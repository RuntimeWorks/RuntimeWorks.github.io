# Research gates: the parts done by eye

`npm run research` (scripts/research-gates.mjs) runs the nine gates added to the S-tier gold standard on 2026-11-07
(`Desktop/Claude Code/projects/s-tier-site/GOLD-STANDARD.md` §3). Seven are automatic. Two need a look, recorded here
with the date, so the next review knows the baseline.

## 2026-11-07, first run

**Meaning of alt texts.** All 17 read against their pictures (`alt-reviewed.json` holds each verdict). Four rewritten:
the out-of-range phone screen claimed a 9 °C reading that is not in the picture; the Dental Today screen, the
due-list screen and the inspector report left out the numbers and states the pictures show.

**Colour-vision deficiencies.** Seven pages under protanopia, deuteranopia, tritanopia and achromatopsia
(`dist-check/research/cvd`). Nothing depends on colour alone: status chips are words, the paper-against-app comparison
uses ✕ and ✓, the daily log marks out-of-range rows with a written note, the calculator's result is text.

**Deception** (the five strategies of Gray et al., CHI 2024).
- Obstruction: nothing to cancel or leave; no accounts.
- Sneaking: no hidden costs; the pilot price is "agreed with you before you pay anything".
- Interface interference: paired buttons are both ways forward, never a weakened "no". The Florida calculator starts
  with a sterilizer type selected, a setting GOV.UK allows to be pre-selected.
- Forced action: the free logs need no sign-up and keep nothing.
- Social engineering: no countdowns, invented reviews or activity. "We're looking for ten food businesses" is the
  founder's own pilot size from the old site, with no deadline; kept.

**Agent run.** In the desktop app's browser, from the accessibility tree alone: home → Food Safety Logbook →
"Talk to us about a pilot" (the email). Before the fix the hero's "Talk to us about a pilot" jumped to the section
while the same words lower down opened an email; the hero now says "See the founding pilot".

**Found while looking, outside the nine gates.** Tailwind Typography wrapped every quote in its own curly quotes, so
quoted rules showed two opening marks and a closing mark after the source line (five pages). Turned off in
`src/styles/global.css`.

**Negative control.** Twelve faults planted in the built home page (an alt of "image", an alt changed after review,
TODO, NaN, "click here", one name for two places, an email field without autocomplete, a pre-ticked box, "Only 3 left",
stored data with no banner, the agent's link renamed, then a missing alt and a placeholder-only field): every one
caught. The first run missed the TODO because cheerio's `.text()` glued "Call us" to "TODO"; the sweep now reads text
node by node.
