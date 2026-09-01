import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Every number the prose claims about the corpus, checked against the corpus.
 *
 * This exists because the counts drifted three separate times in two days —
 * rules, then surface-scoped rules, then the test total — and each time the
 * only thing that caught it was someone deciding to recount by hand. A tool
 * whose whole pitch is "it only says what it observed" cannot ship a README
 * claiming 116 tests when there are 125.
 *
 * The claims stay as patterns over the prose rather than as a generated table,
 * because prose should read like prose. What it must not do is disagree with
 * the code.
 *
 * Every assertion runs in one test on purpose: a test file that generates its
 * tests in a loop cannot count its own tests, and this file has to.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

function corpus() {
  const files = readdirSync(join(ROOT, 'rules')).filter((f) => f.endsWith('.yaml'));
  const text = files.map((f) => read(join('rules', f))).join('\n');
  return {
    categories: files.length,
    rules: (text.match(/^- id:/gm) ?? []).length,
    scoped: (text.match(/^ {2}surfaces:/gm) ?? []).length,
    advisory: (text.match(/^ {2}advisory: true$/gm) ?? []).length,
    upstreamRefs: (text.match(/\{ origin: (?:catalogue|study|heuristics), ref:/g) ?? []).length,
    sourceBlocks: (text.match(/^ {2}sources:/gm) ?? []).length,
  };
}

/** Every `test(` in the suite is one test, which is why this file has one. */
function suiteSize() {
  return readdirSync(join(ROOT, 'test'))
    .filter((f) => f.endsWith('.test.mjs'))
    .reduce((n, f) => n + (read(join('test', f)).match(/^test\(/gm) ?? []).length, 0);
}

test('the prose agrees with the corpus it describes', () => {
  const c = corpus();
  const claims = [
    ['README.md', /merges them into (\d+) rules/, c.rules],
    ['README.md', /(\d+) rules are marked this way/, c.advisory],
    ['README.md', /(\d+) rules are scoped accordingly/, c.scoped],
    ['README.md', /corpus is (\d+) rules across/, c.rules],
    ['README.md', /rules across (\d+) categories/, c.categories],
    ['README.md', /the suite is (\d+) tests/, suiteSize()],
    ['README.md', /^ {2}(\d+) rules merged from:/m, c.rules],
    ['NOTICE', /(\d+) rules collapsed from/, c.rules],
    ['NOTICE', /collapsed from (\d+)\s*\n?\s*upstream references/, c.upstreamRefs],
    // Shipped metadata drifts too, and nobody reads it — both of these were
    // still advertising 113 rules six rules later.
    // `design rules` became `rules` when the corpus stopped being only about
    // design — it reads code and documents now. The pattern tracks the wording
    // rather than pinning it, so a future rename fails loudly instead of
    // silently dropping the claim from the check.
    ['.claude-plugin/plugin.json', /(\d+) (?:design )?rules merged/, c.rules],
    ['.claude-plugin/marketplace.json', /(\d+) (?:design )?rules merged/, c.rules],
  ];

  const wrong = [];
  for (const [file, pattern, expected] of claims) {
    const m = read(file).match(pattern);
    // A claim that has vanished from the prose is also a failure. Otherwise the
    // way to make this test pass is to delete the sentence it checks.
    if (!m) {
      wrong.push(`${file}: no sentence matches ${pattern} — did the wording change?`);
      continue;
    }
    if (Number(m[1]) !== expected) {
      wrong.push(`${file}: "${m[0].trim()}" but the code says ${expected}`);
    }
  }
  assert.deepEqual(wrong, [], `\n${wrong.join('\n')}\n`);
});

test('every rule carries at least one source', () => {
  const c = corpus();
  assert.equal(c.sourceBlocks, c.rules, `${c.rules} rules but ${c.sourceBlocks} sources blocks`);
});
