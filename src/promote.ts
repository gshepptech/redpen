import { ruleById } from './corpus/load.js';
import type { RawFinding, Finding, Confidence, Channel, Rule } from './types.js';

/**
 * Cross-channel promotion.
 *
 * This is the step that makes a merged rule set usable rather than merely
 * louder. Concatenating four catalogues doubles the rules and doubles the false
 * positives; the fix is to require agreement.
 *
 *   confirmed — two or more channels saw it independently, or the only channel
 *               that *can* see it saw it and that channel is authoritative
 *   likely    — one channel of several possible saw it, and it is a channel
 *               that reads real state rather than text
 *   possible  — source-only hit on a rule the render channel could also have
 *               caught, meaning the render pass disagreed or never ran
 *
 * The asymmetry matters. A source-only hit for `gradient-text` is weak, because
 * the render channel checks the same thing more reliably and did not confirm
 * it. A source-only hit for `placeholder-name` is strong, because source is the
 * only place that tell exists.
 */

/** Channels that observe real state rather than text, in order of authority. */
const AUTHORITATIVE: ReadonlySet<Channel> = new Set<Channel>(['render', 'fingerprint']);

function confidenceFor(rule: Rule, observed: Set<Channel>): Confidence {
  const possible = new Set(rule.channels);

  if (observed.size >= 2) return 'confirmed';

  const only = [...observed][0]!;

  // The rule can only ever be seen by this one channel, and it saw it.
  const observableChannels = [...possible].filter((c) => c !== 'vision');
  if (observableChannels.length === 1 && observableChannels[0] === only) {
    return 'confirmed';
  }

  if (AUTHORITATIVE.has(only)) {
    // Render found it and source could not have — computed styles, geometry,
    // contrast. Nothing is disagreeing.
    if (!possible.has('source')) return 'confirmed';
    return 'likely';
  }

  // Source-only, on a rule the render channel could have settled.
  //
  // Both ways round this is a lead, and the second way was backwards. If render
  // ran and did not agree, the channels disagree. If render never ran, nothing
  // checked it — which is weaker still, and it was being reported as stronger.
  //
  // Measured on one real app: of eleven source-only findings presented as
  // likely or confirmed, seven were false. The page had `lang="en"`, the nav had
  // `aria-current`, the input was wrapped in its label, the stylesheet had the
  // reduced-motion block. Every one of those is a fact about the rendered page
  // that a regex over .tsx files cannot see, and each of those rules already
  // carries a render check that would have answered it.
  //
  // This rule's own doc comment said `possible` means the render pass
  // "disagreed or never ran". The code said otherwise.
  if (possible.has('render')) {
    return 'possible';
  }

  return 'likely';
}

export interface PromoteOptions {
  /**
   * False when playwright was unavailable.
   *
   * No longer changes any confidence: a source hit on a rule render could have
   * settled is a lead whether render disagreed or never ran. Kept because the
   * report says which of those happened, and the two read very differently to
   * someone deciding whether to act.
   */
  renderRan: boolean;
  /** Rule ids that do not apply on this surface. Dropped before promotion. */
  offSurface?: Set<string>;
  /** Rule ids suppressed by a project-level ignore, with their reasons. */
  ignored?: Map<string, { reason: string; location: string; selector?: string; scopedTo?: string }>;
}

export function promote(raw: RawFinding[], opts: PromoteOptions): {
  findings: Finding[];
  ignored: Finding[];
  unknownRules: string[];
} {
  const byRule = new Map<string, RawFinding[]>();
  const unknownRules: string[] = [];

  for (const f of raw) {
    // A rule that does not hold on this surface never becomes a finding — it is
    // not a low-confidence finding, it is not a finding at all.
    if (opts.offSurface?.has(f.ruleId)) continue;
    if (!ruleById(f.ruleId)) {
      if (!unknownRules.includes(f.ruleId)) unknownRules.push(f.ruleId);
      continue;
    }
    const list = byRule.get(f.ruleId) ?? [];
    list.push(f);
    byRule.set(f.ruleId, list);
  }

  const findings: Finding[] = [];
  const ignored: Finding[] = [];

  for (const [ruleId, group] of byRule) {
    const rule = ruleById(ruleId)!;
    const channels = new Set<Channel>(group.map((g) => g.channel));
    const evidence = group.flatMap((g) => g.evidence);

    const finding: Finding = {
      ruleId,
      title: rule.title,
      category: rule.category,
      kind: rule.kind,
      advisory: rule.advisory ?? false,
      severity: rule.severity,
      weight: rule.weight,
      confidence: confidenceFor(rule, channels),
      channels: [...channels],
      evidence: evidence.slice(0, 16),
      why: rule.why,
      fix: rule.fix,
      sources: rule.sources,
    };

    const suppression = opts.ignored?.get(ruleId);
    if (suppression) {
      // An unscoped ignore silences the rule. A scoped one silences only the
      // matching evidence, so the same rule can stay live elsewhere on the page.
      if (!suppression.selector && !suppression.scopedTo) {
        ignored.push({ ...finding, ignored: suppression });
        continue;
      }
      const kept = finding.evidence.filter((e) => {
        const bySelector = suppression.selector
          ? !(e.selector ?? '').includes(suppression.selector)
          : true;
        const byLocation = suppression.scopedTo ? !e.location.includes(suppression.scopedTo) : true;
        return bySelector && byLocation;
      });
      if (!kept.length) {
        ignored.push({ ...finding, ignored: suppression });
        continue;
      }
      findings.push({ ...finding, evidence: kept });
      continue;
    }
    findings.push(finding);
  }

  findings.sort(rank);
  ignored.sort(rank);

  return { findings, ignored, unknownRules };
}

const CONFIDENCE_ORDER: Record<Confidence, number> = {
  confirmed: 0,
  likely: 1,
  possible: 2,
};

/**
 * Order by confidence first, then by measured weight. Deliberately *not* by
 * severity — severity is one catalogue author's opinion, weight is how often
 * humans actually name the tell.
 */
function rank(a: Finding, b: Finding): number {
  const byConfidence = CONFIDENCE_ORDER[a.confidence] - CONFIDENCE_ORDER[b.confidence];
  if (byConfidence !== 0) return byConfidence;
  return b.weight - a.weight;
}

export function meetsThreshold(f: Finding, min: Confidence): boolean {
  return CONFIDENCE_ORDER[f.confidence] <= CONFIDENCE_ORDER[min];
}
