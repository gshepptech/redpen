import { readFileSync } from 'node:fs';
import { rulesForChannel } from '../corpus/load.js';
import type { RawFinding, Evidence } from '../types.js';

/**
 * The vision channel: put the screenshot in front of a model and ask the
 * questions no rule can express.
 *
 * The source channel reads text and the render channel reads computed styles.
 * Neither can answer "does the hierarchy read in two seconds" or "is the
 * highlight band sitting at the baseline instead of the x-height" — those are
 * judgements about the rendered image, and hallmark's own gate for the second
 * one literally instructs the model to *imagine* the output. This channel looks
 * instead.
 *
 * Every question is phrased so that "yes" means the tell is present, and each
 * answer carries its own confidence so a hedge doesn't get promoted into a
 * finding. Vision alone never confirms anything: a vision hit corroborates a
 * source or render hit, or it reports as `likely` on its own.
 */

const MODEL = 'claude-opus-5';

/** Answers below this are dropped rather than reported as low-confidence noise. */
const MIN_CONFIDENCE = 0.7;

export interface VisionOptions {
  /** url -> screenshot path, from the render channel. */
  screenshots: Map<string, string>;
  /** Skip rules whose ids are already confirmed — no need to pay for them. */
  alreadyConfirmed?: Set<string>;
}

export interface VisionResult {
  findings: RawFinding[];
  /** Populated when the channel could not run. Never silently returns clean. */
  unavailable: string | null;
  /** Input+output tokens, so `--timing` can report what the pass cost. */
  tokens: number;
}

interface AnthropicModule {
  default: new (opts?: Record<string, unknown>) => AnthropicClient;
}

interface AnthropicClient {
  messages: {
    create(params: Record<string, unknown>): Promise<AnthropicResponse>;
  };
}

interface AnthropicResponse {
  content: Array<{ type: string; text?: string }>;
  stop_reason: string | null;
  usage?: { input_tokens?: number; output_tokens?: number };
}

interface Answer {
  ruleId: string;
  present: boolean;
  confidence: number;
  evidence: string;
}

/**
 * The response schema. Constraining the output means no parsing heuristics and
 * no "the model returned prose this time" failure mode.
 */
function answerSchema(ruleIds: string[]): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      answers: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            ruleId: { type: 'string', enum: ruleIds },
            present: {
              type: 'boolean',
              description: 'True when the tell described by the question is present in the image.',
            },
            confidence: {
              type: 'number',
              description: '0 to 1. Below 0.7 the answer is discarded, so hedge honestly.',
            },
            evidence: {
              type: 'string',
              description:
                'What you actually see that decides it, in one short phrase. Name the element and where it sits.',
            },
          },
          required: ['ruleId', 'present', 'confidence', 'evidence'],
          additionalProperties: false,
        },
      },
    },
    required: ['answers'],
    additionalProperties: false,
  };
}

const SYSTEM = `You judge screenshots of web pages for the visual tells that mark a page as machine-generated.

You are given one screenshot and a numbered list of questions. Answer every question about that image and nothing else.

Rules:
- Answer only from what is visible. Do not infer from what a page like this usually does.
- Each question is phrased so "yes" means the tell IS present. Read the direction carefully.
- Report confidence honestly. A question you cannot decide from this image gets low confidence, not a guess — low-confidence answers are discarded, which is the correct outcome for an unclear case.
- "evidence" names the specific thing you saw. "the three cards under the headline each open with a rounded icon square" — not "it looks AI-generated".`;

async function loadSdk(): Promise<AnthropicModule | null> {
  try {
    // Indirect specifier: the SDK is an optional peer dependency, so a scan
    // without it must still typecheck and run.
    const specifier = '@anthropic-ai/sdk';
    return (await import(specifier)) as unknown as AnthropicModule;
  } catch {
    return null;
  }
}

export async function scanVision(opts: VisionOptions): Promise<VisionResult> {
  const empty: VisionResult = { findings: [], unavailable: null, tokens: 0 };

  if (opts.screenshots.size === 0) {
    return {
      ...empty,
      unavailable:
        'no screenshots captured — the vision channel needs the render channel to run with --screenshots',
    };
  }

  const rules = rulesForChannel('vision').filter(
    (r) => r.vision && !opts.alreadyConfirmed?.has(r.id),
  );
  if (rules.length === 0) return empty;

  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return {
      ...empty,
      unavailable:
        'no Anthropic credentials found — set ANTHROPIC_API_KEY or run `ant auth login` to enable the vision channel',
    };
  }

  const sdk = await loadSdk();
  if (!sdk) {
    return {
      ...empty,
      unavailable:
        '@anthropic-ai/sdk is not installed — run `npm i @anthropic-ai/sdk` to enable the vision channel',
    };
  }

  const client = new sdk.default();
  const ruleIds = rules.map((r) => r.id);
  const schema = answerSchema(ruleIds);

  const questions = rules
    .map((r, i) => `${i + 1}. [${r.id}] ${r.vision!.ask.replace(/\s+/g, ' ').trim()}`)
    .join('\n');

  const hits = new Map<string, Evidence[]>();
  const problems: string[] = [];
  let tokens = 0;

  for (const [url, file] of opts.screenshots) {
    let data: string;
    try {
      data = readFileSync(file).toString('base64');
    } catch (err) {
      problems.push(`could not read ${file}: ${err instanceof Error ? err.message : err}`);
      continue;
    }

    let response: AnthropicResponse;
    try {
      response = await client.messages.create({
        model: MODEL,
        max_tokens: 8000,
        system: SYSTEM,
        output_config: { format: { type: 'json_schema', schema } },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/png', data } },
              { type: 'text', text: `Answer each question about the screenshot above.\n\n${questions}` },
            ],
          },
        ],
      });
    } catch (err) {
      problems.push(`${url}: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }

    tokens += (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);

    // A refusal or a truncated response is a failed observation, not a clean
    // page — say so rather than letting it read as "found nothing".
    if (response.stop_reason === 'refusal') {
      problems.push(`${url}: the model declined to answer`);
      continue;
    }
    if (response.stop_reason === 'max_tokens') {
      problems.push(`${url}: response truncated — some questions went unanswered`);
    }

    const answers = parseAnswers(response, ruleIds);
    if (!answers) {
      problems.push(`${url}: could not read a structured answer from the response`);
      continue;
    }

    for (const a of answers) {
      if (!a.present || a.confidence < MIN_CONFIDENCE) continue;
      const list = hits.get(a.ruleId) ?? [];
      list.push({
        channel: 'vision',
        location: url,
        excerpt: `${a.evidence.slice(0, 140)} (confidence ${a.confidence.toFixed(2)})`,
      });
      hits.set(a.ruleId, list);
    }
  }

  const findings: RawFinding[] = [];
  for (const [ruleId, evidence] of hits) {
    findings.push({ ruleId, channel: 'vision', evidence });
  }

  return {
    findings,
    unavailable: problems.length ? problems.join('; ') : null,
    tokens,
  };
}

function parseAnswers(response: AnthropicResponse, validIds: string[]): Answer[] | null {
  const text = response.content.find((b) => b.type === 'text')?.text;
  if (!text) return null;

  let parsed: { answers?: unknown };
  try {
    parsed = JSON.parse(text) as { answers?: unknown };
  } catch {
    return null;
  }
  if (!Array.isArray(parsed.answers)) return null;

  const valid = new Set(validIds);
  const out: Answer[] = [];
  for (const raw of parsed.answers) {
    const a = raw as Partial<Answer>;
    if (typeof a.ruleId !== 'string' || !valid.has(a.ruleId)) continue;
    if (typeof a.present !== 'boolean') continue;
    out.push({
      ruleId: a.ruleId,
      present: a.present,
      confidence: typeof a.confidence === 'number' ? a.confidence : 0,
      evidence: typeof a.evidence === 'string' ? a.evidence : '',
    });
  }
  return out;
}
