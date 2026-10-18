# boldsand.com

Public website of Boldsand Software Inc. (Charlottetown, Prince Edward Island). Static HTML served by GitHub Pages.

- `/` company information
- `/food-safety/` Food Safety Logbook
- `/torque-trails/privacy/` Torque Trails privacy policy (linked from Google Play; keep this path)

No application source code lives here.

## State rule pages (`/states/<state>/`): the template

`states/florida/` is the reference. Every state page is built the same way, so a fix to the shared stylesheet lands
on all of them:

- **Styles:** `<link rel="stylesheet" href="/assets/css/state.css">` in `<head>`, and no `<style>` block. New styles go
  in `assets/css/state.css`, tokens only (the raw-values gate reads linked stylesheets too).
- **First in `<body>`:** `<a class="skip" href="#main">Skip to the rules</a>`; then `<header class="top">` (brand and
  the pilot link, which wraps under the brand on narrow phones); then `<main id="main" tabindex="-1">`.
- **Hero:** `.kicker.label`, the one `h1`, the `.lede`, then the contents list:
  `<nav class="toc" aria-labelledby="toc-title">` with `<p class="label" id="toc-title">On this page</p>` and an
  `<ol role="list">` of links whose words match each `h2` exactly (USWDS in-page navigation; NN/g).
- **Sections:** `<section class="sec">`, an `h2` with an `id` made from its words (lower case, hyphens, no
  apostrophes), `.intro`, then `.rules` or `.steps` lists, `.note` (`.note.disagree` where sources disagree),
  `.product` for what Dental Logbook does, and the summary table in
  `<div class="table-wrap" role="region" aria-label="…" tabindex="0">` with a `.scroll-hint` after it.
- **Never** hide horizontal overflow on `html` or `body`: it hid a clipped header button at 320 px from the reflow gate.
- Rule text and citations are verified separately; the template changes layout only.
