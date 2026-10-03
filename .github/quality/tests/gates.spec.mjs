// DESIGN-SYSTEM v3 section 13 gates for boldsand.com. Thresholds are the fleet's; change them only
// with the founder's OK (SAAS-PLAYBOOK section 8).
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { ROUTES, WIDTHS } from "./pages.mjs";

for (const route of ROUTES) {
  for (const [w, h] of WIDTHS) {
    test.describe(`${route} @ ${w}`, () => {
      test.use({ viewport: { width: w, height: h } });
      test.beforeEach(async ({ page }) => {
        const resp = await page.goto(route, { waitUntil: "load" });
        expect(resp?.status()).toBe(200);
      });

      test("axe: 0 serious or critical (WCAG 2.2 A/AA tags)", async ({ page }) => {
        const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
        const blocking = r.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""));
        expect(blocking.map((v) => `${v.id} ×${v.nodes.length}: ${v.nodes[0]?.target.join(" ")}`)).toEqual([]);
      });

      test("one h1; meaningful text ≥ 14 px; no target under 24 px", async ({ page }) => {
        const m = await page.evaluate(() => {
          const vis = (el) => { const r = el.getBoundingClientRect(); const c = getComputedStyle(el); return r.width > 0 && r.height > 0 && c.visibility !== "hidden" && c.display !== "none"; };
          const textEls = [...document.querySelectorAll("body *")].filter((el) => vis(el) && !el.closest(".sr,.sr-only,[aria-hidden=true],[data-overline]") && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
          const small = textEls.filter((el) => parseFloat(getComputedStyle(el).fontSize) < 14).map((el) => `${getComputedStyle(el).fontSize} "${el.textContent.trim().slice(0, 30)}"`);
          const inline = (el) => el.tagName === "A" && el.closest("p,li,td,dd,figcaption") && !el.matches(".btn,[class*=btn]");
          const tiny = [...document.querySelectorAll("a[href],button,input,select,textarea,[role=button],summary")].filter(vis).filter((e) => !inline(e)).filter((e) => { const r = e.getBoundingClientRect(); return r.width < 24 || r.height < 24; }).map((e) => `"${e.textContent.trim().slice(0, 30)}"`);
          return { h1: document.querySelectorAll("h1").length, small, tiny };
        });
        expect(m.h1, "exactly one h1").toBe(1);
        expect(m.small, "meaningful text under 14 px (mark non-essential section labels with data-overline)").toEqual([]);
        expect(m.tiny, "targets under 24 px (WCAG 2.5.8)").toEqual([]);
      });

      test("WCAG 1.4.12: text spacing overrides clip nothing", async ({ page }) => {
        const clipped = await page.evaluate(() => {
          const st = document.createElement("style");
          st.textContent = "*{line-height:1.5!important;letter-spacing:0.12em!important;word-spacing:0.16em!important}p{margin-bottom:2em!important}";
          document.head.appendChild(st);
          return [...document.querySelectorAll("body *")].filter((el) => {
            if (el.closest(".sr,.sr-only,.visually-hidden") || el.clientWidth <= 1 || el.clientHeight <= 1) return false;
            const c = getComputedStyle(el);
            return /(hidden|clip)/.test(c.overflow + c.overflowX + c.overflowY) && (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2) && el.textContent.trim();
          }).map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]}`);
        });
        expect(clipped).toEqual([]);
      });
    });
  }
  test(`${route}: no horizontal scroll at 320 px (WCAG 1.4.10)`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(route, { waitUntil: "load" });
    const o = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(o).toBeLessThanOrEqual(1);
  });
}
