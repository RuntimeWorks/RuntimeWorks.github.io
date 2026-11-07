// Keyboard alone (WCAG 2.1.1, 2.4.3, 2.4.7; APG disclosure contract), adapted from PurchaseRow's keyboard test.
// On the built site: the skip link comes first and moves focus into the page; every focused control shows a visible
// focus ring; the phone menu opens with Enter and closes with Escape, giving focus back; a question opens with Enter;
// the product cards and a sheet's fields are reachable; the calculator answers typed input.
import fs from "node:fs"
import http from "node:http"
import path from "node:path"
import { chromium } from "playwright"

const dist = path.resolve(import.meta.dirname, "../dist")
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname)
  if (p.endsWith("/")) p += "index.html"
  const f = path.join(dist, p)
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end() }
  res.writeHead(200, { "content-type": { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" }[path.extname(f)] ?? "application/octet-stream" })
  fs.createReadStream(f).pipe(res)
})
await new Promise((ok) => server.listen(0, "127.0.0.1", ok))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()
let failed = 0
const check = (ok, what) => { console.log(`  ${ok ? "ok  " : "FAIL"} ${what}`); if (!ok) failed++ }
const focusInfo = (page) => page.evaluate(() => {
  const el = document.activeElement
  const s = getComputedStyle(el)
  const ring = (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== "none" || (el.matches("a") && getComputedStyle(el, "::after").outlineStyle !== "none")
  return { tag: el.tagName, text: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40), href: el.getAttribute("href"), ring }
})

for (const width of [390, 1280]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } })
  await page.goto(`${base}/`)
  await page.keyboard.press("Tab")
  let f = await focusInfo(page)
  check(f.href === "#main" && f.ring, `${width}px: the first Tab lands on the skip link, with a visible ring`)
  await page.keyboard.press("Enter")
  check(await page.evaluate(() => location.hash === "#main"), `${width}px: the skip link moves to the main content`)
  // Walk the page by Tab: every stop shows a ring, and the product links are reachable.
  await page.goto(`${base}/`)
  const seen = []
  for (let i = 0; i < 60; i++) { await page.keyboard.press("Tab"); f = await focusInfo(page); if (f.tag === "BODY") break; seen.push(f); if (!f.ring) check(false, `${width}px: no visible focus on ${f.tag} "${f.text}"`) } // BODY: focus has left the page
  check(seen.some((x) => x.href === "https://sheetsconverter.com/"), `${width}px: Tab reaches the Sheets Converter card`)
  check(seen.some((x) => x.href === "/meal-planner/"), `${width}px: Tab reaches the meal planner card`)
  if (width === 390) {
    await page.goto(`${base}/`)
    await page.locator("summary", { hasText: "Menu" }).focus()
    await page.keyboard.press("Enter")
    check(await page.locator("details[data-menu]").evaluate((d) => d.open), "390px: Enter opens the menu")
    await page.keyboard.press("Escape")
    check(!(await page.locator("details[data-menu]").evaluate((d) => d.open)) && (await focusInfo(page)).text === "Menu", "390px: Escape closes the menu and returns focus to it")
  }
  await page.close()
}

const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto(`${base}/food-safety/`)
const q = page.locator("summary", { hasText: "What does it cost?" })
await q.focus(); await page.keyboard.press("Enter")
check(await q.evaluate((s) => s.parentElement.open), "a question opens with Enter")
await page.goto(`${base}/tools/spore-test-log/`)
await page.locator("[data-sheet] input").first().focus()
await page.keyboard.type("Northgate Dental")
check((await page.locator("[data-sheet] input").first().inputValue()) === "Northgate Dental", "a sheet field takes typed text")
check(await page.locator("button[data-print]").isVisible(), "the sheet has its print button")
await page.goto(`${base}/tools/florida-spore-test-calculator/`)
await page.locator("#last").fill("2026-10-06")
await page.locator("#cyc").fill("8"); await page.locator("#mins").fill("60")
await page.locator("#mins").press("Tab")
check((await page.locator('[data-o="due"]').textContent()) === "Oct 11, 2026", "the calculator gives the worked example's date (Oct 11, 2026)")
await page.locator('input[value="dry"]').focus(); await page.keyboard.press("Space")
check((await page.locator('[data-o="due"]').textContent()) === "Oct 13, 2026", "choosing dry heat by keyboard moves the date to the 7-day limit")

await browser.close()
server.close()
console.log(failed ? `\n${failed} keyboard checks failed` : "\nall keyboard checks passed")
process.exit(failed ? 1 : 0)
