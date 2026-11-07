// The old site published /sitemap.xml; @astrojs/sitemap writes sitemap-index.xml. This keeps the old address
// answering with the same index, so a search console that has it registered keeps reading it.
export const GET = () =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://boldsand.com/sitemap-0.xml</loc></sitemap></sitemapindex>\n`, { headers: { "Content-Type": "application/xml" } })
