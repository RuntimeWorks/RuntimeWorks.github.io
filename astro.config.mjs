// @ts-check
import { defineConfig } from "astro/config"
import tailwindcss from "@tailwindcss/vite"
import sitemap from "@astrojs/sitemap"

// Static site served by GitHub Pages at boldsand.com. Every page is a folder with index.html, so the addresses the
// live site has used since 2026-10 (/guides/<slug>/, /tools/<slug>/, /torque-trails/privacy/) stay exactly the same.
export default defineConfig({
  site: "https://boldsand.com",
  trailingSlash: "always",
  build: { format: "directory" },
  vite: { plugins: [tailwindcss()] },
  devToolbar: { enabled: false },
  // The old waitlist page named a closed rival in its title; its address now leads to the meal planner's own page
  // (Astro writes a redirect page with a canonical link, which GitHub Pages can serve).
  redirects: {
    "/mealime-alternative/": "/meal-planner/",
    // The car game is not listed as a Boldsand product (founder, 2026-11-07); its privacy policy stays at
    // /torque-trails/privacy/, which the app links to.
    "/torque-trails/": "/",
  },
  integrations: [sitemap({ filter: (page) => !page.includes("/torque-trails/") && !page.includes("/mealime-alternative/") })],
})
