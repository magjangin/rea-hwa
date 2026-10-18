import { spawn } from "node:child_process";
import { resolve } from "node:path";

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

export interface Il2CppAsmResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

/**
 * Executes tools/il2cpp_asm.py to disassemble IL2CPP methods with symbol annotations
 * directly from binary and dump metadata.
 */
export async function runIl2CppAsm(
  options: Il2CppAsmOptions,
  scriptPathOverride?: string
): Promise<Il2CppAsmResult> {
  const scriptPath =
    scriptPathOverride ?? resolve(process.cwd(), "tools", "il2cpp_asm.py");
  const pythonCmd = process.platform === "win32" ? "python" : "python3";

  const args: string[] = [scriptPath, "--binary", options.binaryPath];

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

  return new Promise((res, rej) => {
    let stdout = "";
    let stderr = "";

    const proc = spawn(pythonCmd, args, { env: process.env });

    proc.stdout?.on("data", (d: Buffer) => {
      stdout += d.toString("utf8");
    });
    proc.stderr?.on("data", (d: Buffer) => {
      stderr += d.toString("utf8");
    });

    proc.on("error", (err) => {
      rej(err);
    });

    proc.on("close", (code) => {
      res({
        exitCode: code ?? 0,
        stdout,
        stderr,
      });
    });
  });
}

/**
 * Check Mach-O encryption (FairPlay cryptid)
 */
export async function checkMachOEncryption(
  machoPath: string,
  scriptPathOverride?: string
): Promise<boolean> {
  const scriptPath =
    scriptPathOverride ?? resolve(process.cwd(), "tools", "il2cpp_asm.py");
  const pythonCmd = process.platform === "win32" ? "python" : "python3";

  return new Promise((res, rej) => {
    const proc = spawn(pythonCmd, [scriptPath, "--check-encryption", machoPath], {
      env: process.env,
    });

    proc.on("error", rej);
    proc.on("close", (code) => {
      // Exit code 2 indicates encrypted
      res(code === 2);
    });
  });
}
