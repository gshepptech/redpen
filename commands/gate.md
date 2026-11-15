---
description: Set up redpen as a CI regression gate on this project
argument-hint: "[--url <dev-server-url>]"
allowed-tools: Bash, Read, Write, Edit, Glob
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

`@gshepptech/redpen` is not on npm yet, so there is no `npx` fallback. If the
resolver above finds nothing, say the plugin is not installed rather than
inventing a way to run it.

Wire redpen into this project's CI as a regression gate.

`redpen check` is not a grader. A codebase that starts at 46 should not have to
reach 90 before CI goes green — it has to stop getting worse. The gate fails on
a score **drop** past `tolerance`, or on a tell that was not present at
baseline, so fixing one problem while introducing another still fails.

## Steps

1. Find how this project builds and serves itself (`package.json` scripts, or
   the existing CI workflow).
2. Run `run init` and put the real dev-server URLs in
   `.redpen/config.json`. List every route worth gating, not just the homepage.
3. Start the server, run `run baseline . --url <url>`, and **commit
   `.redpen/baseline.json`** — the gate is meaningless without it in the repo.
4. Add the check to the existing CI workflow. Do not create a new workflow file
   if one already exists.

```yaml
- run: npm run build && npm run preview &
- run: npx playwright install --with-deps chromium
- run: run check . --url http://localhost:4173
```

5. Tell the user the baseline score you recorded and what `tolerance` is set to,
   so they know exactly what the gate now enforces.

If the current score is low, say so plainly and do **not** quietly raise
`tolerance` to make it pass. A gate tuned to never fire is worse than no gate.
