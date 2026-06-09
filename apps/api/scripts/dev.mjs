// Dev launcher for the FastAPI server.
//
// Runs uvicorn with the project's virtualenv interpreter (apps/api/.venv) when it
// exists, so `pnpm dev:api` / `pnpm dev` work without manually activating the venv.
// Falls back to `python` on PATH if the venv hasn't been created yet. Extra args
// are forwarded to uvicorn, e.g. `pnpm dev:api -- --port 8001`.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const venvPython =
  process.platform === "win32"
    ? path.join(apiRoot, ".venv", "Scripts", "python.exe")
    : path.join(apiRoot, ".venv", "bin", "python");

const python = existsSync(venvPython) ? venvPython : "python";
if (python === "python") {
  console.error(
    "[dev] apps/api/.venv not found — falling back to `python` on PATH. " +
      "If this fails, create the venv per README → First-time setup.",
  );
}

const args = [
  "-m",
  "uvicorn",
  "app.main:app",
  "--reload",
  "--port",
  "8000",
  ...process.argv.slice(2),
];

const child = spawn(python, args, { cwd: apiRoot, stdio: "inherit" });

child.on("error", (err) => {
  console.error(`[dev] failed to start uvicorn: ${err.message}`);
  process.exit(1);
});
child.on("exit", (code) => process.exit(code ?? 0));
