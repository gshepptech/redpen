import { rulesForChannel } from '../corpus/load.js';
import { detectorSource, type DetectorSpec, type DetectorHit } from './detectors.js';
import { fingerprintSource, type RawFingerprint } from '../fingerprint/extract.js';
import { surfaceSource, classify, type SurfaceSignals } from './surface.js';
import type { SurfaceVerdict } from './surface.js';
import type { RawFinding, Evidence, Fingerprint } from '../types.js';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * The render channel: drive the real page and read computed styles.
 *
 * Playwright is an optional peer dependency, so `redpen scan` still works with
 * nothing installed — it just runs source-only and says so. Anything that
 * requires a browser degrades loudly rather than silently reporting a clean
 * page, because "no findings" and "did not look" must never look the same.
 */

export interface RenderOptions {
  urls: string[];
  /**
   * The project being scanned, so playwright can be resolved from it.
   *
   * A plugin install is one bundled file with no node_modules of its own, so a
   * bare import finds nothing and the render channel — the whole reason redpen
   * cross-confirms anything — silently never runs. The project being scanned is
   * a web project, and usually already has playwright.
   */
  root?: string;
  viewports: number[];
  /** Milliseconds to wait after load for hydration and entrance animations. */
  settleMs?: number;
  /** Capture PNGs to this directory for the vision channel and fix-verify. */
  screenshotDir?: string | null;
  /**
   * Colour schemes to render. Dark adds one pass per url at the widest
   * viewport. Omit or pass ['light'] to skip it.
   */
  schemes?: Array<'light' | 'dark'>;
  /** Probe the page for a dark theme and add the pass only if it has one. */
  autoScheme?: boolean;
  /**
   * A Playwright storage state — cookies and localStorage captured after a
   * successful login, by `redpen login`.
   *
   * This is the one universal thing about authentication. Every app's login
   * page lives somewhere different, wants different fields, and may not be a
   * form at all — OAuth, a magic link, SSO, a second factor. What every one of
   * them produces is the same artefact: a cookie jar the browser can be handed.
   * So redpen automates none of the logging in and all of the remembering.
   */
  storageState?: string | null;
}

/**
 * How a page turns its own dark theme on, when it is not the media query.
 *
 * Emulating `prefers-color-scheme` never exercises a toggle, so a page can be
 * correct under the OS preference and broken under its own switch — different
 * code path, same claim of supporting dark mode.
 */
export interface ThemeStamp {
  kind: 'attribute' | 'class';
  /** Attribute name, or the literal "class". */
  name: string;
  /** Value to set, e.g. "dark". */
  value: string;
}

export interface RenderResult {
  findings: RawFinding[];
  fingerprints: Fingerprint[];
  screenshots: Map<string, string>;
  /** url -> detected surface. Empty when nothing could be classified. */
  detectedSurfaces: Map<string, SurfaceVerdict>;
  /** Populated when the browser could not be started. */
  unavailable: string | null;
}

interface PlaywrightModule {
  chromium: {
    launch(opts: { headless: boolean }): Promise<BrowserLike>;
  };
}

interface BrowserLike {
  newContext(opts: Record<string, unknown>): Promise<ContextLike>;
  close(): Promise<void>;
}

interface ContextLike {
  newPage(): Promise<PageLike>;
  storageState(opts?: Record<string, unknown>): Promise<unknown>;
  close(): Promise<void>;
}

interface PageLike {
  /** Where the browser actually ended up, which is not always where it was sent. */
  url(): string;
  setViewportSize(size: { width: number; height: number }): Promise<void>;
  goto(url: string, opts?: Record<string, unknown>): Promise<unknown>;
  waitForTimeout(ms: number): Promise<void>;
  evaluate<T>(expression: string): Promise<T>;
  addInitScript(script: string): Promise<void>;
  screenshot(opts: Record<string, unknown>): Promise<Buffer>;
  on(event: string, handler: (payload: unknown) => void): void;
  close(): Promise<void>;
}

/**
 * Whether a redirect landed somewhere that is a different page.
 *
 * Normalised so the ordinary ones do not trip it: a trailing slash, a change of
 * host or port behind a proxy, an added query string. What counts is the path.
 */
export function differentPage(requested: string, landed: string): boolean {
  const path = (u: string) => {
    try {
      return new URL(u).pathname.replace(/\/+$/, '') || '/';
    } catch {
      return u;
    }
  };
  return path(requested) !== path(landed);
}

/**
 * One line per distinct failure, with the contexts it happened in.
 *
 * A dev server that is not running fails identically at every viewport, and
 * joining the raw list put the same sentence on screen three times. The reader
 * needs to know what went wrong once, and where it went wrong in full.
 */
export function summariseErrors(errors: string[]): string {
  const byMessage = new Map<string, string[]>();
  for (const e of errors) {
    const at = e.indexOf(': ');
    const where = at > 0 ? e.slice(0, at) : '';
    const what = at > 0 ? e.slice(at + 2) : e;
    const list = byMessage.get(what) ?? [];
    if (where) list.push(where);
    byMessage.set(what, list);
  }
  return [...byMessage]
    .map(([what, wheres]) => (wheres.length ? `${what} (${wheres.join(', ')})` : what))
    .join('; ');
}

export async function loadPlaywright(root?: string): Promise<PlaywrightModule | null> {
  // Indirect specifier so the compiler does not require playwright to be
  // installed — it is an optional peer dependency, and a source-only scan must
  // keep working without a browser on the machine.
  const specifier = 'playwright';
  try {
    return (await import(specifier)) as unknown as PlaywrightModule;
  } catch {
    // Nothing beside redpen. Look in the project being scanned, which is a web
    // project and has one more often than not. Without this a plugin install —
    // one bundled file, no node_modules — can never render anything, and every
    // source finding stays capped at "possible" forever.
    if (!root) return null;
    try {
      const require = createRequire(join(resolve(root), 'noop.js'));
      const entry = require.resolve(specifier);
      const mod = (await import(pathToFileURL(entry).href)) as Record<string, unknown>;
      // playwright's entry is CommonJS, and importing CJS from ESM puts the
      // whole module object on `default`. Resolved but unusable is worse than
      // not found: the first version of this got as far as "could not launch
      // chromium: Cannot read properties of undefined".
      const ns = ('chromium' in mod ? mod : mod.default) as unknown;
      return ns as PlaywrightModule;
    } catch {
      return null;
    }
  }
}

/**
 * Captured before any page script runs, so an exception during hydration is
 * still visible to the console-errors check.
 */
const ERROR_TRAP = `
  window.__redpenErrors = [];
  window.addEventListener('error', function (e) {
    window.__redpenErrors.push(String(e.message || e.error || 'error'));
  });
  window.addEventListener('unhandledrejection', function (e) {
    window.__redpenErrors.push('unhandled rejection: ' + String(e.reason));
  });
`;

function buildSpecs(): DetectorSpec[] {
  return rulesForChannel('render')
    .filter((r) => r.render)
    .map((r) => ({
      ruleId: r.id,
      check: r.render!.check,
      params: (r.render!.params ?? {}) as Record<string, unknown>,
      minHits: r.render!.minHits ?? 1,
    }));
}

export async function scanRender(opts: RenderOptions): Promise<RenderResult> {
  const empty: RenderResult = {
    findings: [],
    fingerprints: [],
    screenshots: new Map(),
    detectedSurfaces: new Map(),
    unavailable: null,
  };

  if (opts.urls.length === 0) return empty;

  const pw = await loadPlaywright(opts.root);
  if (!pw) {
    return {
      ...empty,
      unavailable:
        'playwright is not installed — run `npm i -D playwright && npx playwright install chromium` ' +
        'in the project being scanned, or beside redpen, to enable the render channel',
    };
  }

  const specs = buildSpecs();

  /**
   * Install both extractors as plain function declarations before any page
   * script runs, then invoke them by name.
   *
   * Playwright's string form of `evaluate` takes no arguments, and `new
   * Function` is blocked by any page with a strict CSP — which real apps have.
   * Declaring the functions in an init script sidesteps both: no eval, no
   * argument marshalling, and the definitions survive client-side navigation.
   */
  const install = [
    `window.__redpenDetect = ${detectorSource()};`,
    `window.__redpenFingerprint = ${fingerprintSource()};`,
    `window.__redpenSurface = ${surfaceSource()};`,
  ].join('\n');

  let browser: BrowserLike;
  try {
    browser = await pw.chromium.launch({ headless: true });
  } catch (err) {
    return {
      ...empty,
      unavailable: `could not launch chromium: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // ruleId -> evidence, accumulated across every url and viewport
  const hits = new Map<string, Evidence[]>();
  const fingerprints: Fingerprint[] = [];
  const screenshots = new Map<string, string>();
  const detectedSurfaces = new Map<string, SurfaceVerdict>();
  const detectorErrors: string[] = [];
  /** url -> where it actually went, so the caller can say so once per url. */
  const redirected = new Map<string, string>();

  const widest = Math.max(...opts.viewports);

  /**
   * Which passes to run, as (viewport, scheme) pairs.
   *
   * Every pass before this one opened a default context, so `prefers-color-
   * scheme: dark` never applied and half of a themed app went unscanned. A
   * project's dark `--on-danger` measured 3.14:1 on its only destructive
   * control — below AA, on a confirmation page — and redpen reported the light
   * value of 6.15 and called it clean.
   *
   * Dark runs at the widest viewport only. What it uniquely catches is colour,
   * and colour does not change with width, so a second full sweep would double
   * the wall clock to re-measure layout that cannot differ.
   */
  let wantsDark = opts.schemes?.includes('dark') ?? false;
  let stamp: ThemeStamp | null = null;
  if (opts.schemes === undefined || opts.autoScheme) {
    // Probe once rather than assuming. A site with no dark theme should not pay
    // for a pass whose findings would be identical to the light one.
    const probe = await probeDarkTheme(browser, opts.urls[0]!);
    wantsDark = probe.media;
    stamp = probe.stamp;
  }

  const passes: Array<{ width: number; scheme: 'light' | 'dark'; stamp?: ThemeStamp }> = [];
  for (const width of opts.viewports) passes.push({ width, scheme: 'light' });
  if (wantsDark) passes.push({ width: widest, scheme: 'dark' });
  // A theme driven by an attribute or a class is a different code path from
  // one driven by the media query, and a page can be right under one and wrong
  // under the other. Emulating the preference never exercises the toggle.
  if (stamp) passes.push({ width: widest, scheme: 'light', stamp });

  try {
    for (const url of opts.urls) {
      for (const { width, scheme, stamp: stampFor } of passes) {
        let stampScript: string | null = null;
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          deviceScaleFactor: 1,
          reducedMotion: 'no-preference',
          colorScheme: scheme,
          ...(opts.storageState ? { storageState: opts.storageState } : {}),
        });
        const page = await context.newPage();
        await page.addInitScript(ERROR_TRAP);
        await page.addInitScript(install);
        if (stampFor) {
          // An init script runs at document creation, when documentElement may
          // not exist yet — setting it unguarded threw, and the only sign was a
          // console-error finding that fired on the stamped pass alone. Apply as
          // early as possible, then again once the element is certainly there.
          const apply =
            stampFor.kind === 'class'
              ? `document.documentElement.classList.add(${JSON.stringify(stampFor.value)})`
              : `document.documentElement.setAttribute(${JSON.stringify(stampFor.name)}, ${JSON.stringify(stampFor.value)})`;
          await page.addInitScript(
            `(function () {
              function set() { if (document.documentElement) { ${apply}; return true; } return false; }
              if (!set()) document.addEventListener('DOMContentLoaded', set);
            })();`,
          );
          stampScript = `(function () { ${apply}; })()`;
        }

        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
        } catch {
          // A slow page is still worth inspecting; a dead one is not.
          try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 });
          } catch (err) {
            // Playwright's navigation errors carry a multi-line call log, and
            // one dev server that is not running produces the same one at every
            // viewport. Printed whole that is a dozen lines of noise around the
            // one fact that matters, so keep the first line and let the
            // deduplication below collapse the repeats.
            const detail = (err instanceof Error ? err.message : String(err)).split('\n')[0]!.trim();
            detectorErrors.push(`${url} @${width}px ${scheme}: ${detail}`);
            await context.close();
            continue;
          }
        }

        /**
         * Where the browser actually landed.
         *
         * Asking for `/dashboard` on an app that requires a session lands on
         * `/login`, and nothing here compared the two — so redpen produced a
         * clean, confident, fully scored report about a login page, labelled
         * with the dashboard's url, and classified it as a `persuade` surface
         * for good measure. Silently answering a different question is the
         * worst failure this tool has, because every safeguard downstream is
         * working correctly on the wrong page.
         *
         * A same-path redirect is normal — a trailing slash, a locale prefix,
         * a canonical host. A different path is a different page.
         */
        const landed = page.url();
        if (differentPage(url, landed)) {
          redirected.set(url, landed);
          detectorErrors.push(
            `${url} redirected to ${landed} — not scanned. ` +
              'A page that sends the browser somewhere else is not the page you asked about; ' +
              'if it needs a session, capture one with `redpen login`.',
          );
          await context.close();
          continue;
        }

        // Read the stamp back off the page rather than trusting that setting
        // it worked. The first version labelled every hit from the pass config,
        // so when the init script threw before documentElement existed the
        // evidence still said "data-theme=dark" for a context the page had
        // never entered — confidently wrong, which is worse than absent.
        // Report what was observed, never what was requested.
        let observedStamp: string | null = null;
        if (stampFor) {
          if (stampScript) await page.evaluate(stampScript);
          observedStamp = await page.evaluate<string | null>(
            stampFor.kind === 'class'
              ? `document.documentElement.classList.contains(${JSON.stringify(stampFor.value)}) ? 'class=' + ${JSON.stringify(stampFor.value)} : null`
              : `document.documentElement.getAttribute(${JSON.stringify(stampFor.name)}) === ${JSON.stringify(stampFor.value)} ? ${JSON.stringify(stampFor.name)} + '=' + ${JSON.stringify(stampFor.value)} : null`,
          );
          if (!observedStamp) {
            // The pass cannot mean what it was for, so it must not be reported
            // as if it did. Skipping is right: its findings would be duplicates
            // of the light pass wearing a dark label.
            detectorErrors.push(
              `${url}: could not apply ${stampFor.name}=${stampFor.value} to the page, so the toggled-theme pass was skipped rather than reported under a theme it never entered`,
            );
            await page.close();
            await context.close();
            continue;
          }
        }
        await page.waitForTimeout(opts.settleMs ?? 900);

        const found = await page.evaluate<DetectorHit[]>(
          `window.__redpenDetect(${JSON.stringify(specs)})`,
        );
        for (const h of found ?? []) {
          if (h.ruleId === '__detector_error__') {
            detectorErrors.push(`${h.selector}: ${h.excerpt}`);
            continue;
          }
          const list = hits.get(h.ruleId) ?? [];
          list.push({
            channel: 'render',
            location: url,
            selector: h.selector,
            viewport: width,
            scheme: observedStamp ? 'dark' : scheme,
            themeStamp: observedStamp ?? undefined,
            excerpt: h.excerpt,
          });
          hits.set(h.ruleId, list);
        }

        // Fingerprint once per url, at the widest viewport, because the
        // structural signature is a desktop-layout property.
        if (width === widest && scheme === 'light' && !stampFor) {
          const signals = await page.evaluate<SurfaceSignals>('window.__redpenSurface()');
          if (signals) detectedSurfaces.set(url, classify(signals));

          const raw = await page.evaluate<RawFingerprint>('window.__redpenFingerprint()');
          fingerprints.push({
            page: url,
            recordedAt: new Date().toISOString(),
            ...raw,
          });

          if (opts.screenshotDir) {
            const file = `${opts.screenshotDir}/${slug(url)}.png`;
            await page.screenshot({ path: file, fullPage: true });
            screenshots.set(url, file);
          }
        }

        await page.close();
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  const findings: RawFinding[] = [];
  for (const [ruleId, evidence] of hits) {
    findings.push({ ruleId, channel: 'render', evidence: evidence.slice(0, 12) });
  }

  return {
    findings,
    fingerprints,
    screenshots,
    detectedSurfaces,
    unavailable: detectorErrors.length ? summariseErrors(detectorErrors) : null,
  };
}

/**
 * Does this page actually ship a dark theme?
 *
 * Two ways to have one: a prefers-color-scheme rule in a stylesheet, or a
 * repaint under an emulated dark preference. The second catches themes driven
 * by a class or a data attribute that follows the media query, which the first
 * cannot see. Same-origin stylesheets only — a cross-origin sheet throws on
 * .cssRules and is not worth a permission fight.
 */
async function probeDarkTheme(
  browser: BrowserLike,
  url: string,
): Promise<{ media: boolean; stamp: ThemeStamp | null }> {
  const read = async (scheme: 'light' | 'dark') => {
    const context = await browser.newContext({ colorScheme: scheme });
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 });
      return await page.evaluate<{ declared: boolean; stamp: ThemeStamp | null; paint: string }>(`(function () {
        var declared = false;
        var stamp = null;
        for (var i = 0; i < document.styleSheets.length; i++) {
          try {
            var rules = document.styleSheets[i].cssRules;
            for (var j = 0; j < rules.length; j++) {
              var r = rules[j];
              if (r.conditionText && /prefers-color-scheme/.test(r.conditionText)) declared = true;
              // A theme the page drives itself, rather than one the OS asks for.
              var sel = r.selectorText;
              if (!sel) continue;
              var attr = /\\[data-([\\w-]+)\\s*[~|^$*]?=\\s*["\']?(dark|night)["\']?\\]/i.exec(sel);
              if (attr && !stamp) stamp = { kind: 'attribute', name: 'data-' + attr[1], value: attr[2] };
              if (!stamp && /(^|[\\s,>+~])(html|:root|body)?\\.dark\\b/.test(sel)) {
                stamp = { kind: 'class', name: 'class', value: 'dark' };
              }
            }
          } catch (e) { /* cross-origin sheet */ }
        }
        var cs = getComputedStyle(document.body);
        return { declared: declared, stamp: stamp, paint: cs.backgroundColor + '|' + cs.color };
      })()`);
    } catch {
      return null;
    } finally {
      await context.close();
    }
  };

  const light = await read('light');
  if (!light) return { media: false, stamp: null };
  if (light.declared) return { media: true, stamp: light.stamp };
  const dark = await read('dark');
  const media = !!dark && dark.paint !== light.paint;
  return { media, stamp: light.stamp };
}

function slug(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'page';
}
