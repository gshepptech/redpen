import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { scanSource } from './channels/source.js';
import { scanRender } from './channels/render.js';
import { scanVision } from './channels/vision.js';
import { promote, meetsThreshold } from './promote.js';
import { findClashes, fingerprintFindings } from './fingerprint/distance.js';
import * as store from './fingerprint/store.js';
import { score } from './score.js';
import { loadConfig, configIgnores, type RedpenConfig } from './config.js';
import type { ScanResult, RawFinding, Channel, Finding } from './types.js';

/**
 * The orchestrator. Runs every available channel, promotes, scores.
 *
 * Channel failures degrade the *confidence* of the result rather than being
 * swallowed — `channelsRun` is part of the output precisely so a caller can
 * never mistake "we did not look" for "there was nothing there".
 */

export interface ScanOptions {
  root: string;
  urls?: string[];
  viewports?: number[];
  screenshots?: boolean;
  /** Run the vision pass over the screenshots. Implies `screenshots`. */
  vision?: boolean;
  /** Skip persisting fingerprints. Used by `redpen check` on throwaway branches. */
  ephemeral?: boolean;
  onProgress?: (message: string) => void;
}

export async function runScan(opts: ScanOptions): Promise<ScanResult & {
  config: RedpenConfig;
  warnings: string[];
}> {
  const root = resolve(opts.root);
  const config = loadConfig(root);
  const urls = opts.urls?.length ? opts.urls : config.urls;
  const viewports = opts.viewports?.length ? opts.viewports : config.viewports;

  const warnings: string[] = [];
  const channelsRun: Channel[] = [];
  const timing: Record<string, number> = {};
  const raw: RawFinding[] = [];

  // ---- source ----
  opts.onProgress?.('scanning source');
  const t0 = Date.now();
  const src = scanSource({ root });
  timing.source = Date.now() - t0;
  channelsRun.push('source');
  raw.push(...src.findings);
  opts.onProgress?.(`source: ${src.findings.length} rule(s) hit across ${src.filesScanned} files`);

  // ---- render ----
  let renderRan = false;
  let fingerprints = [] as ScanResult['fingerprints'];
  let screenshots = new Map<string, string>();
  if (urls.length) {
    opts.onProgress?.(`rendering ${urls.length} url(s) at ${viewports.join(', ')}px`);
    const t1 = Date.now();
    const wantShots = opts.screenshots || opts.vision;
    const screenshotDir = wantShots ? resolve(root, '.redpen', 'screenshots') : null;
    if (screenshotDir) mkdirSync(screenshotDir, { recursive: true });

    const render = await scanRender({ urls, viewports, screenshotDir });
    timing.render = Date.now() - t1;

    if (render.unavailable && !render.findings.length && !render.fingerprints.length) {
      warnings.push(render.unavailable);
    } else {
      renderRan = true;
      channelsRun.push('render');
      raw.push(...render.findings);
      fingerprints = render.fingerprints;
      screenshots = render.screenshots;
      if (render.unavailable) warnings.push(render.unavailable);
      opts.onProgress?.(`render: ${render.findings.length} rule(s) hit`);
    }
  } else {
    warnings.push(
      'no urls configured — the render channel did not run, so every source finding that render could confirm is capped at "possible". Add urls to .redpen/config.json or pass --url.',
    );
  }

  // ---- vision ----
  if (opts.vision) {
    opts.onProgress?.(`asking the vision pass about ${screenshots.size} screenshot(s)`);
    const t2 = Date.now();

    // Rules a channel has already nailed down don't need paying for again.
    const seen = new Set(raw.map((f) => f.ruleId));
    const confirmed = new Set(
      [...seen].filter((id) => raw.filter((f) => f.ruleId === id).length >= 2),
    );

    const vision = await scanVision({ screenshots, alreadyConfirmed: confirmed });
    timing.vision = Date.now() - t2;

    if (vision.unavailable && !vision.findings.length) {
      warnings.push(vision.unavailable);
    } else {
      channelsRun.push('vision');
      raw.push(...vision.findings);
      if (vision.unavailable) warnings.push(vision.unavailable);
      opts.onProgress?.(
        `vision: ${vision.findings.length} rule(s) hit (${vision.tokens.toLocaleString()} tokens)`,
      );
    }
  }

  // ---- fingerprint ----
  let clashes: ScanResult['clashes'] = [];
  if (fingerprints.length) {
    channelsRun.push('fingerprint');
    const prior = store.priorPages(root, fingerprints.map((f) => f.page));
    const all = [...prior, ...fingerprints];
    clashes = findClashes(all);
    raw.push(...fingerprintFindings(all, clashes));
    if (!opts.ephemeral) store.save(root, fingerprints);
    opts.onProgress?.(
      `fingerprint: ${fingerprints.length} page(s) recorded, ${prior.length} prior on file, ${clashes.length} clash(es)`,
    );
  }

  // ---- promote ----
  const ignores = configIgnores(config);
  const promoted = promote(raw, { renderRan, ignored: ignores });
  if (promoted.unknownRules.length) {
    warnings.push(`unknown rule ids reported by a channel: ${promoted.unknownRules.join(', ')}`);
  }

  const inScope = promoted.findings.filter((f) => !config.skipCategories.includes(f.category));

  // Everything in scope is returned so the report can offer the low-confidence
  // fold, but only findings at or above the confidence threshold move the
  // score. A source-only guess should never cost a project points.
  const scored = inScope.filter((f) => meetsThreshold(f, config.minConfidence));

  return {
    score: score(scored),
    findings: inScope,
    ignored: promoted.ignored,
    fingerprints,
    clashes,
    channelsRun,
    timing,
    config,
    warnings,
  };
}

/** Rule ids present in a result, for baseline comparison. */
export function ruleIds(findings: Finding[]): string[] {
  return [...new Set(findings.map((f) => f.ruleId))].sort();
}
