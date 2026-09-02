/**
 * Measures over a whole document, rather than patterns inside it.
 *
 * The catalogue redpen draws its prose rules from lists four of these —
 * punctuation distribution, function-word trigram entropy, cross-paragraph
 * burstiness, and type-token ratio. They are a different kind of check: no
 * regex reaches them, because the signal is a property of the document rather
 * than a string in it.
 *
 * Two of the four are not here, and the reason is the same for both: neither
 * means anything without a reference corpus of human prose to compare against,
 * and redpen has none. Punctuation distribution and trigram entropy produce a
 * number with no threshold, and a threshold guessed rather than measured is how
 * a tool starts making confident claims about who wrote something.
 *
 * The two that are here were measured before they were shipped. See
 * `burstiness` for what separated and `MEASURED_AND_REJECTED` for what did not.
 */

/** Markdown furniture is not prose, and counting it measures the syntax. */
function proseOnly(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\s{4,}.*$/gm, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    // Headings, tables, blockquotes and list markers all impose their own
    // length, and a document that is mostly table would be measured as
    // uniform for reasons that have nothing to do with how it was written.
    .replace(/^\s*[|>#].*$/gm, ' ')
    .replace(/^\s*[-*+]\s+.*$/gm, ' ')
    .replace(/[*_#>|]/g, ' ');
}

function sentencesOf(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 3);
}

export interface Burstiness {
  /** Coefficient of variation of sentence length. Lower means more uniform. */
  cv: number;
  sentences: number;
  words: number;
  meanLength: number;
}

/**
 * How much sentence length varies across a document.
 *
 * Measured against 1,113 markdown files from four real repositories. The
 * distribution runs p10 0.38, median 0.53, p90 0.68 — and below 0.35 sit 23
 * documents, of which 18 are machine-written on evidence independent of this
 * measure: twelve code reviews whose own front matter names an AI agent as the
 * reviewer, two agent-generated plan files, three from a documentation
 * generator's evidence directory, and one whose filename is a prompt.
 *
 * The five that are not machine-written are all reference documentation — API
 * pages, a getting-started guide, a table of credential types — where uniform
 * sentence length is the correct register rather than a tell. That is the
 * false-positive class, it is nameable, and it is why this reports as advisory
 * and never as a score.
 */
export function burstiness(text: string): Burstiness | null {
  const p = proseOnly(text);
  const words = p.toLowerCase().match(/\b[a-z']{2,}\b/g) ?? [];
  const sentences = sentencesOf(p);

  // Too little prose to say anything. A short note is uniform because it is
  // short, and reporting that would be measuring length.
  if (words.length < 300 || sentences.length < 12) return null;

  const lengths = sentences.map((s) => s.split(/\s+/).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  if (mean <= 0) return null;
  const variance = lengths.reduce((a, b) => a + (b - mean) ** 2, 0) / lengths.length;

  return {
    cv: Math.sqrt(variance) / mean,
    sentences: sentences.length,
    words: words.length,
    meanLength: mean,
  };
}

/**
 * Type-token ratio, built and rejected.
 *
 * Vocabulary diversity over a fixed 200-word window, so document length does
 * not drive the number. Across the same 1,113 documents it separated nothing:
 * the twelve machine-written code reviews scored 0.58 to 0.63 against a
 * population median of 0.645 and a p25 of 0.597 — inside the ordinary range,
 * and overlapping it on both sides. The most varied document in the sample and
 * one of the most uniform had almost the same ratio.
 *
 * Kept as a function because the measurement is the evidence for not shipping
 * a rule, and deleting it would leave only the assertion.
 */
export const MEASURED_AND_REJECTED = ['type-token-ratio', 'punctuation-distribution', 'function-word-entropy'] as const;

export function typeTokenRatio(text: string, window = 200): number | null {
  const words = proseOnly(text).toLowerCase().match(/\b[a-z']{2,}\b/g) ?? [];
  if (words.length < window * 2) return null;
  const ratios: number[] = [];
  for (let i = 0; i + window <= words.length; i += window) {
    ratios.push(new Set(words.slice(i, i + window)).size / window);
  }
  return ratios.reduce((a, b) => a + b, 0) / ratios.length;
}
