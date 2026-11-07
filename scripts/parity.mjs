// Text parity: every sentence the old site showed on a page is on that page now. Reads the old pages from git
// (scripts/legacy.mjs), removes the same chrome the move removed, and looks for each block of text in the new page.
// Run after a build: node scripts/parity.mjs. Pages rewritten on purpose are listed in REWRITTEN with the reason.
import fs from "node:fs"
import path from "node:path"
import * as cheerio from "cheerio"
import { CHROME, isEyebrow, pages, read } from "./legacy.mjs"

const dist = path.resolve(import.meta.dirname, "../dist")
const REWRITTEN = {
  "/": "the company home page, rebuilt to list every product (founder, 2026-11-07)",
  "/mealime-alternative/": "named a closed rival in its title and described an older app; now forwards to /meal-planner/",
  "/torque-trails/": "the car game is not listed as a Boldsand product (founder, 2026-11-07); forwards to /",
}
// Words dropped on purpose, by page.
const DROPPED = {
  "/tools/osha-training-record/": ["Sterilizer (label)"], // a field copied from another sheet by mistake; a training record has no sterilizer
  "/tools/florida-spore-test-calculator/": ["@out"], // the calculator's result, which is computed in the browser now
  "/food-safety/": ["→ moved stock to walk-in, recheck"], // kept, but shown under its check (spacing differs)
}

const norm = (s) => s.normalize("NFKC").replace(/[‘’′]/g, "'").replace(/[“”″]/g, '"').replace(/[–—−]/g, "-")
  .replace(/…/g, "...").replace(/ | /g, " ").replace(/&/g, "&").replace(/\s+/g, " ").replace(/\s+([.,;:!?)])/g, "$1").replace(/\(\s+/g, "(").trim().toLowerCase()

let missing = 0, checked = 0
for (const file of pages()) {
  const url = `/${file.replace(/index\.html$/, "")}`
  if (REWRITTEN[url]) { console.log(`  skip ${url}: ${REWRITTEN[url]}`); continue }
  const $ = cheerio.load(read(file))
  const main = $("main").length ? $("main").first() : $("body")
  main.find("header, footer, nav").remove()
  for (const sel of CHROME) main.find(sel).remove()
  main.find(".label, .eyebrow, .kicker").each((_, el) => { if (isEyebrow($, el) && !$(el).is(".kicker")) $(el).remove() })
  if ((DROPPED[url] ?? []).includes("@out")) main.find(".out").remove()
  const target = path.join(dist, url, "index.html")
  if (!fs.existsSync(target)) { console.log(`  FAIL ${url}: no new page`); missing++; continue }
  const $n = cheerio.load(fs.readFileSync(target, "utf8"))
  $n("script, style").remove()
  const now = norm($n("main").text() + " " + $n("main input").map((_, i) => $n(i).attr("value") ?? "").get().join(" "))
  const blocks = main.find("h1, h2, h3, h4, p, li, td, th, dt, dd, caption, figcaption, summary, label, legend, blockquote").filter((_, e) => !$(e).find("p, li, h2, h3, h4, table, ul, ol").length)
  for (const b of blocks.toArray()) {
    const text = norm($(b).text())
    if (text.length < 3 || (DROPPED[url] ?? []).some((d) => norm(d) === text)) continue
    checked++
    if (!now.replace(/\s/g, "").includes(text.replace(/\s/g, ""))) { missing++; console.log(`  FAIL ${url}: missing "${$(b).text().replace(/\s+/g, " ").trim().slice(0, 110)}"`) }
  }
}
// Markdown that failed to render (an unclosed ** or __) shows its marks as text: none may reach a built page.
for (const f of fs.readdirSync(dist, { recursive: true }).filter((f) => f.endsWith(".html"))) {
  const $n = cheerio.load(fs.readFileSync(path.join(dist, f), "utf8"))
  $n("script, style").remove()
  const t = $n("main").text()
  if (/\*\*|__\w/.test(t)) { missing++; console.log(`  FAIL ${f}: raw Markdown marks in the text: "${t.match(/.{0,40}(\*\*|__\w).{0,40}/s)[0].replace(/\s+/g, " ")}"`) }
}
console.log(`\n${checked} blocks of old text checked, ${missing} missing`)
process.exit(missing ? 1 : 0)
