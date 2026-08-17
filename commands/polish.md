---
description: Fix everything mechanically wrong, leaving taste alone
argument-hint: "[path] [--url <dev-server-url>]"
allowed-tools: Bash, Read, Edit, MultiEdit, Glob, Grep
---

## Running redpen

```bash
REDPEN="${CLAUDE_PLUGIN_ROOT:-$(npm root -g)/@gshepptech/redpen}/dist/cli.js"
node "$REDPEN" --help >/dev/null || REDPEN=""   # falls back to the global binary
run() { if [ -n "$REDPEN" ]; then node "$REDPEN" "$@"; else redpen "$@"; fi; }
```

If neither resolves, the plugin is not installed and `redpen` is not on PATH —
say so rather than guessing. **Never `npx redpen`**: that name belongs to an
unrelated package.

## What this does

The **quality axis only** — everything broken regardless of taste. Accessibility,
contrast, overflow, states, semantics, the browser surfaces. It deliberately
does not touch the slop axis: no palette opinions, no layout restructuring.

```bash
run scan <path> --url <url>
```

Read the `quality` score and work only findings whose kind is `quality`. The
JSON output tags every finding, so `--json` and filter on `kind` if it helps.

## Work in this order

1. **Anything that throws.** A page with an uncaught error on load has parts
   that never initialised; everything downstream of it is unverified.
2. **Access.** Unlabelled controls, missing alt, missing lang, colour-only
   state, no skip link, heading order.
3. **States.** Default, hover, focus-visible, active, disabled — all five, on
   every interactive element. `outline: none` with nothing replacing it is the
   single most common line that breaks keyboard use.

   Reach for `!important` here and stop: it means the state rule is losing a
   specificity fight, and the fix is the selector, not the flag.
4. **Overflow and geometry.** Sideways scroll at any width, clipped text,
   controls under 44px, mismatched heights in a row.

   Fix leading **per role, never globally.** Setting `line-height: 1.55` on
   `body` fixes every `tight-leading` finding on prose and immediately creates
   one on the hero, because a 72px heading at body leading is as wrong in the
   other direction. This happened on the first real run of this command.
5. **Browser surfaces.** Selection, caret, scrollbar, underline offset, tabular
   numerals.

## What not to do

Do not "improve" anything on the slop axis while you are here. A polish pass
that also changes the palette is impossible to review and impossible to revert.
If you see slop findings worth acting on, list them at the end and let the user
decide.

## Finish

Re-run. Report the quality score before and after; **the slop score should be
unchanged**, and if it moved you did something outside the brief.

## What this looked like the first time it was run

On a deliberately-bad fixture: **quality 6 → 45**, twenty-three findings to
four, with the **slop score at exactly 4 before and after** — which is the
contract, and it held.

Two things the run taught, both now fixed in the detectors rather than worked
around here: adding a skip link and a visually-hidden label used to *create*
two findings, because the standard clip-rect recipe looks like clipped text
sitting off-canvas; and `low-contrast` reported a confident 1.00:1 for white
text on a gradient button, because a gradient leaves `backgroundColor`
transparent and the walk-up found the white page behind it. It now declines to
measure contrast over a gradient at all — a wrong number is worse than no
number, and that judgement belongs to the vision channel.
