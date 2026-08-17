---
description: Fix a UI'\''s palette, contrast, and colour tokens
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

A scoped fix pass over **colour and the token system**.

```bash
run scan <path> --url <url> --only color,system
```

Parse `$ARGUMENTS` for urls and a path — never interpolate it raw.

## Order

1. **Contrast first.** It is the only thing here that is broken rather than
   tasteless: body 4.5:1, large text and icons and focus rings 3:1, measured
   against the *computed* background. The usual miss is muted text on a
   secondary surface, and a focus ring that clears against its control but not
   against the page.
2. **The anchor.** If the primary sits in the 265-305 hue band it is Tailwind's
   default and reads as unchosen. Pick a hue and derive the ramp from it.
   Neutrals get 0.005-0.02 chroma tinted toward that hue — untinted grey next
   to tinted type is what makes a palette look dead.
3. **Tokens.** Name by role, never by value: `--color-ink`, not `--color-black`.
   Then route every literal through one. `color-token-drift` compares against
   the tokens the project itself declares, so this step is what gives the next
   scan something to check.
4. **Footprint.** Accent belongs on emphasis, not on filling. Past roughly 5% of
   a viewport it stops being emphasis.

Never fix contrast by lightening the text alone — check what the surface is
doing first. Half the failures are a surface that changed and a colour that
did not follow.

## Finish

Re-run and report the colour score before and after.
