// The live site before the rebuild (commit 5b0fcac, 2026-10-29), read straight from git so nothing is copied by hand.
// Shared by scripts/migrate-legacy.mjs (moves the words into src/content) and scripts/parity.mjs (checks that every
// sentence still appears on its new page). The selectors below are the old site's chrome: they were replaced by the
// new layout's own header, call to action and labels, so neither script treats their words as page content.
import { execSync } from "node:child_process"

export const REV = "5b0fcac1cccd1282935052027a98e214f230e9ce"
export const read = (file) => execSync(`git show ${REV}:${file}`, { encoding: "utf8", maxBuffer: 1e8 })
export const files = () => execSync(`git ls-tree -r --name-only ${REV}`, { encoding: "utf8" }).split("\n").filter(Boolean)
export const pages = () => files().filter((f) => f.endsWith("index.html"))

/** Old chrome replaced by the new layout: calls to action, pilot boxes, print buttons, eyebrow labels above headings. */
export const CHROME = [
  "script", "style", "noscript", "template", "svg",
  "section.cta", "section.pilot", ".cta", ".pilot", ".closing .btn",
  "button", "[data-print]", ".no-print", ".screen-only .btn",
  ".sr-only.skip",
]

/** Words a page shows only as decoration: an eyebrow right before a heading. */
export const isEyebrow = ($, el) => {
  const n = $(el).next()
  return n.length > 0 && /^h[1-4]$/.test(n.get(0).tagName)
}
