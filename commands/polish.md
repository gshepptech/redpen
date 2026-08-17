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

Parse `$ARGUMENTS` for urls and a path. Never interpolate it raw: it is prose,
and it may carry a path, several urls, and a sentence of context in any order.


**Polish is refinement, never concealed redesign.** Preserve the incumbent
visual world, content, behaviour and everything outside scope. If the concept
itself is wrong, *say so and recommend a redesign* rather than smuggling one in.

This command works the **quality axis only** — everything broken regardless of
taste. It deliberately does not touch slop: no palette opinions, no structural
restructuring. That constraint is what makes its diff reviewable and revertible.

**A detector result is defect evidence, not proof of quality.** Use the feature
yourself at the sizes people actually use before you believe the scan.

## 1. Establish the system

Read the tokens, shared components and neighbouring flows. If there is no formal
system, use the project's own conventions.

Then **classify each drift before fixing it** — this decides where the fix goes:

| | |
| --- | --- |
| **missing token** | the system needs a reusable value |
| **one-off implementation** | a shared component or pattern should replace it |
| **conceptual mismatch** | the flow or hierarchy differs from comparable areas |
| **local defect** | the implementation is simply incomplete |

Fix the cause at the **narrowest correct level**. Promoting a one-local-exception
value to a token is not a fix, it is a bigger mistake.

## 2. Gather the evidence

```bash
run scan <path> --url <url>
```

Read the `quality` score and work only findings whose kind is `quality` — the
JSON output tags every one, so `--json` and filter on `kind` if it helps. Then
walk the path yourself at desktop and mobile widths and establish: whether it is
functionally complete, what the intended quality bar is, and which states,
content lengths and input methods people actually encounter.

## 3. Triage

Fix in this order. **Do not perfect one corner while leaving the rest below the
same bar.**

1. Broken or blocked tasks, data loss, misleading state, inaccessible paths.
2. Missing loading, empty, error, success, disabled and permission states.
3. Hierarchy, responsive and design-system drift.
4. Visual and motion inconsistencies.
5. Code and asset cleanup.

## 4. Polish the whole path

**States.** Every control needs default, hover, focus-visible, active, disabled,
loading, error and success. `outline: none` with nothing replacing it is the
single most common line that breaks keyboard use.

Reach for `!important` here and stop — it means the state rule is losing a
specificity fight, and the fix is the selector, not the flag.

**Access.** Unlabelled controls, missing alt, missing lang, colour-only state,
skip link, heading order. Preserve visible focus, logical tab order and
platform-appropriate touch targets.

**Geometry.** Sideways scroll at any width, clipped text, controls under 44px,
mismatched heights in a row. Fix leading **per role, never globally** — setting
`line-height` on `body` clears every prose finding and instantly creates one on
the hero.

**Motion.** Coherent, interruptible, and behind a `prefers-reduced-motion`
fallback. Do not add animation merely to make the polish visible.

**Browser surfaces.** Selection, caret, scrollbar, underline offset, tabular
numerals.

**Content and code.** Keep terminology and punctuation consistent, and **ask
before changing factual claims**. Remove debug output, dead code and
polish-created duplication.

## 5. Verify and finish

Answer each of these with rendered or source evidence. **Do not
substitute a bare "yes" for verification** — an unevidenced pass is the same
failure mode as an unevidenced finding, which this tool rejects on the way in.

- Walk the path again with mouse, keyboard and touch.
- Loading, empty, error, success, disabled, long-content and missing-content
  states.
- Zoom, contrast, focus, semantics and screen-reader names.
- Console errors, layout shift, image loading.
- Re-run. Report quality before and after; **the slop score should be
  unchanged**, and if it moved you did something outside the brief.
- Finish with a source diff: remove accidental churn and temporary artefacts.

## What this looked like the first time it was run

On a deliberately-bad fixture: **quality 6 → 45**, twenty-three findings to
four, with the **slop score at exactly 4 before and after** — the contract, and
it held.

Two things the run taught, both since fixed in the detectors: adding a skip link
and a visually-hidden label used to *create* two findings, because the standard
clip-rect recipe looks like clipped text sitting off-canvas; and `low-contrast`
reported a confident 1.00:1 for white text on a gradient button, because a
gradient leaves `backgroundColor` transparent and the walk-up found the white
page behind it.

---

<sub>This command is built on redpen's rule corpus. See NOTICE for the
catalogues the corpus draws on and the licences they carry.</sub>
