import { rulesForChannel } from '../corpus/load.js';
import { detectorSource, type DetectorSpec, type DetectorHit } from './detectors.js';
import { fingerprintSource, type RawFingerprint } from '../fingerprint/extract.js';
import { surfaceSource, classify, type SurfaceSignals } from './surface.js';
import type { SurfaceVerdict } from './surface.js';
import type { RawFinding, Evidence, Fingerprint } from '../types.js';

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
  close(): Promise<void>;
}

interface PageLike {
  setViewportSize(size: { width: number; height: number }): Promise<void>;
  goto(url: string, opts?: Record<string, unknown>): Promise<unknown>;
  waitForTimeout(ms: number): Promise<void>;
  evaluate<T>(expression: string): Promise<T>;
  addInitScript(script: string): Promise<void>;
  screenshot(opts: Record<string, unknown>): Promise<Buffer>;
  on(event: string, handler: (payload: unknown) => void): void;
  close(): Promise<void>;
}

async function loadPlaywright(): Promise<PlaywrightModule | null> {
  try {
    // Indirect specifier so the compiler does not require playwright to be
    // installed — it is an optional peer dependency, and a source-only scan
    // must keep working without a browser on the machine.
    const specifier = 'playwright';
    return (await import(specifier)) as unknown as PlaywrightModule;
  } catch {
    return null;
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

  const pw = await loadPlaywright();
  if (!pw) {
    return {
      ...empty,
      unavailable:
        'playwright is not installed — run `npm i -D playwright && npx playwright install chromium` to enable the render channel',
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
  if (opts.schemes === undefined || opts.autoScheme) {
    // Probe once rather than assuming. A site with no dark theme should not pay
    // for a pass whose findings would be identical to the light one.
    wantsDark = await probeDarkTheme(browser, opts.urls[0]!);
  }

  const passes: Array<{ width: number; scheme: 'light' | 'dark' }> = [];
  for (const width of opts.viewports) passes.push({ width, scheme: 'light' });
  if (wantsDark) passes.push({ width: widest, scheme: 'dark' });

  try {
    for (const url of opts.urls) {
      for (const { width, scheme } of passes) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          deviceScaleFactor: 1,
          reducedMotion: 'no-preference',
          colorScheme: scheme,
        });
        const page = await context.newPage();
        await page.addInitScript(ERROR_TRAP);
        await page.addInitScript(install);

        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
        } catch {
          // A slow page is still worth inspecting; a dead one is not.
          try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 });
          } catch (err) {
            detectorErrors.push(`${url} @${width}px ${scheme}: ${err instanceof Error ? err.message : err}`);
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
            scheme,
            excerpt: h.excerpt,
          });
          hits.set(h.ruleId, list);
        }

        // Fingerprint once per url, at the widest viewport, because the
        // structural signature is a desktop-layout property.
        if (width === widest && scheme === 'light') {
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
    unavailable: detectorErrors.length ? detectorErrors.join('; ') : null,
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
async function probeDarkTheme(browser: BrowserLike, url: string): Promise<boolean> {
  const read = async (scheme: 'light' | 'dark') => {
    const context = await browser.newContext({ colorScheme: scheme });
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 });
      return await page.evaluate<{ declared: boolean; paint: string }>(`(function () {
        var declared = false;
        for (var i = 0; i < document.styleSheets.length; i++) {
          try {
            var rules = document.styleSheets[i].cssRules;
            for (var j = 0; j < rules.length; j++) {
              if (rules[j].conditionText && /prefers-color-scheme/.test(rules[j].conditionText)) {
                declared = true;
              }
            }
          } catch (e) { /* cross-origin sheet */ }
        }
        var cs = getComputedStyle(document.body);
        return { declared: declared, paint: cs.backgroundColor + '|' + cs.color };
      })()`);
    } catch {
      return null;
    } finally {
      await context.close();
    }
  };

  const light = await read('light');
  if (!light) return false;
  if (light.declared) return true;
  const dark = await read('dark');
  return !!dark && dark.paint !== light.paint;
}

function slug(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'page';
}
