// Validates every page found by pages.mjs with the Nu HTML Checker (errors only).
import { spawnSync } from "node:child_process";
import { FILES, ROOT } from "./pages.mjs";

const args = ["-jar", "node_modules/vnu-jar/build/dist/vnu.jar", "--errors-only", "--skip-non-html",
  "--filterpattern", ".*paint-order.*", ...FILES.map((f) => ROOT + f)];
const r = spawnSync("java", args, { stdio: "inherit" });
process.exit(r.status ?? 1);
