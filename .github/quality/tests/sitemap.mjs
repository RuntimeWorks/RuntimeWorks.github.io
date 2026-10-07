// sitemap.xml and robots.txt for boldsand.com (sitemaps.org protocol 0.9; Google Search Central "Build and
// submit a sitemap"; RFC 9309). Every route from pages.mjs is listed at its canonical URL, except pages marked
// noindex, which Google says not to submit. lastmod is the page file's last commit date; changefreq and
// priority are left out because Google ignores them.
//   node tests/sitemap.mjs --write   regenerate ../../sitemap.xml (run after adding, removing or editing a page)
//   node tests/sitemap.mjs           check: fails if the sitemap or robots.txt no longer matches the pages
import fs from "node:fs"; import path from "node:path"; import { execFileSync } from "node:child_process";
import { ROOT, ROUTES } from "./pages.mjs";
const ORIGIN = "https://boldsand.com";
const SITEMAP = path.join(ROOT, "sitemap.xml"); const ROBOTS = path.join(ROOT, "robots.txt");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const pages = ROUTES.map((route) => {
  const html = fs.readFileSync(path.join(ROOT, route.slice(1), "index.html"), "utf8");
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? null;
  const noindex = /<meta name="robots" content="[^"]*noindex/i.test(html);
  return { route, canonical, noindex };
});
const listed = pages.filter((p) => !p.noindex);
const problems = [];
for (const p of listed) if (p.canonical !== ORIGIN + p.route) problems.push(`${p.route}: canonical is ${p.canonical}, expected ${ORIGIN + p.route}`);

function lastmod(route) {
  const out = execFileSync("git", ["log", "-1", "--format=%cs", "--", path.join(route.slice(1), "index.html")], { cwd: ROOT, encoding: "utf8" }).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(out)) throw new Error(`no git date for ${route} (shallow clone?)`);
  return out;
}

if (process.argv.includes("--write")) {
  if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
  const body = listed.map((p) => `  <url><loc>${esc(ORIGIN + p.route)}</loc><lastmod>${lastmod(p.route)}</lastmod></url>`).join("\n");
  fs.writeFileSync(SITEMAP, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
  console.log(`sitemap.xml written: ${listed.length} URLs (${pages.length - listed.length} noindex left out: ${pages.filter((p) => p.noindex).map((p) => p.route).join(", ") || "none"})`);
  process.exit(0);
}

// check
const xml = fs.existsSync(SITEMAP) ? fs.readFileSync(SITEMAP, "utf8") : "";
if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) problems.push("sitemap.xml: missing, or wrong XML declaration or urlset namespace");
if (!/<\/urlset>\s*$/.test(xml)) problems.push("sitemap.xml: does not end with </urlset>");
const entries = [...xml.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod><\/url>/g)].map((m) => ({ loc: m[1], lastmod: m[2] }));
if (entries.length !== (xml.match(/<url>/g) || []).length) problems.push("sitemap.xml: an <url> entry is not exactly <url><loc>…</loc><lastmod>…</lastmod></url>");
const want = new Set(listed.map((p) => ORIGIN + p.route)); const have = new Set(entries.map((e) => e.loc));
for (const u of want) if (!have.has(u)) problems.push(`sitemap.xml: missing ${u} (run: node tests/sitemap.mjs --write)`);
for (const u of have) if (!want.has(u)) problems.push(`sitemap.xml: lists ${u}, which is not an indexable page`);
if (have.size !== entries.length) problems.push("sitemap.xml: duplicate URLs");
for (const e of entries) if (!/^\d{4}-\d{2}-\d{2}$/.test(e.lastmod)) problems.push(`sitemap.xml: lastmod "${e.lastmod}" for ${e.loc} is not YYYY-MM-DD`);
let shallow = false;
try { shallow = execFileSync("git", ["rev-parse", "--is-shallow-repository"], { cwd: ROOT, encoding: "utf8" }).trim() === "true"; } catch { shallow = true; }
if (!shallow) for (const e of entries) { const route = e.loc.slice(ORIGIN.length); if (want.has(e.loc) && lastmod(route) !== e.lastmod) problems.push(`sitemap.xml: lastmod for ${route} is ${e.lastmod}, its last commit is ${lastmod(route)} (run --write)`); }
const robots = fs.existsSync(ROBOTS) ? fs.readFileSync(ROBOTS, "utf8") : "";
if (!/^User-agent: \*$/m.test(robots)) problems.push("robots.txt: missing 'User-agent: *'");
if (/^Disallow: \/\s*$/m.test(robots)) problems.push("robots.txt: 'Disallow: /' blocks the whole site");
if (!robots.split("\n").includes(`Sitemap: ${ORIGIN}/sitemap.xml`)) problems.push(`robots.txt: missing 'Sitemap: ${ORIGIN}/sitemap.xml'`);
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
console.log(`sitemap.xml and robots.txt OK: ${entries.length} URLs, ${pages.length - listed.length} noindex pages left out${shallow ? " (lastmod dates not checked: shallow clone)" : ", lastmod dates match git"}`);
