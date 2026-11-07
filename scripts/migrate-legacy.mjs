// One-time move of the Dental Logbook library (guides, tools, state pages) from the old hand-written HTML into
// content collections. Run: node scripts/migrate-legacy.mjs. It reads the old pages from git (scripts/legacy.mjs),
// strips their per-page CSS, scripts and chrome, keeps the words and the structure, and writes one Markdown file per
// page. Parts: cheerio (parse), sanitize-html (whitelist the semantic tags), Turndown + GFM (HTML to Markdown).
// Tables and definition lists stay as HTML inside the Markdown so captions and row headers survive.
import fs from "node:fs"
import path from "node:path"
import * as cheerio from "cheerio"
import sanitizeHtml from "sanitize-html"
import TurndownService from "turndown"
import { gfm } from "turndown-plugin-gfm"
import GithubSlugger from "github-slugger"
import { CHROME, isEyebrow, pages, read } from "./legacy.mjs"

const root = path.resolve(import.meta.dirname, "..")
const clean = (s) => s.replace(/\s+/g, " ").trim()

const ALLOWED = ["h2", "h3", "h4", "h5", "p", "ul", "ol", "li", "a", "strong", "em", "b", "i", "code", "pre", "blockquote",
  "table", "caption", "thead", "tbody", "tfoot", "tr", "th", "td", "dl", "dt", "dd", "figure", "figcaption", "img", "cite",
  "time", "abbr", "br", "hr", "sup", "sub", "details", "summary", "x-widget", "q", "mark", "small", "span"]
const sanitize = (html) => sanitizeHtml(html, {
  allowedTags: ALLOWED,
  allowedAttributes: { a: ["href"], th: ["scope", "colspan", "rowspan"], td: ["colspan", "rowspan"], img: ["src", "alt", "width", "height"], time: ["datetime"], abbr: ["title"], ol: ["start"], "x-widget": ["name"] },
  // Wrappers (div, section, article, span) are not allowed: they are dropped and their contents kept.
  allowedSchemes: ["https", "http", "mailto", "tel"],
})

const marker = (n) => `\n\n<div data-widget="${n.getAttribute("name")}"></div>\n\n`
// Turndown drops empty elements through blankReplacement, so the empty widget markers are written there too.
const td = new TurndownService({ headingStyle: "atx", bulletListMarker: "-", emDelimiter: "_", codeBlockStyle: "fenced",
  blankReplacement: (_c, n) => (n.nodeName === "X-WIDGET" ? marker(n) : n.isBlock ? "\n\n" : "") })
td.use(gfm)
// Tables and definition lists stay HTML, on one line so Markdown passes them through untouched.
td.addRule("keep-block-html", {
  filter: ["table", "dl", "details"],
  replacement: (_c, node) => `\n\n${node.outerHTML.replace(/>\s+</g, "><").replace(/\s*\n\s*/g, " ")}\n\n`,
})
td.addRule("cite", { filter: ["cite"], replacement: (c) => `<cite>${c.trim()}</cite>` })
// "<b>Title</b><span>Text</span>" (a title with its text on the next line) becomes "**Title**<br>Text". Without the
// break, CommonMark leaves "**…)**What" unclosed, because a closing ** after punctuation must be followed by a space.
td.addRule("title-then-text", {
  filter: (n) => n.nodeName === "SPAN" && ["B", "STRONG"].includes(n.previousSibling?.nodeName ?? ""),
  replacement: (c) => `<br>${c.trim()}`,
})
td.addRule("widget", { filter: (n) => n.nodeName === "X-WIDGET", replacement: (_c, n) => marker(n) })
// Short pieces shown outside the body (the lead, the summary box) stay as clean inline HTML.
const inline = (html) => sanitize(html).replace(/^<(p|li)>|<\/(p|li)>$/g, "").replace(/\s+/g, " ").trim()
const md = (html) => td.turndown(sanitize(html)).replace(/\n{3,}/g, "\n\n").trim()

// A printable sheet: its title, header fields, notes and tables. A column's label comes from the first row's input
// labels ("Row 1: date placed", "Date, row 1", "Training date, line 1"); a cell with printed text (a week's date on the
// calendar) is kept as that text, so the sheet is data and one component draws every sheet the same way.
// The old page's own print rules: the paper it asked for (@page size) and the classes it hid on paper (a "scroll
// sideways" hint, for example). Braces are matched, so nested rules inside @media print are read whole.
function printRules(css) {
  const orientation = /@page\s*\{[^}]*size:\s*letter\s+(landscape|portrait)/.exec(css)?.[1] ?? "portrait"
  const hidden = new Set()
  for (let i = css.indexOf("@media print"); i !== -1; i = css.indexOf("@media print", i + 1)) {
    let depth = 0, j = css.indexOf("{", i), k = j
    for (; k < css.length; k++) { if (css[k] === "{") depth++; else if (css[k] === "}" && --depth === 0) break }
    for (const [, sel, body] of css.slice(j + 1, k).matchAll(/([^{}]+)\{([^{}]*)\}/g))
      if (/display\s*:\s*none/.test(body)) for (const c of sel.matchAll(/\.([\w-]+)/g)) hidden.add(c[1])
  }
  return { orientation, hidden }
}
const stripRow = (s) => clean(s).replace(/^Row \d+:\s*/i, "").replace(/,\s*(row|line)\s*\d+$/i, "")
function readSheet($, sheet, print) {
  // A line break inside a heading ("Date of<br>positive result") is a space in the words.
  sheet.find("br").replaceWith(" ")
  const title = clean(sheet.find(".sheet-head h3, h3").first().text())
  const fields = sheet.find(".field").map((_, f) => {
    const input = $(f).find("input").first()
    return { label: clean($(f).find("label").text()), ...(input.attr("value") ? { value: input.attr("value") } : {}) }
  }).get().filter((f) => f.label)
  // Every other line printed on the sheet (a label under the title, a hint, a footnote, the footer with the address),
  // split into the lines above the first table and the lines below it.
  const firstTable = sheet.find("table").first().get(0)
  const lines = sheet.find("p, small, h4, h5, legend, .sheet-foot, .foot").filter((_, e) => !$(e).closest(".field, table").length && !$(e).find("p, small, h4, h5").length && !$(e).is(sheet.find(".sheet-head h3, h3").first()))
  // A line is above the table when the table follows it (as a later sibling of the line or of one of its parents).
  const isBefore = (e) => Boolean(firstTable) && $(e).nextAll().add($(e).parents().nextAll()).filter((_, n) => n === firstTable || $(n).find(firstTable).length > 0).length > 0
  // Lines the old page hid on paper are screen hints; they stay on screen and are never printed.
  const screenOnly = (e) => ($(e).attr("class") ?? "").split(/\s+/).some((c) => print.hidden.has(c))
  const text = (set) => set.map((_, e) => clean($(e).text())).get().filter(Boolean)
  const notes = text(lines.filter((_, e) => isBefore(e) && !screenOnly(e)))
  const footer = text(lines.filter((_, e) => !isBefore(e) && !screenOnly(e)))
  const hints = text(lines.filter((_, e) => screenOnly(e)))
  const tables = sheet.find("table").map((_, t) => {
    const table = $(t)
    const headers = table.find("thead tr").last().find("th").map((_, th) => clean($(th).text())).get()
    const rows = table.find("tbody tr").map((_, tr) => [$(tr).find("td, th").map((_, c) => {
      const input = $(c).find("input, textarea").first()
      return input.length ? null : clean($(c).text())
    }).get()]).get()
    const first = table.find("tbody tr").first().find("td, th")
    const columns = headers.map((h, i) => {
      const input = first.eq(i).find("input, textarea").first()
      return { header: h, label: input.length ? stripRow(input.attr("aria-label") || h) : h }
    })
    const prefilled = rows.some((r) => r.some((c) => c !== null && c !== ""))
    return { caption: clean(table.find("caption").text()), columns, ...(prefilled ? { rows } : { rows: rows.length }) }
  }).get()
  return { ...(title ? { title } : {}), orientation: print.orientation, fields, notes, tables, ...(footer.length ? { footer } : {}), ...(hints.length ? { hints } : {}) }
}

const kinds = { guides: "guides", tools: "tools", states: "states" }
const report = []
for (const file of pages()) {
  const parts = file.split("/")
  if (parts.length !== 3 || !kinds[parts[0]]) continue // only /<kind>/<slug>/index.html
  const [kind, slug] = parts
  const $ = cheerio.load(read(file))
  const main = $("main").first()
  const fm = {
    title: clean($("title").text()),
    description: clean($('meta[name="description"]').attr("content") || ""),
    legacy: `/${kind}/${slug}/`,
  }
  main.find("*").addBack().contents().filter((_, n) => n.type === "comment").remove()
  // In-page links pointed at section ids, which disappear with the sections. Astro gives each heading an id from its
  // text with github-slugger, so point each link at the slug of its section's first heading instead.
  const slugger = new GithubSlugger()
  const ids = {}
  main.find("h2, h3, h4").each((_, h) => { const s = slugger.slug(clean($(h).text())); const host = $(h).closest("[id]"); if (host.length && !(host.attr("id") in ids)) ids[host.attr("id")] = s })
  main.find('a[href^="#"]').each((_, a) => { const id = $(a).attr("href").slice(1); if (ids[id]) $(a).attr("href", `#${ids[id]}`) })

  // Call to action: keep its words for the new layout's pilot box, then remove it.
  const cta = main.find("section.cta, section.pilot").first()
  if (cta.length) {
    fm.cta = { heading: clean(cta.find("h2, h3").first().text()), text: cta.find("p").map((_, p) => clean($(p).text())).get().filter(Boolean).join(" "), link: clean(cta.find("a").first().text()) }
  }
  for (const sel of CHROME) main.find(sel).remove()

  const h1 = main.find("h1").first()
  fm.heading = clean(h1.text())
  const kicker = main.find(".kicker").first().length ? main.find(".kicker").first() : h1.prevAll(".label, .eyebrow, p.label").first()
  if (kicker.length) { fm.kicker = clean(kicker.text()); kicker.remove() }
  const byline = main.find(".byline").first()
  if (byline.length) { fm.byline = clean(byline.text()); byline.remove() }
  // The lead: paragraphs straight after the H1, before anything else.
  const lead = []
  let n = h1.next()
  while (n.length && n.get(0).tagName === "p") { lead.push(inline($.html(n))); const next = n.next(); n.remove(); n = next }
  if (lead.length) fm.lead = lead
  // Facts listed under the hero (ul.facts) stay with the lead.
  const facts = h1.parent().find("ul.facts, .facts").first()
  if (facts.length) { fm.facts = facts.find("li").map((_, li) => clean($(li).text())).get(); facts.remove() }
  h1.remove()

  const answer = main.find(".answer").first()
  if (answer.length) { fm.answer = (answer.is("p") ? answer : answer.find("p, li")).map((_, p) => inline($.html(p))).get().filter(Boolean); answer.remove() }
  const note = main.find("p.note, aside.note, .note-sec .note, .note-sec p").last()
  if (note.length && clean(note.text()).length < 400) { fm.note = clean(note.text()); note.remove() }

  main.find(".label, .eyebrow, .kicker").each((_, el) => { if (isEyebrow($, el)) $(el).remove() })
  main.find(".src, .cite").each((_, el) => { el.tagName = "cite" })
  // Decorative step labels ("01", "02") inside ordered lists repeat the list's own numbers (taste-skill: numbering).
  main.find("ol .num, ol .n, ol .step-num").filter((_, e) => /^\d{1,2}$/.test(clean($(e).text()))).remove()

  // A sheet is a block with a table and fields to fill. Other blocks with inputs (the Florida calculator) become a marked spot
  // for a component ported by hand; a "sheet" with no inputs is an ordinary table and stays in the text.
  main.find(".sheet, .log-card, #calc, .calc").filter((_, el) => $(el).find("table").length === 0 && $(el).find("input").length > 0)
    .each((i, el) => { $(el).replaceWith(`<x-widget name="form-${i + 1}"></x-widget>`) })
  const sheets = main.find(".sheet, .log-card").filter((_, el) => $(el).find("table").length > 0 && $(el).find("input").length > 0)
  if (sheets.length) {
    const print = printRules($("style").map((_, st) => $(st).text()).get().join("\n"))
    fm.sheets = sheets.map((_, el) => readSheet($, $(el), print)).get()
    // Correction: the training record carried a "Sterilizer (label)" field copied from the sterilizer sheets; a
    // bloodborne pathogens training record has no sterilizer.
    if (slug === "osha-training-record") for (const sh of fm.sheets) sh.fields = sh.fields.filter((f) => f.label !== "Sterilizer (label)")
    sheets.each((i, el) => { $(el).replaceWith(`<x-widget name="sheet-${i + 1}"></x-widget>`) })
  }
  // Interactive parts other than sheets are ported by hand into components; mark where they sat.
  main.find("form").each((i, f) => { $(f).replaceWith(`<x-widget name="form-${i + 1}"></x-widget>`) })

  const body = md(main.html() || "")
  const yaml = Object.entries(fm).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join("\n")
  const out = path.join(root, "src/content", kind, `${slug}.md`)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, `---\n${yaml}\n---\n\n${body}\n`)
  report.push(`${kind}/${slug}: ${body.length} chars${fm.sheets ? `, sheets ${fm.sheets.map((s) => s.tables.map((t) => `${t.columns.length}×${Array.isArray(t.rows) ? t.rows.length + "p" : t.rows}`).join("+")).join(", ")}` : ""}${/data-widget="form/.test(body) ? ", FORM" : ""}`)
}
console.log(report.join("\n"))
console.log(`${report.length} pages moved`)

// The three index pages: their opening words and their groups of cards (title, blurb, tag), in the old order.
const indexes = {}
for (const kind of Object.keys(kinds)) {
  const $ = cheerio.load(read(`${kind}/index.html`))
  const main = $("main").first()
  const hero = main.find("section.hero").first()
  indexes[kind] = {
    title: clean($("title").text()),
    description: clean($('meta[name="description"]').attr("content") || ""),
    kicker: clean(hero.find(".label, .kicker").first().text()),
    heading: clean(hero.find("h1").text()),
    lead: hero.find("p").not(".label, .kicker").map((_, p) => clean($(p).text())).get().filter(Boolean),
    groups: main.find("section").not(".hero, .pilot, .cta").map((_, s) => ({
      title: clean($(s).find("h2").first().text()),
      items: $(s).find("li.card").map((_, li) => ({
        href: $(li).find("a").first().attr("href"),
        title: clean($(li).find("h3").text()),
        blurb: clean($(li).find("p").not(".meta").first().text()),
        ...($(li).find("p.meta").length ? { tag: clean($(li).find("p.meta").text()) } : {}),
      })).get(),
      // Sentences after the cards, as clean HTML so their links survive.
      after: $(s).find("p").filter((_, p) => !$(p).closest("li.card").length).map((_, p) => sanitize($.html(p)).replace(/\s+/g, " ").trim()).get().filter(Boolean),
    })).get().filter((g) => g.items.length || g.after.length),
  }
}
fs.writeFileSync(path.join(root, "src/data/library.json"), `${JSON.stringify(indexes, null, 2)}\n`)
console.log(Object.entries(indexes).map(([k, v]) => `${k}: ${v.groups.map((g) => `${g.title || "(none)"} ${g.items.length}`).join(", ")}`).join("\n"))
