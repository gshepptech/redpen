import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
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
  /** Rule ids suppressed project-wide, each with a mandatory reason. */
  ignore: Record<string, string>;
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
};

const DIR = '.redpen';
const CONFIG_FILE = 'config.json';
const BASELINE_FILE = 'baseline.json';

export function loadConfig(root: string): RedpenConfig {
  const file = join(root, DIR, CONFIG_FILE);
  if (!existsSync(file)) return { ...DEFAULT_CONFIG };
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as Partial<RedpenConfig>;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch (err) {
    throw new Error(`redpen: ${file} is not valid JSON — ${err}`);
  }
}

export function saveConfig(root: string, config: RedpenConfig): void {
  mkdirSync(join(root, DIR), { recursive: true });
  writeFileSync(
    join(root, DIR, CONFIG_FILE),
    JSON.stringify(config, null, 2) + '\n',
    'utf8',
  );
}

export interface Baseline {
  score: number;
  recordedAt: string;
  /** Rule ids present at baseline, so new tells are reported even if the score held. */
  knownRules: string[];
}

export function loadBaseline(root: string): Baseline | null {
  const file = join(root, DIR, BASELINE_FILE);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as Baseline;
  } catch {
    return null;
  }
}

export function saveBaseline(root: string, baseline: Baseline): void {
  mkdirSync(join(root, DIR), { recursive: true });
  writeFileSync(
    join(root, DIR, BASELINE_FILE),
    JSON.stringify(baseline, null, 2) + '\n',
    'utf8',
  );
}

/** Ignores from config become the same shape the source channel produces. */
export function configIgnores(
  config: RedpenConfig,
): Map<string, { reason: string; location: string }> {
  const map = new Map<string, { reason: string; location: string }>();
  for (const [ruleId, reason] of Object.entries(config.ignore)) {
    if (!reason || !reason.trim()) {
      throw new Error(
        `redpen: ignore for "${ruleId}" has no reason — an ignore without a reason is how a rule set stops meaning anything`,
      );
    }
    map.set(ruleId, { reason, location: '.redpen/config.json' });
  }
  return map;
}
