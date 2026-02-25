/**
 * Shell execution utility.
 * Uses an explicit shell path to avoid ENOENT when /bin/sh is unavailable
 * (e.g. in sandboxed test environments). Prefers process.env.SHELL, falls
 * back to /bin/bash on Unix.
 */

import { exec, ExecOptions } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/** Shell path for exec. Avoids default /bin/sh which may not exist in sandboxes. */
const SHELL = process.env.SHELL || (process.platform === "win32" ? undefined : "/bin/bash");

/**
 * Execute a shell command. Uses SHELL when available to avoid ENOENT on spawn.
 */
export async function shellExec(
  command: string,
  options?: ExecOptions & { timeout?: number }
): Promise<{ stdout: string; stderr: string }> {
  const opts: ExecOptions = {
    ...options,
    timeout: options?.timeout ?? 30_000,
    encoding: "utf8",
  };
  if (SHELL && process.platform !== "win32") {
    opts.shell = SHELL;
  }
  const result = await execAsync(command, opts);
  return {
    stdout: typeof result.stdout === "string" ? result.stdout : result.stdout.toString("utf8"),
    stderr: typeof result.stderr === "string" ? result.stderr : result.stderr.toString("utf8"),
  };
}
