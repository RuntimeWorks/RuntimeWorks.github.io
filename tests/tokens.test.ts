// The generated colours meet WCAG 2.2 for every pair the site uses, in light and in dark (SPEC.md §8: contrast pairs in
// both themes). Reads src/styles/tokens.css (the sRGB values; the P3 values are the same colours in a wider gamut).
import fs from "node:fs"
import path from "node:path"
import Color from "colorjs.io"
import { describe, expect, it } from "vitest"

const css = fs.readFileSync(path.resolve(import.meta.dirname, "../src/styles/tokens.css"), "utf8")
// Every "@media (prefers-color-scheme: dark)" block (Radix's scales, then the brand theme), matched by braces, is the
// dark theme; what is left is the light theme.
const darkBlocks: string[] = []
let lightPart = css
for (let at = lightPart.indexOf("@media (prefers-color-scheme: dark)"); at >= 0; at = lightPart.indexOf("@media (prefers-color-scheme: dark)")) {
  let depth = 0, j = lightPart.indexOf("{", at)
  for (; j < lightPart.length; j++) { if (lightPart[j] === "{") depth++; else if (lightPart[j] === "}" && --depth === 0) break }
  darkBlocks.push(lightPart.slice(at, j + 1))
  lightPart = lightPart.slice(0, at) + lightPart.slice(j + 1)
}
const darkPart = darkBlocks.join("\n")
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
const themes = { light: vars(lightPart), dark: { ...vars(lightPart), ...vars(darkPart) } }
// Text pairs need 4.5:1; borders and icons that carry meaning need 3:1 (WCAG 1.4.3, 1.4.11).
const pairs: [string, string, number][] = [
  ["gray-12", "color-background", 4.5], ["gray-11", "color-background", 4.5], ["accent-11", "color-background", 4.5],
  ["gray-12", "gray-2", 4.5], ["gray-11", "gray-2", 4.5], ["gray-11", "gray-3", 4.5], ["accent-11", "gray-2", 4.5],
  ["accent-contrast", "accent-9", 4.5], ["accent-contrast", "accent-10", 4.5], ["gray-12", "gray-1", 4.5],
  ["gray-9", "color-background", 3], ["gray-8", "gray-1", 1.5],
  // The brand theme: text on the navy band, the ink footer, the white cards, the sand bands and the green chip.
  ["on-harbour", "harbour", 4.5], ["on-harbour-2", "harbour", 4.5], ["on-harbour", "harbour-2", 4.5], ["on-harbour-2", "ink", 4.5],
  ["ink", "on-harbour", 4.5], ["gray-12", "surface", 4.5], ["gray-11", "surface", 4.5], ["accent-11", "surface", 4.5],
  ["gray-12", "sand", 4.5], ["gray-11", "sand", 4.5], ["accent-11", "sand", 4.5], ["pass-11", "pass-3", 4.5],
]
const ratio = (a: string, b: string) => new Color(a).contrastWCAG21(new Color(b))

describe.each(Object.entries(themes))("%s theme", (_name, t) => {
  it.each(pairs)("%s on %s reaches %s:1", (fg, bg, min) => {
    expect(t[fg], fg).toBeTruthy()
    expect(t[bg], bg).toBeTruthy()
    expect(ratio(t[fg]!, t[bg]!)).toBeGreaterThanOrEqual(min)
  })
})
