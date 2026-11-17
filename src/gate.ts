import { ruleIds } from './scan.js';
import type { Baseline } from './config.js';
import type { Finding } from './types.js';

export interface AxisDrop {
  axis: 'slop' | 'quality';
  was: number;
  now: number;
  drop: number;
}

export interface GateRun {
  slop: number;
  quality: number;
  channelsRun: string[];
  findings: Finding[];
}

/**
 * `notes` are non-fatal: things the caller should say out loud but which do not
 * change the verdict. They ride along on every status.
 */
export type GateResult =
  | { status: 'incomparable'; reason: 'missing-channels'; missing: string[]; had: string[]; ran: string[]; notes: string[] }
  | { status: 'incomparable'; reason: 'pre-two-axis'; notes: string[] }
  | { status: 'regressed'; drops: AxisDrop[]; introduced: string[]; notes: string[] }
  | { status: 'holding'; slop: number; quality: number; notes: string[] };

/**
 * Decide whether a run holds the bar its baseline set.
 *
 * Pure by design. The gate is the one part of redpen that can block someone's
 * work, and a comparator that reaches for the filesystem or exits the process
 * is a comparator nobody can check.
 */
export function compareToBaseline(
  baseline: Baseline,
  run: GateRun,
  tolerance: number,
): GateResult {
  const notes: string[] = [];

  // A check that ran fewer channels than the baseline did sees fewer findings
  // and therefore a *higher* score, so it passes for having looked at less.
  // That is the one failure a gate must never have.
  const ran = new Set(run.channelsRun);
  if (baseline.channels) {
    const missing = baseline.channels.filter((c) => !ran.has(c));
    if (missing.length) {
      return {
        status: 'incomparable',
        reason: 'missing-channels',
        missing,
        had: baseline.channels,
        ran: run.channelsRun,
        notes,
      };
    }
  } else {
    notes.push('this baseline predates channel recording, so a partial run cannot be detected');
  }

  // A baseline without the two axes stores `score` as the union of both rather
  // than the worse of them. The two numbers are not the same quantity, so
  // comparing them would gate on arithmetic rather than on the page.
  if (baseline.slop === undefined || baseline.quality === undefined) {
    return { status: 'incomparable', reason: 'pre-two-axis', notes };
  }

  // Gate on each axis, not on the headline. The headline is the worse of the
  // two, so a page that regresses on its healthier axis moves the headline not
  // at all, and a gate that cannot see a regression is not a gate.
  const drops: AxisDrop[] = (
    [
      { axis: 'slop' as const, was: baseline.slop, now: run.slop },
      { axis: 'quality' as const, was: baseline.quality, now: run.quality },
    ]
  )
    .map((a) => ({ ...a, drop: a.was - a.now }))
    .filter((a) => a.drop > tolerance);

  // `possible` findings are the ones a channel checked and did not corroborate.
  // They cost nothing against the score, so they must not fail the gate either.
  const known = new Set(baseline.knownRules);
  const introduced = ruleIds(run.findings.filter((f) => f.confidence !== 'possible')).filter(
    (id) => !known.has(id),
  );

  if (drops.length || introduced.length) {
    return { status: 'regressed', drops, introduced, notes };
  }

  return { status: 'holding', slop: run.slop, quality: run.quality, notes };
}
