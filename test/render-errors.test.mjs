import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summariseErrors } from '../dist/channels/render.js';

/**
 * What the reader sees when the dev server is not running.
 *
 * This is the most common failure of the render channel and it was the ugliest
 * thing redpen printed: Playwright attaches a multi-line call log to every
 * navigation error, the same error happens at every viewport, and the raw list
 * was joined and printed whole. Twelve lines of noise around one fact.
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
