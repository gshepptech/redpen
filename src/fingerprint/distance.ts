import type { Fingerprint, FingerprintClash, RawFinding, Evidence } from '../types.js';

/**
 * Sameness scoring.
 *
 * The weights below encode the one claim this feature rests on: readers
 * register *structure*, not palette. Two pages with the same skeleton and
 * different colours read as the same page; two pages with the same colours and
 * different skeletons do not. So macrostructure and section rhythm dominate,
 * and palette is worth almost nothing on its own.
 */

const WEIGHTS = {
  macrostructure: 0.3,
  sectionRhythm: 0.34,
  hero: 0.14,
  nav: 0.06,
  typeScale: 0.1,
  palette: 0.06,
} as const;

/** Below this, two pages are the same page. Tuned against the test fixtures. */
export const CLASH_THRESHOLD = 0.28;

/** Ordered-sequence similarity, normalised 0-1. Levenshtein over section kinds. */
function rhythmDistance(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[] = new Array(rows * cols).fill(0);

  for (let i = 0; i < rows; i++) d[i * cols] = i;
  for (let j = 0; j < cols; j++) d[j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      // Card grids of different column counts are near-misses, not matches.
      const ai = a[i - 1]!;
      const bj = b[j - 1]!;
      let cost = 1;
      if (ai === bj) cost = 0;
      else if (family(ai) === family(bj)) cost = 0.4;

      d[i * cols + j] = Math.min(
        d[(i - 1) * cols + j]! + 1,
        d[i * cols + (j - 1)]! + 1,
        d[(i - 1) * cols + (j - 1)]! + cost,
      );
    }
  }

  return d[rows * cols - 1]! / Math.max(a.length, b.length);
}

function family(kind: string): string {
  if (kind.startsWith('card-grid')) return 'card-grid';
  if (kind.startsWith('hero')) return 'hero';
  return kind;
}

function scaleDistance(a: number[], b: number[]): number {
  if (!a.length || !b.length) return 1;
  const setA = new Set(a);
  const setB = new Set(b);
  let shared = 0;
  for (const v of setA) if (setB.has(v)) shared++;
  const union = new Set([...setA, ...setB]).size;
  return 1 - shared / union;
}

function hueDistance(a: number | null, b: number | null): number {
  if (a === null || b === null) return a === b ? 0 : 1;
  const raw = Math.abs(a - b);
  const circular = Math.min(raw, 360 - raw);
  // 40 degrees apart is a different colour decision; beyond that adds nothing.
  return Math.min(circular / 40, 1);
}

export function distance(a: Fingerprint, b: Fingerprint): number {
  return (
    WEIGHTS.macrostructure * (a.macrostructure === b.macrostructure ? 0 : 1) +
    WEIGHTS.sectionRhythm * rhythmDistance(a.sectionRhythm, b.sectionRhythm) +
    WEIGHTS.hero * (a.hero === b.hero ? 0 : 1) +
    WEIGHTS.nav * (a.nav === b.nav ? 0 : 1) +
    WEIGHTS.typeScale * scaleDistance(a.typeScale, b.typeScale) +
    WEIGHTS.palette * hueDistance(a.paletteAnchor, b.paletteAnchor)
  );
}

function sharedDimensions(a: Fingerprint, b: Fingerprint): string[] {
  const shared: string[] = [];
  if (a.macrostructure === b.macrostructure) shared.push(`macrostructure (${a.macrostructure})`);
  if (rhythmDistance(a.sectionRhythm, b.sectionRhythm) < 0.2) {
    shared.push(`section rhythm (${a.sectionRhythm.join(' → ')})`);
  }
  if (a.hero === b.hero) shared.push(`hero (${a.hero})`);
  if (a.nav === b.nav) shared.push(`nav (${a.nav})`);
  if (scaleDistance(a.typeScale, b.typeScale) < 0.2) shared.push('type scale');
  if (hueDistance(a.paletteAnchor, b.paletteAnchor) < 0.25) shared.push('palette anchor');
  return shared;
}

/** The archetype every generated page converges on. */
const TEMPLATE_RHYTHM = ['nav', 'hero-full', 'card-grid-3', 'cta', 'footer'];

export function findClashes(prints: Fingerprint[]): FingerprintClash[] {
  const clashes: FingerprintClash[] = [];
  for (let i = 0; i < prints.length; i++) {
    for (let j = i + 1; j < prints.length; j++) {
      const a = prints[i]!;
      const b = prints[j]!;
      const d = distance(a, b);
      if (d < CLASH_THRESHOLD) {
        clashes.push({
          page: a.page,
          against: b.page,
          distance: Number(d.toFixed(3)),
          sharedDimensions: sharedDimensions(a, b),
        });
      }
    }
  }
  return clashes.sort((x, y) => x.distance - y.distance);
}

/**
 * Turn clashes and archetype matches into findings so they flow through the
 * same report, score, and gate as everything else.
 */
export function fingerprintFindings(
  prints: Fingerprint[],
  clashes: FingerprintClash[],
): RawFinding[] {
  const findings: RawFinding[] = [];

  if (clashes.length) {
    findings.push({
      ruleId: 'repeated-macrostructure',
      channel: 'fingerprint',
      evidence: clashes.slice(0, 8).map<Evidence>((c) => ({
        channel: 'fingerprint',
        location: c.page,
        excerpt: `matches ${c.against} (distance ${c.distance}) — shares ${c.sharedDimensions.join(', ')}`,
      })),
    });
  }

  const templated = prints.filter(
    (p) => rhythmDistance(p.sectionRhythm, TEMPLATE_RHYTHM) < 0.25,
  );
  if (templated.length) {
    findings.push({
      ruleId: 'template-archetype',
      channel: 'fingerprint',
      evidence: templated.map<Evidence>((p) => ({
        channel: 'fingerprint',
        location: p.page,
        excerpt: `nav → hero → 3-card grid → CTA → footer (${p.sectionRhythm.join(' → ')})`,
      })),
    });
  }

  // The remaining sameness rules need a corpus, not a pair.
  if (prints.length >= 3) {
    const vocab = new Set(prints.flatMap((p) => p.sectionRhythm.map(family)));
    vocab.delete('nav');
    vocab.delete('footer');
    if (vocab.size <= 3) {
      findings.push({
        ruleId: 'single-section-vocabulary',
        channel: 'fingerprint',
        evidence: [
          {
            channel: 'fingerprint',
            location: `${prints.length} pages`,
            excerpt: `every page built from only: ${[...vocab].join(', ')}`,
          },
        ],
      });
    }

    const scaleKeys = new Set(prints.map((p) => p.typeScale.join(',')));
    const familyKeys = new Set(prints.map((p) => p.families.join(',')));
    if (scaleKeys.size === 1 && familyKeys.size === 1 && prints.length >= 3) {
      findings.push({
        ruleId: 'uniform-type-scale-across-pages',
        channel: 'fingerprint',
        evidence: [
          {
            channel: 'fingerprint',
            location: `${prints.length} pages`,
            excerpt: `identical scale ${prints[0]!.typeScale.join('/')} and identical families on every page`,
          },
        ],
      });
    }

    const hues = prints.map((p) => p.paletteAnchor).filter((h): h is number => h !== null);
    if (hues.length === prints.length && new Set(hues).size === 1) {
      findings.push({
        ruleId: 'palette-monoculture',
        channel: 'fingerprint',
        evidence: [
          {
            channel: 'fingerprint',
            location: `${prints.length} pages`,
            excerpt: `every page anchored to hue ${hues[0]}`,
          },
        ],
      });
    }
  }

  return findings;
}
