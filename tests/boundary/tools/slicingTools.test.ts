import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
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
