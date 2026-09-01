import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, chmodSync, existsSync } from 'node:fs';
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
  // PATH is emptied for the duration. Without that this test passed or failed
  // on whether the machine running it happened to have jscpd installed, which
  // is the one thing a test must never depend on.
  const dir = project({ 'package.json': '{"name":"t","private":true}', 'src/a.ts': 'export const a = 1;\n' });
  const path = process.env.PATH;
  process.env.PATH = '';
  try {
    const result = await runScan({ root: dir, codeCategories: true, ephemeral: true });
    const warning = result.warnings.find((w) => w.includes('not found'));
    assert.ok(warning, 'a missing analyser must be said out loud');
    assert.match(warning, /nothing about them is in this score/);
    assert.ok(!result.channelsRun.includes('tools'), 'no tool ran, so no tools channel');
  } finally {
    process.env.PATH = path;
    rmSync(dir, { recursive: true, force: true });
  }
});

test('redpen never installs an analyser, so a bare project stays bare', async () => {
  // The whole reason resolveBin exists. A scan that fetches a tool behaves
  // differently on a plane and runs code nobody in the project chose.
  const dir = project({ 'package.json': '{"name":"t","private":true}' });
  const path = process.env.PATH;
  process.env.PATH = '';
  try {
    const before = runTools(dir);
    assert.deepEqual(before.ran, []);
    assert.deepEqual(before.findings, []);
    assert.ok(before.missing.length >= 3, 'every analyser it knows about is reported missing');
    // And nothing appeared in the project as a side effect of looking.
    assert.ok(!existsSync(join(dir, 'node_modules')), 'a scan installs nothing');
  } finally {
    process.env.PATH = path;
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

test('the analysers skip the test material redpen skips', async () => {
  // jscpd walks the tree itself and knows nothing about SKIP_FILE. On a
  // 1,872-file repository the single largest source of reported duplication
  // was `*_integration_test.go`, where setup blocks repeat by design.
  const { runTools } = await import('../dist/channels/tools.js');
  const src = await import('../dist/channels/tools.js');
  assert.ok(typeof runTools === 'function');
  // The globs themselves are the contract, so assert on what jscpd is handed.
  const file = await import('node:fs').then((fs) =>
    fs.readFileSync(new URL('../src/channels/tools.ts', import.meta.url), 'utf8'),
  );
  for (const glob of ['**/*_test.go', '**/test_*.py', '**/*.test.*', '**/*.pb.go']) {
    assert.ok(file.includes(glob), `${glob} must be ignored by the analysers`);
  }
});

test('a capped evidence list still reports its true size', async () => {
  // The cap used to be silent: 1,772 duplicated blocks rendered as sixteen with
  // nothing saying the other 1,756 existed.
  const { promote } = await import('../dist/promote.js');
  const raw = Array.from({ length: 40 }, (_, i) => ({
    ruleId: 'copy-paste-duplication',
    channel: 'tools',
    evidence: [{ channel: 'tools', location: `f${i}.ts`, line: 1, excerpt: '9 lines repeated' }],
  }));
  const { findings } = promote(raw, { renderRan: false });
  assert.equal(findings[0].evidence.length, 16, 'the list is still capped');
  assert.equal(findings[0].evidenceTotal, 40, 'and the true count survives the cap');
});

test('the terminal report counts against the total, not the capped list', async () => {
  const { renderTerminal } = await import('../dist/report/terminal.js');
  const { promote } = await import('../dist/promote.js');
  const raw = Array.from({ length: 200 }, (_, i) => ({
    ruleId: 'copy-paste-duplication',
    channel: 'tools',
    evidence: [{ channel: 'tools', location: `f${i}.ts`, line: 1, excerpt: 'repeated' }],
  }));
  const { findings } = promote(raw, { renderRan: false });
  const out = renderTerminal({
    findings,
    ignored: [],
    advisory: [],
    possible: [],
    unknownRules: [],
    fingerprints: [],
    screenshots: [],
    score: 40,
    slopScore: 40,
    qualityScore: 100,
    channelsRun: ['tools'],
    warnings: [],
    surfaces: {},
    clashes: [],
    config: { tolerance: 0, minConfidence: 'likely' },
    timing: {},
    root: '.',
  }, { verbose: false, showIgnored: false, maxEvidence: 3 });
  const more = out.match(/and (\d+) more/);
  assert.ok(more, 'the report says something was elided');
  assert.equal(Number(more[1]), 200 - 3, 'counted against the 200, not against the capped 16');
});

test('the binary lookup is not posix-only', async () => {
  // `PATH.split(':')` and a bare `jscpd` resolve to nothing on Windows, where
  // the file is `jscpd.cmd` and the separator is `;`. Every analyser came back
  // null there and was reported as "not installed", which is the wrong reason
  // on a platform `engines` claims to support.
  const src = await import('node:fs').then((fs) =>
    fs.readFileSync(new URL('../src/channels/tools.ts', import.meta.url), 'utf8'),
  );
  assert.ok(!/PATH.*split\('?:'?\)/.test(src), 'PATH must not be split on a literal colon');
  assert.match(src, /delimiter/, 'PATH is split on the platform delimiter');
  assert.match(src, /win32/, 'the .cmd shim is looked for on Windows');
});
