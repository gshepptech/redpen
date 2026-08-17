import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { scanSource } from './channels/source.js';
import { scanRender } from './channels/render.js';
import { buildBrief, writeBrief, readAnswers } from './channels/vision.js';
import { promote, meetsThreshold } from './promote.js';
import { MIN_SURFACE_CONFIDENCE } from './channels/surface.js';
import { loadCorpus, appliesTo, isActionable } from './corpus/load.js';
import { findClashes, fingerprintFindings } from './fingerprint/distance.js';
import * as store from './fingerprint/store.js';
import { score, scoreKind } from './score.js';
import { loadConfig, configIgnores, type RedpenConfig } from './config.js';
import type { ScanResult, RawFinding, Channel, Finding, Surface } from './types.js';

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
  /** Capture screenshots and write a vision brief for the caller to answer. */
  vision?: boolean;
  /** Path to answers produced from a brief. Folds them in as a vision channel. */
  answers?: string | null;
  /** Skip persisting fingerprints. Used by `redpen check` on throwaway branches. */
  ephemeral?: boolean;
  onProgress?: (message: string) => void;
}

export async function runScan(opts: ScanOptions): Promise<ScanResult & {
  config: RedpenConfig;
  warnings: string[];
  /** Set when --vision wrote a brief awaiting answers. */
  briefPath: string | null;
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
  const surfaces: ScanResult['surfaces'] = {};
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

      // Surface: declared beats detected, and a low-confidence detection is
      // treated as unknown rather than acted on.
      for (const url of urls) {
        const declared = config.surfaceByUrl[url] ?? config.surface ?? null;
        if (declared) {
          surfaces[url] = { surface: declared, declared: true };
          continue;
        }
        const detected = render.detectedSurfaces.get(url);
        if (detected && detected.confidence >= MIN_SURFACE_CONFIDENCE) {
          surfaces[url] = { surface: detected.surface, declared: false };
          opts.onProgress?.(
            `surface: ${url} looks like "${detected.surface}" (${detected.confidence}) — ${detected.signals.join(', ')}`,
          );
        } else if (detected) {
          warnings.push(
            `could not confidently classify ${url} (best guess "${detected.surface}" at ${detected.confidence}). Every rule stayed on. Declare "surface" in .redpen/config.json to gate the rules that only hold on one kind of page.`,
          );
        }
      }
    }
  } else {
    warnings.push(
      'no urls configured — the render channel did not run, so every source finding that render could confirm is capped at "possible". Add urls to .redpen/config.json or pass --url.',
    );
  }

  // ---- vision: fold in answers from a previous brief ----
  let briefPath: string | null = null;
  if (opts.answers) {
    const t2 = Date.now();
    const answers = readAnswers(opts.answers);
    timing.vision = Date.now() - t2;

    if (answers.unavailable) {
      warnings.push(answers.unavailable);
    } else {
      channelsRun.push('vision');
      raw.push(...answers.findings);
      for (const d of answers.discarded) warnings.push(`vision answer discarded: ${d}`);
      opts.onProgress?.(
        `vision: ${answers.accepted} answer(s) accepted across ${answers.findings.length} rule(s)`,
      );
    }
  }

  // ---- vision: emit a brief for the caller to answer ----
  if (opts.vision && screenshots.size) {
    // Rules two channels already agree on don't need a third opinion.
    const counts = new Map<string, number>();
    for (const f of raw) counts.set(f.ruleId, (counts.get(f.ruleId) ?? 0) + 1);
    const confirmed = new Set([...counts].filter(([, n]) => n >= 2).map(([id]) => id));

    const brief = buildBrief({ screenshots, alreadyConfirmed: confirmed });
    if (brief) {
      briefPath = resolve(root, '.redpen', 'vision-brief.json');
      writeBrief(briefPath, brief);
      opts.onProgress?.(
        `vision: wrote a brief with ${brief.questions.length} question(s) over ${screenshots.size} screenshot(s)`,
      );
    }
  } else if (opts.vision) {
    warnings.push(
      'vision needs screenshots — pass --url so the render channel can capture them',
    );
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
  // Rules that do not hold on this surface never become findings. A single type
  // family is a tell on a landing page and the right answer on a dashboard, so
  // firing it there would be a false positive by construction.
  const activeSurfaces = [...new Set(Object.values(surfaces).map((s) => s.surface))];
  const offSurface = new Set<string>();

  // Rules whose fix needs a capability the project has declared it lacks.
  const caps = config.capabilities as unknown as Record<string, boolean>;
  let unactionable = 0;
  for (const rule of loadCorpus()) {
    if (!isActionable(rule, caps)) {
      offSurface.add(rule.id);
      unactionable++;
    }
  }
  if (unactionable) {
    opts.onProgress?.(
      `capabilities: ${unactionable} rule(s) need something this project declares it cannot do`,
    );
  }

  if (activeSurfaces.length === 1) {
    const only = activeSurfaces[0] as Surface;
    for (const rule of loadCorpus()) {
      if (!appliesTo(rule, only)) offSurface.add(rule.id);
    }
    if (offSurface.size) {
      opts.onProgress?.(
        `surface: ${offSurface.size} rule(s) do not apply on a "${only}" surface`,
      );
    }
  }

  const ignores = configIgnores(config);
  const promoted = promote(raw, { renderRan, ignored: ignores, offSurface });
  if (promoted.unknownRules.length) {
    warnings.push(`unknown rule ids reported by a channel: ${promoted.unknownRules.join(', ')}`);
  }

  const inScope = promoted.findings.filter((f) => !config.skipCategories.includes(f.category));

  // Everything in scope is returned so the report can offer the low-confidence
  // fold, but only findings at or above the confidence threshold move the
  // score. A source-only guess should never cost a project points.
  const scored = inScope.filter((f) => meetsThreshold(f, config.minConfidence));

  // Advisory findings are reported and never scored — for tells humans use
  // legitimately often enough that counting them would be noise, not signal.
  const advisory = inScope.filter((f) => f.advisory);

  return {
    score: score(scored),
    slopScore: scoreKind(scored, 'slop'),
    qualityScore: scoreKind(scored, 'quality'),
    surfaces,
    advisory,
    findings: inScope.filter((f) => !f.advisory),
    ignored: promoted.ignored,
    fingerprints,
    clashes,
    channelsRun,
    timing,
    config,
    warnings,
    briefPath,
  };
}

/** Rule ids present in a result, for baseline comparison. */
export function ruleIds(findings: Finding[]): string[] {
  return [...new Set(findings.map((f) => f.ruleId))].sort();
}
