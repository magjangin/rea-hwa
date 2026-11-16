// Shared launcher for the Python tools in this directory.
// Finds a working Python 3 interpreter and forwards stdio and the exit status.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

// Candidate interpreters, tried in order when one is not installed (ENOENT).
const CANDIDATES =
  process.platform === "win32"
    ? [["python"], ["py", "-3"], ["python3"]]
    : [["python3"], ["python"]];

export function runPython(scriptName, label, args = process.argv.slice(2)) {
  const script = join(here, scriptName);

  const attempt = (index) => {
    const [cmd, ...prefix] = CANDIDATES[index];
    const child = spawn(cmd, [...prefix, script, ...args], {
      stdio: "inherit",
      env: process.env,
    });
    child.on("error", (err) => {
      if (err.code === "ENOENT" && index + 1 < CANDIDATES.length) {
        attempt(index + 1);
        return;
      }
      const why = err.code === "ENOENT" ? "Python 3 is required" : err.message;
      console.error(`[${label}] Error: ${why} to run ${scriptName}`);
      process.exit(1);
    });
    child.on("close", (code, signal) => {
      if (code === null) {
        // Killed by a signal: never report that as success.
        console.error(`[${label}] ${scriptName} was terminated by ${signal}`);
        process.exit(1);
      }
      process.exit(code);
    });
  };

  attempt(0);
}
