---
description: Audit a UI for the tells that mark it as AI-generated, and report what to fix
argument-hint: "[path] [--url <dev-server-url>]"
allowed-tools: Bash, Read, Edit, Glob, Grep
---

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

```bash
run --help    # confirm the binary resolved before doing anything else
```

`@gshepptech/redpen` is not on npm, so there is no `npx` fallback to reach for. If the
resolver above finds nothing, say the plugin is not installed rather than
inventing a way to run it.

Audit the UI at `$ARGUMENTS` (default: this project) using redpen.

## Run it

**Parse `$ARGUMENTS` — do not interpolate it.** The argument is prose written by
a person: it may carry a path, one or more URLs, and a sentence of context in any
order. Extract the parts and build the command yourself:

- every `http://…` / `https://…` token becomes its own `--url`
- the first path-like token that exists on disk becomes the scan path
- everything else is context for your report, not argv

```bash
run scan <path> --url <url> [--url <url> …]
```

Interpolating the raw string produces nonsense like
`scan http://127.0.0.1:7788 — the board, a local no-JavaScript dashboard`.

**A `--url` is not optional in practice.** Without one the browser pass never
runs, every finding it could have confirmed is capped at `possible`, and the
report says so. If the user did not give you a URL:

1. Look for the dev-server command in `package.json` (`dev`, `start`, `preview`).
2. Start it in the background and use its port.
3. If you cannot start it, run source-only and **say clearly in your report that
   the render pass did not run** — never present that as a clean page.

**If a url redirects, redpen refuses it and says so.** That is almost always a
login. The app's own screens are the ones most worth auditing, so capture a
session rather than settling for the marketing pages:

```bash
run login <login-url>    # opens a real browser; the user logs in, presses Enter
```

Ask the user to do it — it needs a person at the keyboard, and redpen never
sees the credential. The session lands in `.redpen/auth.json` and every later
scan uses it. If a scan warns that a configured session is missing from disk,
it has expired; capture another.

One bare origin is usually all you need: redpen reads the project's own routes
and expands, so `run scan . http://localhost:3000` reads the whole app. That is
also how sameness detection earns its keep — it needs at least two pages to
compare, so a single explicit path silences it. Pass an explicit path only when
you mean exactly that page.

## Then look at it

**A scan that skips this is not an audit.** Eight rules in the corpus are
vision-only — hierarchy, focal point, the squint test, whether the icons mean
anything. No regex and no computed style reaches them, and skipping them is how
a page with nothing measurably wrong still reads as generated.

redpen does not call a vision model. It captures the screenshots and writes the
questions; **you** are the channel, and you can already read a PNG.

```bash
run scan <path> <url> --vision      # writes .redpen/vision-brief.json + screenshots
```

Then, in order:

1. **Read every PNG under `.redpen/screenshots/`** with your image tool. Not the
   markup — the image. If you skip this and fill the brief from the DOM you have
   answered a different question, and the answers will be confidently wrong.
2. **Fill in each row of `.redpen/vision-brief.json`**: `present`, `confidence`,
   `evidence`. The brief is written to be answerable by someone who has never
   seen the project, and the questions are deliberately not named after their
   rules so the label cannot lead you.
3. **Re-run with the answers folded in:**

```bash
run scan <path> <url> --answers .redpen/vision-brief.json
```

Four rules the channel enforces, so answer to them rather than around them:

- `present: true` always means **the tell IS there**. Read the direction.
- Answer only from what is visible. Not from what a page like this usually does.
- `confidence` under 0.7 is discarded. A question you cannot settle from the
  image gets a low number, not a guess — discarding is the correct outcome.
- `evidence` names the thing you saw: "the three cards each open with a rounded
  icon square", never "it looks AI-generated". A `true` with no evidence is
  rejected as a guess.

Leave `present: null` on anything you did not judge. Null rows are ignored and
are not an error.

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
