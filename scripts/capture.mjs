// Captures a product's real screen for its card: node scripts/capture.mjs <url> <out.png> [width] [height] [hide-selector]
// Optional CLICK=<button name> presses one button first (for example a cookie choice). Light scheme, reduced motion, 2x pixels. Used for Sheets Converter (live site) and PurchaseRow (its built site).
import { chromium } from "playwright"
const [url, out, w = "1280", h = "800", hide] = process.argv.slice(2)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2, colorScheme: "light", reducedMotion: "reduce" })
await page.goto(url, { waitUntil: "networkidle" })
if (process.env.CLICK) await page.getByRole("button", { name: process.env.CLICK }).click()
if (hide) await page.addStyleTag({ content: `${hide}{display:none!important}` })
await page.waitForTimeout(800)
await page.screenshot({ path: out })
await browser.close()
console.log("saved", out)
