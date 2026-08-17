---
description: Set up redpen as a CI regression gate on this project
argument-hint: "[--url <dev-server-url>]"
allowed-tools: Bash, Read, Write, Edit, Glob
---

## Running redpen

The plugin ships the CLI. Resolve it once and reuse the variable — **do not use
`npx redpen`**, which resolves to an unrelated package of the same name on npm:

```bash
REDPEN="${CLAUDE_PLUGIN_ROOT:-$(npm root -g)/@gshepptech/redpen}/dist/cli.js"
node "$REDPEN" --help    # confirm it resolved before doing anything else
```

If that path does not exist, the plugin is not installed; fall back to
`npx @gshepptech/redpen` (note the `-cli`) and say which one you used.

Wire redpen into this project's CI as a regression gate.

`redpen check` is not a grader. A codebase that starts at 46 should not have to
reach 90 before CI goes green — it has to stop getting worse. The gate fails on
a score **drop** past `tolerance`, or on a tell that was not present at
baseline, so fixing one problem while introducing another still fails.

## Steps

1. Find how this project builds and serves itself (`package.json` scripts, or
   the existing CI workflow).
2. Run `node "$REDPEN" init` and put the real dev-server URLs in
   `.redpen/config.json`. List every route worth gating, not just the homepage.
3. Start the server, run `node "$REDPEN" baseline . --url <url>`, and **commit
   `.redpen/baseline.json`** — the gate is meaningless without it in the repo.
4. Add the check to the existing CI workflow. Do not create a new workflow file
   if one already exists.

```yaml
- run: npm run build && npm run preview &
- run: npx playwright install --with-deps chromium
- run: node "$REDPEN" check . --url http://localhost:4173
```

5. Tell the user the baseline score you recorded and what `tolerance` is set to,
   so they know exactly what the gate now enforces.

If the current score is low, say so plainly and do **not** quietly raise
`tolerance` to make it pass. A gate tuned to never fire is worse than no gate.
