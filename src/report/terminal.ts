import pc from 'picocolors';
import type { Finding, ScanResult, Confidence, Evidence } from '../types.js';
import { verdict, scoreByCategory } from '../score.js';

/**
 * Terminal output.
 *
 * Ordering is confidence-first, which means the top of the report is only ever
 * things at least two independent channels agree on. Everything a single
 * channel guessed at sits below a fold the reader can ignore.
 */

const CONFIDENCE_LABEL: Record<Confidence, (s: string) => string> = {
  confirmed: (s) => pc.red(pc.bold(s)),
  likely: (s) => pc.yellow(s),
  possible: (s) => pc.dim(s),
};

const CONFIDENCE_MARK: Record<Confidence, string> = {
  confirmed: '●',
  likely: '◐',
  possible: '○',
};

/**
 * The pip, painted.
 *
 * It encodes confidence, and confidence is what the whole tool exists to
 * establish, but it was printed in the default colour while the section header
 * fifty lines above carried the meaning. On a report this long the header is off
 * the screen for most of the reading, and a filled circle in the terminal's
 * foreground colour says nothing on its own. Same palette as the section header
 * it belongs to, so the two agree.
 */
function mark(c: Confidence): string {
  return CONFIDENCE_LABEL[c](CONFIDENCE_MARK[c]);
}

export interface TerminalOptions {
  verbose: boolean;
  showIgnored: boolean;
  maxEvidence: number;
}

/**
 * How many findings each tier argues in full before it switches to a roster.
 *
 * Printing all of them at full depth produced a 275-line wall in which a
 * weight-94 finding was typeset identically to a weight-43 one, so nothing on
 * screen said where to start. Confidence is what the whole tool is built to
 * establish, so confidence is what buys depth: everything two channels agree on
 * gets argued, the strongest few of the rest get argued, and the tail is still
 * named and locatable rather than hidden behind a count.
 */
const DETAIL: Record<Confidence, number> = {
  confirmed: Number.POSITIVE_INFINITY,
  likely: 5,
  possible: 0,
};

export function renderTerminal(result: ScanResult, opts: TerminalOptions): string {
  const out: string[] = [];
  const { score: value, findings } = result;

  out.push('');
  out.push(scoreLine(value, result.slopScore, result.qualityScore));
  out.push('');
  out.push(kindLine(result));
  out.push('');
  const surfaceNote = surfaceLine(result);
  if (surfaceNote) {
    out.push(surfaceNote);
    out.push('');
  }

  if (result.channelsRun.length < 3) {
    out.push(pc.dim(`  channels: ${result.channelsRun.join(', ')}`));
    const missing = (['source', 'render', 'vision'] as const).filter(
      (c) => !result.channelsRun.includes(c),
    );
    if (missing.length) {
      out.push(
        pc.dim(
          `  not run: ${missing.join(', ')} — findings that need them are unconfirmed, not absent`,
        ),
      );
    }
    out.push('');
  }

  if (!findings.length) {
    out.push(pc.green('  No findings.'));
    out.push('');
    return out.join('\n');
  }

  const cats = scoreByCategory(findings);
  out.push(pc.dim('  BY CATEGORY'));
  // Thirteen categories on one line ran to 138 characters. Pack them into rows
  // that hold the same right edge as everything else, measuring the plain text
  // because the coloured string carries escape codes that occupy no columns.
  const items = Object.entries(cats)
    .sort((a, b) => a[1] - b[1])
    .map(([k, v]) => ({ plain: `${k} ${String(v).padStart(3)}`, shown: `${k} ${colorScore(v)}` }));
  const SEP = '  ·  ';
  let row: typeof items = [];
  let used = 0;
  for (const it of items) {
    const cost = it.plain.length + (row.length ? SEP.length : 0);
    if (row.length && used + cost > MEASURE - 2) {
      out.push(`  ${row.map((r) => r.shown).join(pc.dim(SEP))}`);
      row = [];
      used = 0;
    }
    row.push(it);
    used += it.plain.length + (row.length > 1 ? SEP.length : 0);
  }
  if (row.length) out.push(`  ${row.map((r) => r.shown).join(pc.dim(SEP))}`);
  out.push('');

  const byConfidence = group(findings);

  for (const conf of ['confirmed', 'likely', 'possible'] as const) {
    const list = byConfidence.get(conf);
    if (!list?.length) continue;

    out.push(CONFIDENCE_LABEL[conf](`  ${conf.toUpperCase()} (${list.length})`));
    out.push(pc.dim(`  ${wrap(describeConfidence(conf), MEASURE - 2, '  ')}`));
    out.push('');

    const depth = opts.verbose ? list.length : DETAIL[conf];
    for (const f of list.slice(0, depth)) {
      out.push(...renderFinding(f, opts));
    }
    const rest = list.slice(depth);
    if (rest.length) {
      const idWidth = idColumn(rest);
      for (const f of rest) out.push(rosterLine(f, idWidth));
      // Named, not hidden. The count on its own is the failure this project
      // keeps finding in itself — a report that says how much it is not saying
      // reads as complete, and a reader cannot tell what they were not shown.
      out.push(
        pc.dim(
          `      ${rest.length} listed, not argued — \`redpen why <rule-id>\`, or --verbose for all`,
        ),
      );
      out.push('');
    }
  }

  if (result.clashes.length) {
    out.push(pc.red(pc.bold(`  SAMENESS (${result.clashes.length})`)));
    out.push(pc.dim('  Pages in this project that share a skeleton.'));
    out.push('');
    for (const c of result.clashes.slice(0, 6)) {
      out.push(`  ${pc.bold(short(c.page))} ${pc.dim('≈')} ${pc.bold(short(c.against))}  ${pc.dim(`distance ${c.distance}`)}`);
      for (const dim of c.sharedDimensions) {
        out.push(pc.dim(`      shares ${dim}`));
      }
      out.push('');
    }
  }

  if (result.advisory.length) {
    out.push(pc.dim(`  ADVISORY (${result.advisory.length}) — reported, never scored`));
    const advWidth = idColumn(result.advisory);
    for (const f of result.advisory) {
      out.push(
        pc.dim(`         ${f.ruleId.padEnd(advWidth)}  ${f.title}`),
      );
    }
    out.push('');
  }

  if (opts.showIgnored && result.ignored.length) {
    out.push(pc.dim(`  ${result.ignored.length} finding(s) suppressed by redpen-ignore:`));
    for (const f of result.ignored) {
      out.push(pc.dim(`    ${f.ruleId} — ${f.ignored?.reason ?? 'no reason given'}`));
    }
    out.push('');
  }

  return out.join('\n');
}

/** The right edge every block in the report shares. */
const MEASURE = 80;

/**
 * One finding on one line: enough to recognise it, enough to look it up. The
 * title is truncated here and nowhere else — in a roster the title is a list
 * item, not a heading, and the rule id beside it recovers anything the cut lost.
 */
function rosterLine(f: Finding, idWidth: number): string {
  const weight = String(f.weight).padStart(3);
  const id = f.ruleId.padEnd(idWidth);
  const room = MEASURE - 4 - weight.length - 2 - id.length - 2;
  const title = f.title.length > room ? `${f.title.slice(0, room - 1)}\u2026` : f.title;
  return `  ${mark(f.confidence)} ${pc.dim(weight)}  ${pc.dim(id)}  ${title}`;
}

/**
 * The id column is as wide as the widest id in the group and no wider.
 *
 * It was a fixed 24 characters, which is a guess about a corpus that changes
 * every time a rule is added. Every character it guesses too wide is a
 * character taken off the end of every title on the screen — which is how
 * `no-reduced-motion` came to read "Motion with no prefers-reduced-motion
 * fallba…" while eight columns of the id gutter sat empty beside it.
 */
const idColumn = (list: Finding[]) => Math.max(...list.map((f) => f.ruleId.length));

function renderFinding(f: Finding, opts: TerminalOptions): string[] {
  const out: string[] = [];
  const channels = pc.dim(`[${f.channels.join('+')}]`);

  // The title line is deliberately exempt from MEASURE. The 78-character limit
  // redpen enforces on the pages it scans is about running text — past that the
  // eye loses the line return — and a single heading has no line return to
  // lose. Truncating a title costs the reader the one thing they scan for.
  out.push(`  ${mark(f.confidence)} ${pc.bold(f.title)} ${channels} ${pc.dim(`${f.ruleId} · ${f.weight}`)}`);
  out.push(`    ${wrap(f.why, MEASURE - 4, '    ')}`);
  out.push(`    ${pc.green('fix')} ${wrap(f.fix, MEASURE - 8, '        ')}`);

  const shown = f.evidence.slice(0, opts.maxEvidence);
  for (const e of shown) {
    out.push(pc.dim(`      ${formatEvidence(e)}`));
  }
  if (f.evidence.length > shown.length) {
    out.push(pc.dim(`      … and ${f.evidence.length - shown.length} more`));
  }

  if (opts.verbose) {
    out.push(pc.dim(`      from ${f.sources.map((s) => `${s.origin}:${s.ref}`).join(', ')}`));
  }

  out.push('');
  return out;
}

function formatEvidence(e: Evidence): string {
  const where =
    e.line !== undefined
      ? `${e.location}:${e.line}`
      : e.selector
        ? `${short(e.location)} ${e.selector}`
        : short(e.location);
  const vp = e.viewport ? ` @${e.viewport}px` : '';
  // Only say the scheme when it is dark. Light is the assumption, and printing
  // it on every line of an unthemed site is noise.
  const scheme = e.scheme === 'dark' ? ' dark' : '';
  const head = `${where}${vp}${scheme}`;
  if (!e.excerpt) return head;

  // The prose above wraps at 76 from an indent of 4, so the block has a right
  // edge at column 80. Evidence sits at an indent of 6 and used to ignore that
  // edge entirely, running to 146 characters — past the 78ch maximum redpen's
  // own line-length rule enforces on the pages it scans. The address is never
  // cut, because a location you cannot copy is worth nothing; the excerpt is,
  // because it is there to recognise the line, not to read it.
  const budget = MEASURE - 6 - head.length - 2;
  const excerpt =
    budget > 12 && e.excerpt.length > budget ? `${e.excerpt.slice(0, budget - 1)}…` : e.excerpt;
  return `${head}  ${excerpt}`;
}

function describeConfidence(c: Confidence): string {
  switch (c) {
    case 'confirmed':
      return 'Seen independently by more than one channel, or by the only channel that can see it.';
    case 'likely':
      return 'Seen by one channel that reads real state. No channel disagreed.';
    case 'possible':
      return 'Source-only. The render pass checked the same thing and did not confirm it.';
  }
}

/**
 * The two scores side by side. One number cannot answer both "does this look
 * machine-made" and "is this broken", and a page is routinely strong on one
 * and failing on the other.
 */
function kindLine(result: ScanResult): string {
  const slop = result.findings.filter((f) => f.kind === 'slop').length;
  const qual = result.findings.filter((f) => f.kind === 'quality').length;
  // Both axes get a bar, not just the headline. The headline is the worse of
  // the two, so its number already appears again on one of these rows — which
  // read as a second measurement until you could see the two bars side by side
  // and watch one of them match the header exactly.
  const row = (name: string, value: number, n: number, gloss: string) =>
    `  ${pc.dim(name)}${' '.repeat(7 - name.length)}  ${colorScore(value)}  ${meter(value, 14)}  ` +
    pc.dim(`${n} finding${n === 1 ? '' : 's'} — ${gloss}`);
  return (
    row('slop', result.slopScore, slop, 'reads as machine-made') +
    '\n' +
    row('quality', result.qualityScore, qual, 'broken regardless of taste')
  );
}

function surfaceLine(result: ScanResult): string | null {
  const entries = Object.entries(result.surfaces);
  if (!entries.length) return null;
  const kinds = new Set(entries.map(([, v]) => v.surface));
  const declared = entries.every(([, v]) => v.declared);
  const how = declared ? 'declared' : entries.some(([, v]) => v.declared) ? 'mixed' : 'detected';
  if (kinds.size === 1) {
    return pc.dim(`  surface  ${[...kinds][0]} (${how}) — rules that only hold elsewhere are off`);
  }
  return pc.dim(`  surface  ${entries.map(([u, v]) => `${short(u)}=${v.surface}`).join(', ')} (${how})`);
}

/**
 * The header carries no bar of its own.
 *
 * It used to draw one 24 cells wide while the axes below drew theirs at 14, and
 * since the headline *is* the worse axis, that was the same number rendered at
 * two lengths — an encoding that invites the eye to compare them and get it
 * wrong. The rows below do the measuring. This line says which page you are
 * looking at and what the verdict is.
 */
function scoreLine(value: number, slop: number, quality: number): string {
  return `  ${pc.bold('redpen')}  ${colorScore(value)}${pc.dim('/100')}  ${pc.dim(verdict(slop, quality))}`;
}

/**
 * One band table for the number and the bar.
 *
 * They used to carry their own: the number had four bands and the bar had
 * three, so a 70 got a bold-yellow number beside a yellow bar and an 80 got a
 * plain-yellow number beside the same yellow bar. Two encodings of one quantity
 * that disagree about where the lines are is the same defect as a header whose
 * word and number came from different sums — smaller, and no more defensible.
 *
 * The floors are the grade floors, so the colour changes exactly where the word
 * does.
 */
const BANDS: Array<{ floor: number; paint: (s: string) => string }> = [
  { floor: 90, paint: (s) => pc.green(s) },
  { floor: 75, paint: (s) => pc.yellow(s) },
  { floor: 55, paint: (s) => pc.yellow(s) },
  { floor: 35, paint: (s) => pc.red(s) },
  { floor: 0, paint: (s) => pc.red(s) },
];

const band = (value: number) => BANDS.find((b) => value >= b.floor)!;

function colorScore(value: number): string {
  return band(value).paint(pc.bold(String(value).padStart(3, ' ')));
}

function meter(value: number, width = 24): string {
  const filled = Math.round((value / 100) * width);
  return band(value).paint('█'.repeat(filled)) + pc.dim('░'.repeat(width - filled));
}

function group(findings: Finding[]): Map<Confidence, Finding[]> {
  const m = new Map<Confidence, Finding[]>();
  for (const f of findings) {
    const list = m.get(f.confidence) ?? [];
    list.push(f);
    m.set(f.confidence, list);
  }
  return m;
}

function short(location: string): string {
  return location.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function wrap(text: string, width: number, indent: string): string {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > width) {
      lines.push(line.trim());
      line = w;
    } else {
      line += ' ' + w;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines.join('\n' + indent);
}
