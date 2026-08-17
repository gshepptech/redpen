---
description: Remove what is not earning its place
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

The subtractive pass. Everything else fixes; this one deletes.

```bash
run scan <path> --url <url> --vision
```

Parse `$ARGUMENTS` for urls and a path — never interpolate it raw.

## What to look for

The corpus already names most of it. Findings that are usually a deletion
rather than a rewrite:

- `radial-halo`, `codex-grid-background`, `repeating-stripes-gradient`,
  `shape-assembled-illustration` — decoration standing in for a decision.
- `scroll-fade-everything`, `celebratory-toast`, `pulsing-dot`, `marquee` —
  motion that carries no state.
- `numbered-section-labels`, `status-chip-soup` — devices repeated until they
  mean nothing.
- `glassmorphism`, `generic-drop-shadow` when nothing is actually above
  anything.
- `nested-cards` — one container per level of meaning, not two.

## The judgement it needs

Deletion is the one pass where the vision channel matters most, because the
question is not "is this wrong" but "is this earning its place". Two questions
in the brief are the ones to answer carefully:

- **`nothing-memorable`** — if the honest answer is that nothing here would be
  remembered tomorrow, deleting more will not fix it. Say so; that page needs
  something added, and this is the wrong command.
- **`sized-to-fit`** — an element sized to fill its container is usually a
  candidate for removal or for being given real proportion.

## The rule

Remove one thing at a time and re-scan. A subtractive pass that removes six
things at once cannot tell you which one mattered — and if the score falls, you
will not know what to put back.

## Finish

Re-run and report what you removed, what the score did, and anything you chose
to keep and why.
