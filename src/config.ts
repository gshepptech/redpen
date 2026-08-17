import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import type { Category, Confidence, Surface } from './types.js';

/**
 * Project configuration and the score baseline.
 *
 * The baseline is what makes `redpen check` a regression gate rather than a
 * grader. A codebase that starts at 46 should not have to reach 90 before CI
 * goes green — it has to stop getting worse.
 */

export interface RedpenConfig {
  urls: string[];
  /**
   * What the visitor is doing here: persuade | operate | read. A declared
   * surface always beats detection, and detection is a heuristic — so on a
   * project whose pages are all one kind, declaring it once is the single
   * highest-value line in this file.
   *
   * Per-url overrides go in `surfaceByUrl`.
   */
  surface: Surface | null;
  /** url -> surface, for projects that mix marketing and app routes. */
  surfaceByUrl: Record<string, Surface>;
  viewports: number[];
  minConfidence: Confidence;
  skipCategories: Category[];
  /** Allowed drop below the baseline before `check` fails. */
  tolerance: number;
  /**
   * Rule ids suppressed project-wide. A bare string is the reason; the object
   * form scopes the suppression to elements matching a selector, which is the
   * only way to excuse a render finding on one component — those have no source
   * line to annotate with a comment.
   */
  ignore: Record<string, string | IgnoreRule>;
  /**
   * What this project is able to do. A rule whose fix requires a capability the
   * project does not have is not a finding — it is a standing complaint the
   * reader can never act on.
   *
   * Reported from the field: a deliberately no-JavaScript dashboard was told to
   * add inline validation, an unsaved-changes warning and autosave on every
   * scan forever.
   */
  capabilities: Capabilities;
  /**
   * What this project is, for the vision brief.
   *
   * Several composition questions cannot be answered fairly without it — "could
   * this page hold a different product's content" is meaningless if you do not
   * know what this product's content is. The brief is meant to be handed to
   * someone who was not there, and this is what makes that possible.
   */
  product: Product;
}

export interface Product {
  /** "Ledger", "the rounce board". */
  name: string;
  /** One sentence: what it does and for whom. */
  purpose: string;
  /** Who uses it, and what they are trying to get done. */
  audience: string;
}

export interface IgnoreRule {
  reason: string;
  /** Suppress only where the render evidence selector contains this. */
  selector?: string;
  /** Suppress only on this url or file. */
  location?: string;
}

export interface Capabilities {
  /** False for server-rendered projects that ship no client JS by rule. */
  javascript: boolean;
  /** False where no off-host asset may be referenced. */
  externalAssets: boolean;
}

export const DEFAULT_CONFIG: RedpenConfig = {
  urls: [],
  surface: null,
  surfaceByUrl: {},
  viewports: [375, 768, 1440],
  minConfidence: 'likely',
  skipCategories: [],
  tolerance: 0,
  ignore: {},
  capabilities: { javascript: true, externalAssets: true },
  product: { name: '', purpose: '', audience: '' },
};

const DIR = '.redpen';
const CONFIG_FILE = 'config.json';
const BASELINE_FILE = 'baseline.json';

/**
 * Where redpen keeps its state.
 *
 * Walks up from the scanned path for a project marker, so pointing redpen at
 * `internal/dash` writes to the repo root rather than burying a state directory
 * inside a source tree. Reported from the field twice — it got swept into a
 * commit both times.
 */
export function stateRoot(scanRoot: string): string {
  const markers = ['.git', 'package.json', 'go.mod', 'Cargo.toml', 'pyproject.toml', 'deno.json'];
  let dir = resolve(scanRoot);
  for (let i = 0; i < 12; i++) {
    if (markers.some((m) => existsSync(join(dir, m)))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return resolve(scanRoot);
}

export function loadConfig(root: string): RedpenConfig {
  const file = join(stateRoot(root), DIR, CONFIG_FILE);
  if (!existsSync(file)) return { ...DEFAULT_CONFIG };
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as Partial<RedpenConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      capabilities: { ...DEFAULT_CONFIG.capabilities, ...(parsed.capabilities ?? {}) },
      product: { ...DEFAULT_CONFIG.product, ...(parsed.product ?? {}) },
    };
  } catch (err) {
    throw new Error(`redpen: ${file} is not valid JSON — ${err}`);
  }
}

export function saveConfig(root: string, config: RedpenConfig): void {
  mkdirSync(join(stateRoot(root), DIR), { recursive: true });
  writeFileSync(
    join(stateRoot(root), DIR, CONFIG_FILE),
    JSON.stringify(config, null, 2) + '\n',
    'utf8',
  );
}

export interface Baseline {
  score: number;
  recordedAt: string;
  /** Rule ids present at baseline, so new tells are reported even if the score held. */
  knownRules: string[];
  /**
   * Channels that produced this score. A later check that runs fewer of them
   * sees fewer findings and a *higher* score, so it passes for having looked
   * at less. Optional because baselines recorded before this existed have none.
   */
  channels?: string[];
}

export function loadBaseline(root: string): Baseline | null {
  const file = join(stateRoot(root), DIR, BASELINE_FILE);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as Baseline;
  } catch {
    return null;
  }
}

export function saveBaseline(root: string, baseline: Baseline): void {
  mkdirSync(join(stateRoot(root), DIR), { recursive: true });
  writeFileSync(
    join(stateRoot(root), DIR, BASELINE_FILE),
    JSON.stringify(baseline, null, 2) + '\n',
    'utf8',
  );
}

/** Ignores from config become the same shape the source channel produces. */
export interface ResolvedIgnore {
  reason: string;
  location: string;
  /** When set, only evidence matching this selector or url is suppressed. */
  selector?: string;
  scopedTo?: string;
}

export function configIgnores(config: RedpenConfig): Map<string, ResolvedIgnore> {
  const map = new Map<string, ResolvedIgnore>();
  for (const [ruleId, entry] of Object.entries(config.ignore)) {
    const rule: IgnoreRule = typeof entry === 'string' ? { reason: entry } : entry;
    if (!rule?.reason || !rule.reason.trim()) {
      throw new Error(
        `redpen: ignore for "${ruleId}" has no reason — an ignore without a reason is how a rule set stops meaning anything`,
      );
    }
    map.set(ruleId, {
      reason: rule.reason,
      location: '.redpen/config.json',
      ...(rule.selector ? { selector: rule.selector } : {}),
      ...(rule.location ? { scopedTo: rule.location } : {}),
    });
  }
  return map;
}
