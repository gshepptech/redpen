---
name: redpen
description: Judge and fix UI, and the source behind it, when either reads as AI-generated. Runs a source scan, a real browser reading computed styles, a structural comparison against the project's other pages, and (on a code scan) the duplication, dead-export and dependency-cycle analysers the project already carries, then reports only what more than one channel agrees on. Use when building, reviewing, or auditing any web UI (landing page, dashboard, component, design system), and whenever the user says a page or a codebase looks generic, templated, AI-made, vibe-coded, or "like every other site", or asks for a design review, a UI audit, an accessibility check, a check for machine-written code, or wants to know why a page feels off.
---

# redpen

One verdict on a UI, from four evidence channels, weighted by what people
actually notice.

Read this before styling anything. It replaces running four separate design
catalogues; the corpus below is those merged, deduplicated, and cross-checked.

## Run it

Resolve the binary first. A plugin install carries `bundle/redpen.mjs`; a
checkout has `dist/cli.js`; a linked install puts `redpen` on PATH. There is no
`npx @gshepptech/redpen`: the package is not published yet, and `npx redpen` is somebody
else's package.

```bash
REDPEN="${CLAUDE_PLUGIN_ROOT:-$(npm root -g)/@gshepptech/redpen}"
if   [ -f "$REDPEN/bundle/redpen.mjs" ]; then run() { node "$REDPEN/bundle/redpen.mjs" "$@"; }
elif [ -f "$REDPEN/dist/cli.js" ];      then run() { node "$REDPEN/dist/cli.js" "$@"; }
else                                         run() { redpen "$@"; }
fi
run --help    # confirm it resolved before doing anything else
```

One bare origin scans the whole app: redpen reads the project's own routes
(Next, SvelteKit, Astro, Nuxt, React Router, Vue Router) and expands. An
explicit path is obeyed exactly.

```bash
run scan . http://localhost:3000
```

Without a url the render channel never runs, every finding it could have
confirmed is capped at `possible`, and the report says so. **Never read a
source-only run as a clean page**: the same fixture scored 76 with no url and
3 with one.

```bash
run scan . http://localhost:3000/pricing   # one page, exactly
run scan . http://localhost:3000 --vision  # writes a brief for you to answer
run code .                                 # the source, not the page
run why ai-purple                          # what a rule means and who said so
run rules color                            # the corpus, by category
run fingerprints                           # every page signature on record
run scan . http://localhost:3000 --json report.json
```

### The vision channel is you

`--vision` does not call an API. It captures the screenshots and writes
`.redpen/vision-brief.json`: the questions no rule can answer, with a pre-built
row for each. **You** open the PNGs and fill them in, then re-run with
`--answers`:

```bash
run scan . http://localhost:3000 --vision
# Read every file under .redpen/screenshots/ with your image-reading tool.
# Fill in each row of .redpen/vision-brief.json: present, confidence, evidence.
run scan . http://localhost:3000 --answers .redpen/vision-brief.json
```

Rules for answering (the channel enforces all of them):

1. Every question is phrased so **present: true means the tell IS present**.
   Read the direction before answering.
2. Answer only from what is visible. Do not infer from what a page like this
   usually does.
3. `confidence` below 0.7 is discarded. A question you cannot decide from the
   image gets a low number, not a guess. Discarding is the right outcome.
4. `evidence` names the specific thing you saw. "the three cards each open with
   a rounded icon square", not "it looks AI-generated". A `true` with no
   evidence is rejected as a guess.
5. Leave `present: null` for anything you did not judge. Null rows are ignored
   and are not an error.

Use this when a page passes every mechanical check and still looks wrong.

## How to read the report

Findings are grouped by **confidence**, not severity. Work the top group first
and treat the bottom group as leads.

| | |
| --- | --- |
| **confirmed** | Two or more channels saw it independently, or the only channel that can see it did. Fix these. |
| **likely** | One channel that reads real state saw it. Nothing disagreed. Fix these next. |
| **possible** | Source-only, and the render pass checked the same thing without corroborating. Usually a false positive. Verify before touching. |

The `[source+render]` tag on each finding names the channels that saw it.
`weight` is 0–100 and comes from measured human complaint data where it exists;
that is the ordering that matters, not the severity label.

## Fixing, not only judging

Five commands scope a fix pass to one concern and re-scan afterwards. Reach for
the one that matches the complaint rather than fixing everything at once. A
pass that changes typography and palette together cannot be reviewed:

| | |
| --- | --- |
| `/redpen:typeset` | faces, scale, leading, measure, type tokens, browser surfaces |
| `/redpen:layout` | overflow and geometry first, then spacing rhythm, then composition |
| `/redpen:color` | contrast first, then the anchor hue, then tokens, then accent footprint |
| `/redpen:polish` | the `quality` axis only: broken things, never taste |
| `/redpen:distill` | removal, one thing at a time |

`redpen scan --only <categories>` is what they are built on, and it narrows the
*report* without narrowing what runs: every channel still executes, so
cross-channel confirmation is unaffected and both scores still describe the
whole page.

## The verbs

**Audit.** Run the scan, then work the confirmed list top-down. Report the
score, the confirmed count, and the single highest-weight finding first. Do not
list every `possible` finding at the user unless they ask; that noise is what
the confidence tiers exist to suppress.

**Fix.** Each finding ships a concrete `fix`. Apply it, then re-run the scan on
the same URL and confirm the finding is gone and the score moved. **A fix you
have not re-scanned is not a fix.** If the score did not move, you changed
something else.

**Build.** Before writing UI, read `redpen rules` for the category you are about
to touch, and check `redpen fingerprints` for what the project's other pages
already look like. Building a page that clashes with an existing signature is
the failure this tool exists to catch; do not create it and then fix it.

**Gate.** `redpen baseline` once, committed; `redpen check` in CI. It fails on a
score drop *or* on a new tell, so fixing one problem while introducing another
still fails.

## Rules that override your defaults

These are the highest-weight findings in the corpus. Do not produce them in the
first place.

1. **No violet/indigo as the primary colour** unless the brand genuinely is
   violet. It is the Tailwind default and ranks second among all named tells.
2. **No gradient-filled heading text.** Ever. Solid colour on every heading;
   presence comes from scale, weight, or a drawn rule.
3. **No centred hero followed by three equal icon cards.** This skeleton is the
   main carrier of "they all look the same". Break the symmetry: unequal
   columns, a numbered sequence, a table, one annotated screenshot.
4. **No italic headings**, including a single italicised word inside an upright
   headline. Headers are roman; italic is a body-copy register.
5. **No emoji as interface icons.** One icon library, or lead with the words.
6. **No cream-plus-serif by reflex.** That was the escape route from AI purple,
   which is what made it the new default.

## Suppressing a finding

When a finding is genuinely wrong for this project, suppress it *with a reason*:

```css
/* redpen-ignore:ai-purple brand is violet, signed off by design 2026-03 */
```

or project-wide in `.redpen/config.json` under `ignore`. The reason is
mandatory. Never suppress a finding you have not first understood. Check
`redpen why <rule-id>` and confirm the pattern is deliberate rather than
inherited.

## Sameness

`redpen fingerprints` records each page's skeleton, section rhythm, type scale,
and palette anchor. When two pages score under 0.28 apart they are reported as
the same page.

The correct fix is **structural**. A palette swap does not clear a clash and the
metric is weighted so that it barely moves, because readers register structure,
not colour. Change the macrostructure: a long document, a stat-led opener, a
catalogue index, a split studio, a workbench, a specimen table.

## What this does not do

It judges the rendered surface. It will not invent product copy, pick a brand,
or enforce a house style. A page can score 100 and still be the wrong page.
When the brief is unclear, ask, rather than defaulting to something the corpus
happens not to penalise.
