---
description: Fix a UI's layout, spacing rhythm, and composition
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

Parse `$ARGUMENTS` for urls and a path. Never interpolate it raw: it is prose,
and it may carry a path, several urls, and a sentence of context in any order.


Layout turns product priority into reading order, grouping, rhythm and usable
space. **Diagnose the structural problem before moving boxes.**

## Two isolated assessments

**Look first. Scan second. Do not let the findings anchor the looking.**

This is the part that is easy to skip and the reason the command exists. A
detector tells you what is measurably wrong; it cannot tell you whether the
thing is any good. If you read the findings first, you will spend the pass
closing them and call that done.

1. **Assess.** Open the page and answer the questions below with a file, a
   selector, or a computed value — not an impression. Do this before running
   anything.
2. **Scan.** Then run the mechanical pass and synthesise both. Note what each
   caught that the other did not; that difference is the useful output.

**A clean scan is a floor, not proof.** A page can clear all 112 rules and still
be the wrong page.

### 1. Assess, before scanning

- **Reading order.** Apply the **squint test**: blur the detail, or step back
  from the screen. Can you still identify the primary element, the secondary
  element, and the major groups, in order? This is the single most useful
  question in the command and no measurement answers it.
- **Grouping.** Are related items close and distinct groups separated — or are
  *containers compensating for weak proximity*? A card drawn around things that
  are not near each other is a box doing spacing's job.
- **Rhythm.** Do tight and generous intervals create a deliberate cadence, or is
  one spacing value repeated until everything has equal weight?
- **Structure.** Does the topology match the content and the task? Are repeated
  cards, columns and sections genuinely equivalent, or a framework default?
- **Density.** Does the information per region fit use frequency and decision
  complexity?
- **Adaptation.** At narrow, intermediate, wide and zoomed states, what
  reorders, collapses, wraps or stays fixed? **Does DOM and focus order still
  agree with visual order?**
- **Extremes.** Long content, empty states, overlays, sticky elements, small
  touch targets.

### 2. Then scan

```bash
run scan <path> --url <url> --only layout,depth,composition
```

Check the reported surface. On operate and read surfaces predictable structure
and stable density are affordances, not monotony; on persuade the composition
may be asymmetric or disruptive if the world earns it.

## Set the spatial thesis

Before editing, name: the primary reading or task path, what belongs together
and what must separate, which element leads and which supports, the intended
density and rhythm, and how the structure changes across viewports and content
extremes.

## Apply

Mechanics first — a page that scrolls sideways cannot be judged for rhythm.
Horizontal overflow at any width, clipped text, body text against the viewport
edge, controls under 44px, mismatched control heights in a row, nested surfaces.

Then rhythm:

- **Group by meaning. Use proximity before adding containers or decoration.**
- Rhythm comes from deliberate contrast between tight and generous intervals.
  **A perfect 4px scale applied uniformly is exactly the failure** — every gap
  on the scale and still no groups. The ratio is the signal, not the values.
- A 4-unit base gives the middle steps an 8-only scale misses.
- Let hierarchy follow product priority, not framework defaults.
- Make responsive behaviour *structural* — reorder, collapse, reflow — rather
  than fluid type.
- Use `gap` for sibling rhythm where it expresses the relationship more directly
  than child margins.
- Keep touch targets usable even when their visible marks are small.
- Use depth only when it clarifies state or hierarchy.
- Make optical corrections only after inspecting the rendered result.

Variation is not a goal. Repetition supports recognition; break it only when
content or priority changes.

## Then composition, and only by looking

`no-focal-point`, `sized-to-fit`, `undifferentiated-spacing` and
`content-interchangeable` are vision-channel rules — no measurement reaches
them. Run with `--vision`, open the screenshots, answer the brief, re-run with
`--answers`. A confident "no, I looked, it is not there" counts and is recorded.

If the answer to *could this hold a different product's content unchanged* is
yes, that is the finding to act on. It is the closest single question to "it
looks AI generated".

## Verify

Answer each of these with rendered or source evidence. **Do not
substitute a bare "yes" for verification** — an unevidenced pass is the same
failure mode as an unevidenced finding, which this tool rejects on the way in.

- The squint test still reveals primary, secondary and major groups in order.
- Related content groups naturally; unrelated content does not blur together.
- Tight and generous spacing create rhythm rather than monotonous repetition.
- Keyboard, touch and assistive-technology order agree with visual order.
- Long text, empty states, zoom and dynamic content do not break the structure.
- Re-run, and run `why-score` with the same `--only`.

## Hand off

When this holds, run `/redpen:polish` — the mechanical pass over everything
broken regardless of taste. This command's job is one concern done well; polish
is what makes the whole path consistent.

---

<sub>This command is built on redpen's rule corpus. See NOTICE for the
catalogues the corpus draws on and the licences they carry.</sub>
