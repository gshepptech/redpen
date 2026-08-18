import type { ScanResult, Finding, Evidence } from '../types.js';
import { verdict, scoreByCategory } from '../score.js';
import type { Confidence } from '../types.js';

/**
 * How many findings each tier argues in full before the rest become a table.
 * Matches the terminal report — a reader who has seen one should not have to
 * learn the other.
 */
const DETAIL: Record<Confidence, number> = {
  confirmed: Number.POSITIVE_INFINITY,
  likely: 5,
  possible: 0,
};

const MARK: Record<Confidence, string> = { confirmed: '●', likely: '◐', possible: '○' };

/**
 * Markdown report — the format an agent reads back and a human pastes into a
 * PR. Deliberately keeps provenance on every finding so a reviewer can argue
 * with the rule, not just the result.
 */
export function renderMarkdown(result: ScanResult): string {
  const out: string[] = [];
  const { score, findings, clashes } = result;

  out.push(`# redpen — ${score}/100 (${verdict(result.slopScore, result.qualityScore)})`);
  out.push('');
  // The bare gloss on its own reads as a verdict — "slop 100 | reads as
  // machine-made" invites exactly the wrong conclusion. The terminal report
  // disambiguates with a finding count; this one has to as well.
  const slopCount = findings.filter((f) => f.kind === 'slop').length;
  const qualCount = findings.filter((f) => f.kind === 'quality').length;
  out.push(`| Axis | Score | Findings | What it measures |`);
  out.push(`| --- | --- | --- | --- |`);
  out.push(
    `| **slop** | ${result.slopScore} | ${slopCount} | whether it reads as machine-made |`,
  );
  out.push(
    `| **quality** | ${result.qualityScore} | ${qualCount} | whether it is broken regardless of taste |`,
  );
  out.push('');
  const surfaceEntries = Object.entries(result.surfaces);
  if (surfaceEntries.length) {
    const how = surfaceEntries.every(([, v]) => v.declared) ? 'declared' : 'detected';
    out.push(
      `Surface: ${surfaceEntries.map(([u, v]) => `\`${u}\` → **${v.surface}**`).join(', ')} (${how}). Rules that only hold on other surfaces did not run.`,
    );
    out.push('');
  }
  out.push(`Channels run: ${result.channelsRun.join(', ')}.`);
  const missing = (['source', 'render', 'vision'] as const).filter(
    (c) => !result.channelsRun.includes(c),
  );
  if (missing.length) {
    out.push('');
    out.push(
      `> Not run: ${missing.join(', ')}. Findings that depend on those channels are unconfirmed rather than absent.`,
    );
  }
  out.push('');

  if (!findings.length && !clashes.length) {
    out.push('No findings.');
    return out.join('\n');
  }

  const cats = scoreByCategory(findings);
  if (Object.keys(cats).length) {
    out.push('| Category | Score |');
    out.push('| --- | --- |');
    for (const [cat, v] of Object.entries(cats).sort((a, b) => a[1] - b[1])) {
      out.push(`| ${cat} | ${v} |`);
    }
    out.push('');
  }

  for (const conf of ['confirmed', 'likely', 'possible'] as const) {
    const list = findings.filter((f) => f.confidence === conf);
    if (!list.length) continue;
    out.push(`## ${conf} (${list.length})`);
    out.push('');

    for (const f of list.slice(0, DETAIL[conf])) out.push(...findingBlock(f));

    // Same fold as the terminal report, and for a sharper reason: this one goes
    // into a pull request, where twenty-seven full arguments is a comment
    // nobody finishes. The tail is a table rather than a count, so every
    // finding stays named and every rule id stays copyable.
    const rest = list.slice(DETAIL[conf]);
    if (rest.length) {
      out.push(`<details><summary>${rest.length} more, listed not argued</summary>`);
      out.push('');
      out.push('| | Weight | Rule | Finding |');
      out.push('| --- | --- | --- | --- |');
      for (const f of rest) {
        out.push(`| ${MARK[f.confidence]} | ${f.weight} | \`${f.ruleId}\` | ${f.title} |`);
      }
      out.push('');
      out.push('</details>');
      out.push('');
    }
  }

  if (clashes.length) {
    out.push('## Sameness');
    out.push('');
    out.push(
      'Pages in this project that share a structural skeleton. Readers register structure, not palette — two pages this close read as the same page.',
    );
    out.push('');
    for (const c of clashes) {
      out.push(`- \`${c.page}\` ≈ \`${c.against}\` (distance ${c.distance})`);
      for (const d of c.sharedDimensions) out.push(`  - shares ${d}`);
    }
    out.push('');
  }

  if (result.advisory.length) {
    out.push('## Advisory');
    out.push('');
    out.push('Reported but never scored — tells humans use legitimately often enough that counting them would be noise.');
    out.push('');
    for (const f of result.advisory) out.push(`- \`${f.ruleId}\` — ${f.title}`);
    out.push('');
  }

  if (result.ignored.length) {
    out.push('## Suppressed');
    out.push('');
    for (const f of result.ignored) {
      out.push(`- \`${f.ruleId}\` — ${f.ignored?.reason ?? 'no reason given'}`);
    }
    out.push('');
  }

  return out.join('\n');
}

function findingBlock(f: Finding): string[] {
  const out: string[] = [];
  out.push(`### ${f.title}`);
  out.push('');
  out.push(`\`${f.ruleId}\` · weight ${f.weight} · seen by ${f.channels.join(' + ')}`);
  out.push('');
  out.push(f.why);
  out.push('');
  out.push(`**Fix.** ${f.fix}`);
  out.push('');
  if (f.evidence.length) {
    out.push('```');
    for (const e of f.evidence.slice(0, 8)) out.push(evidenceLine(e));
    if (f.evidence.length > 8) out.push(`… and ${f.evidence.length - 8} more`);
    out.push('```');
    out.push('');
  }
  out.push(
    `<sub>from ${f.sources.map((s) => `${s.origin}:${s.ref}`).join(', ')}</sub>`,
  );
  out.push('');
  return out;
}

function evidenceLine(e: Evidence): string {
  const where = e.line !== undefined ? `${e.location}:${e.line}` : `${e.location} ${e.selector ?? ''}`;
  const vp = e.viewport ? ` @${e.viewport}px${e.scheme === 'dark' ? ' dark' : ''}` : '';
  return `${where.trim()}${vp}${e.excerpt ? `  ${e.excerpt}` : ''}`;
}
