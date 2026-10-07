// Raw design values in page <style> blocks (DESIGN-SYSTEM v3 section 2.1). Ratchet: fails when the
// count rises above BASELINE; lower BASELINE as issue #5 is fixed, until it reaches 0.
import fs from "node:fs"; import path from "node:path"; import stylelint from "stylelint";
const BASELINE = 331;
const root = path.resolve("../..");
import { FILES as pages } from "./pages.mjs";
const code = pages.map((p) => [...fs.readFileSync(path.join(root, p), "utf8").matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n"));
const config = JSON.parse(fs.readFileSync(new URL("../stylelint.design.json", import.meta.url)));
let total = 0;
for (let i = 0; i < pages.length; i++) {
  const r = await stylelint.lint({ code: code[i], config });
  const n = r.results[0].warnings.length; total += n;
  console.log(`${pages[i]}: ${n}`);
}
// Shared stylesheets the pages link (/assets/css/*.css) count too, each once: moving a page's styles into a linked file
// must not take them out of this gate.
const linked = new Set(pages.flatMap((p) => [...fs.readFileSync(path.join(root, p), "utf8").matchAll(/<link[^>]+rel="stylesheet"[^>]+href="(\/assets\/css\/[^"]+\.css)"/g)].map((m) => m[1])));
for (const href of [...linked].sort()) {
  const r = await stylelint.lint({ code: fs.readFileSync(path.join(root, href), "utf8"), config });
  const n = r.results[0].warnings.length; total += n;
  console.log(`${href.slice(1)}: ${n}`);
}
console.log(`total ${total} (baseline ${BASELINE})`);
if (total > BASELINE) { console.error("Raw design values increased."); process.exit(1); }
