# boldsand.com

The website of Boldsand Software Inc. (Charlottetown, Prince Edward Island): the company, its products, and the
Dental Logbook's free guides, printable logs and state pages. A static Astro site published by GitHub Pages.

## Run and check

```bash
npm ci
npm run dev        # http://localhost:4321 (tokens are generated first)
npm run check      # types, unit tests, build, HTML validity, text parity, keyboard, page gates
```

`npm run check` must pass before anything is published. The page gates open every page at 320, 390, 768, 1280 and
1440 px in light and dark and fail on any WCAG 2.2 AA violation (axe-core), sideways scroll, small targets, heading
problems, text under 13 px, weak field edges or layout shift. Screenshots go to `dist-check/`.

## Where things live

| Path | What |
|---|---|
| `src/data/brand.ts` | Company facts and the product list. The home page, footer and structured data read it. |
| `src/content/{guides,tools,states}/*.md` | The Dental Logbook library, one Markdown file per page. |
| `src/data/library.json` | The library's three index pages: their words and groups. |
| `src/pages/` | The home page, the product pages, the library routes, the 404 and the game's privacy policy. |
| `src/components/` | Header, footer, product cards, the shared product-page sections, the printable sheet, the calculator. |
| `src/lib/florida.ts` | The Florida spore test due-date rule (tested in `tests/florida.test.ts`). |
| `scripts/gen-tokens.ts` | Writes `src/styles/tokens.css` from Radix's palette generator and Utopia's scales. |
| `scripts/vendor/radix/` | Radix's custom palette generator, unchanged (MIT). |
| `scripts/migrate-legacy.mjs` | The one-time move of the old pages into `src/content` (reads them from git). |

## Publishing

`.github/workflows/deploy.yml` builds and publishes on every push to `main`. Before the first push of this version,
switch the repository's Pages source to GitHub Actions; until then Pages serves the branch's files as they are.

## Addresses that must not change

- `/torque-trails/privacy/`: linked from the Torque Trails (AnyCarClimbs) Android app.
- Every guide, tool and state page address: `npm run check` fails if an old address stops answering.
