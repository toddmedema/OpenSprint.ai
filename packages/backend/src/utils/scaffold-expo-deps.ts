import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { createLogger } from "./logger.js";
import { getErrorMessage } from "./error-utils.js";

const execAsync = promisify(exec);
const log = createLogger("scaffold-expo-deps");

type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

/**
 * Ensure @types/react and @types/react-dom are declared when the app depends on React.
 * Uses `expo install` so versions stay compatible with the Expo SDK.
 */
export async function ensureExpoReactTypeDevDependencies(repoPath: string): Promise<void> {
  const pkgPath = path.join(repoPath, "package.json");
  let pkg: PackageJson;
  try {
    pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8")) as PackageJson;
  } catch {
    return;
  }

  const hasReact = Boolean(pkg.dependencies?.react ?? pkg.devDependencies?.react);
  if (!hasReact) {
    return;
  }

  const dev = pkg.devDependencies ?? {};
  if (dev["@types/react"] && dev["@types/react-dom"]) {
    return;
  }

  log.info("Installing missing React TypeScript definitions for Expo scaffold", { repoPath });
  try {
    await execAsync("npx expo install @types/react @types/react-dom", {
      cwd: repoPath,
      timeout: 120_000,
    });
  } catch (err) {
    const msg = getErrorMessage(err, "expo install @types/react failed");
    throw new Error(msg);
  }
}
