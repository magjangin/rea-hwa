"""Regression tests for pe_slice.py, il2cpp_asm.py and their Node wrappers.

Run: python -I -m unittest discover -s tools -p "test_*.py"
Uses small synthetic PE/ELF fixtures built in memory; needs capstone for the
disassembly tests (they are skipped when it is missing).
"""

import json
import os
import shutil
import struct
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
sys.path.insert(0, str(TOOLS))

import pe_slice  # noqa: E402

try:
    import capstone  # noqa: F401
    HAVE_CAPSTONE = True
except ImportError:
    HAVE_CAPSTONE = False

NODE = shutil.which("node")


def run(script, *args):
    return subprocess.run([sys.executable, "-I", str(TOOLS / script), *args],
                          capture_output=True, text=True, encoding="utf-8")


# ───────────────────────── fixtures ─────────────────────────

def build_pe(text, pdata, base=0x180000000):
    """Minimal x64 PE: .text @0x1000, .pdata @0x2000 (unwind byte at 0x2100)."""
    text = text.ljust(0x200, b"\xcc")
    pd = bytearray(0x200)
    for i, (b, e) in enumerate(pdata):
        struct.pack_into("<III", pd, 12 * i, b, e, 0x2100)
    pd[0x100] = 0x01                                   # unwind info v1, no flags
    hdr = bytearray(0x200)
    hdr[0:2] = b"MZ"
    struct.pack_into("<I", hdr, 0x3C, 0x40)
    hdr[0x40:0x44] = b"PE\0\0"
    struct.pack_into("<HHIIIHH", hdr, 0x44, 0x8664, 2, 0, 0, 0, 0xF0, 0x2022)
    opt = 0x58
    struct.pack_into("<H", hdr, opt, 0x20B)
    struct.pack_into("<Q", hdr, opt + 24, base)
    struct.pack_into("<I", hdr, opt + 108, 16)
    struct.pack_into("<II", hdr, opt + 112 + 24, 0x2000, len(pdata) * 12)
    sec = opt + 0xF0
    struct.pack_into("<8sIIIIIIHHI", hdr, sec, b".text", 0x200, 0x1000, 0x200, 0x200, 0, 0, 0, 0, 0x60000020)
    struct.pack_into("<8sIIIIIIHHI", hdr, sec + 40, b".pdata", 0x200, 0x2000, 0x200, 0x400, 0, 0, 0, 0, 0x40000040)
    return bytes(hdr) + text + bytes(pd)


def build_elf(machine, code_at):
    """ELF header + code placed at the given file offsets."""
    size = max(off + len(c) for off, c in code_at.items())
    blob = bytearray(size)
    blob[0:4] = b"\x7fELF"
    struct.pack_into("<H", blob, 0x12, machine)
    for off, c in code_at.items():
        blob[off:off + len(c)] = c
    return bytes(blob)


def dump_cs(entries):
    return "\n".join(f"// RVA: {rva:#x} Offset: {off:#x} VA: {rva:#x}" for rva, off in entries)


class TempDirCase(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="tools-test-"))
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)

    def write(self, name, data):
        p = self.tmp / name
        p.write_bytes(data) if isinstance(data, bytes) else p.write_text(data, encoding="utf-8")
        return str(p)

    def script_json(self, methods, strings=()):
        return self.write("script.json", json.dumps({
            "ScriptMethod": [{"Address": a, "Name": n} for a, n in methods],
            "ScriptString": [{"Address": a, "Value": v} for a, v in strings],
        }))


# ───────────────────────── pe_slice ─────────────────────────

class PeSliceTests(TempDirCase):
    def make_dll(self):
        # 0x1000: call 0x1020 ; ret   |   0x1020: ret
        text = bytearray(0x200)
        text[0:5] = b"\xE8" + struct.pack("<i", 0x1020 - 0x1005)
        text[5] = 0xC3
        text[0x20] = 0xC3
        return self.write("g.dll", build_pe(bytes(text), [(0x1000, 0x1006), (0x1020, 0x1021)]))

    @unittest.skipUnless(HAVE_CAPSTONE, "capstone required")
    def test_slice_by_method_names_target_and_callee(self):
        dll = self.make_dll()
        sj = self.script_json([(0x1000, "Cls$$Run"), (0x1020, "Cls$$Helper")])
        out = str(self.tmp / "out" / "s.dll")
        r = run("pe_slice.py", "--dll", dll, "--script-json", sj, "--method", "Cls::Run", "--out", out)
        self.assertEqual(r.returncode, 0, r.stderr)
        names = json.loads(Path(out + ".names.json").read_text(encoding="utf-8"))
        self.assertEqual(names["names"]["0x180001000"], "Cls$$Run")
        self.assertEqual(names["names"]["0x180001020"], "Cls$$Helper")
        sliced, src = pe_slice.Pe(out), pe_slice.Pe(dll)
        self.assertEqual(sliced.base, src.base)
        self.assertEqual(sliced.read(0x1000, 6), src.read(0x1000, 6))

    def test_slice_by_rva_without_script_json(self):
        dll = self.make_dll()
        out = str(self.tmp / "s.dll")
        r = run("pe_slice.py", "--dll", dll, "--rva", "0x1020", "--out", out)
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(pe_slice.Pe(out).read(0x1020, 1), b"\xC3")

    def test_func_end_uses_pdata(self):
        pe = pe_slice.Pe(self.make_dll())
        self.assertEqual(pe.func_end(0x1000, []), 0x1006)

    def test_unknown_class_fails_with_message(self):
        dll = self.make_dll()
        sj = self.script_json([(0x1000, "Cls$$Run")])
        r = run("pe_slice.py", "--dll", dll, "--script-json", sj, "--class", "Nope", "--out", str(self.tmp / "x.dll"))
        self.assertEqual(r.returncode, 1)
        self.assertIn("클래스를 찾지 못했습니다", r.stderr)

    def test_rejects_non_pe(self):
        r = run("pe_slice.py", "--dll", self.write("n.bin", b"not a pe"), "--rva", "0x1000", "--out", str(self.tmp / "x.dll"))
        self.assertEqual(r.returncode, 1)
        self.assertIn("PE 파일이 아닙니다", r.stderr)


# ───────────────────────── il2cpp_asm ─────────────────────────

@unittest.skipUnless(HAVE_CAPSTONE, "capstone required")
class Il2cppAsmTests(TempDirCase):
    def test_x64_elf_annotates_call_target(self):
        # A @0x100: call B ; ret    B @0x200: ret
        a = b"\xE8" + struct.pack("<i", 0x200 - 0x105) + b"\xC3"
        elf = self.write("lib.so", build_elf(0x3E, {0x100: a, 0x200: b"\xC3"}))
        dc = self.write("dump.cs", dump_cs([(0x100, 0x100), (0x200, 0x200)]))
        sj = self.script_json([(0x100, "Cls$$A"), (0x200, "Cls$$B")])
        r = run("il2cpp_asm.py", "--binary", elf, "--dump", dc, "--script-json", sj, "--method", "Cls::A")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("→ Cls$$B", r.stdout)

    def test_arm64_elf_annotates_bl_and_string(self):
        words = [0x94000040,        # bl 0x200
                 0xB0000000,        # adrp x0, 0x1000
                 0x91004000,        # add x0, x0, #0x10
                 0xD65F03C0]        # ret
        a = b"".join(struct.pack("<I", w) for w in words)
        elf = self.write("lib.so", build_elf(0xB7, {0x100: a, 0x200: struct.pack("<I", 0xD65F03C0)}))
        dc = self.write("dump.cs", dump_cs([(0x100, 0x100), (0x200, 0x200)]))
        sj = self.script_json([(0x100, "Cls$$A"), (0x200, "Cls$$B")], strings=[(0x1010, "hi")])
        r = run("il2cpp_asm.py", "--binary", elf, "--dump", dc, "--script-json", sj, "--method", "Cls::A")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("→ Cls$$B", r.stdout)
        self.assertIn('&StringLiteral "hi"', r.stdout)

    def test_oversized_function_is_reported_as_truncated(self):
        cap = 0x4000
        elf = self.write("lib.so", build_elf(0x3E, {0x100: b"\x90" * (cap + 0x200)}))
        dc = self.write("dump.cs", dump_cs([(0x100, 0x100), (0x100 + cap + 0x100, 0x100 + cap + 0x100)]))
        sj = self.script_json([(0x100, "Cls$$Big"), (0x100 + cap + 0x100, "Cls$$Next")])
        r = run("il2cpp_asm.py", "--binary", elf, "--dump", dc, "--script-json", sj, "--method", "Cls::Big")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("잘렸습니다", r.stderr)
        self.assertIn("※ 잘림", r.stdout)

    def test_normal_function_has_no_truncation_warning(self):
        elf = self.write("lib.so", build_elf(0x3E, {0x100: b"\xC3", 0x200: b"\xC3"}))
        dc = self.write("dump.cs", dump_cs([(0x100, 0x100), (0x200, 0x200)]))
        sj = self.script_json([(0x100, "Cls$$A"), (0x200, "Cls$$B")])
        r = run("il2cpp_asm.py", "--binary", elf, "--dump", dc, "--script-json", sj, "--method", "Cls::A")
        self.assertNotIn("잘렸습니다", r.stderr)

    def test_check_encryption_flags_encrypted_macho(self):
        def macho(cryptid):
            hdr = struct.pack("<IIIIIIII", 0xFEEDFACF, 0x0100000C, 0, 2, 1, 24, 0, 0)
            return hdr + struct.pack("<IIIIII", 0x2C, 24, 0, 0, cryptid, 0)
        enc = run("il2cpp_asm.py", "--check-encryption", self.write("enc", macho(1)))
        self.assertEqual(enc.returncode, 2, enc.stdout)
        plain = run("il2cpp_asm.py", "--check-encryption", self.write("plain", macho(0)))
        self.assertEqual(plain.returncode, 0, plain.stdout)

    def test_rejects_unsupported_binary(self):
        r = run("il2cpp_asm.py", "--binary", self.write("x", b"junk" * 64),
                "--dump", self.write("d.cs", dump_cs([(1, 1)])), "--script-json", self.script_json([(1, "A$$B")]),
                "--method", "A::B")
        self.assertEqual(r.returncode, 1)
        self.assertIn("PE · ELF · Mach-O가 아닙니다", r.stderr)


# ───────────────────────── Node wrappers ─────────────────────────

@unittest.skipUnless(NODE, "node required")
class WrapperTests(TempDirCase):
    def node(self, script, *args):
        return subprocess.run([NODE, str(TOOLS / script), *args], capture_output=True, text=True, encoding="utf-8")

    def test_forwards_success(self):
        for wrapper, tag in (("il2cpp-asm.mjs", "il2cpp_asm"), ("pe-slice.mjs", "pe_slice")):
            r = self.node(wrapper, "--version")
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertIn(tag, r.stdout)

    def test_forwards_failure_exit_code(self):
        r = self.node("pe-slice.mjs", "--dll", str(self.tmp / "missing.dll"), "--rva", "0x1", "--out", str(self.tmp / "o.dll"))
        self.assertNotEqual(r.returncode, 0)

    @unittest.skipIf(os.name == "nt", "POSIX signals only")
    def test_signal_killed_child_is_not_success(self):
        fake = self.tmp / "bin"
        fake.mkdir()
        py = fake / "python3"
        py.write_text("#!/bin/sh\nkill -9 $$\n")
        py.chmod(0o755)
        env = {**os.environ, "PATH": f"{fake}{os.pathsep}{os.environ['PATH']}"}
        r = subprocess.run([NODE, str(TOOLS / "il2cpp-asm.mjs"), "--version"], capture_output=True, text=True, env=env)
        self.assertEqual(r.returncode, 1)
        self.assertIn("terminated", r.stderr)


if __name__ == "__main__":
    unittest.main()
