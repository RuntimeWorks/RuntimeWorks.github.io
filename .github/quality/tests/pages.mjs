// Every page on the site is tested automatically: each directory with an index.html is a route.
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const SKIP = new Set([".git", ".github", "node_modules", "assets"]);

function walk(dir, prefix) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name === "index.html") out.push(prefix);
    if (entry.isDirectory() && !SKIP.has(entry.name)) out.push(...walk(dir + entry.name + "/", prefix + entry.name + "/"));
  }
  return out;
}

export const ROUTES = walk(ROOT, "/").sort();
export const FILES = ROUTES.map((r) => r.slice(1) + "index.html");
export const WIDTHS = [[375, 812], [768, 1024], [1440, 900]];
