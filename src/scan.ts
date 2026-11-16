import { resolve, join } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';
import { scanSource, unreadLanguages } from './channels/source.js';
import { scanRender } from './channels/render.js';
import { buildBrief, writeBrief, readAnswers } from './channels/vision.js';
import { promote, meetsThreshold } from './promote.js';
import { MIN_SURFACE_CONFIDENCE } from './channels/surface.js';
import { runTools } from './channels/tools.js';
import { discoverRoutes } from './channels/routes.js';
import { loadCorpus, appliesTo, isActionable, ruleById } from './corpus/load.js';
import { findClashes, fingerprintFindings } from './fingerprint/distance.js';
import * as store from './fingerprint/store.js';
import { scoreKind, headline } from './score.js';
import { loadConfig, configIgnores, stateRoot, type RedpenConfig } from './config.js';
import { CODE_CATEGORIES } from './types.js';
import type { ScanResult, RawFinding, Channel, Finding, Surface, Category } from './types.js';

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
  /** Restrict the report to these categories. Everything else still runs. */
  only?: string[];
  /**
   * Report the source categories instead of the page ones. There is no mode
   * that returns both: a project's code and the UI it serves are answers to
   * different questions and averaging them into one score says neither.
   */
  codeCategories?: boolean;
  /**
   * Neither read nor write the fingerprint store. Used by `redpen check` on
   * throwaway branches and by tests. Skipping only the write is not enough: the
   * run would still compare against whatever is on disk, so an unrelated
   * project's pages could produce a sameness finding.
   */
  ephemeral?: boolean;
  /**
   * Skip the external analysers even where the project has them.
   *
   * Their output depends on what is installed on the machine, which is right
   * for a scan and wrong for a test: a result that changes when jscpd lands on
   * the PATH is not a fixture.
   */
  tools?: boolean;
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
  const given = opts.urls?.length ? opts.urls : config.urls;
  const viewports = opts.viewports?.length ? opts.viewports : config.viewports;

  const warnings: string[] = [];

  /**
   * One bare origin means "the whole app", not "the home page".
   *
   * Reading exactly one page is almost never what someone pointing redpen at
   * their dev server wants, and the sameness channel, which compares a
   * project's pages against each other, cannot run at all on a single page.
   * The routes are already in the repository, so they are used.
   *
   * Only for a bare origin. Any explicit path is an instruction to read that
   * page and is obeyed exactly.
   */
  const MAX_EXPANDED = 20;
  let urls = given;
  let expandedFrom: number | null = null;
  if (given.length === 1) {
    const only = given[0]!;
    let bare = false;
    try {
      const u = new URL(only);
      bare = u.pathname === '/' && !u.search && !u.hash;
    } catch {
      bare = false;
    }
    if (bare) {
      const routes = discoverRoutes(root);
      if (routes.length > 1) {
        const origin = only.replace(/\/$/, '');
        urls = routes.slice(0, MAX_EXPANDED).map((r) => origin + (r.path === '/' ? '' : r.path));
        if (!urls.includes(origin)) urls.unshift(origin);
        expandedFrom = routes.length;
      }
    }
  }
  if (expandedFrom !== null) {
    opts.onProgress?.(
      `routes: ${expandedFrom} declared in the source, scanning ${urls.length}` +
        (expandedFrom > MAX_EXPANDED ? ` (capped at ${MAX_EXPANDED}; list urls in .redpen/config.json to choose)` : ''),
    );
    if (expandedFrom > MAX_EXPANDED) {
      warnings.push(
        `${expandedFrom} routes were found in the source and the first ${MAX_EXPANDED} were scanned — ` +
          'the rest are not in this score. List the ones you care about in .redpen/config.json.',
      );
    }
  }

  const state = stateRoot(root);
  if (!existsSync(join(state, '.redpen', 'config.json'))) {
    warnings.push(
      `no .redpen/config.json found (looked in ${state}) — running with defaults, so every capability is assumed available and no surface is declared`,
    );
  }
  if (state !== root) {
    opts.onProgress?.(`state: writing .redpen/ to the project root (${state}), not the scanned path`);
  }
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
  if (src.filesScanned === 0) {
    // A source pass over nothing raises nothing, which reads exactly like a
    // clean codebase. Not looking and finding nothing must never look the same.
    warnings.push(
      `the source channel found no files to read under ${root} — every source rule was skipped, and findings the render pass could only have confirmed are reported as one-channel. Check the path.`,
    );
  }

  // ---- render ----
  let renderRan = false;
  let fingerprints = [] as ScanResult['fingerprints'];
  let screenshots = new Map<string, string>();
  const surfaces: ScanResult['surfaces'] = {};
  // A code scan never opens a browser. Every craft and residue rule is
  // source-channel, so rendering answers nothing they ask, and configured urls
  // with no server behind them would only print connection failures.
  if (urls.length && !opts.codeCategories) {
    opts.onProgress?.(`rendering ${urls.length} url(s) at ${viewports.join(', ')}px`);
    const t1 = Date.now();
    const wantShots = opts.screenshots || opts.vision;
    const screenshotDir = wantShots ? resolve(stateRoot(root), '.redpen', 'screenshots') : null;
    if (screenshotDir) mkdirSync(screenshotDir, { recursive: true });

    // A stored session, if one was captured. Resolved against the project root
    // so the config can hold a relative path and stay portable.
    const authPath = config.storageState ? resolve(root, config.storageState) : null;
    if (authPath && !existsSync(authPath)) {
      warnings.push(
        `storageState "${config.storageState}" is configured but not on disk — ` +
          'scanning anonymously. Run `redpen login <url>` to capture one, or clear the setting.',
      );
    }

    const render = await scanRender({
      root,
      urls,
      viewports,
      screenshotDir,
      storageState: authPath && existsSync(authPath) ? authPath : null,
      ...(config.schemes === 'auto'
        ? { autoScheme: true }
        : { schemes: config.schemes }),
    });
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
      const schemesSeen = new Set(
        render.findings.flatMap((f) => f.evidence.map((e) => e.scheme).filter(Boolean)),
      );
      opts.onProgress?.(
        `render: ${render.findings.length} rule(s) hit` +
          (schemesSeen.size > 1 ? ` across ${[...schemesSeen].join(' and ')}` : ''),
      );
      // A finding only one scheme can see is the case this pass exists for.
      const darkOnly = render.findings.filter(
        (f) => f.evidence.length && f.evidence.every((e) => e.scheme === 'dark'),
      );
      if (darkOnly.length) {
        opts.onProgress?.(
          `render: ${darkOnly.length} rule(s) fire only in dark mode — ${darkOnly.map((f) => f.ruleId).join(', ')}`,
        );
      }

      // Surface resolution, in three passes: declared beats detected, detected
      // beats inherited, and inherited beats failing open.
      const undecided: string[] = [];
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
            `surface: ${url} is "${detected.surface}" (${detected.confidence}) — ${detected.signals.join(', ')}`,
          );
        } else {
          undecided.push(url);
        }
      }

      // Inherit from the neighbours.
      //
      // Abstaining would enable every rule, the most punishing default,
      // applied exactly when confidence is lowest. Within one scan of one
      // origin, "unclassified" does not mean "could be anything": if five
      // routes of a product are operate surfaces, the sixth is too.
      if (undecided.length && Object.keys(surfaces).length) {
        const tally = new Map<Surface, number>();
        for (const v of Object.values(surfaces)) {
          tally.set(v.surface, (tally.get(v.surface) ?? 0) + 1);
        }
        const [modal, count] = [...tally].sort((a, b) => b[1] - a[1])[0]!;
        // Only inherit from a clear majority, and only from more than one page.
        if (count >= 2 && count >= Object.keys(surfaces).length * 0.6) {
          for (const url of undecided.splice(0)) {
            surfaces[url] = { surface: modal, declared: false, inherited: true };
            const d = render.detectedSurfaces.get(url);
            opts.onProgress?.(
              `surface: ${url} inherited "${modal}" from ${count} sibling route(s)` +
                (d?.sparse ? ` — too little on the page to classify (${d.density.rows} rows, ${d.density.controls} controls)` : ''),
            );
          }
        }
      }

      // Anything still undecided leaves every rule on, and says why properly.
      for (const url of undecided) {
        const d = render.detectedSurfaces.get(url);
        if (d?.sparse) {
          warnings.push(
            `${url} had too little on it to classify (${d.density.rows} rows, ${d.density.controls} controls, ${d.density.characters} characters). Every rule stayed on. This is usually a thin dev fixture rather than a problem with the page — scan against fuller data, or declare "surface" in .redpen/config.json.`,
          );
        } else {
          warnings.push(
            `could not confidently classify ${url} (best guess "${d?.surface ?? 'unknown'}" at ${d?.confidence ?? 0}). Every rule stayed on. Declare "surface" in .redpen/config.json to gate the rules that only hold on one kind of page.`,
          );
        }
      }
    }
  } else if (!opts.codeCategories) {
    // Not on a code scan. No craft or residue rule has a render half, so
    // "findings that render could confirm are capped" describes nothing here.
    //
    // Name the routes rather than asking for them. redpen has the source, so
    // "add urls" is asking someone to retype what the repository already
    // states, and the cost of not bothering is invisible in the score.
    const routes = discoverRoutes(root);
    const listed = routes.slice(0, 8).map((r: { path: string }) => r.path).join(' ');
    warnings.push(
      'no urls configured — the render channel did not run, so every source finding that render could confirm is capped at "possible". ' +
        (routes.length
          ? `This project declares ${routes.length} route(s) (${routes[0]!.framework}): ${listed}` +
            (routes.length > 8 ? ` … and ${routes.length - 8} more.` : '.') +
            ' Start the app and pass an origin — `redpen scan . http://localhost:3000` scans them all.'
          : 'Add urls to .redpen/config.json or pass --url.'),
    );
  }

  // ---- vision: fold in answers from a previous brief ----
  let briefPath: string | null = null;
  let visionChecked = 0;
  let visionCleared = 0;
  if (opts.answers) {
    const t2 = Date.now();
    const answers = readAnswers(opts.answers);
    timing.vision = Date.now() - t2;

    if (answers.unavailable) {
      warnings.push(answers.unavailable);
    } else {
      channelsRun.push('vision');
      raw.push(...answers.findings);
      visionChecked = answers.checked.length;
      visionCleared = answers.cleared;
      for (const d of answers.discarded) warnings.push(`vision answer discarded: ${d}`);
      opts.onProgress?.(
        `vision: ${answers.accepted + answers.cleared} answer(s) across ${answers.checked.length} rule(s) — ` +
        `${answers.accepted} present, ${answers.cleared} cleared`,
      );
    }
  }

  // ---- vision: emit a brief for the caller to answer ----
  if (opts.vision && screenshots.size) {
    // Rules two channels already agree on don't need a third opinion.
    const counts = new Map<string, number>();
    for (const f of raw) counts.set(f.ruleId, (counts.get(f.ruleId) ?? 0) + 1);
    const confirmed = new Set([...counts].filter(([, n]) => n >= 2).map(([id]) => id));

    const brief = buildBrief({
      screenshots,
      alreadyConfirmed: confirmed,
      surfaces,
      product: config.product,
    });
    if (!config.product.name) {
      warnings.push(
        'no "product" declared in .redpen/config.json — the vision brief cannot say what this is, and the questions about specificity are unanswerable without it',
      );
    }
    if (brief) {
      briefPath = resolve(stateRoot(root), '.redpen', 'vision-brief.json');
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

  // ---- tools ----
  //
  // Only on a code scan. Duplication, cycles and unused exports are questions
  // about a project's source, not about the page it serves, and folding them
  // into a UI scan would move every score anyone holds a baseline against.
  if (opts.codeCategories && opts.tools !== false) {
    const tools = runTools(root, opts.onProgress);
    if (tools.ran.length) {
      channelsRun.push('tools');
      raw.push(...tools.findings);
      opts.onProgress?.(
        `tools: ${tools.ran.join(', ')} produced ${tools.findings.length} finding(s)`,
      );
    }
    if (tools.missing.length) {
      // Absent, not clean. A project without jscpd gets no duplication finding
      // and that is not the same as having no duplication.
      warnings.push(
        `${tools.missing.join(', ')} not found in this project or on PATH — ` +
          'duplication, dependency cycles and unused exports need a parse of the whole ' +
          'project, so nothing about them is in this score. redpen installs nothing; ' +
          'add them to the project to have them read.',
      );
    }
  }

  // ---- fingerprint ----
  let clashes: ScanResult['clashes'] = [];
  if (fingerprints.length) {
    channelsRun.push('fingerprint');
    const prior = opts.ephemeral ? [] : store.priorPages(root, fingerprints.map((f) => f.page));
    const all = [...prior, ...fingerprints];
    const operatePages = new Set(
      Object.entries(surfaces).filter(([, v]) => v.surface === 'operate').map(([url]) => url),
    );
    clashes = findClashes(all, operatePages);
    raw.push(...fingerprintFindings(all, clashes, operatePages));
    if (!opts.ephemeral) store.save(root, fingerprints);
    opts.onProgress?.(
      `fingerprint: ${fingerprints.length} page(s) recorded, ${prior.length} prior on file, ${clashes.length} clash(es)`,
    );
  }

  // A code scan that read almost nothing must not answer "clean".
  //
  // Say so out loud when a project holds source in a language nothing here
  // reads, rather than scoring the handful of files it could read as 100/100.
  if (opts.codeCategories) {
    const unread = unreadLanguages(root);
    if (unread.length) {
      warnings.push(
        `${unread.map(([ext, n]) => `${n} ${ext}`).join(', ')} file(s) were not read — ` +
          'no rule in this corpus knows that language, so nothing about them is in this score.',
      );
    }
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

  /**
   * The ignores written in the source, which were collected and dropped.
   *
   * `--show-ignored` lists findings suppressed by redpen-ignore as well as the
   * ones named in `.redpen/config.json`. A person is required to write a reason
   * on an ignore so it is a decision on record, and this is where it is read
   * back.
   *
   * They never became findings, so there is nothing to demote; they are
   * listed by the rule and the line that carried the directive.
   */
  for (const [ruleId, directives] of src.ignored) {
    const rule = ruleById(ruleId);
    if (!rule) continue;
    for (const d of directives) {
      promoted.ignored.push({
        ruleId,
        title: rule.title,
        category: rule.category,
        kind: rule.kind,
        advisory: false,
        severity: rule.severity,
        weight: rule.weight,
        confidence: 'possible',
        channels: ['source'],
        evidence: [{ channel: 'source', location: d.location ?? '', line: d.line }],
        evidenceTotal: 1,
        why: rule.why,
        fix: rule.fix,
        sources: rule.sources,
        ignored: { reason: d.reason, location: d.location ?? '' },
      });
    }
  }
  if (promoted.unknownRules.length) {
    warnings.push(`unknown rule ids reported by a channel: ${promoted.unknownRules.join(', ')}`);
  }

  /**
   * A UI scan and a code scan are different questions.
   *
   * craft and residue are about the source a project is written in, not the
   * page it serves, and folding them into `scan` would move every score anyone
   * holds a baseline against.
   * `redpen code` asks for them; `redpen scan` never returns them.
   */
  const codeOnly = opts.codeCategories === true;
  let inScope = promoted.findings
    .filter((f) => !config.skipCategories.includes(f.category))
    .filter((f) => (CODE_CATEGORIES.has(f.category) ? codeOnly : !codeOnly));
  // `--only` narrows what is *reported*, never what is measured: every channel
  // still runs, so cross-channel confirmation is unaffected and the scores
  // below still describe the whole page.
  if (opts.only?.length) {
    const wanted = new Set(opts.only);
    // A filter that matches no category is not an empty result, it is a typo.
    // `--only` takes categories and reads like it takes rule ids, so
    // `--only nested-cards` must not print a confident 100/100 clean.
    const known = new Set(loadCorpus().map((r) => r.category));
    const unknown = [...wanted].filter((c) => !known.has(c as Category));
    if (unknown.length) {
      warnings.push(
        `--only ${unknown.join(', ')}: no such categor${unknown.length === 1 ? 'y' : 'ies'}. ` +
          `It takes categories, not rule ids — ${[...known].sort().join(', ')}. ` +
          `Nothing was reported under ${unknown.length === 1 ? 'that name' : 'those names'}.`,
      );
    }
    inScope = inScope.filter((f) => wanted.has(f.category));
  }

  // Everything in scope is returned so the report can offer the low-confidence
  // fold, but only findings at or above the confidence threshold move the
  // score. A source-only guess should never cost a project points.
  const scored = inScope.filter((f) => meetsThreshold(f, config.minConfidence));

  // Advisory findings are reported and never scored — for tells humans use
  // legitimately often enough that counting them would be noise, not signal.
  const advisory = inScope.filter((f) => f.advisory);

  const slopScore = scoreKind(scored, 'slop');
  const qualityScore = scoreKind(scored, 'quality');

  return {
    score: headline(slopScore, qualityScore),
    slopScore,
    qualityScore,
    surfaces,
    advisory,
    vision: { checked: visionChecked, cleared: visionCleared },
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
