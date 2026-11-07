// Quality gates on every built page (s-tier-site SPEC.md §8), adapted from PurchaseRow's scripts/check.mjs.
// Serves dist/ on a throwaway port, opens every page in headless Chromium at five widths in light and dark, and fails
// on: axe-core WCAG 2.2 AA violations, sideways scroll, targets under 24 px, not exactly one H1, skipped heading
// levels, text under 13 px, headings over two lines (768 px and up), field edges under 3:1, clickable text on two
// lines, layout shift over 0.01, script errors, broken internal links or anchors, a page budget over limits, and any
// address of the old site that no longer answers. Run after a build: node scripts/check.mjs [path-filter].
import fs from "node:fs"
import http from "node:http"
import path from "node:path"
import zlib from "node:zlib"
import { chromium } from "playwright"
import { pages as legacyPages } from "./legacy.mjs"

const root = path.resolve(import.meta.dirname, "..")
const dist = path.join(root, "dist")
const out = path.join(root, "dist-check")
fs.mkdirSync(out, { recursive: true })
const axeSource = fs.readFileSync(path.join(root, "node_modules/axe-core/axe.min.js"), "utf8")
const only = process.argv[2]
const failures = [], warnings = []
const fail = (m) => { failures.push(m); console.log(`  FAIL ${m}`) }
const warn = (m) => { warnings.push(m); console.log(`  warn ${m}`) }

// Every built page, as its address.
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
const htmlFiles = walk(dist).filter((f) => f.endsWith(".html"))
const urlOf = (f) => { const r = "/" + path.relative(dist, f).replaceAll(path.sep, "/"); return r.endsWith("/index.html") ? r.slice(0, -10) : r }
const built = Object.fromEntries(htmlFiles.map((f) => [urlOf(f), fs.readFileSync(f, "utf8")]))
const isRedirect = (h) => /<meta http-equiv="refresh"/.test(h)
const pages = Object.keys(built).filter((u) => !isRedirect(built[u]) && (!only || u.includes(only))).sort()

// Budget: JS and CSS each page loads up front, gzipped.
const gz = (u) => zlib.gzipSync(fs.readFileSync(path.join(dist, u))).length
for (const u of pages) {
  const h = built[u]
  const js = [...h.matchAll(/<script[^>]+src="(\/_astro\/[^"]+\.js)"/g)].map((m) => m[1])
  const css = [...h.matchAll(/<link[^>]+href="(\/_astro\/[^"]+\.css)"/g)].map((m) => m[1])
  const jsKb = js.reduce((s, f) => s + gz(f), 0) / 1024, cssKb = css.reduce((s, f) => s + gz(f), 0) / 1024
  if (jsKb > 30) fail(`${u}: JS ${jsKb.toFixed(1)} KB gz over 30 KB`)
  if (cssKb > 20) fail(`${u}: CSS ${cssKb.toFixed(1)} KB gz over 20 KB`)
}
console.log("  ok   budgets checked")

// Every internal link and #anchor lands on a page that exists and an element with that id.
const idsOf = (h) => new Set([...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))
const resolvePage = (p) => (built[p] !== undefined ? p : built[p.endsWith("/") ? p : `${p}/`] !== undefined ? `${p}/` : null)
let links = 0
for (const [u, h] of Object.entries(built)) {
  if (isRedirect(h)) continue
  for (const [, raw] of h.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
    const href = raw.replaceAll("&amp;", "&")
    if (/^(https?:|mailto:|tel:|sms:|data:)/.test(href)) continue
    const [p, frag] = href.split("#")
    const target = p === "" ? u : p.startsWith("/") ? p : new URL(p, `http://x${u}`).pathname
    links++
    if (/\.(pdf|xml|svg|jpg|png|webp|txt)$/.test(target)) { if (!fs.existsSync(path.join(dist, target))) fail(`${u}: link to ${href}: no such file`); continue }
    const page = resolvePage(target)
    if (page === null) fail(`${u}: link to ${href} has no page`)
    else if (frag && !idsOf(built[page]).has(frag)) fail(`${u}: link to ${href} has no element with that id`)
  }
}
console.log(`  ok   ${links} internal links checked`)

// Every address the old site served still answers (a page or a redirect), so no bookmark, search result or app link breaks.
const legacy = legacyPages().map((f) => `/${f.replace(/index\.html$/, "")}`)
for (const u of legacy) if (resolvePage(u) === null) fail(`old address ${u} no longer answers`)
for (const f of ["/food-safety/sample-inspector-report.pdf", "/assets/og-boldsand.jpg", "/robots.txt", "/sitemap.xml", "/CNAME"]) if (!fs.existsSync(path.join(dist, f))) fail(`old file ${f} is missing`)
console.log(`  ok   ${legacy.length} old addresses checked`)

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".pdf": "application/pdf", ".xml": "application/xml" }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname)
  if (p.endsWith("/")) p += "index.html"
  const f = path.join(dist, p)
  if (!f.startsWith(dist) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404, { "content-type": "text/html" }); return res.end(fs.readFileSync(path.join(dist, "404.html"))) }
  res.writeHead(200, { "content-type": types[path.extname(f)] ?? "application/octet-stream" })
  fs.createReadStream(f).pipe(res)
})
await new Promise((ok) => server.listen(0, "127.0.0.1", ok))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()

async function gate(u, scheme, width) {
  const page = await browser.newPage({ colorScheme: scheme, reducedMotion: "reduce", viewport: { width, height: 900 } })
  const errors = []
  page.on("pageerror", (e) => errors.push(e.message))
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()))
  await page.goto(base + u, { waitUntil: "networkidle" })
  const tag = `${u} ${scheme} ${width}px`
  for (const e of errors) fail(`${tag}: script error ${e.slice(0, 160)}`)
  // Loaded through the DevTools protocol (page.evaluate), which the page's own Content Security Policy does not
  // govern, so every page is checked with its real policy in force (a script tag would be refused by it).
  await page.evaluate(axeSource)
  const axe = await page.evaluate(() => window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } }))
  for (const v of axe.violations) fail(`${tag}: axe ${v.id} (${v.impact}) on ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`)
  const m = await page.evaluate(() => {
    const r = { overflow: document.documentElement.scrollWidth - window.innerWidth, smallTargets: [], tallHeads: [], untitled: [], faint: [], twoLine: [], tiny: [] }
    const SEL = "a[href], button, summary, select, input:not([type=hidden]):not([type=radio]):not([type=checkbox]), textarea"
    const targets = [...document.querySelectorAll(SEL)].filter((el) => el.checkVisibility() && el.getBoundingClientRect().width > 1)
    const boxes = targets.map((el) => el.getBoundingClientRect())
    targets.forEach((el, i) => {
      const b = boxes[i]
      if (b.height >= 23.5 && b.width >= 23.5) return
      const inline = el.tagName === "A" && getComputedStyle(el).display === "inline" && el.parentElement && el.parentElement.textContent.trim().length > el.textContent.trim().length + 5
      const host = el.parentElement?.closest(`label, td, ${SEL}`)
      const nested = host && host.getBoundingClientRect().height >= 23.5 && host.getBoundingClientRect().width >= 23.5
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2
      const spaced = boxes.every((o, j) => j === i || targets[j].contains(el) || el.contains(targets[j]) || Math.hypot(Math.max(o.left - cx, 0, cx - o.right), Math.max(o.top - cy, 0, cy - o.bottom)) >= 12)
      if (!inline && !nested && !spaced) r.smallTargets.push(`${(el.getAttribute("aria-label") || el.textContent).trim().slice(0, 30)} ${Math.round(b.width)}×${Math.round(b.height)}`)
    })
    const linesOf = (el) => {
      const range = document.createRange(); range.selectNodeContents(el)
      const half = parseFloat(getComputedStyle(el).fontSize) / 2
      let lines = 0, top = -Infinity
      for (const x of [...range.getClientRects()].filter((x) => x.width > 1).sort((p, q) => p.top - q.top)) if (x.top > top + half) { lines++; top = x.top }
      return lines
    }
    for (const h of document.querySelectorAll("main h1, main h2")) if (h.checkVisibility() && linesOf(h) > 2) r.tallHeads.push(`${h.textContent.trim().slice(0, 40)}: ${linesOf(h)} lines`)
    for (const s of document.querySelectorAll("main section")) if (!s.querySelector("h1, h2, h3") && !s.getAttribute("aria-label") && !s.getAttribute("aria-labelledby")) r.untitled.push(s.id || s.className.slice(0, 30))
    const levels = [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")].filter((h) => h.checkVisibility()).map((h) => Number(h.tagName[1]))
    r.h1 = levels.filter((l) => l === 1).length
    r.skips = levels.filter((l, i) => i > 0 && l > levels[i - 1] + 1).length
    const ctx = document.createElement("canvas").getContext("2d")
    const rgb = (c) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = "#000"; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data] }
    const lum = ([R, G, B]) => [R, G, B].map((v) => (v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0)
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
    const ground = (el) => { for (let e = el.parentElement; e; e = e.parentElement) { const v = rgb(getComputedStyle(e).backgroundColor); if (v[3] > 200) return v } return rgb(getComputedStyle(document.body).backgroundColor) }
    // A field's edge: its own border or fill, or, for a borderless field filling a table cell, the cell's grid line.
    for (const el of document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), textarea, select")) {
      if (!el.checkVisibility()) continue
      const s = getComputedStyle(el), outside = ground(el)
      let edge = Math.max(parseFloat(s.borderTopWidth) > 0 ? ratio(rgb(s.borderTopColor), outside) : 0, rgb(s.backgroundColor)[3] > 200 ? ratio(rgb(s.backgroundColor), outside) : 0)
      const cell = el.closest("td")
      if (cell) { const cs = getComputedStyle(cell); if (parseFloat(cs.borderTopWidth) > 0) edge = Math.max(edge, ratio(rgb(cs.borderTopColor), outside)) }
      if (edge < 3) r.faint.push(`${el.getAttribute("aria-label") || el.id || el.name} ${edge.toFixed(2)}:1`)
    }
    r.twoLine = [...document.querySelectorAll("header a, header summary, footer a, nav a, button, a.min-h-11")].filter((el) => el.checkVisibility() && !el.closest("p") && linesOf(el) > 1).map((el) => el.textContent.trim().slice(0, 40))
    r.tiny = [...document.querySelectorAll("body *")].filter((e) => e.checkVisibility() && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 12.5 && !e.closest(".sr-only")).map((e) => `${e.textContent.trim().slice(0, 30)} (${getComputedStyle(e).fontSize})`)
    return r
  })
  if (m.overflow > 0) fail(`${tag}: horizontal overflow ${m.overflow}px`)
  for (const t of [...new Set(m.smallTargets)].slice(0, 3)) fail(`${tag}: target under 24 px: ${t}`)
  for (const h of m.tallHeads) (width >= 768 ? fail : warn)(`${tag}: heading over two lines: ${h}`)
  for (const s of m.untitled) fail(`${tag}: section without a heading: ${s}`)
  if (m.h1 !== 1) fail(`${tag}: ${m.h1} H1 elements`)
  if (m.skips) fail(`${tag}: ${m.skips} skipped heading levels`)
  for (const t of m.tiny.slice(0, 3)) fail(`${tag}: text below 13 px: ${t}`)
  for (const f of [...new Set(m.faint)].slice(0, 3)) fail(`${tag}: field edge under 3:1: ${f}`)
  for (const t of [...new Set(m.twoLine)].slice(0, 3)) fail(`${tag}: clickable text on two lines: ${t}`)
  const cls = await page.evaluate(() => new Promise((res) => { let v = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) v += e.value }).observe({ type: "layout-shift", buffered: true }); setTimeout(() => res(v), 400) }))
  if (cls > 0.01) fail(`${tag}: layout shift ${cls.toFixed(3)}`)
  if (width === 390 || width === 1440) await page.screenshot({ path: path.join(out, `${u.replaceAll("/", "_") || "home"}-${scheme}-${width}.png`), fullPage: true })
  await page.close()
}

const jobs = pages.flatMap((u) => ["light", "dark"].flatMap((scheme) => [320, 390, 768, 1280, 1440].map((w) => [u, scheme, w])))
let next = 0
await Promise.all(Array.from({ length: 6 }, async () => { while (next < jobs.length) { const j = jobs[next++]; await gate(...j) } }))
console.log(`  ok   ${pages.length} pages × 2 themes × 5 widths gated`)
// The motion layer must survive the build: a minifier once folded the scroll-driven rule into a shorthand Chrome
// rejects, and nothing moved. With motion allowed, the home page's parts must carry a running animation.
{
  const page = await browser.newPage({ reducedMotion: "no-preference", viewport: { width: 1440, height: 900 } })
  await page.goto(base + "/", { waitUntil: "networkidle" })
  const moving = await page.evaluate(() => ({ rise: document.querySelectorAll(".rise").length, running: document.getAnimations().length, name: getComputedStyle(document.querySelector(".rise")).animationName }))
  if (moving.name !== "rise" || moving.running < moving.rise) fail(`/ motion: ${moving.running} of ${moving.rise} rising parts animate (animation-name ${moving.name})`)
  await page.close()
}
// Print: every free log is laid out under its print styles at the width its paper leaves inside the margins
// (US Letter, @page margins in global.css: landscape 11 - 2 x 0.4 in, portrait 8.5 - 2 x 0.5 in, at 96 px an inch).
// No table may run past the page, and no screen-only hint may print. The old pages printed every column on paper.
for (const f of fs.readdirSync(path.join(dist, "tools"), { recursive: true }).filter((f) => f.endsWith("index.html"))) {
  const u = `/tools/${f.replace(/index\.html$/, "")}`
  if (!fs.readFileSync(path.join(dist, "tools", f), "utf8").includes("data-sheet=")) continue
  for (const orientation of ["landscape", "portrait"]) {
    const page = await browser.newPage({ viewport: { width: orientation === "landscape" ? Math.round(10.2 * 96) : Math.round(7.5 * 96), height: 900 } })
    await page.emulateMedia({ media: "print" })
    await page.goto(base + u, { waitUntil: "networkidle" })
    const r = await page.evaluate((o) => [...document.querySelectorAll(`[data-sheet].sheet-${o}`)].map((sh) => ({
      id: sh.dataset.sheet,
      over: Math.max(0, ...[...sh.querySelectorAll("table")].map((t) => Math.ceil(t.getBoundingClientRect().right - sh.getBoundingClientRect().right))),
      hints: [...sh.querySelectorAll("[data-hint]")].filter((p) => p.checkVisibility()).length,
    })), orientation)
    for (const x of r) {
      if (x.over > 0) fail(`${u} print (${orientation}): sheet ${x.id} runs ${x.over}px past the page`)
      if (x.hints) fail(`${u} print (${orientation}): sheet ${x.id} prints a screen-only hint`)
    }
    await page.close()
  }
}
await browser.close()
server.close()
console.log(`\n${failures.length} failures, ${warnings.length} warnings`)
process.exit(failures.length ? 1 : 0)
