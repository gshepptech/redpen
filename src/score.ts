import type { Finding, Confidence, Category, Kind } from './types.js';

/**
 * The score.
 *
 * 100 is a clean page. Every finding subtracts its weight, discounted by
 * confidence and by how much evidence backs it, and the total is compressed so
 * that a page with forty small problems does not score below a page with one
 * catastrophic one purely on arithmetic.
 *
 * The number exists to be tracked over time. Its absolute value matters less
 * than whether it moved, which is why `redpen check` gates on a delta against a
 * stored baseline rather than on a fixed grade.
 */

const CONFIDENCE_DISCOUNT: Record<Confidence, number> = {
  confirmed: 1,
  likely: 0.55,
  possible: 0.25,
};

/**
 * Evidence past the first few instances tells you the tell is systemic, not
 * that it is worse. Logarithmic, capped at 2x.
 */
function evidenceMultiplier(count: number): number {
  if (count <= 1) return 1;
  return Math.min(2, 1 + Math.log10(count) / 1.6);
}

export function score(findings: Finding[]): number {
  const scored = findings.filter((f) => !f.advisory);
  if (!scored.length) return 100;

  let penalty = 0;
  for (const f of scored) {
    const instances = new Set(
      f.evidence.map((e) => `${e.location}:${e.line ?? e.selector ?? ''}`),
    ).size;
    penalty += (f.weight / 100) * CONFIDENCE_DISCOUNT[f.confidence] * evidenceMultiplier(instances);
  }

  // Saturating curve: the first few real problems cost the most, and a page
  // cannot fall below 0 no matter how long the list gets.
  const result = 100 * Math.exp(-penalty / 6);
  return Math.round(Math.max(0, Math.min(100, result)));
}

/**
 * Score one kind on its own.
 *
 * "Does it look machine-made" and "is it broken" are different questions, and a
 * single number answers neither — a page can be immaculate taste over a broken
 * form, or flawless mechanics wearing every default in the corpus. Advisory
 * findings are excluded from every score by definition.
 */
export function scoreKind(findings: Finding[], kind: Kind): number {
  return score(findings.filter((f) => f.kind === kind && !f.advisory));
}

export function scoreByCategory(findings: Finding[]): Record<string, number> {
  const groups = new Map<Category, Finding[]>();
  for (const f of findings) {
    const list = groups.get(f.category) ?? [];
    list.push(f);
    groups.set(f.category, list);
  }
  const out: Record<string, number> = {};
  for (const [cat, list] of groups) out[cat] = score(list);
  return out;
}

export interface ScoreContribution {
  ruleId: string;
  title: string;
  kind: Kind;
  /** Points the score would gain if this finding went away, all else equal. */
  worth: number;
  /** Raw penalty units it contributes. */
  penalty: number;
  /**
   * This finding's share of the total penalty, 0-1.
   *
   * The score curve saturates, so on a badly-failing page every single fix is
   * worth a fraction of a point and `worth` ranks nothing. Share stays
   * meaningful at any score: it is what proportion of the problem this is.
   */
  share: number;
  instances: number;
  confidence: Confidence;
}

/**
 * Where the score came from.
 *
 * The number was the one output in this tool with no provenance, which is a
 * strange gap in a tool whose whole design is provenance — and it cost someone
 * a wasted afternoon: four true findings fixed, and the score went *down*,
 * with nothing to explain why. `worth` answers the only question that matters
 * when deciding what to fix next: how many points do I get back for this one.
 */
export function explainScore(findings: Finding[]): {
  score: number;
  ceiling: number;
  contributions: ScoreContribution[];
} {
  const scored = findings.filter((f) => !f.advisory);
  const total = score(scored);

  let totalPenalty = 0;
  for (const f of scored) {
    const n = new Set(f.evidence.map((e) => `${e.location}:${e.line ?? e.selector ?? ''}`)).size;
    totalPenalty += (f.weight / 100) * CONFIDENCE_DISCOUNT[f.confidence] * evidenceMultiplier(n);
  }

  const contributions = scored
    .map((f) => {
      const instances = new Set(
        f.evidence.map((e) => `${e.location}:${e.line ?? e.selector ?? ''}`),
      ).size;
      const penalty =
        (f.weight / 100) * CONFIDENCE_DISCOUNT[f.confidence] * evidenceMultiplier(instances);
      // What the score becomes with this one finding removed. The curve is not
      // linear, so this is measured rather than apportioned.
      const without = score(scored.filter((x) => x.ruleId !== f.ruleId));
      return {
        ruleId: f.ruleId,
        title: f.title,
        kind: f.kind,
        worth: Number((without - total).toFixed(1)),
        penalty: Number(penalty.toFixed(3)),
        share: totalPenalty > 0 ? penalty / totalPenalty : 0,
        instances,
        confidence: f.confidence,
      };
    })
    .sort((a, b) => b.penalty - a.penalty);

  return { score: total, ceiling: 100, contributions };
}

export function grade(value: number): string {
  if (value >= 90) return 'clean';
  if (value >= 75) return 'minor tells';
  if (value >= 55) return 'reads as generated';
  if (value >= 35) return 'heavily templated';
  return 'slop';
}
