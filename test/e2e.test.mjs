import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rmSync, readFileSync, writeFileSync } from 'node:fs';
import { runScan } from '../dist/scan.js';

/**
 * The end-to-end claim, stated as a test:
 *
 *   a deliberately-designed page scores near 100 and raises no confirmed
 *   findings, the same page rebuilt out of defaults scores near 0, and two
 *   pages that differ only in palette are reported as the same page.
 *
 * If any of those three stop holding, the product does not work, whatever the
 * unit tests say.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
// An unlisted type falls through to text/plain, so an <img src="*.svg"> never
// decodes and naturalWidth stays 0, which silently disables every rule that
// reasons about image size.
const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
};

let servers = [];

function serve(dir) {
  const server = createServer(async (req, res) => {
    const path = (req.url ?? '/').split('?')[0];
    const file = join(dir, path === '/' ? 'index.html' : path.slice(1));
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'text/plain' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      servers.push(server);
      resolve(`http://127.0.0.1:${server.address().port}`);
    });
  });
}

async function playwrightAvailable() {
  try {
    await import('playwright');
    return true;
  } catch {
    return false;
  }
}

const HAS_BROWSER = await playwrightAvailable();
const opts = { skip: HAS_BROWSER ? false : 'playwright not installed' };

// pricing.html is the sloppy page with every hue swapped and nothing else
// changed. It is written here rather than checked in so the two pages cannot
// drift apart in structure.
const HUE_SWAP = {
  '#7c3aed': '#0f766e',
  '#6366f1': '#0d9488',
  '#3b82f6': '#14b8a6',
  '#8b5cf6': '#0f766e',
  '#ec4899': '#f59e0b',
  '#a855f7': '#2dd4bf',
  'rgba(124, 58, 237, 0.1)': 'rgba(15, 118, 110, 0.1)',
};

function writePaletteSwap(dir) {
  const html = readFileSync(join(dir, 'index.html'), 'utf8').replace('style.css', 'pricing.css');
  let css = readFileSync(join(dir, 'style.css'), 'utf8');
  for (const [from, to] of Object.entries(HUE_SWAP)) css = css.split(from).join(to);
  writeFileSync(join(dir, 'pricing.html'), html);
  writeFileSync(join(dir, 'pricing.css'), css);
}

let cleanUrl;
let sloppyUrl;
let appUrl;

before(async () => {
  if (!HAS_BROWSER) return;
  cleanUrl = await serve(join(HERE, 'fixtures', 'clean'));
  sloppyUrl = await serve(join(HERE, 'fixtures', 'sloppy'));
  appUrl = await serve(join(HERE, 'fixtures', 'app'));
  writePaletteSwap(join(HERE, 'fixtures', 'sloppy'));
  for (const d of ['clean', 'sloppy', 'app']) {
    rmSync(join(HERE, 'fixtures', d, '.redpen'), { recursive: true, force: true });
  }
});

after(() => {
  for (const s of servers) s.close();
  servers = [];
});

test('a deliberately-designed page scores clean', opts, async () => {
  const result = await runScan({
    root: join(HERE, 'fixtures', 'clean'),
    urls: [cleanUrl],
    viewports: [1440],
    ephemeral: true,
  });

  assert.ok(result.channelsRun.includes('render'), 'the render channel must have run');
  const confirmed = result.findings.filter((f) => f.confidence === 'confirmed');
  assert.deepEqual(
    confirmed.map((f) => f.ruleId),
    [],
    `expected no confirmed findings on the clean fixture, got ${confirmed.map((f) => f.ruleId).join(', ')}`,
  );
  assert.ok(result.score >= 90, `clean fixture scored ${result.score}, expected >= 90`);
});

test('the same page built from defaults scores as slop', opts, async () => {
  const result = await runScan({
    root: join(HERE, 'fixtures', 'sloppy'),
    urls: [sloppyUrl],
    viewports: [1440],
    ephemeral: true,
  });

  assert.ok(result.score <= 25, `sloppy fixture scored ${result.score}, expected <= 25`);

  const confirmed = new Set(
    result.findings.filter((f) => f.confidence === 'confirmed').map((f) => f.ruleId),
  );
  // The tells the Reddit study ranks highest must all be caught, and caught by
  // more than one channel — that is the entire promise of the merge.
  for (const id of ['ai-purple', 'gradient-text', 'hero-three-cards', 'emoji-as-icon', 'default-sans']) {
    assert.ok(confirmed.has(id), `${id} should be confirmed on the sloppy fixture`);
  }
});

test('cross-channel agreement is what produces confirmation', opts, async () => {
  const result = await runScan({
    root: join(HERE, 'fixtures', 'sloppy'),
    urls: [sloppyUrl],
    viewports: [1440],
    ephemeral: true,
  });
  const purple = result.findings.find((f) => f.ruleId === 'ai-purple');
  assert.ok(purple.channels.includes('source'));
  assert.ok(purple.channels.includes('render'));
});

test('render disagreement demotes a source-only guess', opts, async () => {
  // The clean fixture ships a skip link and aria-current. The source regexes
  // cannot see either, so they fire; the render channel checks the real DOM and
  // does not confirm. Those findings must not reach the reader or the score.
  const result = await runScan({
    root: join(HERE, 'fixtures', 'clean'),
    urls: [cleanUrl],
    viewports: [1440],
    ephemeral: true,
  });

  for (const id of ['no-skip-link', 'no-active-nav-state']) {
    const f = result.findings.find((x) => x.ruleId === id);
    if (!f) continue;
    assert.equal(f.confidence, 'possible', `${id} should have been demoted by the render pass`);
  }
});

test('two pages that differ only in palette are reported as the same page', opts, async () => {
  const result = await runScan({
    root: join(HERE, 'fixtures', 'sloppy'),
    urls: [sloppyUrl, `${sloppyUrl}/pricing.html`],
    viewports: [1440],
    ephemeral: true,
  });

  assert.equal(result.fingerprints.length, 2);
  const [a, b] = result.fingerprints;
  assert.notEqual(a.paletteAnchor, b.paletteAnchor, 'the fixture pages use different hues');
  assert.equal(a.macrostructure, b.macrostructure);

  assert.ok(result.clashes.length >= 1, 'a colour swap is not variety and must be reported');
  assert.ok(result.clashes[0].distance < 0.15);

  const sameness = result.findings.filter((f) => f.category === 'sameness');
  assert.ok(
    sameness.some((f) => f.ruleId === 'repeated-macrostructure'),
    'the clash must surface as a finding, not only as a diagnostic',
  );
});

test('a source-only run says so instead of reporting a clean page', opts, async () => {
  const result = await runScan({
    root: join(HERE, 'fixtures', 'sloppy'),
    urls: [],
    ephemeral: true,
  });
  assert.deepEqual(result.channelsRun, ['source']);
  assert.ok(
    result.warnings.some((w) => w.includes('render channel did not run')),
    'not looking and finding nothing must never look the same',
  );
});

/* ---- surface detection --------------------------------------------------
 * Per-row action buttons are not "repeated CTAs". Counting them would make a
 * list of records read as a landing page.
 * --------------------------------------------------------------------- */

test('a list of records with per-row controls is an operate surface', opts, async () => {
  const result = await runScan({
    root: join(HERE, 'fixtures', 'app'),
    urls: [appUrl],
    viewports: [1440],
    ephemeral: true,
  });
  const verdict = result.surfaces[appUrl];
  assert.ok(verdict, 'the page should have been classified');
  assert.equal(verdict.surface, 'operate');
  assert.equal(verdict.declared, false, 'this must come from detection, not config');
});

test('a page that is one labelled form is an operate surface', opts, async () => {
  const url = `${appUrl}/new.html`;
  const result = await runScan({
    root: join(HERE, 'fixtures', 'app'),
    urls: [url],
    viewports: [1440],
    ephemeral: true,
  });
  assert.equal(result.surfaces[url]?.surface, 'operate');
});

test('an app surface raises no slop findings and still catches real defects', opts, async () => {
  const result = await runScan({
    root: join(HERE, 'fixtures', 'app'),
    urls: [appUrl, `${appUrl}/new.html`],
    viewports: [1440],
    ephemeral: true,
  });
  // Consistent chrome across an app is the point, not a tell.
  assert.equal(result.slopScore, 100, 'an app should not be penalised for looking like an app');
  // But quality rules apply everywhere — broken is broken.
  assert.ok(result.qualityScore < 100, 'quality rules must still run on an operate surface');
  assert.ok(
    !result.findings.some((f) => f.ruleId === 'repeated-macrostructure'),
    'sameness across app routes is consistency, not slop',
  );
});

test('scan and why-score report the same number', opts, async () => {
  // why-score must score only what meets the confidence floor, as scan does,
  // or the command you run to improve the score reports a different number.
  const { explainScore } = await import('../dist/score.js');
  const { meetsThreshold } = await import('../dist/promote.js');

  const result = await runScan({
    root: join(HERE, 'fixtures', 'sloppy'),
    urls: [sloppyUrl],
    viewports: [1440],
    ephemeral: true,
  });
  const scorable = result.findings.filter((f) =>
    meetsThreshold(f, result.config.minConfidence),
  );
  assert.equal(explainScore(scorable).score, result.score);
});

test('visually-hidden content is not a finding', opts, async () => {
  // The standard clip-rect recipe looks like clipped text sitting off-canvas.
  // Flagging it would mean adding a skip link or an sr-only label *creates* two
  // findings — the tool punishing the correct accessibility pattern.
  const dir = join(HERE, 'fixtures', 'clean');
  const result = await runScan({ root: dir, urls: [cleanUrl], viewports: [1440], ephemeral: true });
  for (const id of ['text-overflow', 'body-text-viewport-edge']) {
    const f = result.findings.find((x) => x.ruleId === id);
    if (!f) continue;
    assert.ok(
      !f.evidence.some((e) => /skip|sr-only/i.test(e.selector ?? '') || /Skip to content/i.test(e.excerpt ?? '')),
      `${id} fired on visually-hidden content`,
    );
  }
});

test('bare urls on the command line are urls, not a root path', opts, async () => {
  // Taken as the root, the source channel would scan a directory that cannot
  // exist while the config's urls silently stood in for what was typed, and
  // the report would describe pages the command never named.
  const { parseArgs } = await import('../dist/cli.js');
  const args = parseArgs(['scan', 'http://127.0.0.1:9/', './src']);
  assert.deepEqual(args.urls, ['http://127.0.0.1:9/']);
  assert.deepEqual(args.positional, ['./src']);
});

test('a source pass that read nothing says so', opts, async () => {
  const result = await runScan({
    root: join(HERE, 'fixtures', 'clean', 'does-not-exist'),
    urls: [],
    ephemeral: true,
  });
  assert.ok(
    result.warnings.some((w) => w.includes('no files to read')),
    'scanning nothing must never look like a clean codebase',
  );
});

test('a run whose urls are unreachable says so rather than scoring blind', opts, async () => {
  // A confident number with nothing to say the browser never reached the
  // pages is wrong. The warning has to exist on the result for every command
  // to be able to print it.
  const result = await runScan({
    root: join(HERE, 'fixtures', 'clean'),
    // Port 9 is discard: nothing listens, so every navigation is refused.
    urls: ['http://127.0.0.1:9/'],
    viewports: [1440],
    ephemeral: true,
  });
  assert.ok(result.warnings.length > 0, 'an unreachable url must warn');
  assert.ok(
    !result.channelsRun.includes('render'),
    'a render pass that reached nothing must not count as having run',
  );
});

test('content clipped past the viewport edge is found, not passed', opts, async () => {
  // `overflow-x: clip` on the root can put nav destinations past the right
  // edge at 375px — unreachable, and measuring clean by every overflow metric,
  // because clip sets scrollWidth equal to clientWidth.
  const url = await serve(join(HERE, 'fixtures', 'clipped'));
  const result = await runScan({
    root: join(HERE, 'fixtures', 'clipped'),
    urls: [url],
    viewports: [375],
    ephemeral: true,
  });

  const f = result.findings.find((x) => x.ruleId === 'horizontal-overflow');
  assert.ok(f, 'clipped-away overflow must still be reported');
  assert.ok(
    f.evidence.some((e) => /unreachable/.test(e.excerpt ?? '')),
    'the report must say the content cannot be scrolled to',
  );

  // Both guards: the wide table lives in its own scroll container, and the
  // skip link is parked off-screen on purpose. Neither is a defect.
  const flagged = f.evidence.map((e) => e.selector ?? '').join(' ');
  assert.ok(!/table|wrap/.test(flagged), 'a table inside overflow-x:auto is the correct pattern');
  assert.ok(!/skip/.test(flagged), 'the visually-hidden skip link is not overflow');
});

test('a filled mark beside stroked icons is not two icon libraries', opts, async () => {
  // Three false positives with one cause each.
  const url = await serve(join(HERE, 'fixtures', 'marks'));
  const result = await runScan({
    root: join(HERE, 'fixtures', 'marks'),
    urls: [url],
    viewports: [1440],
    ephemeral: true,
  });
  const ids = new Set(result.findings.map((f) => f.ruleId));

  // A filled mark has no stroke; its computed stroke-width is the SVG default.
  assert.ok(!ids.has('mixed-icon-sets'), 'filled mark + stroked icon is a deliberate pairing');

  // The root carries the CSS initial color rgb(0,0,0) that nothing authored.
  assert.ok(!ids.has('zero-chroma-neutrals'), 'an unauthored UA default is not a palette choice');

  // An identifier repeating is data. Three rows naming one file is the product
  // working, not placeholder copy that survived into production.
  assert.ok(!ids.has('repeated-container-text'), 'a repeated file path is data, not placeholder copy');

  // A 12px monospace path in chrome clears the 12px chrome floor.
  const tiny = result.findings.find((f) => f.ruleId === 'tiny-text');
  assert.ok(
    !tiny || !tiny.evidence.some((e) => /prose/.test(e.excerpt ?? '')),
    'a path with no spaces in it is never prose',
  );
});

test('a contrast failure that only exists in dark mode is found', opts, async () => {
  // A default context never applies prefers-color-scheme: dark, so half of a
  // themed app would go unscanned. A destructive control at 6.15:1 light and
  // 3.14:1 dark is below AA, and only the dark pass sees it.
  const url = await serve(join(HERE, 'fixtures', 'themed'));
  const result = await runScan({
    root: join(HERE, 'fixtures', 'themed'),
    urls: [url],
    viewports: [1440],
    ephemeral: true,
  });

  const contrast = result.findings.find((f) => f.ruleId === 'low-contrast');
  assert.ok(contrast, 'the dark-mode contrast failure must be found');
  assert.ok(
    contrast.evidence.some((e) => e.scheme === 'dark'),
    'the evidence must say which scheme it was seen under',
  );
  assert.ok(
    !contrast.evidence.some((e) => e.scheme === 'light'),
    'light mode passes honestly at ~6.2:1 and must not be blamed',
  );
});

test('a color-mix control is measured against its composited ground', opts, async () => {
  // Three traps.
  //
  // 1. color-mix serialises as color(srgb r g b / a), never rgb(), so a parser
  //    that only knows rgba() returns null for every tinted control.
  // 2. The alpha is on the element being measured, not behind it. Used
  //    directly it yields 1.00:1 — the loudest possible finding, on a control
  //    that is actually past 13:1.
  // 3. One level of compositing is not enough: the input sits on a panel which
  //    sits on the body.
  //
  // The reason this needs its own fixture rather than riding on the dark-mode
  // one: the naive numbers are 1.00 in light AND 1.00 in dark. Comparing the
  // two schemes cannot find a bug that is equally wrong in both.
  const url = await serve(join(HERE, 'fixtures', 'mixed'));
  const result = await runScan({
    root: join(HERE, 'fixtures', 'mixed'),
    urls: [url],
    viewports: [1440],
    ephemeral: true,
  });

  const contrast = result.findings.find((f) => f.ruleId === 'low-contrast');
  const onControls = (contrast?.evidence ?? []).filter((e) =>
    /input|\.btn|button/.test(e.selector ?? ''),
  );
  assert.deepEqual(
    onControls.map((e) => e.excerpt),
    [],
    'a control at >13:1 must not be reported as low contrast',
  );

  // The discriminating case. A 7% tint is forgiving — dropping the unparsed
  // layer barely moves the ground, so the answer stays right by accident. A
  // near-opaque wash is not: skip it and you measure light text against the
  // light panel underneath and report a failure that does not exist.
  const onWash = (contrast?.evidence ?? []).filter((e) => /wash/.test(e.selector ?? ''));
  assert.deepEqual(
    onWash.map((e) => e.excerpt),
    [],
    'light text on a near-opaque dark wash is readable; the wash must be composited, not skipped',
  );
});

test('a theme the page toggles itself is exercised, not just the OS preference', opts, async () => {
  // Emulating prefers-color-scheme never runs the toggle's code path. This
  // fixture keeps both: the media-query block got the contrast fix and the
  // [data-theme="dark"] block did not, so the page is correct under the OS
  // preference and broken under its own switch.
  const url = await serve(join(HERE, 'fixtures', 'toggled'));
  const result = await runScan({
    root: join(HERE, 'fixtures', 'toggled'),
    urls: [url],
    viewports: [1440],
    ephemeral: true,
  });

  const contrast = result.findings.find((f) => f.ruleId === 'low-contrast');
  assert.ok(contrast, 'the toggle-only contrast failure must be found');

  const stamped = contrast.evidence.filter((e) => e.themeStamp);
  assert.ok(stamped.length, 'the finding must come from the stamped pass');
  assert.match(stamped[0].themeStamp, /data-theme=dark/);

  // The emulated dark pass is genuinely fine here, so blaming it would be wrong.
  const emulated = contrast.evidence.filter((e) => e.scheme === 'dark' && !e.themeStamp);
  assert.deepEqual(
    emulated.map((e) => e.excerpt),
    [],
    'the media-query theme passes honestly and must not be blamed',
  );
});

test('the four borrowed checks each fire on the shape they describe', opts, async () => {
  // Taken from two upstream catalogues. Each is a defect a person can act on
  // and none of them was reachable from an existing rule.
  const url = await serve(join(HERE, 'fixtures', 'borrowed'));
  const result = await runScan({
    root: join(HERE, 'fixtures', 'borrowed'),
    urls: [url],
    viewports: [1440],
    ephemeral: true,
  });
  const ids = new Set(result.findings.map((f) => f.ruleId));

  assert.ok(ids.has('input-zoom-font-size'), '14px on a text field zooms iOS and does not zoom back');
  assert.ok(ids.has('adjacent-tap-targets'), 'two 44px controls touching still produce mis-taps');
  assert.ok(ids.has('wrapped-control-label'), 'a label wrapping means the control was sized for a shorter string');
});

test('an unfilled grid row is a hole on a marketing page and a record count in an app', opts, async () => {
  // The rule is scoped away from operate deliberately: five records in a
  // three-column grid is how many records there are. On a persuade surface the
  // same shape means a sixth card was assumed and never written.
  const url = await serve(join(HERE, 'fixtures', 'ragged'));
  const result = await runScan({
    root: join(HERE, 'fixtures', 'ragged'),
    urls: [url],
    viewports: [1440],
    ephemeral: true,
  });
  assert.ok(
    result.findings.some((f) => f.ruleId === 'empty-grid-cell'),
    '5 cards in 3 columns leaves a hole in the last row',
  );

  // Pin the cause, not just the effect. The grid read as five rows of records
  // and classified the page operate at 0.8, which switched the rule off along
  // with 20 others written for exactly this kind of page.
  //
  // Abstaining is a fair outcome on a fixture this thin — what must not happen
  // is calling it operate, because that is a confident wrong answer rather
  // than an admitted absence of one.
  assert.notEqual(
    result.surfaces[url]?.surface,
    'operate',
    'a feature grid is cards side by side, not a list of records going down',
  );
});

test('a toggled-theme pass that cannot enter its theme is skipped, not relabelled', opts, async () => {
  // See test/POLICY.md. A stamp read from the pass config would label every
  // hit "data-theme=dark" even when the init script threw and the page stayed
  // light the whole time.
  const url = await serve(join(HERE, 'fixtures', 'toggled'));
  const result = await runScan({
    root: join(HERE, 'fixtures', 'toggled'),
    urls: [url],
    viewports: [1440],
    ephemeral: true,
  });

  // Every stamped label must name a theme the page was actually in, which for
  // this fixture means the contrast finding only exists under the stamp.
  for (const f of result.findings) {
    for (const e of f.evidence) {
      if (!e.themeStamp) continue;
      assert.equal(e.scheme, 'dark', 'a stamped hit is by definition a dark-theme hit');
      assert.match(e.themeStamp, /^[\w-]+=[\w-]+$/, 'the label must be a real attribute reading');
    }
  }
});

test('a control inside a card is not a card inside a card', opts, async () => {
  // Every design system gives its inputs and buttons a background, a border, a
  // radius and padding — every signal the nested-surface test looks for — so a
  // form inside a card must not read as card-in-card.
  //
  // The fixture carries both cases side by side: a card full of ordinary
  // controls, which must stay quiet, and a card genuinely inside a card, which
  // must fire. Only the second discriminates.
  const url = await serve(join(HERE, 'fixtures', 'controls'));
  const result = await runScan({
    root: join(HERE, 'fixtures', 'controls'),
    urls: [url],
    viewports: [1440],
    ephemeral: true,
  });

  const nested = result.findings.filter((f) => f.ruleId === 'nested-cards');
  assert.equal(nested.length, 1, 'the genuinely nested card should be reported');

  const on = (nested[0]?.evidence ?? []).map((e) => e.selector ?? '');
  for (const control of ['input', 'select', 'textarea', 'button']) {
    assert.ok(
      !on.some((sel) => sel.includes(control)),
      `${control} reported as a nested card: ${on.join(' | ')}`,
    );
  }
});

test('a --only filter that matches no category says so rather than reporting clean', opts, async () => {
  // `--only` takes categories and reads like it takes rule ids. A filter that
  // does not recognise its argument must never answer with a clean page.
  const url = await serve(join(HERE, 'fixtures', 'sloppy'));
  const result = await runScan({
    root: join(HERE, 'fixtures', 'sloppy'),
    urls: [url],
    viewports: [1440],
    only: ['nested-cards'],
    ephemeral: true,
  });
  assert.equal(result.findings.length, 0, 'the filter should still filter');
  assert.ok(
    result.warnings.some((w) => w.includes('no such categor')),
    `nothing warned about the unknown name: ${result.warnings.join(' | ')}`,
  );

  const real = await runScan({
    root: join(HERE, 'fixtures', 'sloppy'),
    urls: [url],
    viewports: [1440],
    only: ['layout'],
    ephemeral: true,
  });
  assert.ok(real.findings.length > 0, 'a real category should still return findings');
  assert.ok(
    !real.warnings.some((w) => w.includes('no such categor')),
    'a real category should not warn',
  );
});

test('the tells above gate forty each fire on the shape they describe', opts, async () => {
  // Five of the most specific tells in the upstream catalogue: a grid track
  // that cannot shrink, display type with no break
  // opportunity, uppercase set tighter than its own cap height, two elements
  // stuck to the same strip of viewport, and a window frame drawn out of divs.
  const url = await serve(join(HERE, 'fixtures', 'gates'));
  const result = await runScan({
    root: join(HERE, 'fixtures', 'gates'),
    urls: [url],
    viewports: [375, 1440],
    ephemeral: true,
  });
  const fired = new Set(result.findings.map((f) => f.ruleId));
  for (const id of [
    'grid-track-bare-fr',
    'display-no-word-wrap',
    'caps-tight-leading',
    'double-sticky-top',
    'redrawn-chrome',
  ]) {
    assert.ok(fired.has(id), `${id} did not fire on the shape it describes`);
  }
});

test('none of the new tells fire on a page that does not have them', opts, async () => {
  // The half that matters. A rule that fires on everything is worse than no
  // rule: display-no-word-wrap must not fire on the clean fixture's headings.
  // A single backslash does not survive a TypeScript template literal, so a
  // `\s` that becomes "s" would split on the letter.
  const url = await serve(join(HERE, 'fixtures', 'clean'));
  const result = await runScan({
    root: join(HERE, 'fixtures', 'clean'),
    urls: [url],
    viewports: [375, 1440],
    ephemeral: true,
  });
  const fired = result.findings.map((f) => f.ruleId);
  for (const id of [
    'grid-track-bare-fr',
    'display-no-word-wrap',
    'caps-tight-leading',
    'double-sticky-top',
    'redrawn-chrome',
  ]) {
    assert.ok(!fired.includes(id), `${id} fired on a page that does not have it`);
  }
});

test('every copy and marketing tell fires on the page it describes', opts, async () => {
  // The fixture is a marketing page on purpose. These rules are scoped to
  // persuade and read, and a fixture that classified as an app would gate all
  // seven copy rules off and pass having measured nothing, which is exactly
  // what test/POLICY.md warns about.
  const url = await serve(join(HERE, 'fixtures', 'prose'));
  const result = await runScan({
    root: join(HERE, 'fixtures', 'prose'),
    urls: [url],
    viewports: [1440],
    ephemeral: true,
  });
  assert.ok(
    Object.values(result.surfaces).every((v) => v.surface === 'persuade'),
    `the fixture must land on persuade or the rules under test are switched off: ${JSON.stringify(result.surfaces)}`,
  );

  const fired = new Set(result.findings.map((f) => f.ruleId));
  for (const id of [
    'tricolon-cadence',
    'hedged-claim',
    'false-breadth',
    'transition-filler',
    'significance-inflation',
    'copula-avoidance',
    'bare-noun-bullets',
    'stock-illustration',
    'nav-fingerprint',
    'footer-fingerprint',
    'decorative-no-anchor',
  ]) {
    assert.ok(fired.has(id), `${id} did not fire on the page it describes`);
  }
});

test('no copy or marketing tell fires on a page written without them', opts, async () => {
  const url = await serve(join(HERE, 'fixtures', 'clean'));
  const result = await runScan({
    root: join(HERE, 'fixtures', 'clean'),
    urls: [url],
    viewports: [1440],
    ephemeral: true,
  });
  const fired = result.findings.map((f) => f.ruleId);
  for (const id of [
    'tricolon-cadence',
    'hedged-claim',
    'false-breadth',
    'transition-filler',
    'significance-inflation',
    'copula-avoidance',
    'bare-noun-bullets',
    'stock-illustration',
    'nav-fingerprint',
    'footer-fingerprint',
    'decorative-no-anchor',
    'shadcn-default-card',
  ]) {
    assert.ok(!fired.includes(id), `${id} fired on a page that does not have it`);
  }
});

const WCAG_RULES = [
  'control-no-accessible-name',
  'target-size-minimum',
  'aria-hidden-focusable',
  'positive-tabindex',
  'duplicate-id',
  'new-window-no-warning',
];

test('each WCAG criterion fires on the failure it describes', opts, async () => {
  const url = await serve(join(HERE, 'fixtures', 'wcag'));
  const result = await runScan({
    root: join(HERE, 'fixtures', 'wcag'),
    urls: [url],
    viewports: [375],
    ephemeral: true,
  });
  const fired = new Set(result.findings.map((f) => f.ruleId));
  for (const id of WCAG_RULES) {
    assert.ok(fired.has(id), `${id} did not fire on the failure it describes`);
  }
});

test('a page that meets the criteria is not told otherwise', opts, async () => {
  // target-size-minimum needs this. WCAG 2.5.8 exempts an undersized target
  // that is spaced clear of every other target, so a 23px nav link with room
  // all round it passes.
  const url = await serve(join(HERE, 'fixtures', 'clean'));
  const result = await runScan({
    root: join(HERE, 'fixtures', 'clean'),
    urls: [url],
    viewports: [375],
    ephemeral: true,
  });
  const fired = result.findings.map((f) => f.ruleId);
  for (const id of WCAG_RULES) {
    assert.ok(!fired.includes(id), `${id} fired on a page that meets it`);
  }
});

test('the source rules find tells in a component that works', async () => {
  // Same test the code rules got, one level up. This is a stand-register form
  // that compiles and does its job, with the tells where they turn up rather
  // than where they are easy to find.
  //
  // `invented-metrics` must not depend on a fixed list of nouns: "Trusted by
  // 50,000+ land managers" is the tell whatever the audience is called. And
  // `no-loading-state` must see more than the inline handler —
  // `onClick={async () => await …}` is the tutorial shape; a real component
  // extracts the handler.
  const result = await runScan({
    root: join(HERE, 'fixtures', 'realistic-app'),
    ephemeral: true,
  });
  const fired = new Set(result.findings.map((f) => f.ruleId));
  for (const id of ['invented-metrics', 'no-loading-state', 'destructive-without-confirm']) {
    assert.ok(fired.has(id), `${id} missed a tell in a component that works`);
  }
});

/**
 * The visual tells, one page, one assertion each.
 *
 * Untried is not the same as broken, and the only way to tell them apart is to
 * build the page. This one carries eleven tells no other fixture exercises.
 */
const VISUAL_TELLS = [
  'all-caps-body',
  'animated-focus-ring',
  'animated-layout-property',
  'dark-glow',
  'glassmorphism',
  'justified-text',
  'marquee',
  'no-tabular-nums',
  'pulsing-dot',
  'text-overflow',
  'too-many-families',
];

test('every visual tell on the page is reported', opts, async () => {
  const url = await serve(join(HERE, 'fixtures', 'visual-variants'));
  const result = await runScan({
    root: join(HERE, 'fixtures', 'visual-variants'),
    urls: [url],
    viewports: [375, 1440],
    ephemeral: true,
  });
  const fired = new Set([
    ...result.findings.map((f) => f.ruleId),
    ...result.advisory.map((f) => f.ruleId),
  ]);
  const missed = VISUAL_TELLS.filter((id) => !fired.has(id));
  assert.deepEqual(missed, [], `planted and not reported: ${missed.join(', ')}`);
});

test('none of the visual tells fire on a page without them', opts, async () => {
  const url = await serve(join(HERE, 'fixtures', 'clean'));
  const result = await runScan({
    root: join(HERE, 'fixtures', 'clean'),
    urls: [url],
    viewports: [375, 1440],
    ephemeral: true,
  });
  const fired = [
    ...result.findings.map((f) => f.ruleId),
    ...result.advisory.map((f) => f.ruleId),
  ];
  const wrong = VISUAL_TELLS.filter((id) => fired.includes(id));
  assert.deepEqual(wrong, [], `fired on a page that does not have it: ${wrong.join(', ')}`);
});

test('a live region one file away is still a live region', async () => {
  // A file importing a toast is not missing a live region when the Toast
  // component carries `aria-live="polite"` one directory away. Same-line
  // suppression cannot see another file, and this is a question about the
  // project rather than the line.
  const withOne = await runScan({
    root: join(HERE, 'fixtures', 'toast-with-live'),
    ephemeral: true,
  });
  assert.ok(
    !withOne.findings.some((f) => f.ruleId === 'no-live-region'),
    'reported a project that has a live region',
  );

  // ...and a project with a toast and no live region anywhere still is one.
  const without = await runScan({
    root: join(HERE, 'fixtures', 'toast-no-live'),
    ephemeral: true,
  });
  assert.ok(
    without.findings.some((f) => f.ruleId === 'no-live-region'),
    'stopped reporting a toast with no live region anywhere',
  );
});

test('deleting saved work is destructive; editing a draft is not', async () => {
  // Form builders remove things that were never saved — removeService in a
  // deploy wizard, removeComponent on a chip in a draft, a Remove button beside
  // a row being composed. `destructive-without-confirm` is about work that is
  // saved, so it matches delete, destroy and wipe, not remove, clear or reset.
  const real = await runScan({ root: join(HERE, 'fixtures', 'realistic-app'), ephemeral: true });
  assert.ok(
    real.findings.some((f) => f.ruleId === 'destructive-without-confirm'),
    'a Delete button on saved rows with no confirm went unreported',
  );

  const draft = await runScan({ root: join(HERE, 'fixtures', 'draft-form'), ephemeral: true });
  assert.ok(
    !draft.findings.some((f) => f.ruleId === 'destructive-without-confirm'),
    'removing an item from a form nobody has submitted is not destroying work',
  );
});

test('a message that names nothing is found in markup as well as in a string', async () => {
  // `generic-error-message` must read JSX text, not just quoted literals:
  // `<p role="alert">Something went wrong.</p>` is the most ordinary way there
  // is to render one. It is case-sensitive, so the bare word `Error` does not
  // match `=== 'error'`, which is a state, not a message.
  const real = await runScan({ root: join(HERE, 'fixtures', 'realistic-app'), ephemeral: true });
  assert.ok(
    real.findings.some((f) => f.ruleId === 'generic-error-message'),
    'a generic message rendered as JSX text rather than assigned to a variable went unreported',
  );

  const draft = await runScan({ root: join(HERE, 'fixtures', 'draft-form'), ephemeral: true });
  assert.ok(
    !draft.findings.some((f) => f.ruleId === 'generic-error-message'),
    "a status literal named 'error' beside a message that says what broke is not a generic message",
  );
});

test('a note about the interface is not the interface', async () => {
  // A comment line is not the interface. This fixture is a component that does
  // everything right, with the tells written only in the prose that explains
  // why.
  const ui = await runScan({ root: join(HERE, 'fixtures', 'commented-tells'), ephemeral: true });
  const claimed = [...ui.findings, ...ui.advisory].map((f) => f.ruleId);
  assert.deepEqual(claimed, [], `reported a tell that exists only inside a comment: ${claimed}`);

  // And the exemption holds in the other direction: the two categories whose
  // subject is the comment must still read it. The same file carries
  // TODO(L2-04), which is how a phase id is actually written, not flush
  // against the comment marker.
  const code = await runScan({
    root: join(HERE, 'fixtures', 'commented-tells'),
    codeCategories: true,
    ephemeral: true,
  });
  assert.ok(
    [...code.findings, ...code.advisory].some((f) => f.ruleId === 'orchestration-marker'),
    'the comment skip silenced the categories whose whole subject is the comment',
  );
});

test('a guard written below the button still counts as a guard', async () => {
  // `destructive-without-confirm` is the only critical-severity rule in the
  // corpus. A guard is never written on the button's own line: one component
  // calls window.confirm seven lines above, another swaps the row for an
  // inline "Confirm?" step, and a third writes `onClick={async (e) => {` with
  // the check two lines *below*, inside the handler — which is what
  // suppressAfter is for.
  //
  // The fixture never says "confirm" in its own prose, because the upward
  // window would read it and the fixture would pass while testing nothing.
  const guarded = await runScan({ root: join(HERE, 'fixtures', 'guarded-delete'), ephemeral: true });
  const claimed = [...guarded.findings, ...guarded.advisory].filter(
    (f) => f.ruleId === 'destructive-without-confirm',
  );
  assert.deepEqual(
    claimed.flatMap((f) => f.evidence.map((e) => `${e.location}:${e.line}`)),
    [],
    'a delete that asks first was reported as one that does not',
  );

  // And the rule still fires where nothing asks.
  const real = await runScan({ root: join(HERE, 'fixtures', 'realistic-app'), ephemeral: true });
  assert.ok(
    real.findings.some((f) => f.ruleId === 'destructive-without-confirm'),
    'the suppression window swallowed a delete with no guard at all',
  );
});
