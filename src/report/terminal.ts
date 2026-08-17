import pc from 'picocolors';
import type { Finding, ScanResult, Confidence, Evidence } from '../types.js';
import { grade, scoreByCategory } from '../score.js';

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

export interface TerminalOptions {
  verbose: boolean;
  showIgnored: boolean;
  maxEvidence: number;
}

export function renderTerminal(result: ScanResult, opts: TerminalOptions): string {
  const out: string[] = [];
  const { score: value, findings } = result;

  out.push('');
  out.push(scoreLine(value));
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

  const byConfidence = group(findings);

  for (const conf of ['confirmed', 'likely', 'possible'] as const) {
    const list = byConfidence.get(conf);
    if (!list?.length) continue;
    if (conf === 'possible' && !opts.verbose) {
      out.push(
        pc.dim(
          `  ${list.length} single-channel finding${list.length === 1 ? '' : 's'} not shown — pass --verbose`,
        ),
      );
      out.push('');
      continue;
    }

    out.push(CONFIDENCE_LABEL[conf](`  ${conf.toUpperCase()} (${list.length})`));
    out.push(pc.dim(`  ${describeConfidence(conf)}`));
    out.push('');

    for (const f of list) {
      out.push(...renderFinding(f, opts));
    }
  }

  if (result.clashes.length) {
    out.push(pc.red(pc.bold('  SAMENESS')));
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

  const cats = scoreByCategory(findings);
  const catLine = Object.entries(cats)
    .sort((a, b) => a[1] - b[1])
    .map(([k, v]) => `${k} ${colorScore(v)}`)
    .join(pc.dim('  ·  '));
  out.push(pc.dim('  by category'));
  out.push(`  ${catLine}`);
  out.push('');

  if (result.advisory.length) {
    out.push(pc.dim(`  ADVISORY (${result.advisory.length}) — reported, never scored`));
    for (const f of result.advisory) {
      out.push(
        pc.dim(`    ${f.ruleId.padEnd(26)} ${f.title}`),
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

function renderFinding(f: Finding, opts: TerminalOptions): string[] {
  const out: string[] = [];
  const mark = CONFIDENCE_MARK[f.confidence];
  const channels = pc.dim(`[${f.channels.join('+')}]`);

  out.push(`  ${mark} ${pc.bold(f.title)} ${channels} ${pc.dim(`${f.ruleId} · ${f.weight}`)}`);
  out.push(`    ${wrap(f.why, 76, '    ')}`);
  out.push(`    ${pc.green('fix')} ${wrap(f.fix, 76, '    ')}`);

  const shown = f.evidence.slice(0, opts.maxEvidence);
  for (const e of shown) {
    out.push(pc.dim(`      ${formatEvidence(e)}`));
  }
  if (f.evidence.length > shown.length) {
    out.push(pc.dim(`      … and ${f.evidence.length - shown.length} more`));
  }

  if (opts.verbose) {
    out.push(pc.dim(`      from ${f.sources.map((s) => `${s.catalogue}:${s.ref}`).join(', ')}`));
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
  const excerpt = e.excerpt ? `  ${e.excerpt}` : '';
  return `${where}${vp}${excerpt}`;
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
  return (
    `  ${pc.dim('slop')}     ${colorScore(result.slopScore)}  ${pc.dim(`${slop} finding${slop === 1 ? '' : 's'} — reads as machine-made`)}\n` +
    `  ${pc.dim('quality')}  ${colorScore(result.qualityScore)}  ${pc.dim(`${qual} finding${qual === 1 ? '' : 's'} — broken regardless of taste`)}`
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

function scoreLine(value: number): string {
  const label = grade(value);
  const num = colorScore(value);
  const bar = meter(value);
  return `  ${pc.bold('redpen')}  ${num}  ${bar}  ${pc.dim(label)}`;
}

function colorScore(value: number): string {
  const s = String(value).padStart(3, ' ');
  if (value >= 90) return pc.green(pc.bold(s));
  if (value >= 75) return pc.yellow(s);
  if (value >= 55) return pc.yellow(pc.bold(s));
  return pc.red(pc.bold(s));
}

function meter(value: number): string {
  const filled = Math.round((value / 100) * 24);
  const bar = '█'.repeat(filled) + pc.dim('░'.repeat(24 - filled));
  if (value >= 90) return pc.green(bar);
  if (value >= 55) return pc.yellow(bar);
  return pc.red(bar);
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
