import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rmSync } from 'node:fs';
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
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };

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

let cleanUrl;
let sloppyUrl;
let appUrl;

before(async () => {
  if (!HAS_BROWSER) return;
  cleanUrl = await serve(join(HERE, 'fixtures', 'clean'));
  sloppyUrl = await serve(join(HERE, 'fixtures', 'sloppy'));
  appUrl = await serve(join(HERE, 'fixtures', 'app'));
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
 * Both shapes below were misclassified in the field and the reason string gave
 * the bug away: per-row action buttons were being counted as "repeated CTAs",
 * so a list of records read as a landing page.
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
  // They disagreed by nine points and a whole verdict band, because why-score
  // scored everything in scope while scan scores only what meets the
  // confidence floor — so the command you run to improve the score was the
  // pessimistic one.
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
