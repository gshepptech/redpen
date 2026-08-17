# redpen

One verdict on your UI.

```
npx redpen scan . --url http://localhost:3000
```

```
  redpen   76  ██████████████████░░░░░░  minor tells

  CONFIRMED (2)
  Seen independently by more than one channel, or by the only channel that can see it.

  ● AI purple as the primary colour [source+render] ai-purple · 94
    Violet/indigo is Tailwind's out-of-the-box accent and the colour every model
    reaches for unprompted, so it reads as "nobody chose this". It ranks second
    among all named tells in a 3,033-comment sample.
    fix Pick an anchor hue outside the 265-305 band and derive the ramp from it.
      src/theme.css:12  --primary: #7c3aed;
      localhost:3000 body @1440px  background rgb(124, 58, 237)

  SAMENESS
  localhost:3000/pricing ≈ localhost:3000  distance 0.06
      shares macrostructure (hero-triptych)
      shares section rhythm (nav → hero-full → card-grid-3 → cta → footer)
```

## Why this exists

Four good catalogues already describe what AI-generated UI looks like:
[impeccable](https://github.com/pbakaus/impeccable),
[hallmark](https://github.com/nutlope/hallmark),
[unslop-ui](https://github.com/JCarterJohnson/vibecoded-design-tells), and
[frontend-design-audit](https://github.com/mistyhx/frontend-design-audit).

Running them together is worse than running one. They use different
vocabularies, they contradict each other, and concatenating ~200 rules doubles
the false positives without doubling the truth. redpen merges them into 96 rules
with provenance intact, then does three things none of them does.

**It cross-checks before it reports.** The four catalogues inspect three
different things and each is blind to the others. A purple gradient written as a
Tailwind class is visible to a source scan; the same gradient assembled from
theme variables, or injected after a fetch, is not. redpen runs a source scan, a
real browser reading computed styles, and — with `--vision` — a pass over the
screenshots, then reports a finding as **confirmed** only when more than one
channel saw it independently, or when the only channel that *can* see it did.
A source-only hit that the render pass checked and did not corroborate is
demoted to `possible`, hidden by default, and costs nothing against your score.

That last part is measurable. On the well-designed test fixture, the source
regexes fire for `no-skip-link` and `no-active-nav-state` — the page has both,
written in a form the regex can't see. The render channel checks the real DOM,
disagrees, and both are demoted to `possible`. The page scores 100.

**It weights by what people actually notice.** Severity in every upstream
catalogue is one author's opinion. One of the four measured it — the unslop-ui
study tabulated 3,033 comments drawn from 3.2M Reddit posts across 47
subreddits — so redpen orders the whole corpus by that ranking where it exists,
and says plainly when it doesn't. `redpen why <rule-id>` tells you which.

**It remembers your other pages.** The top finding in that study was not any
single feature. "They all look the same" appeared in ~13% of on-topic posts,
ahead of every individual tell. Nothing that checks one page at a time can see
it. redpen records a structural signature per page — skeleton, section rhythm,
type scale, palette anchor — and reports when two pages in your project are the
same page wearing different words. Changing the palette does not count as
variety; the metric is weighted so that it barely moves.

## Install

**As a Claude Code plugin** — gives you `/redpen:audit`, `/redpen:why`,
`/redpen:gate`, and a skill that fires whenever you build or review UI:

```
/plugin marketplace add gshepptech/redpen
/plugin install redpen
```

**As a CLI**, for CI or for use outside an agent:

```
npm i -D redpen
npm i -D playwright && npx playwright install chromium   # for the browser pass
```

Playwright is optional. Without it, redpen runs source-only and **says so** — a
missing channel is reported as unconfirmed, never as clean.

### Commands

| | |
| --- | --- |
| `/redpen:audit [path] [--url ...]` | scan, report the confirmed findings, apply the fixes you approve |
| `/redpen:why <rule-id>` | what a rule means, who named it, whether humans actually notice it |
| `/redpen:gate` | wire the regression gate into this project's CI |

## Use

```
redpen scan [path]        run every available channel and print the report
redpen check [path]       same, but exit non-zero when the score drops
redpen baseline [path]    record the current score as the bar to hold
redpen rules              list the merged corpus
redpen why <rule-id>      explain one rule and where it came from
redpen sources            provenance rollup across the upstream catalogues
redpen fingerprints       show recorded page signatures
redpen init [path]        write .redpen/config.json
```

| Option | |
| --- | --- |
| `--url <u>` | page to render, repeatable. Without one the render channel never runs. |
| `--viewport <n>` | viewport width, repeatable. Default 375, 768, 1440. |
| `--json [file]` / `--markdown [file]` | machine-readable and PR-ready output |
| `--screenshots` | full-page PNGs to `.redpen/screenshots` |
| `--vision` | capture screenshots and write `.redpen/vision-brief.json` |
| `--answers <file>` | fold answered vision questions back into the verdict |
| `--verbose` | include single-channel findings and rule provenance |
| `--min <level>` | confidence floor for scoring: `confirmed`, `likely`, `possible` |

### Configuration

`.redpen/config.json`:

```json
{
  "urls": ["http://localhost:3000", "http://localhost:3000/pricing"],
  "viewports": [375, 768, 1440],
  "minConfidence": "likely",
  "skipCategories": [],
  "tolerance": 0,
  "ignore": {
    "ai-purple": "the brand is genuinely violet, signed off by design"
  }
}
```

### CI

`redpen check` is a regression gate, not a grader. A codebase that starts at 46
should not have to reach 90 before CI goes green — it has to stop getting worse.

```yaml
- run: npm run build && npm run preview &
- run: npx redpen baseline . --url http://localhost:4173   # once, committed
- run: npx redpen check . --url http://localhost:4173
```

`check` fails when the score drops below the baseline by more than `tolerance`,
or when a tell appears that was not present at baseline — so a score that holds
steady while one problem is fixed and another introduced still fails.

### Suppressing a finding

```css
/* redpen-ignore:ai-purple the brand is violet, signed off 2026-03 */
--primary: #7c3aed;
```

The reason is required. An ignore with no reason is how a rule set stops meaning
anything, so `/* redpen-ignore */` alone does nothing. `redpen scan
--show-ignored` lists everything a project has excused.

## The channels

| Channel | Sees | Blind to |
| --- | --- | --- |
| **source** | text in the repo — literal patterns, class names, imports | anything computed, themed, or rendered at runtime |
| **render** | computed styles and geometry in a real browser, swept across viewports | routes you didn't list; states you didn't drive |
| **vision** | a screenshot, judged by whoever runs redpen — hierarchy, rhythm, whether a headline says anything | anything not visible in the frame |
| **fingerprint** | this page against every other page on record | a project with only one page |

Each finding names the channels that saw it: `[source+render]`.

### The vision channel takes no API key

Some judgements no rule can express: does the hierarchy read in two seconds, is
the highlight band sitting at the baseline instead of the x-height, would this
headline fit any company unedited. hallmark's own gate for the second one
instructs the model to *imagine* the rendered output.

redpen does not call a model to answer these. Whatever is running redpen —
Claude Code, Cursor, you — can already open a PNG, and is a better judge than
any model redpen would pick on your behalf. So `--vision` writes a brief and
`--answers` reads the replies:

```
redpen scan . --url http://localhost:3000 --vision
#   → .redpen/screenshots/*.png
#   → .redpen/vision-brief.json   (questions + pre-built answer rows)

# open the screenshots, fill in the rows, then:
redpen scan . --url http://localhost:3000 --answers .redpen/vision-brief.json
```

The brief carries its own instructions, skips any rule two channels already
agree on, and pre-builds one row per page/question pair so answering is editing
rather than authoring. An answer is discarded unless it is a `true` above 0.7
confidence **with evidence** — an unevidenced yes is a guess, and it is rejected
and reported rather than silently dropped.

A vision hit never confirms a finding alone. It corroborates another channel, or
reports as `likely` on its own:

```
confirmed [render+vision]  icon-tile-feature-card
    each feature card opens with an emoji inside a ~48px rounded violet-tinted square
likely    [vision]         vague-headline
    "Supercharge your workflow" names no product and no outcome — fits any SaaS unchanged
```

`vague-headline` is a rule no other channel can see at all. It exists only
because someone looked.

**A channel that cannot run says so.** No Playwright, no screenshots, an
unreadable or malformed answers file — each is reported as a warning and the
affected findings stay unconfirmed. Nothing degrades into a clean report.

## Rule categories

`color` · `typography` · `layout` · `depth` · `motion` · `iconography` · `copy`
· `usability` · `a11y` · `sameness`

Accessibility rules sit next to the visual rule they interact with — contrast in
`color`, heading order in `typography`, alt text in `iconography` — because that
is how they get fixed. `redpen rules a11y` lists what remains.

## Attribution

Every rule carries its upstream provenance. See [NOTICE](NOTICE) for licences
and what redpen added on top. `redpen sources`:

```
  96 rules merged from:
      67  hallmark
      66  impeccable
      46  frontend-design-audit
      18  unslop-ui
       5  redpen
```

The counts exceed the rule total because most rules were named by more than one
catalogue. That overlap is what the merge collapsed.

## Licence

MIT.
