import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanVision } from '../dist/channels/vision.js';
import { rulesForChannel } from '../dist/corpus/load.js';

/**
 * The vision channel's API call needs credentials this test environment does
 * not have, so what is tested here is the property that actually matters for
 * correctness: every path that cannot observe the page must SAY it could not
 * observe the page. A channel that returns `{findings: [], unavailable: null}`
 * when it never ran is indistinguishable from a clean result, and that is the
 * one bug this design exists to prevent.
 */

function withoutCredentials(fn) {
  const key = process.env.ANTHROPIC_API_KEY;
  const token = process.env.ANTHROPIC_AUTH_TOKEN;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_AUTH_TOKEN;
  try {
    return fn();
  } finally {
    if (key !== undefined) process.env.ANTHROPIC_API_KEY = key;
    if (token !== undefined) process.env.ANTHROPIC_AUTH_TOKEN = token;
  }
}

test('no screenshots reports unavailable rather than clean', async () => {
  const result = await scanVision({ screenshots: new Map() });
  assert.deepEqual(result.findings, []);
  assert.match(result.unavailable, /screenshot/i);
});

test('no credentials reports unavailable rather than clean', async () => {
  const result = await withoutCredentials(() =>
    scanVision({ screenshots: new Map([['http://x', '/nonexistent.png']]) }),
  );
  assert.deepEqual(result.findings, []);
  assert.match(result.unavailable, /credential/i);
});

test('an unreadable screenshot is reported, not swallowed', async () => {
  const key = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'sk-ant-test-not-a-real-key';
  try {
    const result = await scanVision({
      screenshots: new Map([['http://x', '/definitely/not/a/file.png']]),
    });
    assert.deepEqual(result.findings, []);
    assert.ok(result.unavailable, 'a failed read must surface as unavailable');
  } finally {
    if (key === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = key;
  }
});

test('already-confirmed rules are skipped so the pass is not paid for twice', async () => {
  const all = rulesForChannel('vision').map((r) => r.id);
  assert.ok(all.length > 0, 'the corpus must declare some vision rules');

  const result = await scanVision({
    screenshots: new Map([['http://x', '/nonexistent.png']]),
    alreadyConfirmed: new Set(all),
  });
  // Every rule filtered out — the channel returns early with nothing to ask,
  // and that is a legitimately empty result, not a failure.
  assert.deepEqual(result.findings, []);
  assert.equal(result.unavailable, null);
  assert.equal(result.tokens, 0);
});

test('every vision rule asks a question whose yes-answer means the tell is present', () => {
  for (const r of rulesForChannel('vision')) {
    assert.ok(r.vision?.ask, `${r.id} declares vision but asks nothing`);
    assert.ok(
      r.vision.ask.trim().endsWith('?'),
      `${r.id}: the ask must be phrased as a question — got "${r.vision.ask.slice(0, 60)}"`,
    );
  }
});
