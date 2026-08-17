import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { rulesForChannel } from '../corpus/load.js';
import type { RawFinding, Evidence } from '../types.js';

/**
 * The vision channel.
 *
 * Source reads text, render reads computed styles. Neither can answer "does the
 * hierarchy read in two seconds" or "is the highlight band sitting at the
 * baseline instead of the x-height" — those are judgements about the rendered
 * image, and hallmark's own gate for the second one literally instructs the
 * model to *imagine* the output.
 *
 * redpen does not call a model to answer them. Whatever is running redpen —
 * Claude Code, Cursor, a person — can already open a PNG, and it is a better
 * judge than any model redpen would pick on your behalf. So this channel emits
 * a brief (screenshots + questions) and consumes answers. No API key, no second
 * bill, no credential setup, and it works identically in every harness.
 *
 * Every question is phrased so "yes" means the tell is present, and every answer
 * carries a confidence so a hedge doesn't get promoted into a finding. A vision
 * hit never confirms a finding alone — it corroborates another channel, or
 * reports as `likely` on its own.
 */

/** Answers below this are discarded rather than reported as low-confidence noise. */
export const MIN_CONFIDENCE = 0.7;

export interface VisionQuestion {
  ruleId: string;
  /** Yes means the tell is present. */
  ask: string;
  /** What to do about it if the answer is yes. Copied from the rule. */
  fix: string;
}

export interface VisionBrief {
  version: 1;
  /** How to answer, in the file itself — the reader may not have the docs open. */
  instructions: string;
  /** url -> screenshot path on disk. */
  screenshots: Record<string, string>;
  questions: VisionQuestion[];
  /** Pre-filled skeleton so answering is editing, not authoring. */
  answers: VisionAnswer[];
}

export interface VisionAnswer {
  page: string;
  ruleId: string;
  /** True when the tell described by the question is visible in that screenshot. */
  present: boolean | null;
  /** 0-1. Below 0.7 the answer is discarded, so hedge honestly. */
  confidence: number;
  /** What you actually saw that decided it. Names the element and where it sits. */
  evidence: string;
}

const INSTRUCTIONS = [
  'Open each screenshot listed under "screenshots" and answer every question in "questions" about it.',
  'Fill in the pre-built rows in "answers" — one row per page/question pair.',
  'Each question is phrased so present=true means the tell IS present. Read the direction carefully.',
  'Answer only from what is visible. Do not infer from what a page like this usually does.',
  'Set confidence honestly: a question you cannot decide from the image gets a low number, not a guess.',
  'Answers below 0.7 confidence are discarded, which is the correct outcome for an unclear case.',
  'evidence names the specific thing you saw — "the three cards each open with a rounded icon square", not "looks AI-generated".',
  'Leave present as null for anything you did not judge; null rows are ignored.',
  'Then run: redpen scan <path> --url <url> --answers <this file>',
].join(' ');

export interface BriefOptions {
  /** url -> screenshot path, from the render channel. */
  screenshots: Map<string, string>;
  /** Rules two channels already agree on — no point asking about them. */
  alreadyConfirmed?: Set<string>;
}

/**
 * Build the brief. Returns null when there is nothing to ask, which is a
 * legitimate outcome and not a failure.
 */
export function buildBrief(opts: BriefOptions): VisionBrief | null {
  if (opts.screenshots.size === 0) return null;

  const rules = rulesForChannel('vision').filter(
    (r) => r.vision && !opts.alreadyConfirmed?.has(r.id),
  );
  if (rules.length === 0) return null;

  const questions: VisionQuestion[] = rules.map((r) => ({
    ruleId: r.id,
    ask: r.vision!.ask.replace(/\s+/g, ' ').trim(),
    fix: r.fix.replace(/\s+/g, ' ').trim(),
  }));

  const screenshots: Record<string, string> = {};
  for (const [url, file] of opts.screenshots) screenshots[url] = file;

  const answers: VisionAnswer[] = [];
  for (const page of opts.screenshots.keys()) {
    for (const q of questions) {
      answers.push({ page, ruleId: q.ruleId, present: null, confidence: 0, evidence: '' });
    }
  }

  return { version: 1, instructions: INSTRUCTIONS, screenshots, questions, answers };
}

export function writeBrief(path: string, brief: VisionBrief): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(brief, null, 2) + '\n', 'utf8');
}

export interface AnswerResult {
  findings: RawFinding[];
  /** Answers that were parsed but discarded, and why. Surfaced as warnings. */
  discarded: string[];
  /** Set when the file could not be used at all. Never silently returns clean. */
  unavailable: string | null;
  /** Answers actually acted on, for the progress line. */
  accepted: number;
}

/**
 * Read answers back and turn the affirmative, confident ones into findings.
 *
 * Deliberately strict: an unparseable file, an unknown rule id, or a malformed
 * row is reported rather than skipped, because a vision pass that quietly
 * dropped half its answers is indistinguishable from a page with fewer problems.
 */
export function readAnswers(path: string): AnswerResult {
  const empty: AnswerResult = { findings: [], discarded: [], unavailable: null, accepted: 0 };

  let raw: string;
  try {
    raw = readFileSync(path, 'utf8');
  } catch (err) {
    return { ...empty, unavailable: `could not read ${path}: ${err instanceof Error ? err.message : err}` };
  }

  let parsed: { answers?: unknown };
  try {
    parsed = JSON.parse(raw) as { answers?: unknown };
  } catch (err) {
    return { ...empty, unavailable: `${path} is not valid JSON — ${err instanceof Error ? err.message : err}` };
  }

  if (!Array.isArray(parsed.answers)) {
    return { ...empty, unavailable: `${path} has no "answers" array` };
  }

  const known = new Set(rulesForChannel('vision').map((r) => r.id));
  const hits = new Map<string, Evidence[]>();
  const discarded: string[] = [];
  let accepted = 0;

  for (const row of parsed.answers) {
    const a = row as Partial<VisionAnswer>;

    // Unanswered rows are the expected state for anything not judged.
    if (a.present === null || a.present === undefined) continue;

    if (typeof a.ruleId !== 'string' || !known.has(a.ruleId)) {
      discarded.push(`unknown rule id "${String(a.ruleId)}"`);
      continue;
    }
    if (typeof a.present !== 'boolean') {
      discarded.push(`${a.ruleId}: "present" must be true, false, or null`);
      continue;
    }
    if (!a.present) continue;

    const confidence = typeof a.confidence === 'number' ? a.confidence : 0;
    if (confidence < MIN_CONFIDENCE) {
      discarded.push(`${a.ruleId}: confidence ${confidence} below the ${MIN_CONFIDENCE} floor`);
      continue;
    }

    const evidence = typeof a.evidence === 'string' ? a.evidence.trim() : '';
    if (!evidence) {
      discarded.push(`${a.ruleId}: answered present with no evidence — an unevidenced yes is a guess`);
      continue;
    }

    accepted++;
    const list = hits.get(a.ruleId) ?? [];
    list.push({
      channel: 'vision',
      location: typeof a.page === 'string' ? a.page : 'screenshot',
      excerpt: `${evidence.slice(0, 140)} (confidence ${confidence.toFixed(2)})`,
    });
    hits.set(a.ruleId, list);
  }

  const findings: RawFinding[] = [];
  for (const [ruleId, evidence] of hits) {
    findings.push({ ruleId, channel: 'vision', evidence });
  }

  return { findings, discarded, unavailable: null, accepted };
}
