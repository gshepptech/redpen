---
description: Fix a UI's palette, contrast, and colour tokens
argument-hint: "[path] [--url <dev-server-url>]"
allowed-tools: Bash, Read, Edit, MultiEdit, Glob, Grep
---

<!--
Portions of this file are derived from impeccable (skill/reference/colorize.md),
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


Colour is hierarchy, meaning and atmosphere. Preserve confirmed brand and
semantic conventions — do not replace a visual world under the guise of
adjusting its colour.

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

### 1. Audit, before scanning

Read the tokens, themes and representative states. Identify: which colours are
confirmed brand commitments; the current surface, text, action and semantic
roles; where grayscale is obscuring hierarchy or state; contrast failures and
colour-only communication; light/dark requirements; and whether the task is
asking for more colour or for a new identity.

If it needs a new identity, this is the wrong command — say so.

### 2. Then scan

```bash
run scan <path> --url <url> --only color,system
```

On operate and read surfaces colour mainly encodes action, selection, status and
wayfinding — **rarity is what gives an accent force**. On persuade it may own
large regions if the world calls for it.

## Choose a strategy

Name the emotional temperature, the dominant relationship, the contrast range
and the dosage *before* editing. Then build **roles, not a bag of swatches**:
canvas and elevated surfaces; primary and secondary text; action, focus and
selection; borders; success/warning/error/info; data categories.

For a new web palette prefer OKLCH, because lightness and chroma move
predictably. Choose the hue from product meaning, never from a default category
association.

## Apply

1. **Contrast first** — the only thing here that is broken rather than
   tasteless. Body 4.5:1, large text and icons and focus rings 3:1, measured
   against the *computed* background. The usual miss is muted text on a
   secondary surface, and a focus ring that clears against its control but not
   against the page.

   Never fix contrast by lightening the text alone. Half the failures are a
   surface that changed and a colour that did not follow.

   redpen declines to measure contrast where a gradient or image sits behind the
   text — it cannot be computed from computed styles, and a wrong number is
   worse than none. Those are for the vision pass.
2. **The anchor.** A primary in the 265-305 hue band is Tailwind's default and
   reads as unchosen. Derive the ramp from a hue you picked.
3. **Neutrals.** Tint them toward the anchor *only when the brand hue genuinely
   creates cohesion* — neutral grey is valid when it serves the world. The floor
   is measured in OKLCH chroma, not RGB spread: a warm grey with 2% channel
   spread can still sit under 0.005. The evidence line reports the number.
4. **On coloured surfaces, derive secondary text from the foreground or surface
   hue** rather than reaching for a washed-out generic grey.
5. **Tokens.** Name by role, never by value — `--color-ink`, not
   `--color-black`. Then route every literal through one. `color-token-drift`
   compares against the tokens the project itself declares, so this step is what
   gives the next scan something to check.
6. **Footprint.** Accent belongs on emphasis, not on filling. Let the strongest
   colour own a deliberate region or role instead of scattering tiny accents.
7. **Dark mode is composed, not inverted.** Design surface elevation and
   contrast explicitly.

Information carried by colour also needs text, shape, icon or position.

## Verify

Answer each of these with rendered or source evidence. **Do not
substitute a bare "yes" for verification** — an unevidenced pass is the same
failure mode as an unevidenced finding, which this tool rejects on the way in.

- Every colour has a stable role or a specific atmospheric purpose.
- Attention lands on the intended action, content or state.
- The palette holds across quiet, dense, interactive, error and empty states.
- Light and dark are each composed.
- Contrast and non-colour cues pass in every relevant state.
- The result is recognisably *this* product, not a generic colourful treatment.

## Hand off

When this holds, run `/redpen:polish` — the mechanical pass over everything
broken regardless of taste. This command's job is one concern done well; polish
is what makes the whole path consistent.

---

<sub>This command is built on redpen's rule corpus. See NOTICE for the
catalogues the corpus draws on and the licences they carry.</sub>
