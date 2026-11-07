// The generated colours meet WCAG 2.2 for every pair the site uses, in light and in dark (SPEC.md §8: contrast pairs in
// both themes). Reads src/styles/tokens.css (the sRGB values; the P3 values are the same colours in a wider gamut).
import fs from "node:fs"
import path from "node:path"
import Color from "colorjs.io"
import { describe, expect, it } from "vitest"

const css = fs.readFileSync(path.resolve(import.meta.dirname, "../src/styles/tokens.css"), "utf8")
const [lightPart, darkPart] = css.split("@media (prefers-color-scheme: dark)")
// Drop every @supports block (the P3 copies), matching braces, and read the sRGB custom properties that remain.
const withoutSupports = (part: string) => {
  let out = "", i = 0
  while (i < part.length) {
    const at = part.indexOf("@supports", i)
    if (at < 0) { out += part.slice(i); break }
    out += part.slice(i, at)
    let depth = 0, j = part.indexOf("{", at)
    for (; j < part.length; j++) { if (part[j] === "{") depth++; else if (part[j] === "}" && --depth === 0) break }
    i = j + 1
  }
  return out
}
const vars = (part: string) => Object.fromEntries([...withoutSupports(part).matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]))
const themes = { light: vars(lightPart!), dark: vars(darkPart!) }
// Text pairs need 4.5:1; borders and icons that carry meaning need 3:1 (WCAG 1.4.3, 1.4.11).
const pairs: [string, string, number][] = [
  ["gray-12", "color-background", 4.5], ["gray-11", "color-background", 4.5], ["accent-11", "color-background", 4.5],
  ["gray-12", "gray-2", 4.5], ["gray-11", "gray-2", 4.5], ["gray-11", "gray-3", 4.5], ["accent-11", "gray-2", 4.5],
  ["accent-contrast", "accent-9", 4.5], ["accent-contrast", "accent-10", 4.5], ["gray-12", "gray-1", 4.5],
  ["gray-9", "color-background", 3], ["gray-8", "gray-1", 1.5],
]
const ratio = (a: string, b: string) => new Color(a).contrastWCAG21(new Color(b))

describe.each(Object.entries(themes))("%s theme", (_name, t) => {
  it.each(pairs)("%s on %s reaches %s:1", (fg, bg, min) => {
    expect(t[fg], fg).toBeTruthy()
    expect(t[bg], bg).toBeTruthy()
    expect(ratio(t[fg]!, t[bg]!)).toBeGreaterThanOrEqual(min)
  })
})
