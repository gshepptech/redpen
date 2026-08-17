---
description: Fix a UI's layout, spacing rhythm, and composition
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

A scoped fix pass over **layout, depth and composition**.

```bash
run scan <path> --url <url> --only layout,depth,composition
```

Parse `$ARGUMENTS` for urls and a path — never interpolate it raw.

## Mechanics first

These are measurable and they block judgement work: horizontal overflow at any
width, clipped or overflowing text, body text against the viewport edge,
controls under 44px, mismatched control heights in one row, nested surfaces.
Fix them before looking at composition — a page that scrolls sideways cannot be
judged for rhythm.

## Then rhythm

Spacing is the one that needs eyes, and the reason is worth holding onto: **a
perfect 4px scale applied uniformly is exactly the failure.** Every gap can be
on the scale and the page still have no groups. Tighten inside a group, open
between groups; the ratio is the signal, not the values.

Vary the vertical rhythm by role and draw at least one boundary with a rule or
a colour shift rather than more air.

## Then composition, and only by looking

`no-focal-point`, `sized-to-fit`, `undifferentiated-spacing` and
`content-interchangeable` are vision-channel rules — no measurement reaches
them. Run with `--vision`, open the screenshots, answer the brief honestly, and
re-run with `--answers`. Answering "no, I looked, it is not there" counts and
is worth recording.

If the answer to *could this hold a different product's content unchanged* is
yes, that is the finding to act on. It is the closest single question to "it
looks AI generated".

## Finish

Re-run and report the delta. Do not report a fix you have not re-scanned.
