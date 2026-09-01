---
description: Audit the source a project is written in for the tells that mark it as machine-written
argument-hint: "[path]"
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

## What this asks, and what it does not

`run code ${ARGUMENTS:-.}`

This is a different question from `/redpen:audit`. That one reads the page a
project serves; this one reads the source it is written in, and the two never
mix — a code scan returns no UI findings and a UI scan returns no code ones,
because averaging them into a single number answers neither.

Two categories:

- **craft** — code that reads as machine-written. Comments addressed to the
  reviewer rather than the reader, docstrings that read the signature back,
  stubs shipped in the live path, a catch that hides what it caught, marketing
  adjectives and tutorial names in identifiers, several modules named after
  nothing.
- **residue** — what the process that built it left behind. Phase and task ids,
  the tool named as an author, half a conversation committed, pointers to plan
  files that were deleted after the run that wrote them.

No browser is involved and none is needed. Most rules here read the source
directly; three need a parse of the whole project and come from analysers the
project already carries — `jscpd` for blocks repeated instead of shared,
`madge` for modules that import each other, `knip` for exports nothing imports.
redpen installs none of them. If they are absent the run says so, and those
three findings are *absent* rather than clean:

```bash
npm i -D jscpd madge knip     # optional; picked up automatically if present
```

Duplication is worth asking for specifically. It is the tell that most
separates code that was generated from code that was maintained, and no pattern
can see it.

## Reading the result

Report the findings with their file and line. Then, before proposing a single
edit, **read each one in its own file**. These rules have a hard problem: the
difference between a comment that narrates an edit and a comment that explains
the code is a judgement, and a regex is making it.

Things that have already been wrong, and will be again:

- A word can be denied in the next clause. `// this is load-bearing, not
  defensive padding` was reported as defensive padding.
- A reason written above a block is still a reason. A `catch {}` with three
  lines of justification above it is a decision, not an omission.
- A verb mid-sentence is not a note about an edit. "Whitetail Institute renamed
  this product" is a fact about a product.
- Ordinary naming looks like sloppy naming. `newToken` is the Go constructor
  idiom; `sampleProfile` takes samples.

So: if the code disagrees with the finding, the finding is wrong. Say so plainly
rather than editing around it, and offer `redpen-ignore: <reason>` on the line
if the shape is deliberate — an ignore with a reason is a decision on record.

## Fixing

Fix what survives that reading, smallest change first, and never in bulk. A
comment that narrates an edit is usually deleted rather than rewritten: the
change it describes is in the history already.

For anything you delete, say what was there. The point is a file that reads as
though a person wrote it on purpose, and a person can tell you when you have
taken out something they meant.
