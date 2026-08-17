---
description: Fix a UI's typography — faces, scale, leading, measure, and the type tokens
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

A scoped fix pass over **typography** only. Scan, fix, re-scan, report the delta.

```bash
run scan <path> --url <url> --only typography,chrome,system
```

Parse `$ARGUMENTS` for urls and a path — never interpolate it raw.

## The order to fix in

Work down, not by weight — each step changes what the next one measures.

1. **Faces.** One display, one body, at most one outlier. A single default sans
   carrying everything is a tell on a landing page and correct on a dashboard;
   check the reported surface before touching it.
2. **Scale.** Build a real ramp and expose it as tokens named for the role
   (`--font-size-*`, `--text-*`). `font-size-token-drift` only fires once such
   tokens exist, so this step is what makes the next scan meaningful.
3. **Leading.** Body 1.5-1.65, headings 1.0-1.3. The relationship inverts with
   size; a heading at body leading is the most common miss.
4. **Measure.** Prose at 45-75ch, set once on the prose class. Data and dense UI
   legitimately run wider.
5. **The floor.** 14px for anything read as prose, 12px for incidental chrome.

## Then the parts nobody draws

`--only chrome` covers these and they are the cheapest wins in the corpus:
selection colour, caret colour, underline offset and thickness, tabular figures
in numeric columns. Nobody themes a caret by accident, which is exactly why an
unthemed one reads as assembled rather than built.

## Finish

Re-run the same scan. Report the typography score before and after and name
what moved. If it did not move, you changed something else — say so.
