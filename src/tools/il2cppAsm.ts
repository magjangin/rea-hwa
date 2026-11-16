import {
  defaultToolScript,
  runPythonTool,
  type PythonToolResult,
} from "./pythonTool.js";

export interface Il2CppAsmOptions {
  binaryPath: string;
  outputPath?: string;
  dumpCsPath?: string;
  scriptJsonPath?: string;
  targetClasses?: string[];
  targetMethods?: string[];
  arch?: "arm64" | "x64";
  maxFunctions?: number;
}

export type Il2CppAsmResult = PythonToolResult;

/**
 * Executes tools/il2cpp_asm.py to disassemble IL2CPP methods with symbol annotations
 * directly from binary and dump metadata.
 */
export async function runIl2CppAsm(
  options: Il2CppAsmOptions,
  scriptPathOverride?: string,
): Promise<Il2CppAsmResult> {
  const scriptPath = scriptPathOverride ?? defaultToolScript("il2cpp_asm.py");

  const args: string[] = ["--binary", options.binaryPath];

  if (options.outputPath) {
    args.push("--out", options.outputPath);
  }
  if (options.dumpCsPath) {
    args.push("--dump", options.dumpCsPath);
  }
  if (options.scriptJsonPath) {
    args.push("--script-json", options.scriptJsonPath);
  }
  if (options.targetClasses) {
    for (const cls of options.targetClasses) {
      args.push("--class", cls);
    }
  }
  if (options.targetMethods) {
    for (const m of options.targetMethods) {
      args.push("--method", m);
    }
  }
  if (options.arch) {
    args.push("--arch", options.arch);
  }
  if (typeof options.maxFunctions === "number") {
    args.push("--max-functions", options.maxFunctions.toString());
  }

  return runPythonTool(scriptPath, args);
}

/**
 * Check Mach-O encryption (FairPlay cryptid)
 */
export async function checkMachOEncryption(
  machoPath: string,
  scriptPathOverride?: string,
): Promise<boolean> {
  const scriptPath = scriptPathOverride ?? defaultToolScript("il2cpp_asm.py");
  const { exitCode } = await runPythonTool(scriptPath, [
    "--check-encryption",
    machoPath,
  ]);
  // Exit code 2 indicates encrypted
  return exitCode === 2;
}
