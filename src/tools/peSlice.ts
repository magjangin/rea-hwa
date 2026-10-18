import { spawn } from "node:child_process";
import { resolve } from "node:path";

export interface PeSliceOptions {
  dllPath: string;
  outputPath: string;
  scriptJsonPath?: string;
  targetClasses?: string[];
  targetMethods?: string[];
  rvas?: string[];
  maxFunctions?: number;
}

export interface PeSliceResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

/**
 * Executes tools/pe_slice.py to create a minimal sliced PE containing only
 * target functions and their immediate dependencies, preventing Ghidra / REA timeouts.
 */
export async function runPeSlice(
  options: PeSliceOptions,
  scriptPathOverride?: string
): Promise<PeSliceResult> {
  const scriptPath =
    scriptPathOverride ?? resolve(process.cwd(), "tools", "pe_slice.py");
  const pythonCmd = process.platform === "win32" ? "python" : "python3";

  const args: string[] = [
    scriptPath,
    "--dll",
    options.dllPath,
    "--out",
    options.outputPath,
  ];

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
  if (options.rvas) {
    for (const r of options.rvas) {
      args.push("--rva", r);
    }
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
