---
description: Remove what is not earning its place
argument-hint: "[path] [--url <dev-server-url>]"
allowed-tools: Bash, Read, Edit, MultiEdit, Glob, Grep
---

<!--
Portions of this file are derived from impeccable (skill/reference/distill.md),
Copyright the impeccable authors, licensed under the Apache License, Version 2.0.
A copy of that licence ships with redpen as LICENSE-APACHE-2.0.

Changed by the redpen authors: rewritten to drive redpen's CLI and its evidence
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


Strip the design to its essence. Everything else in redpen fixes; this one
deletes.

**Simplicity is not about removing features. It is about removing obstacles
between people and their goals.** Every element should justify its existence —
and a thing that is genuinely load-bearing stays however cluttered it looks.

## 1. Find the essence, before scanning

- What is the **one** thing this page should accomplish?
- What is necessary versus nice-to-have?
- What can be removed, hidden behind progressive disclosure, or combined?

If any of that is unclear from the codebase, **do not guess — ask.** A cut made
without knowing the purpose is vandalism with good intentions.

## 2. Then scan

```bash
run scan <path> --url <url> --vision
```

The corpus already names most of the candidates. Findings that are usually a
deletion rather than a rewrite:

- `radial-halo`, `codex-grid-background`, `repeating-stripes-gradient`,
  `shape-assembled-illustration` — decoration standing in for a decision.
- `scroll-fade-everything`, `celebratory-toast`, `pulsing-dot`, `marquee` —
  motion carrying no state.
- `numbered-section-labels`, `status-chip-soup` — devices repeated until they
  mean nothing.
- `glassmorphism`, `generic-drop-shadow` where nothing is above anything.
- `nested-cards` — one container per level of meaning, not two.

## 3. Cut, by dimension

**Structure.** One primary action, few secondary, everything else tertiary or
hidden. Remove redundancy — if it is said elsewhere, do not repeat it. Flatten
nesting; **never nest cards inside cards**, and remember cards are not needed
for basic layout at all: spacing and alignment usually do it better.

**Visual.** One or two colours plus neutrals. One family, three or four sizes,
two or three weights. Remove borders, shadows and backgrounds that serve neither
hierarchy nor function.

**Interaction.** Fewer choices and a clearer path. Smart defaults so the common
case is automatic. Inline editing over modal flows. Can the flow lose a step?

**Content.** Cut every sentence in half, then do it again. Active voice. No
header restating the intro.

**Code.** Dead CSS, unused components, orphaned files. Does that component need
twelve variants, or do three cover ninety percent?

## Never

- Remove necessary functionality — simple is not feature-less.
- Sacrifice accessibility for simplicity. Labels and ARIA still required.
- Make it so simple it is unclear. Mystery is not minimalism.
- Remove information people need to decide.
- Eliminate hierarchy entirely. Some things should stand out.
- Oversimplify a genuinely complex domain.

## The judgement it needs

Deletion is where the vision channel matters most, because the question is not
"is this wrong" but "is this earning its place". Two questions in the brief are
the ones to answer carefully:

- **`nothing-memorable`** — if the honest answer is that nothing here would be
  remembered tomorrow, deleting more will not fix it. Say so. That page needs
  something *added*, and this is the wrong command.
- **`sized-to-fit`** — an element sized to fill its container is usually a
  candidate for removal or for being given real proportion.

## The rule

**Remove one thing at a time and re-scan.** A pass that removes six things at
once cannot tell you which one mattered, and if the score falls you will not
know what to put back.

## Verify

Answer each of these with rendered or source evidence. **Do not
substitute a bare "yes" for verification** — an unevidenced pass is the same
failure mode as an unevidenced finding, which this tool rejects on the way in.

- Can the task be completed faster?
- Is it easier to understand what to do?
- Is everything necessary still reachable?
- Is it obvious what matters most?

Document what you removed and why. If a feature went, note whether it needs an
alternative access point.

---

<sub>This command is built on redpen's rule corpus. See NOTICE for the
catalogues the corpus draws on and the licences they carry.</sub>
