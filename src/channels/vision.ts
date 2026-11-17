import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { rulesForChannel } from '../corpus/load.js';
import type { RawFinding, Evidence } from '../types.js';

/**
 * The vision channel.
 *
 * Source reads text, render reads computed styles. Neither can answer "does the
 * hierarchy read in two seconds" or "is the highlight band sitting at the
 * baseline instead of the x-height". Those are judgements about the rendered
 * image, and hallmark's own gate for the second one literally instructs the
 * model to *imagine* the output.
 *
 * redpen does not call a model to answer them. Whatever is running redpen
 * (Claude Code, Cursor, a person) can already open a PNG, and it is a better
 * judge than any model redpen would pick on your behalf. So this channel emits
 * a brief (screenshots + questions) and consumes answers. No API key, no second
 * bill, no credential setup, and it works identically in every harness.
 *
 * Every question is phrased so "yes" means the tell is present, and every answer
 * carries a confidence so a hedge doesn't get promoted into a finding. A vision
 * hit never confirms a finding alone: it corroborates another channel, or
 * reports as `likely` on its own.
 */

/** Answers below this are discarded rather than reported as low-confidence noise. */
export const MIN_CONFIDENCE = 0.7;

export interface VisionQuestion {
  /**
   * An opaque handle (q1, q2, …), deliberately not the rule id.
   *
   * `no-focal-point` and `nothing-memorable` are not neutral labels: they state
   * the answer the author expects, and a reader who sees them is being led. The
   * rule each question belongs to is recorded in `key`, which the answerer has
   * no reason to open.
   */
  id: string;
  /** Yes means the tell is present. */
  ask: string;
}

export interface VisionContext {
  /** What the product is, in the author's own words. */
  product: string;
  /** Who uses it and what for. */
  audience: string;
  /** url -> what the visitor is doing there. */
  surface: Record<string, string>;
}

export interface VisionBrief {
  version: 2;
  /** How to answer, in the file itself; the reader may not have the docs open. */
  instructions: string;
  /**
   * What a reader needs to judge the page without having seen the project.
   *
   * The point of this file is that it can be handed to someone who was not
   * there. Half these questions are unanswerable without knowing what the thing
   * is ("could this hold a different product's content" means nothing if you
   * do not know what this product's content is), and the person who built the
   * page is the worst possible judge of them, because they cannot unsee it.
   */
  context: VisionContext;
  /** url -> screenshot path on disk. */
  screenshots: Record<string, string>;
  questions: VisionQuestion[];
  /** Pre-filled skeleton so answering is editing, not authoring. */
  answers: VisionAnswer[];
  /**
   * question id -> rule id. Not needed to answer, and reading it first is the
   * one way to bias yourself. redpen uses it when folding the answers back in.
   */
  key: Record<string, string>;
}

export interface VisionAnswer {
  page: string;
  /** The question's opaque id, matching `questions[].id`. */
  question: string;
  /** True when the thing the question describes is visible in that screenshot. */
  present: boolean | null;
  /** 0-1. Below 0.7 the answer is discarded, so hedge honestly. */
  confidence: number;
  /** What you actually saw that decided it. Names the element and where it sits. */
  evidence: string;
}

const INSTRUCTIONS = [
  'ANSWER ONLY FROM THE SCREENSHOTS. If you built these pages, stop and get someone who did not — you cannot unsee your own intent, and half these questions are about the impression a page makes on someone meeting it for the first time.',
  'You are being asked to look at some screenshots and say what you see. You are not expected to know this project, and you should not go and read it — the value of this file is that it can be answered by someone who was not there.',
  'Read "context" first: it says what the product is and what each page is for. Then open each file in "screenshots".',
  'Answer every row in "answers". Each row names a page and a question id; look up the question in "questions" by that id.',
  'present=true means the thing the question describes IS there. Read the direction of each question carefully — some are phrased as absences.',
  'Answer only from what is visible in the image. Do not infer from what a page like this usually does, and do not open the source.',
  'Set confidence honestly. A question you cannot decide from the image gets a low number, not a guess; answers under 0.7 are discarded, which is the right outcome for an unclear case.',
  'evidence names the specific thing you saw — "the three cards each open with a rounded icon square" — not "it looks AI-generated".',
  'A confident "no" counts. It records that the question was asked and cleared.',
  'Leave present as null for anything you did not judge. Null rows are ignored and are not an error.',
  'Do not read "key" before answering. It maps questions to the rules behind them, and knowing which rule you are answering is the one thing that will bias you.',
  'When done: redpen scan <path> --url <url> --answers <this file>',
].join(' ');

export interface BriefOptions {
  /** url -> screenshot path, from the render channel. */
  screenshots: Map<string, string>;
  /** Rules two channels already agree on; no point asking about them. */
  alreadyConfirmed?: Set<string>;
  /** url -> detected or declared surface, for the context block. */
  surfaces?: Record<string, { surface: string }>;
  /** What the project says it is. Empty strings prompt the reader to fill them. */
  product?: { name?: string; purpose?: string; audience?: string };
}

/** What the visitor is doing, said in a sentence rather than a keyword. */
const SURFACE_PROSE: Record<string, string> = {
  persuade: 'the visitor is deciding whether to act — this is a page that has to earn attention',
  operate: 'the visitor is completing a task — this is a tool, and being unremarkable is allowed',
  read: 'the visitor is trying to understand something — this is a page to be read',
};

/**
 * Deterministic shuffle.
 *
 * Questions arrive grouped by rule file, so a reader sees six typography
 * questions in a row and starts answering the category rather than the image.
 * Ordering by a hash of the question id breaks the grouping without making two
 * runs of the same brief disagree.
 */
function scatter<T>(items: T[], keyOf: (item: T) => string): T[] {
  const hash = (s: string): number => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  return [...items].sort((a, b) => hash(keyOf(a)) - hash(keyOf(b)));
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

  // Scatter before numbering, so q1..qN carry no category ordering either.
  const scattered = scatter(rules, (r) => r.id);
  const key: Record<string, string> = {};
  const questions: VisionQuestion[] = scattered.map((r, i) => {
    const id = `q${i + 1}`;
    key[id] = r.id;
    // `fix` is left out on purpose: it states what a "yes" would mean you must
    // change, which is the answer key printed next to the question.
    return { id, ask: r.vision!.ask.replace(/\s+/g, ' ').trim() };
  });

  const screenshots: Record<string, string> = {};
  for (const [url, file] of opts.screenshots) screenshots[url] = file;

  const surface: Record<string, string> = {};
  for (const url of opts.screenshots.keys()) {
    const s = opts.surfaces?.[url]?.surface;
    surface[url] = s
      ? SURFACE_PROSE[s] ?? s
      : 'not established — judge it as you find it';
  }

  const context: VisionContext = {
    product: opts.product?.name
      ? `${opts.product.name}${opts.product.purpose ? ` — ${opts.product.purpose}` : ''}`
      : 'NOT DECLARED. Set "product" in .redpen/config.json. Several questions below cannot be answered fairly without it; leave those null rather than guessing.',
    audience: opts.product?.audience || 'NOT DECLARED. Set "product.audience" in .redpen/config.json.',
    surface,
  };

  const answers: VisionAnswer[] = [];
  for (const page of opts.screenshots.keys()) {
    for (const q of questions) {
      answers.push({ page, question: q.id, present: null, confidence: 0, evidence: '' });
    }
  }

  return { version: 2, instructions: INSTRUCTIONS, context, screenshots, questions, answers, key };
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
  /** Answers that produced a finding. */
  accepted: number;
  /**
   * Questions answered "no, I looked, it is not there" with confidence.
   *
   * These matter as much as the yeses. Without them a fully answered pass is
   * indistinguishable from one where nobody opened a screenshot, which undoes
   * the whole reason redpen refuses to let a channel fail silently.
   */
  cleared: number;
  /** Every rule the reader actually judged, present or not. */
  checked: string[];
}

/**
 * Read answers back and turn the affirmative, confident ones into findings.
 *
 * Deliberately strict: an unparseable file, an unknown rule id, or a malformed
 * row is reported rather than skipped, because a vision pass that quietly
 * dropped half its answers is indistinguishable from a page with fewer problems.
 */
export function readAnswers(path: string): AnswerResult {
  const empty: AnswerResult = {
    findings: [], discarded: [], unavailable: null, accepted: 0, cleared: 0, checked: [],
  };

  let raw: string;
  try {
    raw = readFileSync(path, 'utf8');
  } catch (err) {
    return { ...empty, unavailable: `could not read ${path}: ${err instanceof Error ? err.message : err}` };
  }

  let parsed: { answers?: unknown; key?: unknown };
  try {
    parsed = JSON.parse(raw) as { answers?: unknown; key?: unknown };
  } catch (err) {
    return { ...empty, unavailable: `${path} is not valid JSON — ${err instanceof Error ? err.message : err}` };
  }

  if (!Array.isArray(parsed.answers)) {
    return { ...empty, unavailable: `${path} has no "answers" array` };
  }
  if (!parsed.key || typeof parsed.key !== 'object') {
    return {
      ...empty,
      unavailable: `${path} has no "key" — it maps question ids back to rules, and without it the answers cannot be attributed. Regenerate the brief with --vision.`,
    };
  }

  const key = parsed.key as Record<string, string>;
  const known = new Set(rulesForChannel('vision').map((r) => r.id));
  const hits = new Map<string, Evidence[]>();
  const discarded: string[] = [];
  const checked = new Set<string>();
  let accepted = 0;
  let cleared = 0;

  for (const row of parsed.answers) {
    const a = row as Partial<VisionAnswer>;
    const answered = a.present !== null && a.present !== undefined;

    // Resolve the opaque question id through the brief's own key. A row naming
    // a question the brief never asked is worth saying out loud rather than
    // silently doing nothing.
    const ruleId = typeof a.question === 'string' ? key[a.question] : undefined;
    if (!ruleId || !known.has(ruleId)) {
      if (answered) {
        discarded.push(
          `question "${String(a.question)}" is not in this brief's key — the answers may belong to an older brief`,
        );
      }
      continue;
    }

    if (!answered) continue;

    if (typeof a.present !== 'boolean') {
      discarded.push(`${a.question}: "present" must be true, false, or null`);
      continue;
    }

    const confidence = typeof a.confidence === 'number' ? a.confidence : 0;
    if (confidence < MIN_CONFIDENCE) {
      discarded.push(`${a.question} (${ruleId}): confidence ${confidence} below the ${MIN_CONFIDENCE} floor`);
      continue;
    }

    // A confident "no, I looked, it is not there" is a result. It clears the
    // rule and proves the pass happened.
    checked.add(ruleId);
    if (!a.present) {
      cleared++;
      continue;
    }

    const evidence = typeof a.evidence === 'string' ? a.evidence.trim() : '';
    if (!evidence) {
      discarded.push(`${a.question} (${ruleId}): answered present with no evidence — an unevidenced yes is a guess`);
      continue;
    }

    accepted++;
    const list = hits.get(ruleId) ?? [];
    list.push({
      channel: 'vision',
      location: typeof a.page === 'string' ? a.page : 'screenshot',
      excerpt: `${evidence.slice(0, 140)} (confidence ${confidence.toFixed(2)})`,
    });
    hits.set(ruleId, list);
  }

  const findings: RawFinding[] = [];
  for (const [ruleId, evidence] of hits) {
    findings.push({ ruleId, channel: 'vision', evidence });
  }

  return { findings, discarded, unavailable: null, accepted, cleared, checked: [...checked] };
}
