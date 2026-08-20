import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runScan } from '../dist/scan.js';
import { CODE_CATEGORIES } from '../dist/scan.js';

/**
 * The source a project is written in, rather than the page it serves.
 *
 * Two categories, both source-channel, both outside a UI scan on purpose: they
 * fired on redpen's own src the moment they existed, and folding them into
 * `scan` would have moved every score anyone holds a baseline against.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const CODE_RULES = [
  'edit-narrating-comment',
  'signature-restating-docstring',
  'stub-shipped',
  'swallowed-error',
  'defensive-impossible-check',
  'orchestration-marker',
  'agent-attribution',
  'conversation-artifact',
  'dead-scaffold-reference',
];

const scanCode = (fixture) =>
  runScan({ root: join(HERE, 'fixtures', fixture), codeCategories: true, ephemeral: true });

test('every code rule fires on the shape it describes', async () => {
  const result = await scanCode('sloppy-code');
  const fired = new Set(result.findings.map((f) => f.ruleId));
  for (const id of CODE_RULES) {
    assert.ok(fired.has(id), `${id} did not fire on the shape it describes`);
  }
});

test('none of them fire on code written without them', async () => {
  const result = await scanCode('clean-code');
  assert.deepEqual(
    result.findings.map((f) => f.ruleId),
    [],
    'a rule fired on code that does not have the defect',
  );
});

test('a caught error with a stated reason is a decision, not a swallow', async () => {
  // The rule's own fix says so, and the first version contradicted it — firing
  // on redpen's `catch (e) { /* cross-origin stylesheet */ }`, which is exactly
  // the shape the advice calls correct. Same principle as redpen-ignore: the
  // reason is what makes it a decision.
  const result = await scanCode('clean-code');
  assert.ok(
    !result.findings.some((f) => f.ruleId === 'swallowed-error'),
    'a catch carrying its reason was reported as swallowing',
  );

  const sloppy = await scanCode('sloppy-code');
  const swallow = sloppy.findings.find((f) => f.ruleId === 'swallowed-error');
  assert.ok(swallow, 'an empty catch should still be reported');
  const seen = swallow.evidence.map((e) => e.excerpt ?? '').join('\n');
  assert.match(seen, /catch|ignore/, seen);
});

test('a UI scan never returns a code finding, and a code scan never returns a UI one', async () => {
  // The gate that keeps existing baselines meaningful.
  const ui = await runScan({ root: join(HERE, 'fixtures', 'sloppy-code'), ephemeral: true });
  const leaked = ui.findings.filter((f) => CODE_CATEGORIES.has(f.category));
  assert.deepEqual(leaked.map((f) => f.ruleId), [], 'code rules leaked into a UI scan');

  const code = await scanCode('sloppy');
  const wrongWay = code.findings.filter((f) => !CODE_CATEGORIES.has(f.category));
  assert.deepEqual(wrongWay.map((f) => f.ruleId), [], 'UI rules leaked into a code scan');
});

test("redpen's own source stays clean of what it reports", async () => {
  // A real-world check rather than a fixture: the code that ships the rules has
  // to pass them. It found three catches in detectors.ts the first time, which
  // turned out to be the rule's fault rather than the code's.
  const result = await runScan({
    root: join(HERE, '..', 'src'),
    codeCategories: true,
    ephemeral: true,
  });
  const found = result.findings.map((f) => `${f.ruleId} — ${f.evidence[0]?.location}:${f.evidence[0]?.line}`);
  assert.deepEqual(found, [], `redpen's own source trips its own code rules:\n${found.join('\n')}`);
});
