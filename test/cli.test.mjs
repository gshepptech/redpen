import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The commands, run as commands.
 *
 * Every other test calls the library directly, so only these catch a dispatch
 * bug. A check meant for the scan path (does this directory exist) must not
 * run before the dispatch, or `redpen why ai-purple` exits 2 with "no such
 * directory: ai-purple". The report prints `redpen why <rule-id>` under every
 * folded roster, so that command has to work.
 */

const CLI = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'cli.js');

function run(...argv) {
  try {
    return { code: 0, out: execFileSync('node', [CLI, ...argv], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) };
  } catch (err) {
    return { code: err.status ?? 1, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

test('a rule id is a rule id, not a directory', () => {
  const r = run('why', 'ai-purple');
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /AI purple as the primary colour/);
  assert.doesNotMatch(r.out, /no such directory/);
});

test('a category filter is a filter, not a directory', () => {
  const r = run('rules', 'color');
  assert.equal(r.code, 0, r.out);
  assert.doesNotMatch(r.out, /no such directory/);
  assert.match(r.out, /ai-purple/);
});

test('every rule the report tells you to look up can be looked up', () => {
  // The roster note names `redpen why <rule-id>` for rules it did not argue.
  for (const id of ['cancelled-size-floor', 'horizontal-overflow', 'transition-all']) {
    const r = run('why', id);
    assert.equal(r.code, 0, `${id}: ${r.out}`);
  }
});

test('a scan path that does not exist is still refused', () => {
  const r = run('scan', './definitely-not-here');
  assert.equal(r.code, 2, r.out);
  assert.match(r.out, /no such directory/);
});

test('an unknown rule id says so rather than exiting clean', () => {
  const r = run('why', 'no-such-rule-anywhere');
  assert.notEqual(r.out.trim(), '', 'said nothing at all');
});
