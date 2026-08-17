/**
 * The unified vocabulary. Every rule from every upstream catalogue is normalised
 * into `Rule`; every hit from every channel is normalised into `RawFinding`;
 * cross-channel promotion turns those into `Finding`.
 *
 * The whole product rests on one idea: a tell observed in the source and again
 * in the rendered page is a fact, and a tell observed in only one of them is a
 * guess. The types below exist to keep that distinction unloseable.
 */

export type Category =
  | 'color'
  | 'typography'
  | 'layout'
  | 'depth'
  | 'motion'
  | 'iconography'
  | 'copy'
  | 'usability'
  | 'a11y'
  | 'sameness';

export type Channel = 'source' | 'render' | 'vision' | 'fingerprint';

/** Author-declared importance, before evidence weighting. */
export type Severity = 'critical' | 'high' | 'medium' | 'low';

/** How sure we are after cross-channel promotion. */
export type Confidence = 'confirmed' | 'likely' | 'possible';

/**
 * Provenance for a merged rule. Keeping this per-rule is what lets `redpen why`
 * answer "who says so" — and what keeps the NOTICE file honest.
 */
export interface Provenance {
  /** One of: impeccable | hallmark | unslop-ui | frontend-design-audit | redpen */
  catalogue: string;
  /** The upstream identifier, verbatim where one exists. */
  ref: string;
}

/** Source-channel matcher: regex over text with optional same-line suppression. */
export interface SourceMatcher {
  /** Regex sources, applied case-insensitively unless the pattern opts out. */
  patterns: string[];
  /** A same-line match here cancels the hit. Kills the common false positives. */
  suppress?: string;
  /** Restrict to these file extensions. Defaults to all scanned extensions. */
  extensions?: string[];
  /**
   * Minimum distinct lines that must match before the rule reports. Tells like
   * "rounded corners everywhere" are only tells in aggregate — one pill button
   * is a decision, thirty is a default.
   */
  minHits?: number;
}

/**
 * Render-channel matcher. `check` names a detector implemented in
 * src/channels/detectors.ts and runs against computed styles in a real browser,
 * so it sees the same page a person does — including anything a build step,
 * a CSS-in-JS runtime, or a fetch produced after hydration.
 */
export interface RenderMatcher {
  check: string;
  params?: Record<string, unknown>;
  /** Minimum distinct elements before reporting. Same aggregate logic as source. */
  minHits?: number;
}

/** Vision-channel matcher: a question put to a model looking at the screenshot. */
export interface VisionMatcher {
  /** The yes/no question. "Yes" means the tell is present. */
  ask: string;
  /** What the model should look at. Full page unless a selector narrows it. */
  region?: string;
}

export interface Rule {
  id: string;
  title: string;
  category: Category;
  severity: Severity;
  /** Upstream catalogues this rule was merged from. Never empty. */
  sources: Provenance[];
  /**
   * 0-100. Derived from the vibecoded-design-tells Reddit study where that
   * study measured the tell (see corpus/weights.ts), otherwise assigned by
   * category default. This is the number that orders the report — not severity,
   * which is only an author's opinion.
   */
  weight: number;
  /**
   * Rank in the comment-level ranking of the Reddit study, 1 = most named.
   * Null when the tell was never measured against real human complaints.
   */
  evidenceRank: number | null;
  /** Which channels can observe this rule at all. */
  channels: Channel[];
  source?: SourceMatcher;
  render?: RenderMatcher;
  vision?: VisionMatcher;
  /** Why it reads as machine-made. One or two sentences, shown in the report. */
  why: string;
  /** What to do instead. Concrete — a value, a property, a structural move. */
  fix: string;
  /**
   * Contexts where the pattern is a legitimate choice and the rule should not
   * fire. Populated from hallmark's genre notes.
   */
  exceptSurfaces?: string[];
}

/** Where a channel saw something. */
export interface Evidence {
  channel: Channel;
  /** Repo-relative path, or the route URL for render/vision hits. */
  location: string;
  /** 1-indexed line, for source hits. */
  line?: number;
  /** CSS selector path, for render hits. */
  selector?: string;
  /** Viewport width in px, for render hits. */
  viewport?: number;
  /** The matched text or the offending computed value. Trimmed to 160 chars. */
  excerpt?: string;
}

/** One channel's unpromoted observation. */
export interface RawFinding {
  ruleId: string;
  channel: Channel;
  evidence: Evidence[];
}

/** A promoted, reportable finding. */
export interface Finding {
  ruleId: string;
  title: string;
  category: Category;
  severity: Severity;
  weight: number;
  confidence: Confidence;
  /** Which channels independently saw it. Length >= 2 means `confirmed`. */
  channels: Channel[];
  evidence: Evidence[];
  why: string;
  fix: string;
  sources: Provenance[];
  /** Set when a redpen-ignore directive suppressed this finding. */
  ignored?: { reason: string; location: string };
}

/** A page's structural signature, for sameness detection across a repo. */
export interface Fingerprint {
  /** Stable id for the page — route path or repo-relative file path. */
  page: string;
  /** ISO date, so a report can say how stale a record is. */
  recordedAt: string;
  /** Named skeleton: hero-3col-cta, stat-led, long-document, ... */
  macrostructure: string;
  /** Ordered section kinds top to bottom. The strongest sameness signal. */
  sectionRhythm: string[];
  /** Distinct font sizes in px, ascending. */
  typeScale: number[];
  /** Font families in use, deduped and lowercased. */
  families: string[];
  /** OKLCH hue of the dominant non-neutral colour, 0-360, or null if monochrome. */
  paletteAnchor: number | null;
  /** Named nav treatment: wordmark-links, floating-pill, side-rail, ... */
  nav: string;
  /** Named hero treatment: centered-full, split-diptych, stat-led, ... */
  hero: string;
  /** Count of top-level sections. Cheap tiebreaker in the distance metric. */
  sectionCount: number;
}

export interface FingerprintClash {
  page: string;
  against: string;
  /** 0-1, where 0 is identical. Below the threshold is a clash. */
  distance: number;
  /** The dimensions that matched, named for the report. */
  sharedDimensions: string[];
}

export interface ScanConfig {
  /** Directory to scan for source-channel hits. */
  root: string;
  /** URLs to drive for the render channel. Empty disables that channel. */
  urls: string[];
  /** Viewport widths to sweep. */
  viewports: number[];
  /** Enable the vision channel. Requires a configured model provider. */
  vision: boolean;
  /** Minimum confidence to include in the report. */
  minConfidence: Confidence;
  /** Fail the process when the score drops below this. Null disables gating. */
  threshold: number | null;
  /** Categories to skip entirely. */
  skipCategories: Category[];
}

export interface ScanResult {
  score: number;
  findings: Finding[];
  ignored: Finding[];
  fingerprints: Fingerprint[];
  clashes: FingerprintClash[];
  channelsRun: Channel[];
  /** Wall-clock ms per channel, for the --timing flag. */
  timing: Record<string, number>;
}
