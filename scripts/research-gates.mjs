// Research gates (s-tier-site GOLD-STANDARD.md §3, "Gates added 2026-11-07", sources in SPEC.md §2 and §6). Runs after
// a build, beside check.mjs: node scripts/research-gates.mjs. Each gate prints what it checked, so a pass says how
// much it covered, not only that nothing failed.
//
// 1 The six common failures   axe's six rules for the errors on 96% of pages (WebAIM Million 2026), counted by name.
// 2 Meaning, not just markup   every alt text must be in scripts/research/alt-reviewed.json, written after looking at
//                              its picture (Calò et al., CHI EA 2026: alt="image" passes every tool); vague link and
//                              button names fail (WCAG 2.4.4, 4.1.2).
// 3 Placeholder sweep          no lorem ipsum, TODO, example.com, unrendered templates or "undefined" in built pages
//                              (CodeA11y, CHI 2025: assistants leave placeholders in).
// 4 Personal-data fields       a field asking for the user's own name, email, phone or address carries autocomplete
//                              (WCAG 1.3.5); no field is labelled by its placeholder alone.
// 5 Colour-vision deficiencies screenshots under Chrome's four emulations for the look round (WCAG 1.4.1;
//                              Angerbauer et al., CHI 2022).
// 6 Charts                     each chart has a data table or a screen-reader tree (Zong et al. 2022; Chartability).
// 7 Consent                    if a page stores anything or calls another site, a banner with equal Accept and Reject
//                              must exist (Habib et al., CHI 2022; Bielova et al., USENIX Security 2024). Consent is
//                              needed for storing or reading data on the device (ePrivacy Directive Art. 5(3)).
// 8 Deception                  no pre-ticked checkboxes, false urgency, confirmshaming or countdowns (Gray et al.,
//                              CHI 2024). Radios may start selected for a setting, as GOV.UK allows.
// 9 Use by an agent            the main tasks done through roles and names alone, as an agent reading the
//                              accessibility tree would (WebArena, ICLR 2024; NN/g "AI Agents as Users", 2026).
import fs from "node:fs"
import http from "node:http"
import path from "node:path"
import { chromium } from "playwright"
import * as cheerio from "cheerio"
import { brand } from "../src/data/brand.ts"

const root = path.resolve(import.meta.dirname, "..")
const dist = path.join(root, "dist")
const out = path.join(root, "dist-check", "research")
fs.mkdirSync(path.join(out, "cvd"), { recursive: true })
const axeSource = fs.readFileSync(path.join(root, "node_modules/axe-core/axe.min.js"), "utf8")
const ledgerFile = path.join(root, "scripts/research/alt-reviewed.json")
const ledger = fs.existsSync(ledgerFile) ? JSON.parse(fs.readFileSync(ledgerFile, "utf8")) : {}
const failures = []
const fail = (m) => { failures.push(m); console.log(`  FAIL ${m}`) }
const ok = (m) => console.log(`  ok   ${m}`)

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
const htmlFiles = walk(dist).filter((f) => f.endsWith(".html"))
const urlOf = (f) => { const r = "/" + path.relative(dist, f).replaceAll(path.sep, "/"); return r.endsWith("/index.html") ? r.slice(0, -10) : r }
const built = Object.fromEntries(htmlFiles.map((f) => [urlOf(f), fs.readFileSync(f, "utf8")]))
const pages = Object.keys(built).filter((u) => !/<meta http-equiv="refresh"/.test(built[u])).sort()

// 3 Placeholder sweep, on the built HTML: visible text and the attributes people and screen readers meet.
{
  const patterns = [
    [/lorem ipsum/i, "lorem ipsum"], [/\b(TODO|FIXME|TBD|XXX)\b/, "a to-do marker"], [/\bexample\.(com|org|net)\b/i, "example.com"],
    [/\{\{|\}\}|\$\{/, "an unrendered template"], [/\[object Object\]/, "a script value printed as text"],
    [/\bplaceholder\b/i, "the word placeholder"],
  ]
  let n = 0
  for (const u of pages) {
    const $ = cheerio.load(built[u])
    $("script, style, template, noscript").remove()
    // Text node by node with spaces between: cheerio's .text() joins neighbouring elements ("Call us" + "TODO" became
    // "Call usTODO"), which hid a planted TODO from the word-boundary match in the negative control.
    const nodes = $("body *").contents().filter((_, node) => node.type === "text").map((_, node) => node.data).get()
    const text = [...nodes, ...$("[alt], [title], [aria-label]").map((_, e) => [e.attribs.alt, e.attribs.title, e.attribs["aria-label"]].filter(Boolean).join(" ")).get()].join(" ")
    n++
    for (const [re, what] of patterns) { const m = text.match(re); if (m) fail(`${u}: ${what}: "…${text.slice(Math.max(0, m.index - 40), m.index + 40).replace(/\s+/g, " ")}…"`) }
    // A value a script failed to fill shows up as a whole cell or line reading undefined, NaN or null; the words
    // inside a sentence ("the phrase is undefined") are English.
    $("body *").contents().each((_, node) => {
      if (node.type === "text" && /^(undefined|NaN|null)$/.test(node.data.trim())) fail(`${u}: a script value printed as text: "${node.data.trim()}" in <${node.parent.name}>`)
    })
  }
  ok(`placeholder sweep over ${n} pages`)
}

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".pdf": "application/pdf", ".xml": "application/xml" }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname)
  if (p.endsWith("/")) p += "index.html"
  const f = path.join(dist, p)
  if (!f.startsWith(dist) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404, { "content-type": "text/html" }); return res.end(fs.readFileSync(path.join(dist, "404.html"))) }
  res.writeHead(200, { "content-type": types[path.extname(f)] ?? "application/octet-stream" })
  fs.createReadStream(f).pipe(res)
})
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()

const SIX = ["color-contrast", "image-alt", "label", "link-name", "button-name", "html-has-lang"]
const tally = Object.fromEntries(SIX.map((r) => [r, 0]))
const alts = new Map()
let fieldsChecked = 0, sheetCells = 0, charts = 0, storing = 0, views = 0

async function visit(u, scheme) {
  const context = await browser.newContext({ colorScheme: scheme, reducedMotion: "reduce", viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  const offsite = []
  page.on("request", (r) => { const h = new URL(r.url()).host; if (!r.url().startsWith("data:") && h !== new URL(base).host) offsite.push(r.url()) })
  await page.goto(base + u, { waitUntil: "networkidle" })
  views++
  // 1 The six common failures, by name.
  await page.evaluate(axeSource)
  const axe = await page.evaluate((rules) => window.axe.run(document, { runOnly: { type: "rule", values: rules } }), SIX)
  for (const v of axe.violations) { tally[v.id] += v.nodes.length; fail(`${u} ${scheme}: ${v.id} on ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`) }
  if (scheme === "dark") return void (await context.close())

  const r = await page.evaluate(() => {
    const name = (el) => (el.getAttribute("aria-label") || (el.getAttribute("aria-labelledby") || "").split(" ").map((id) => document.getElementById(id)?.textContent || "").join(" ") || el.textContent || el.getAttribute("title") || "").replace(/\s+/g, " ").trim()
    const labelOf = (el) => {
      const own = el.getAttribute("aria-label") || (el.getAttribute("aria-labelledby") || "").split(" ").map((id) => document.getElementById(id)?.textContent || "").join(" ")
      const tag = (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) || el.closest("label")
      return (own || tag?.textContent || el.getAttribute("title") || "").replace(/\s+/g, " ").trim()
    }
    return {
      imgs: [...document.querySelectorAll("img")].map((i) => ({ src: i.getAttribute("src"), alt: i.getAttribute("alt"), decorative: i.getAttribute("alt") === "" || i.getAttribute("role") === "presentation" || i.getAttribute("aria-hidden") === "true" })),
      links: [...document.querySelectorAll("a[href]")].filter((a) => a.checkVisibility()).map((a) => ({ name: name(a), href: a.getAttribute("href") })),
      buttons: [...document.querySelectorAll("button, summary, [role=button]")].filter((b) => b.checkVisibility()).map((b) => name(b)),
      fields: [...document.querySelectorAll("input:not([type=hidden]), select, textarea")].map((f) => ({ type: f.type, name: f.name, autocomplete: f.getAttribute("autocomplete"), label: labelOf(f), placeholder: f.getAttribute("placeholder"), sheet: !!f.closest("[data-sheet]") })),
      checkedBoxes: [...document.querySelectorAll("input[type=checkbox]")].filter((c) => c.defaultChecked).length,
      timers: document.querySelectorAll("[role=timer]").length,
      charts: [...document.querySelectorAll("canvas, svg[role=img], [data-chart]")].map((c) => !!(c.closest("figure")?.querySelector("table") || c.getAttribute("aria-describedby") || c.closest("[data-olli]"))),
      storage: localStorage.length + sessionStorage.length,
    }
  })
  // 2 Meaning: alt texts reviewed against their pictures; names that say where a link goes.
  for (const i of r.imgs) {
    if (i.decorative) continue
    const alt = (i.alt ?? "").trim()
    const file = (i.src || "").split("/").pop().split("?")[0]
    if (/^(an? )?(image|img|photo|picture|logo|icon|graphic|screenshot|banner|figure)s?\.?$/i.test(alt) || /^(image|picture|photo) of\b/i.test(alt) || /\.(png|jpe?g|webp|avif|svg)$/i.test(alt)) fail(`${u}: alt text says nothing: "${alt}" (${file})`)
    if (!alts.has(alt)) alts.set(alt, { file: file.split(".")[0], pages: [] })
    alts.get(alt).pages.push(u)
  }
  const vague = /^(click here|here|read more|more|learn more|link|this|go|details|continue)$/i
  for (const l of r.links) if (vague.test(l.name)) fail(`${u}: link named only "${l.name}" (${l.href})`)
  // One name, one destination (WCAG 2.4.4, 3.2.4): the same words must not lead to two different places.
  const places = new Map()
  for (const l of r.links) { const to = new URL(l.href, base + u).href; (places.get(l.name) ?? places.set(l.name, new Set()).get(l.name)).add(to) }
  for (const [n, s] of places) if (n && s.size > 1) fail(`${u}: link "${n}" leads to ${s.size} places: ${[...s].map((h) => h.replace(base, "")).join(", ")}`)
  for (const b of r.buttons) if (/^(button|submit|ok|click)$/i.test(b)) fail(`${u}: button named only "${b}"`)
  // 4 Personal-data fields. Cells of the printable logs record other people and events, not the user, so
  // autocomplete="off" is right there (WCAG 1.3.5 covers information about the user).
  const personal = /\b(your )?(full |first |last )?name\b|e-?mail|phone|telephone|mobile|address|street|city|postal|post ?code|zip|country|company|organi[sz]ation|card|username|password/i
  for (const f of r.fields) {
    if (f.sheet) { sheetCells++; continue }
    fieldsChecked++
    if ((["email", "tel", "password"].includes(f.type) || personal.test(f.label) || personal.test(f.name)) && (!f.autocomplete || f.autocomplete === "off")) fail(`${u}: personal-data field "${f.label || f.name}" has no autocomplete`)
    if (!f.label && f.placeholder) fail(`${u}: field labelled only by its placeholder "${f.placeholder}"`)
  }
  // 6 Charts.
  charts += r.charts.length
  r.charts.forEach((has, k) => has || fail(`${u}: chart ${k + 1} has no data table or screen-reader tree`))
  // 7 Consent: anything stored, any cookie, any other site called.
  const cookies = await context.cookies()
  if (cookies.length || r.storage || offsite.length) {
    storing++
    const banner = await page.evaluate(() => {
      const box = [...document.querySelectorAll("[role=dialog], [role=region], aside, section, div")].find((e) => /cookie/i.test(e.textContent) && e.querySelectorAll("button").length >= 2)
      if (!box) return null
      const btn = (re) => [...box.querySelectorAll("button")].find((b) => re.test(b.textContent))
      const a = btn(/accept/i), x = btn(/reject|decline|only essential|necessary only/i)
      if (!a || !x) return { equal: false }
      const ra = a.getBoundingClientRect(), rx = x.getBoundingClientRect(), sa = getComputedStyle(a), sx = getComputedStyle(x)
      return { equal: Math.abs(ra.width * ra.height - rx.width * rx.height) / (ra.width * ra.height) < 0.2 && sa.fontWeight === sx.fontWeight && sa.fontSize === sx.fontSize }
    })
    const why = [cookies.length && `${cookies.length} cookies`, r.storage && `${r.storage} stored items`, offsite.length && `calls ${new URL(offsite[0]).host}`].filter(Boolean).join(", ")
    if (!banner) fail(`${u}: ${why}, and no consent banner`)
    else if (!banner.equal) fail(`${u}: consent banner's Accept and Reject are not equal`)
  }
  // 8 Deception.
  if (r.checkedBoxes) fail(`${u}: ${r.checkedBoxes} checkboxes ticked in advance`)
  if (r.timers) fail(`${u}: a countdown timer`)
  const body = await page.evaluate(() => document.body.innerText)
  // Sales pressure, not the word itself ("an unwrapped cycle in a hurry" is guidance).
  const urgency = body.match(/only \d+ left|hurry,? (before|while)|offer ends|limited[- ]time offer|act now|don['’]t miss out|no thanks,? i (don['’]t|do not)/i)
  if (urgency) fail(`${u}: pressure wording "${urgency[0]}"`)
  await context.close()
}

const jobs = pages.flatMap((u) => [[u, "light"], [u, "dark"]])
let next = 0
await Promise.all(Array.from({ length: 6 }, async () => { while (next < jobs.length) await visit(...jobs[next++]) }))
console.log(`  ${Object.values(tally).some(Boolean) ? "count" : "ok  "} the six common failures on ${views} page views: ${SIX.map((r) => `${r} ${tally[r]}`).join(", ")}`)

// 2 The ledger: every alt text must have been read against its picture. A changed alt text needs a new review.
const unreviewed = [...alts].filter(([alt]) => !ledger[alt])
for (const [alt, x] of unreviewed) fail(`alt text not yet reviewed against its picture (${x.file}, on ${x.pages[0]}): "${alt.slice(0, 90)}…"`)
for (const alt of Object.keys(ledger)) if (!alts.has(alt)) console.log(`  note ledger entry no longer on the site: "${alt.slice(0, 70)}…"`)
fs.writeFileSync(path.join(out, "alt-texts.json"), JSON.stringify(Object.fromEntries(alts), null, 1))
ok(`${alts.size} alt texts, ${alts.size - unreviewed.length} reviewed; link and button names checked`)
ok(`${fieldsChecked} form fields checked for autocomplete and labels (${sheetCells} printable log cells left as autocomplete="off")`)
ok(charts ? `${charts} charts checked` : "no charts on the site")
ok(storing ? `${storing} pages store data or call other sites` : `no cookies, stored items or calls to other sites on ${pages.length} pages: no consent banner needed`)

// 5 Colour-vision deficiencies: screenshots for the look round.
const cvdPages = ["/", "/purchaserow/", "/food-safety/", "/dental-logbook/", "/tools/", "/tools/florida-spore-test-calculator/", "/tools/spore-test-log/"]
for (const u of cvdPages.filter((p) => pages.includes(p))) {
  const page = await browser.newPage({ reducedMotion: "reduce", viewport: { width: 1280, height: 900 } })
  const cdp = await page.context().newCDPSession(page)
  await page.goto(base + u, { waitUntil: "networkidle" })
  for (const type of ["protanopia", "deuteranopia", "tritanopia", "achromatopsia"]) {
    await cdp.send("Emulation.setEmulatedVisionDeficiency", { type })
    await page.screenshot({ path: path.join(out, "cvd", `${u === "/" ? "home" : u.replace(/^\/|\/$/g, "").replaceAll("/", "_")}-${type}.png`), fullPage: true })
  }
  await page.close()
}
ok(`${cvdPages.length} pages × 4 vision deficiencies written to dist-check/research/cvd for the look round`)

// 9 Use by an agent: each task through roles and accessible names only, at desktop and phone width. The tree each
// task read is saved, so a failure shows what the agent saw.
const tasks = [
  ["contact the company from the header", async (p, phone) => {
    await p.goto(base + "/")
    // Under 640 px the header's links sit in a native <details>. Chrome exposes its <summary> to screen readers as a
    // disclosure button; Playwright's own tree (the one Playwright MCP agents read) shows it as "group: Menu", so the
    // agent opens the group it can see.
    const header = p.getByRole("banner")
    if (phone) await header.getByRole("group").filter({ hasText: "Menu" }).click()
    await header.getByRole("link", { name: "Contact us" }).click()
    const href = await p.getByRole("link", { name: "Email us" }).getAttribute("href")
    if (href !== `mailto:${brand.email}`) throw new Error(`Email us goes to ${href}`)
  }],
  ["open a product's page", async (p) => {
    await p.goto(base + "/")
    await p.getByRole("main").getByRole("link", { name: "Food Safety Logbook" }).click()
    await p.getByRole("heading", { level: 1, name: /Food Safety Logbook/ }).waitFor({ timeout: 5000 })
  }],
  ["reach an outside product", async (p) => {
    await p.goto(base + "/")
    const href = await p.getByRole("main").getByRole("link", { name: /^Sheets Converter/ }).getAttribute("href")
    if (!href?.startsWith("https://sheetsconverter.com")) throw new Error(`Sheets Converter goes to ${href}`)
  }],
  ["find a free log and print it", async (p) => {
    await p.goto(base + "/")
    await p.getByRole("main").getByRole("link", { name: "Dental Logbook" }).click()
    await p.getByRole("link", { name: "All free logs and records" }).click()
    await p.getByRole("main").getByRole("link", { name: /spore test \(BI\) log/i }).first().click()
    await p.getByRole("heading", { level: 1 }).waitFor({ timeout: 5000 })
    if (!(await p.getByRole("button", { name: /print/i }).count())) throw new Error("no Print button by role and name")
  }],
]
for (const [width, phone] of [[1280, false], [390, true]]) {
  for (const [what, run] of tasks) {
    const page = await browser.newPage({ reducedMotion: "reduce", viewport: { width, height: 900 } })
    try { await run(page, phone); ok(`agent at ${width} px: ${what}`) }
    catch (e) {
      fs.writeFileSync(path.join(out, `agent-${width}-${what.replaceAll(" ", "-")}.yml`), await page.locator("body").ariaSnapshot().catch(() => ""))
      fail(`agent at ${width} px could not ${what}: ${e.message.split("\n")[0].slice(0, 160)}`)
    }
    await page.close()
  }
}

await browser.close()
server.close()
console.log(`\n${failures.length} failures. Still by eye: the colour-vision screenshots and a look round against the dark-patterns ontology.`)
process.exit(failures.length ? 1 : 0)
