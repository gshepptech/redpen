import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolveBin, runTools } from '../dist/channels/tools.js';
import { runScan } from '../dist/scan.js';
import { loadCorpus } from '../dist/corpus/load.js';

/**
 * The external analysers.
 *
 * Three tells need a parse of the whole project rather than a pattern, and
 * each already has a tool that does it. What has to be true is that redpen
 * borrows those tools rather than installing them, and says so when they are
 * not there — because a missing analyser means a finding is absent, not that
 * the project is clean.
 */

const HERE = dirname(fileURLToPath(import.meta.url));

function project(files) {
  const dir = mkdtempSync(join(tmpdir(), 'redpen-tools-test-'));
  for (const [name, body] of Object.entries(files)) {
    const full = join(dir, name);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body, 'utf8');
  }
  return dir;
}

test('a tool the project does not have is reported missing, never as clean', async () => {
  const dir = project({ 'package.json': '{"name":"t","private":true}', 'src/a.ts': 'export const a = 1;\n' });
  try {
    const result = await runScan({ root: dir, codeCategories: true, ephemeral: true });
    const warning = result.warnings.find((w) => w.includes('not found'));
    assert.ok(warning, 'a missing analyser must be said out loud');
    assert.match(warning, /nothing about them is in this score/);
    assert.ok(!result.channelsRun.includes('tools'), 'no tool ran, so no tools channel');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('redpen never installs an analyser, so a bare project stays bare', async () => {
  // The whole reason resolveBin exists. A scan that fetches a tool behaves
  // differently on a plane and runs code nobody in the project chose.
  const dir = project({ 'package.json': '{"name":"t","private":true}' });
  try {
    const before = runTools(dir);
    assert.deepEqual(before.ran, []);
    assert.deepEqual(before.findings, []);
    assert.ok(before.missing.length >= 3, 'every analyser it knows about is reported missing');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a binary in the project's own node_modules wins over one on PATH", () => {
  const dir = project({ 'node_modules/.bin/jscpd': '#!/bin/sh\nexit 0\n' });
  try {
    chmodSync(join(dir, 'node_modules/.bin/jscpd'), 0o755);
    const found = resolveBin(dir, 'jscpd');
    assert.equal(found, join(dir, 'node_modules', '.bin', 'jscpd'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a binary that exists nowhere resolves to null rather than throwing', () => {
  assert.equal(resolveBin(HERE, 'redpen-no-such-analyser-anywhere'), null);
});

test('every tools rule declares tools as its only channel', () => {
  // A rule that claims a second channel would be demoted to `likely` on a run
  // where only the tool saw it, which is every run.
  const rules = loadCorpus().filter((r) => r.channels.includes('tools'));
  assert.ok(rules.length >= 3, 'the tool-backed rules exist');
  for (const r of rules) {
    assert.deepEqual(r.channels, ['tools'], `${r.id} must be tools-only`);
    assert.ok(!r.source, `${r.id} must not also carry a source matcher`);
  }
});

test('a tools finding is confirmed, because no other channel can see it', async () => {
  const { promote } = await import('../dist/promote.js');
  const { findings } = promote(
    [
      {
        ruleId: 'copy-paste-duplication',
        channel: 'tools',
        evidence: [{ channel: 'tools', location: 'a.ts', line: 1, excerpt: '9 lines repeated' }],
      },
    ],
    { renderRan: false },
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].confidence, 'confirmed');
});

test('the tools channel never runs on a UI scan', async () => {
  // A project's source and the page it serves are different questions. Folding
  // duplication into a page score would move every baseline anyone holds.
  const dir = project({ 'package.json': '{"name":"t","private":true}', 'index.html': '<h1>Hi</h1>' });
  try {
    const result = await runScan({ root: dir, ephemeral: true });
    assert.ok(!result.warnings.some((w) => w.includes('not found in this project or on PATH')));
    assert.ok(!result.channelsRun.includes('tools'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
