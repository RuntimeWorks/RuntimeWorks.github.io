// Captures a product's real screen for its card: node scripts/capture.mjs <url> <out.png> [width] [height] [hide-selector]
// Optional CLICK=<button name> presses one button first (for example a cookie choice); ELEMENT=<selector> photographs that element instead of the screen;
// PRINT=1 (RES=<dpi>, default 110) prints the page's sheet the way its Print button does (Chromium PDF, the page's own @page size) and turns
// page 1 into the PNG with Poppler's pdftoppm, so a log is shown as the sheet a visitor prints. Light scheme, reduced motion, 2x pixels. Used for Sheets Converter (live site) and PurchaseRow (its built site).
import { chromium } from "playwright"
import { execFileSync } from "node:child_process"
const [url, out, w = "1280", h = "800", hide] = process.argv.slice(2)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2, colorScheme: "light", reducedMotion: "reduce" })
await page.goto(url, { waitUntil: "networkidle" })
if (process.env.CLICK) await page.getByRole("button", { name: process.env.CLICK }).click()
// Hidden through the CSSOM: the site's own Content Security Policy refuses an added <style> tag, not a script's style edits.
if (hide) await page.evaluate((sel) => document.querySelectorAll(sel).forEach((el) => el.style.setProperty("display", "none", "important")), hide)
await page.waitForTimeout(800)
if (process.env.PRINT) {
  await page.evaluate(() => { document.body.setAttribute("data-print-only", ""); document.querySelector("[data-sheet]").setAttribute("data-print-target", "") })
  await page.pdf({ path: out + ".pdf", preferCSSPageSize: true, printBackground: true })
  execFileSync("pdftoppm", ["-png", "-r", process.env.RES ?? "110", "-f", "1", "-l", "1", "-singlefile", out + ".pdf", out.replace(/\.png$/, "")])
} else if (process.env.ELEMENT) await page.locator(process.env.ELEMENT).first().screenshot({ path: out })
else await page.screenshot({ path: out })
await browser.close()
console.log("saved", out)
