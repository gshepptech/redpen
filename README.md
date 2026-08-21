![redpen scanning a page: a headline of 76/100 reading "minor tells", the two axes below it — slop 76 and quality 100, each with its own bar — an "AI purple as the primary colour" finding promoted from source-only to source+render once both channels agree, and a sameness block reporting two pages that share a section rhythm](assets/hero.gif)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/mark-dark.svg">
  <img src="assets/mark.svg" alt="" width="64" height="54">
</picture>

# redpen

One verdict on your UI.

A linter for the things that make an interface read as machine-made — the
default violet, the three-card grid, the gradient heading — plus the ordinary
defects that are just broken. It reads your source, drives the real page in a
browser, and only calls something a fact when more than one of them agrees.

```
npx @gshepptech/redpen scan . --url http://localhost:3000
```

```
  redpen   76/100  minor tells

  slop      76  ███████████░░░  2 findings — reads as machine-made
  quality  100  ██████████████  0 findings — broken regardless of taste

  channels: source, render

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

That is a two-finding page. A page with twenty-seven looks like this — the
strongest are argued in full, the tail is named and locatable, and nothing is
hidden behind a count:

```
  LIKELY (24)
  Seen by one channel that reads real state. No channel disagreed.

  ◐ AI purple as the primary colour [source] ai-purple · 94
    Violet/indigo is Tailwind's out-of-the-box accent and the colour every model
    reaches for unprompted, so it reads as "nobody chose this". It ranks second
    among all named tells in a 3,033-comment sample.
    fix Pick an anchor hue outside the 265-305 band and derive the ramp from it.
      style.css:2  --primary: #7c3aed;
      style.css:35  background: linear-gradient(90deg, #7c3aed, #3b82f6);
      … and 6 more

  ◐  79  no-focus-visible         Interactive element missing focus, active, or…
  ◐  78  unlabelled-input         Form control with no associated label
  ◐  76  italic-display           Italic headings or display type
  ◐  74  default-sans             Inter, Geist, or Roboto as the only face
      19 listed, not argued — `redpen why <rule-id>`, or --verbose for all
```

## Why this exists

Several good catalogues already describe what AI-generated UI looks like, and
[NOTICE](NOTICE) names the ones redpen's corpus draws on.

Running them together is worse than running one. They use different
vocabularies, they contradict each other, and concatenating ~200 rules doubles
the false positives without doubling the truth. redpen merges them into 155 rules
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

> **Not released yet.** @gshepptech/redpen is not on npm and this repository is
> private, so `npx` will fail today. The plugin path does work from a clone or a
> git install — `bundle/redpen.mjs` is tracked, carries its dependencies inlined,
> and needs no build step or `npm install` on the machine that runs it.

**As a Claude Code plugin** — gives you `/redpen:audit`, `/redpen:why`,
`/redpen:gate`, and a skill that fires whenever you build or review UI:

```
/plugin marketplace add gshepptech/redpen
/plugin install redpen
```

**From a terminal**, globally, so `redpen` works from any directory:

```
npm i -g @gshepptech/redpen && redpen --help
```

**As a project dependency**, for CI. Note the `-cli` — the bare `redpen` name on
npm belongs to an unrelated tool:

```
npm i -D @gshepptech/redpen
npm i -D playwright && npx playwright install chromium   # for the browser pass
```

Playwright is optional. Without it, redpen runs source-only and **says so** — a
missing channel is reported as unconfirmed, never as clean.

### Commands

| | |
| --- | --- |
| `/redpen:audit [path] [--url ...]` | scan, report the confirmed findings, apply the fixes you approve |
| `/redpen:code [path]` | the source it is written in, not the page it serves |
| `/redpen:typeset` | fix typography — faces, scale, leading, measure, tokens |
| `/redpen:layout` | fix layout, spacing rhythm, and composition |
| `/redpen:color` | fix palette, contrast, and colour tokens |
| `/redpen:polish` | fix everything mechanically wrong, leaving taste alone |
| `/redpen:distill` | remove what is not earning its place |
| `/redpen:why <rule-id>` | what a rule means, who named it, whether humans actually notice it |
| `/redpen:gate` | wire the regression gate into this project's CI |

The five fix commands are scoped passes, not a different tool: each one scans
with `--only <categories>`, works the findings in an order where each step
changes what the next measures, and re-scans. `/redpen:polish` works the
`quality` axis and is forbidden from touching taste, so its diff is reviewable;
`/redpen:distill` is the only subtractive one and removes a single thing at a
time so the score can attribute the change.

## Use

```
redpen scan [path]        run every available channel and print the report
redpen code [path]        the source it is written in, not the page it serves
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
| `--verbose` | argue every finding in full rather than folding the tail into a roster, and show rule provenance |
| `--min <level>` | confidence floor for scoring: `confirmed`, `likely`, `possible` |

### The markdown report

`--markdown` writes the same verdict in the shape a pull request wants — every
finding keeps its weight, its channels and its provenance, so a reviewer can
argue with the rule rather than only with the number.

````markdown
# redpen — 9/100 (slop)

| Axis | Score | Findings | What it measures |
| --- | --- | --- | --- |
| **slop** | 22 | 16 | whether it reads as machine-made |
| **quality** | 42 | 11 | whether it is broken regardless of taste |

Channels run: source.

> Not run: render, vision. Findings that depend on those channels are
> unconfirmed rather than absent.

## confirmed (3)

### Full-height sections measured against the wrong viewport

`viewport-height-jump` · weight 63 · seen by source

On mobile browsers `100vh` is the viewport with the address bar hidden, so a
section sized to it is taller than the screen on load and the page jumps as the
bar retracts. The author never sees it, because desktop has no retracting bar.

**Fix.** Use `100dvh` for the height that follows the bar, or `100svh` for the
smallest guaranteed viewport when you need no jump at all.

```
style.css:23  min-height: 100vh;
pricing.css:23  min-height: 100vh;
```

<sub>from catalogue:dynamic-viewport-units</sub>

## likely (24)

… five argued in full, then:

<details><summary>19 more, listed not argued</summary>

| | Weight | Rule | Finding |
| --- | --- | --- | --- |
| ◐ | 79 | `no-focus-visible` | Interactive element missing focus, active, or disabled styling |
| ◐ | 78 | `unlabelled-input` | Form control with no associated label |
| ◐ | 76 | `italic-display` | Italic headings or display type |

</details>
````

Pass a filename to write it instead of printing: `--markdown report.md`.

### Configuration

`.redpen/config.json`:

```json
{
  "urls": ["http://localhost:3000", "http://localhost:3000/pricing"],
  "surface": "operate",
  "surfaceByUrl": { "http://localhost:3000/": "persuade" },
  "viewports": [375, 768, 1440],
  "minConfidence": "likely",
  "capabilities": { "javascript": false },
  "skipCategories": [],
  "tolerance": 0,
  "ignore": {
    "ai-purple": "the brand is genuinely violet, signed off by design"
  }
}
```

**`capabilities`** declares what the project is able to do. A server-rendered
project that ships no client JavaScript by rule should not be told to add inline
validation, an unsaved-changes warning and autosave on every scan forever — 15
rules depend on JavaScript and switch off with one line. A rule whose fix needs
something you cannot do is not a finding, it is a standing complaint.

### CI

`redpen check` is a regression gate, not a grader. A codebase that starts at 46
should not have to reach 90 before CI goes green — it has to stop getting worse.

```yaml
- run: npm run build && npm run preview &
- run: npx @gshepptech/redpen baseline . --url http://localhost:4173   # once, committed
- run: npx @gshepptech/redpen check . --url http://localhost:4173
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

### `redpen why-score`

The score was the one output with no provenance, which is a strange gap in a
tool built on provenance — and it cost someone an afternoon: four true findings
fixed, score went *down*, nothing to explain why.

```
  redpen  72/100   reads as generated

    31.5%    +8  tight-leading                quality · 2×
    27.5%    +7  cramped-padding              quality · 1×
    26.3%    +7  no-focus-visible             quality · 2×

  Start here  tight-leading — 31% of the total
```

`share` is what proportion of the problem a finding is; `+pts` is what the score
gains if it goes away on its own. The curve saturates, so on a badly-failing
page every single fix is worth a fraction of a point — true, and useless for
deciding what to do. Share ranks correctly at any score, and the command says
so when the curve is saturated rather than printing a column of `+0`.

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

**The brief is the artefact you hand to someone who wasn't there.** That is the
design, and it has two consequences.

It carries enough context to be answered cold — what the product is, who uses
it, and what each page is for. Half these questions are meaningless without
that: *could this hold a different product's content* means nothing if you do
not know what this product's content is. Declare `product` in the config.

And it leaks nothing that telegraphs the answer. Questions carry opaque handles
(`q1`, `q2`) rather than rule ids, because `no-focal-point` and
`nothing-memorable` *state the expected answer*. The `fix` text is left out for
the same reason — it is the answer key printed beside the question. Questions
are scattered so six typography questions do not arrive in a row and invite
answering the category rather than the image. The mapping back to rules lives in
`key`, which the answerer has no reason to open.

The person who built the page is the worst available judge of these, because
they cannot unsee it. `redpen brief` prints the whole thing readably — and
deliberately does not print the key. An answer is discarded unless it is a `true` above 0.7
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

## Two scores, not one

"Does this look machine-made" and "is this broken" are different questions, and
one number answers neither. Every rule declares which it is, and that split
turns out to be the most useful distinction in the corpus.

```
  redpen   62  ███████████████░░░░░░░░░  reads as generated

  slop      41  14 findings — reads as machine-made
  quality   88   2 findings — broken regardless of taste
```

51 slop rules, 45 quality. A page can be immaculate taste over a broken form, or
flawless mechanics wearing every default in the catalogue, and you should be
able to see which.

**Advisory rules** are reported and never scored. Some tells — em dashes being
the canonical case — humans use legitimately often enough that counting them is
noise rather than signal. 8 rules are marked this way.

## Surfaces

The rule that most needed to exist: **what the visitor is doing on the page
decides which rules are true there.**

| | The visitor | Examples |
| --- | --- | --- |
| `persuade` | decides and acts | landing, marketing, pricing |
| `operate` | completes a task | app UI, dashboards, settings |
| `read` | understands something | docs, articles, changelogs |

On an operate surface familiarity is a *feature*. A single type family is the
right answer there and a tell on a landing page; uniform spacing is consistency
in a settings panel and monotony on a marketing site; identical repeating
components are the point of a data table. 32 rules are scoped accordingly, and
firing them on the wrong surface is a false positive by construction.

redpen detects the surface from the rendered DOM — controls and data rows versus
a hero and a pitch versus sustained prose — and reports what it decided and why:

```
surface  persuade (detected) — rules that only hold elsewhere are off
```

Detection is a heuristic and behaves like one: below 0.6 confidence it declines
to classify and every rule stays on, because a false positive you can dismiss
beats a silently skipped check. Declare it once to skip the guessing:

```json
{ "surface": "operate", "surfaceByUrl": { "http://localhost:3000/": "persuade" } }
```

Same fixture page, judged both ways, drops ten findings that are wrong on a
dashboard: `default-sans`, `monotonous-spacing`, `ghost-cards`, `over-rounding`,
`line-length`, `hero-three-cards`, `centered-everything-hero`, `generic-cta`,
`marketing-buzzword`, `numbered-section-labels`.

## What this has and has not been proven against

v0.1.0. The corpus is 155 rules across 15 categories, the suite is 185 tests,
and it has been run end to end against five real projects plus its own
fixtures. Nearly everything ever found wrong with redpen was found by pointing
it at something real rather than by reading it: a first Go dashboard gave up six
defects in the dashboard and six in redpen, and each project since has given up
one or two more.

The last of those runs was the first with nothing at stake — five public
marketing pages, fetched and scanned, none of them built by anyone who has
touched this repository. Twelve findings. Three were spot-checked by hand
against the pages, independently of redpen's own code, and all three held:
gradient-clipped headings on two sites, Inter as the only declared face on one,
emoji standing in for icons on two. The fifteen copy rules reported nothing, and
a separate pass over the stripped text confirmed the tells genuinely are not
there — professional copy, correctly left alone.

Specifically not yet true:

- **Validation is shallow.** Five pages checked by hand is not a corpus. Nothing
  here has been run against a project by an author who could push back on the
  result, and no finding has ever been argued with by the person who wrote the
  code.
- **The vision channel is hand-answered.** It writes a brief and folds answers
  back in; it does not look at the screenshots itself.
- **Dark mode is one extra pass.** An emulated preference and, where the page
  ships one, its own theme toggle — but not a matrix of both against every
  viewport.
- **The composition rules are unmeasured.** Seven of them ask a human a
  question no detector can answer, and they carry no evidence ranking because
  no study measured them.

If you run it against a codebase it has never seen and it says something
useless, that is the most valuable bug report available right now.

## Rule categories

`color` · `typography` · `layout` · `depth` · `motion` · `iconography` · `copy`
· `usability` · `a11y` · `sameness` · `chrome` · `system` · `composition`

`chrome` is the surfaces nobody drew — selection, caret, scrollbar, focus ring.
`system` is drift from the project's own declared tokens. `composition` is the
seven judgements no measurement reaches, and the only category that is
vision-only by construction.

Accessibility rules sit next to the visual rule they interact with — contrast in
`color`, heading order in `typography`, alt text in `iconography` — because that
is how they get fixed. `redpen rules a11y` lists what remains.

## Attribution

Every rule records what kind of authority stands behind it, because a rule
backed by a measured study is a different claim from one backed by an author's
taste. See [NOTICE](NOTICE) for the projects behind each and their licences.
`redpen sources`:

```
  155 rules merged from:
     155  catalogue     curated lists of design tells
      50  heuristics    the usability and a11y tradition
      18  study         a tabulation of 3,033 Reddit comments
      12  redpen        named here first
```

The counts exceed the rule total because most rules were named by more than one
catalogue. That overlap is what the merge collapsed.

## Licence

MIT, except for five files. `commands/{typeset,layout,color,polish,distill}.md`
are derivative works of Apache-2.0 material and stay under that licence — each
says so at the top, [LICENSE-APACHE-2.0](LICENSE-APACHE-2.0) is the text, and
[NOTICE](NOTICE) itemises what came from where.
