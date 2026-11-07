// Serves dist/ like GitHub Pages does (folders answer with index.html; unknown paths get 404.html with a 404).
// For the audit tools and local review: node scripts/serve.mjs [port]
import fs from "node:fs"
import http from "node:http"
import path from "node:path"
const dist = path.resolve(import.meta.dirname, "../dist")
const port = Number(process.argv[2] ?? 3633)
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".pdf": "application/pdf", ".xml": "application/xml", ".txt": "text/plain" }
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname)
  if (p.endsWith("/")) p += "index.html"
  let f = path.join(dist, p)
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html")
  if (!f.startsWith(dist) || !fs.existsSync(f)) { res.writeHead(404, { "content-type": types[".html"] }); return res.end(fs.readFileSync(path.join(dist, "404.html"))) }
  res.writeHead(200, { "content-type": types[path.extname(f)] ?? "application/octet-stream" })
  fs.createReadStream(f).pipe(res)
}).listen(port, "127.0.0.1", () => console.log(`serving dist on http://127.0.0.1:${port}/`))
