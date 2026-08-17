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

export function grade(value: number): string {
  if (value >= 90) return 'clean';
  if (value >= 75) return 'minor tells';
  if (value >= 55) return 'reads as generated';
  if (value >= 35) return 'heavily templated';
  return 'slop';
}
