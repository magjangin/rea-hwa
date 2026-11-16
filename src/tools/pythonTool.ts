import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface PythonToolResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

/** Interpreters to try in order when one is not installed (ENOENT). */
export function pythonCandidates(
  platform: NodeJS.Platform = process.platform,
): readonly (readonly string[])[] {
  return platform === "win32"
    ? [["python"], ["py", "-3"], ["python3"]]
    : [["python3"], ["python"]];
}

/** Repository `tools/` script, located relative to this module (src/tools or dist/tools). */
export function defaultToolScript(name: string): string {
  return resolve(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "tools",
    name,
  );
}

interface Attempt {
  result?: PythonToolResult;
  error?: NodeJS.ErrnoException;
}

function attempt(
  command: readonly string[],
  args: readonly string[],
): Promise<Attempt> {
  return new Promise((done) => {
    const [cmd, ...prefix] = command;
    let stdout = "";
    let stderr = "";
    const proc = spawn(cmd as string, [...prefix, ...args], {
      env: process.env,
    });
    proc.stdout?.on("data", (d: Buffer) => {
      stdout += d.toString("utf8");
    });
    proc.stderr?.on("data", (d: Buffer) => {
      stderr += d.toString("utf8");
    });
    proc.on("error", (error: NodeJS.ErrnoException) => done({ error }));
    proc.on("close", (code, signal) => {
      // A signal-killed child has no exit code; never report it as success.
      done({
        result: {
          exitCode: code ?? 1,
          stdout,
          stderr: code === null ? `${stderr}terminated by ${signal}\n` : stderr,
        },
      });
    });
  });
}

/**
 * Runs a Python tool script, falling back to the next interpreter candidate
 * only when the previous one is not installed.
 */
export async function runPythonTool(
  script: string,
  args: readonly string[],
  candidates: readonly (readonly string[])[] = pythonCandidates(),
): Promise<PythonToolResult> {
  let last: NodeJS.ErrnoException | undefined;
  for (const command of candidates) {
    const outcome = await attempt(command, [script, ...args]);
    if (outcome.result) return outcome.result;
    last = outcome.error;
    if (last?.code !== "ENOENT") break;
  }
  throw last ?? new Error("No Python interpreter candidates configured");
}
