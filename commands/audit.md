---
description: Audit a UI for the tells that mark it as AI-generated, and report what to fix
argument-hint: "[path] [--url <dev-server-url>]"
allowed-tools: Bash, Read, Edit, Glob, Grep
---

Audit the UI at `$ARGUMENTS` (default: this project) using redpen.

## Run it

```bash
npx redpen scan $ARGUMENTS
```

**A `--url` is not optional in practice.** Without one the browser pass never
runs, every finding it could have confirmed is capped at `possible`, and the
report says so. If the user did not give you a URL:

1. Look for the dev-server command in `package.json` (`dev`, `start`, `preview`).
2. Start it in the background and use its port.
3. If you cannot start it, run source-only and **say clearly in your report that
   the render pass did not run** — never present that as a clean page.

Add every route worth judging: `--url http://localhost:3000 --url http://localhost:3000/pricing`.
More routes is also how sameness detection earns its keep — it needs at least
two pages to compare.

## Report

Lead with the score and the confirmed count, then the single highest-weight
finding. Work top-down through **confirmed** only.

- **confirmed** — two channels agree, or the only channel that can see it did. Fix these.
- **likely** — one channel that reads real state saw it, nothing disagreed. Fix next.
- **possible** — a source regex fired and the browser pass disagreed. Usually a
  false positive. Do not list these at the user unless they ask.

Do not dump the whole finding list. Give the user the three or four that matter
and what changes, not a wall of rule ids.

## Fix

Each finding ships a concrete `fix`. Apply the ones the user approves, then
**re-run the scan on the same URL** and confirm the finding is gone and the
score moved. A fix you have not re-scanned is not a fix — if the score did not
move, you changed something else.

## Before you suppress anything

`redpen why <rule-id>` explains what a rule means and which catalogue named it.
Suppress only after reading that and confirming the pattern is a deliberate
choice rather than an inherited default:

```css
/* redpen-ignore:ai-purple brand is violet, signed off by design 2026-03 */
```

The reason is mandatory.
