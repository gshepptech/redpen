---
description: Fix a UI's typography — faces, scale, leading, measure, and the type tokens
argument-hint: "[path] [--url <dev-server-url>]"
allowed-tools: Bash, Read, Edit, MultiEdit, Glob, Grep
---

<!--
Portions of this file are derived from impeccable (skill/reference/typeset.md),
Copyright the impeccable authors, licensed under the Apache License, Version 2.0.
A copy of that licence ships with redpen as LICENSE-APACHE-2.0.

Changed by Garrett Sheppard: rewritten to drive redpen's CLI and its evidence
model, reordered around redpen's channels and confidence tiers, and rewritten
throughout in redpen's own wording. The craft guidance this file inherits from
impeccable is itemised in NOTICE.
-->

## Running redpen

```bash
REDPEN="${CLAUDE_PLUGIN_ROOT:-$(npm root -g)/@gshepptech/redpen}"
# The bundle is one dependency-free file and is what a plugin install carries;
# dist/ is the tsc build and only exists in a checkout. Fall through to a
# global binary last.
if   [ -f "$REDPEN/bundle/redpen.mjs" ]; then run() { node "$REDPEN/bundle/redpen.mjs" "$@"; }
elif [ -f "$REDPEN/dist/cli.js" ];      then run() { node "$REDPEN/dist/cli.js" "$@"; }
else                                         run() { redpen "$@"; }
fi
```

If neither resolves, the plugin is not installed and `redpen` is not on PATH —
say so rather than guessing. **Never `npx redpen`**: that name belongs to an
unrelated package.

Parse `$ARGUMENTS` for urls and a path. Never interpolate it raw: it is prose,
and it may carry a path, several urls, and a sentence of context in any order.

Typography carries information, hierarchy, and voice. Improve it inside the
established visual world; do not replace the identity unless asked to.

## Two isolated assessments

**Look first. Scan second. Do not let the findings anchor the looking.**

This is the part that is easy to skip and the reason the command exists. A
detector tells you what is measurably wrong; it cannot tell you whether the
thing is any good. If you read the findings first, you will spend the pass
closing them and call that done.

1. **Assess.** Open the page and answer the questions below with a file, a
   selector, or a computed value — not an impression. Do this before running
   anything.
2. **Scan.** Then run the mechanical pass and synthesise both. Note what each
   caught that the other did not; that difference is the useful output.

**A clean scan is a floor, not proof.** A page can clear all 112 rules and still
be the wrong page.

### 1. Assess, before scanning

- **Authority and fit.** Which faces, weights and roles are established? Do they
  fit the product, or are they unexamined defaults? Is every family necessary?
- **Hierarchy.** Can heading, body, label, metadata and data roles be told apart
  at a glance? Are adjacent sizes or weights too close to carry different jobs?
- **Scale.** Is there a deliberate role scale, or a collection of arbitrary
  values? Do repeated roles stay identical across screens and states?
- **Reading.** Is the measure comfortable? Are leading, paragraph rhythm and
  tracking tuned to *this* face at *this* width, or to a universal ratio?
- **Stress.** What happens with long headings, localisation expansion, zoom,
  narrow containers, a missing weight, a font that fails to load?
- **Delivery.** Are only the used weights loaded? Do fallback metrics avoid
  invisible text and reflow?

### 2. Then scan

```bash
run scan <path> --url <url> --only typography,chrome,system
```

Check the reported surface first. On an operate or read surface a single
well-tuned family and a fixed role scale are often right; on a persuade surface
display type may carry the voice.

## Set the system

Before editing, state: the roles the interface needs, the intended contrast
between them, the reading measure and density, which faces are authoritative,
and any performance or localisation constraints.

Use the fewest roles and families that make the hierarchy unmistakable. Combine
size, weight, space and tone rather than asking size alone to do all the work.
Name tokens for purpose, never for value.

## Apply, in this order

Each step changes what the next one measures.

1. **Faces.** One display, one body, at most one outlier. Then **route every
   element through a token** — declaring `--font-body` and leaving a
   `<blockquote>`, a `<button>` or the form controls on the UA default finishes
   the step and still fails `font-family-drift`. It happened on the first real
   run of this command. Grep for `font-family` and check what is *not* listed.
2. **Scale.** A real ramp, exposed as tokens named for the role
   (`--font-size-*`, `--text-*`). `font-size-token-drift` only fires once such
   tokens exist, so this is the step that makes the next scan mean anything.
3. **Leading.** 1rem/16px is the ordinary web body floor. Tune leading **to the
   face, width and contrast, not a universal ratio** — and *inversely with
   measure*: wider lines need more. Light text on a dark surface needs
   compensating on all three axes: slightly more leading, a touch more tracking,
   one step more weight if the face needs it.

   Fix leading **per role, never globally.** Setting `line-height` on `body`
   clears every finding on prose and instantly creates one on the hero, because
   body leading on a 72px heading is as wrong in the other direction.
4. **Measure.** 45-75ch for prose, set once on the prose class. Data and dense
   UI legitimately run wider.
5. **Tracking.** Both directions. Negative belongs above ~40px and stops at
   -0.03em; wide belongs on small caps and stops at 0.15em. The eyebrow at 0.3em
   is the obvious half; the hero at -0.06em is the half that gets missed,
   because it looks deliberate.
6. **The floor.** 14px for anything read as prose, 12px for incidental chrome.
   The evidence line says which floor it applied — read it before changing a
   size.
7. **Paragraph rhythm.** Spacing *or* first-line indent. Both together
   double-marks the boundary.

Do not make type decorative at the expense of comprehension, and do not add a
second family without a role it alone can perform.

## The parts nobody draws

`--only chrome` covers these and they are the cheapest wins in the corpus:
selection colour, caret colour, underline offset and thickness, tabular figures
in numeric columns. Nobody themes a caret by accident, which is exactly why an
unthemed one reads as assembled rather than built.

## Verify

Answer each of these with rendered or source evidence. **Do not
substitute a bare "yes" for verification** — an unevidenced pass is the same
failure mode as an unevidenced finding, which this tool rejects on the way in.

- Primary, secondary, body and metadata roles are recognisable **without
  reading the copy**.
- Long text stays comfortable across the widths and languages you support.
- Zoom, text scaling and user font settings still work.
- Loading causes no reflow and no invisible text.
- Re-run the scan, then `run why-score <path> --url <url> --only typography,chrome,system`.
  The scan says what is wrong; why-score says what is left and what it is worth.

## Hand off

When this holds, run `/redpen:polish` — the mechanical pass over everything
broken regardless of taste. This command's job is one concern done well; polish
is what makes the whole path consistent.

---

<sub>This command is built on redpen's rule corpus. See NOTICE for the
catalogues the corpus draws on and the licences they carry.</sub>
