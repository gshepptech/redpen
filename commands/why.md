---
description: Explain one redpen rule — what it means, who named it, and whether humans actually notice it
argument-hint: "<rule-id>"
allowed-tools: Bash
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

```bash
REDPEN="${CLAUDE_PLUGIN_ROOT:-$(npm root -g)/@gshepptech/redpen}/dist/cli.js"
node "$REDPEN" --help    # confirm it resolved before doing anything else
```

If that path does not exist, the plugin is not installed; fall back to
`npx @gshepptech/redpen` (note the `-cli`) and say which one you used.

Run `run why $ARGUMENTS` and relay what it says.

If the user gave no rule id, run `run rules` and ask which one they mean.
If the id does not exist, `redpen rules <partial>` filters by substring.

Two fields decide how much weight the rule deserves, and you should say which
applies:

- **an evidence rank** means the tell was measured against 3,033 real complaints.
  The rank is how often humans actually named it.
- **"never measured"** means the weight is redpen's own judgement of consequence.
  Say so — it is a weaker claim, and the user is entitled to disagree with it.
