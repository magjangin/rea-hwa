import { describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  defaultToolScript,
  pythonCandidates,
  runPythonTool,
} from "../../../src/tools/pythonTool.js";
import { runPeSlice } from "../../../src/tools/peSlice.js";
import {
  runIl2CppAsm,
  checkMachOEncryption,
} from "../../../src/tools/il2cppAsm.js";

describe("PE and IL2CPP Slicing Tools TS Wrappers", () => {
  it("runPeSlice executes pe_slice.py and returns standard process result", async () => {
    // Calling without required args should trigger python argparse help/error with code 2 or 1
    const result = await runPeSlice({
      dllPath: "non_existent.dll",
      outputPath: "out.dll",
    });

    expect(result).toHaveProperty("exitCode");
    expect(result).toHaveProperty("stdout");
    expect(result).toHaveProperty("stderr");
    // Should fail cleanly when dll does not exist
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("오류");
  });

  it("runIl2CppAsm executes il2cpp_asm.py and returns standard process result", async () => {
    const result = await runIl2CppAsm({
      binaryPath: "non_existent.so",
    });

    expect(result).toHaveProperty("exitCode");
    expect(result).toHaveProperty("stdout");
    expect(result).toHaveProperty("stderr");
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("오류");
  });

  it("checkMachOEncryption correctly returns false for non-encrypted or non-macho file", async () => {
    const isEncrypted = await checkMachOEncryption(
      resolve(process.cwd(), "package.json"),
    );
    expect(isEncrypted).toBe(false);
  });
});

describe("Python tool launcher", () => {
  const script = (body: string): string => {
    const dir = mkdtempSync(join(tmpdir(), "py-tool-"));
    const file = join(dir, "tool.js");
    writeFileSync(file, body);
    return file;
  };

  it("locates tools relative to the module, not the working directory", () => {
    expect(existsSync(defaultToolScript("pe_slice.py"))).toBe(true);
    expect(existsSync(defaultToolScript("il2cpp_asm.py"))).toBe(true);
  });

  it("tries py -3 on Windows before giving up", () => {
    expect(pythonCandidates("win32")).toContainEqual(["py", "-3"]);
    expect(pythonCandidates("linux")[0]).toEqual(["python3"]);
  });

  it("falls back to the next interpreter only when the first is missing", async () => {
    const file = script(
      'console.log("ok " + process.argv.slice(2).join(","));',
    );
    const result = await runPythonTool(
      file,
      ["a", "b"],
      [["no-such-interpreter-for-rea"], [process.execPath]],
    );
    expect(result).toMatchObject({ exitCode: 0, stdout: "ok a,b\n" });
  });

  it("does not fall back after a real failure", async () => {
    const file = script("process.exit(3);");
    const result = await runPythonTool(
      file,
      [],
      [[process.execPath], ["no-such-interpreter-for-rea"]],
    );
    expect(result.exitCode).toBe(3);
  });

  it("rejects when no interpreter exists", async () => {
    await expect(
      runPythonTool("x", [], [["no-such-interpreter-for-rea"]]),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it.skipIf(process.platform === "win32")(
    "never reports a signal-killed child as success",
    async () => {
      const file = script('process.kill(process.pid, "SIGKILL");');
      const result = await runPythonTool(file, [], [[process.execPath]]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("SIGKILL");
    },
  );
});
