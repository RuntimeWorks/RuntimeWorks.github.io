// Card covers for products that live on this site (founder, 2026-11-07: "really professional thumbnails for all
// products"). Each card shows the product's own front page: Sheets Converter and PurchaseRow use their own sites'
// first screens (src/assets/products/sheets-converter.png, purchaserow.png, 1280 x 800 at 2x); these three use the navy
// opening band of their page here, centred on a navy field at the same 16:10 size. Run after a page's opening changes:
// npm run build, node scripts/serve.mjs, then npm run covers.
import { chromium } from "playwright"
import sharp from "sharp"
import { brand } from "../src/data/brand.ts"

const base = process.env.BASE ?? "http://127.0.0.1:3633"
const pages = ["food-safety", "dental-logbook", "meal-planner"]
const [W, H, scale] = [1280, 800, 2]
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: scale, colorScheme: "light", reducedMotion: "reduce" })
for (const p of pages) {
  await page.goto(`${base}/${p}/`, { waitUntil: "networkidle" })
  // The sticky site header would sit over the band in an element screenshot; hidden through the CSSOM (the site's CSP
  // refuses an added <style>).
  await page.evaluate(() => document.querySelector("body > header")?.style.setProperty("display", "none", "important"))
  await page.waitForTimeout(500)
  const band = await page.locator('section[aria-labelledby="h1"]').screenshot()
  const meta = await sharp(band).metadata()
  // Element boxes end on a fraction of a pixel, so the last rows can catch the ground below: drop 6 rows (inside the
  // band's own padding), then centre the band on the harbour navy.
  const trimmed = await sharp(band).extract({ left: 0, top: 0, width: meta.width, height: meta.height - 6 }).toBuffer()
  // Two steps, because sharp always resizes before it extends, whatever order the calls are written in.
  const h = meta.height - 6
  const pad = Math.max(0, H * scale - h)
  const extended = await sharp(trimmed).extend({ top: Math.floor(pad / 2), bottom: Math.ceil(pad / 2), background: brand.theme.harbour }).toBuffer()
  await sharp(extended).extract({ left: 0, top: 0, width: W * scale, height: H * scale }).png().toFile(`src/assets/products/cover-${p}.png`)
  console.log("cover", p)
}
await browser.close()
