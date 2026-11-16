import {
  defaultToolScript,
  runPythonTool,
  type PythonToolResult,
} from "./pythonTool.js";

export interface PeSliceOptions {
  dllPath: string;
  outputPath: string;
  scriptJsonPath?: string;
  targetClasses?: string[];
  targetMethods?: string[];
  rvas?: string[];
  maxFunctions?: number;
}

export type PeSliceResult = PythonToolResult;

/**
 * Executes tools/pe_slice.py to create a minimal sliced PE containing only
 * target functions and their immediate dependencies, preventing Ghidra / REA timeouts.
 */
export async function runPeSlice(
  options: PeSliceOptions,
  scriptPathOverride?: string,
): Promise<PeSliceResult> {
  const scriptPath = scriptPathOverride ?? defaultToolScript("pe_slice.py");

  const args: string[] = [
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

  return runPythonTool(scriptPath, args);
}
