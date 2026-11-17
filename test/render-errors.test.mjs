import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summariseErrors } from '../dist/channels/render.js';

/**
 * What the reader sees when the dev server is not running.
 *
 * This is the most common failure of the render channel. Playwright attaches a
 * multi-line call log to every navigation error and the same error happens at
 * every viewport, so the raw list printed whole is a dozen lines of noise
 * around one fact.
 */

test('one failure repeated across viewports is said once', () => {
  const out = summariseErrors([
    'http://localhost:3000 @375px light: net::ERR_CONNECTION_REFUSED',
    'http://localhost:3000 @768px light: net::ERR_CONNECTION_REFUSED',
    'http://localhost:3000 @1440px light: net::ERR_CONNECTION_REFUSED',
  ]);
  assert.equal(
    out.match(/ERR_CONNECTION_REFUSED/g).length,
    1,
    `said it ${out.match(/ERR_CONNECTION_REFUSED/g).length} times: ${out}`,
  );
  // ...but every context it happened in is still named, because "it failed
  // somewhere" is the kind of half-report this project keeps removing.
  for (const w of ['@375px', '@768px', '@1440px']) {
    assert.ok(out.includes(w), `${w} was dropped: ${out}`);
  }
});

test('two different failures stay two failures', () => {
  const out = summariseErrors([
    'http://a @375px light: net::ERR_CONNECTION_REFUSED',
    'http://b @375px light: Timeout 30000ms exceeded',
  ]);
  assert.match(out, /ERR_CONNECTION_REFUSED/);
  assert.match(out, /Timeout 30000ms exceeded/);
});

test('it fits on a line rather than running to a call log', () => {
  const out = summariseErrors([
    'http://localhost:3000 @375px light: net::ERR_CONNECTION_REFUSED',
    'http://localhost:3000 @768px light: net::ERR_CONNECTION_REFUSED',
  ]);
  assert.ok(!out.includes('\n'), `still multi-line: ${JSON.stringify(out)}`);
});

/**
 * Four false positives a live app is right to argue with.
 *
 * Each of these is asserted against the detector source rather than a live
 * browser, because the fix is the condition, and a test that needs a dev
 * server running is a test nobody runs.
 */

test('a hero is a screenful, not a page that happens to start with one', async () => {
  // `main > section:first-child` can match the whole content column, where a
  // centred prose measure naturally puts two dozen elements on one axis.
  // Height alone cannot separate it; what makes it not a hero is structural: an
  // opener does not contain the rest of the sections.
  const { detectorSource } = await import('../dist/channels/detectors.js');
  const src = detectorSource();
  const check = src.slice(src.indexOf("CHECKS['centered-axis-stack']"), src.indexOf("CHECKS['centered-axis-stack']") + 2200);
  assert.match(check, /querySelectorAll\('section, article'\)\.length > 1/);
  assert.match(check, /maxHeroVh/);
});

test('a face the page loads is declared, however the framework declared it', async () => {
  // next/font emits @font-face and sets no font custom property, so the
  // framework's own recommended setup must not read as type-system drift.
  const { detectorSource } = await import('../dist/channels/detectors.js');
  const src = detectorSource();
  const check = src.slice(src.indexOf("CHECKS['font-family-drift']"));
  assert.match(check.slice(0, 1600), /document\.fonts/);
  assert.match(check.slice(0, 1600), /f in loaded/);
});

test('background texture is not an assembled illustration', async () => {
  // A full-bleed topographic wash — pointer-events:none, fixed, behind the
  // content — is background texture, not an assembled illustration.
  const { detectorSource } = await import('../dist/channels/detectors.js');
  const src = detectorSource();
  const check = src.slice(src.indexOf("CHECKS['primitive-shape-cluster']"));
  assert.match(check.slice(0, 900), /pointerEvents === 'none'/);
  assert.match(check.slice(0, 900), /zIndex/);
});

test('a measure finding says which bound it crossed', async () => {
  // It is a range check, so 44ch and 79ch are opposite problems with opposite
  // fixes, and the message has to say which one it is.
  const { detectorSource } = await import('../dist/channels/detectors.js');
  const src = detectorSource();
  const check = src.slice(src.indexOf("CHECKS['measure-range']"));
  assert.match(check.slice(0, 1600), /narrower than/);
  assert.match(check.slice(0, 1600), /wider than/);
});

test('framework dev tooling is not the product', async () => {
  // redpen is pointed at a dev server by design, and every stack mounts
  // something there. TanStack Query's devtools button is a 64px svg of 31
  // primitive shapes, and it is not part of the product.
  const { detectorSource } = await import('../dist/channels/detectors.js');
  const src = detectorSource();
  assert.match(src, /DEV_TOOL_SELECTOR/);
  for (const marker of ['tsqd-', 'nextjs-portal', 'vite-error-overlay']) {
    assert.ok(src.includes(marker), `${marker} must be excluded`);
  }
  // The exclusion has to sit in all(), or it only covers the rules that
  // remembered to ask for it.
  const allFn = src.slice(src.indexOf('function all(sel)'), src.indexOf('function all(sel)') + 300);
  assert.match(allFn, /isDevTooling/);
});
