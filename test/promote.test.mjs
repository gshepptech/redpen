import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promote, meetsThreshold } from '../dist/promote.js';
import { score, grade, scoreKind } from '../dist/score.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ev = (channel, location, extra = {}) => ({ channel, location, ...extra });

test('two channels agreeing produces confirmed', () => {
  const { findings } = promote(
    [
      { ruleId: 'ai-purple', channel: 'source', evidence: [ev('source', 'a.css', { line: 2 })] },
      { ruleId: 'ai-purple', channel: 'render', evidence: [ev('render', 'http://x', { selector: 'body' })] },
    ],
    { renderRan: true },
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].confidence, 'confirmed');
  assert.deepEqual(findings[0].channels.sort(), ['render', 'source']);
});

test('source-only on a render-observable rule is demoted when render ran', () => {
  const { findings } = promote(
    [{ ruleId: 'ai-purple', channel: 'source', evidence: [ev('source', 'a.css', { line: 2 })] }],
    { renderRan: true },
  );
  assert.equal(findings[0].confidence, 'possible');
});

test('a finding render could have settled is a lead whether it ran or not', () => {
  // This test used to assert the opposite, and argued it well: absence of a
  // channel is not disagreement, so do not penalise the source hit. It reads as
  // fair and it is wrong, because it treats "nobody checked" as better than
  // "somebody checked and did not agree" when both mean the finding is
  // unconfirmed.
  //
  // Measured on a real app scanned without a browser: eleven source findings,
  // presented as likely or confirmed, and seven were false. The page had
  // `lang="en"`. The nav had `aria-current`. The input was wrapped in its own
  // label. The stylesheet had the reduced-motion block. Every one of those is a
  // fact about the rendered page, every one of those rules already carries a
  // render check that would have answered it, and none of them ran.
  for (const renderRan of [true, false]) {
    const { findings } = promote(
      [{ ruleId: 'ai-purple', channel: 'source', evidence: [ev('source', 'a.css', { line: 2 })] }],
      { renderRan },
    );
    assert.equal(
      findings[0].confidence,
      'possible',
      `render ran: ${renderRan} — unchecked is not the same as agreed`,
    );
  }
});

test('a source-only-observable rule is confirmed from source alone', () => {
  // placeholder-name exists nowhere but the source text.
  const { findings } = promote(
    [{ ruleId: 'placeholder-name', channel: 'source', evidence: [ev('source', 'i.html', { line: 9 })] }],
    { renderRan: true },
  );
  assert.equal(findings[0].confidence, 'confirmed');
});

test('a render-only rule is confirmed from render alone', () => {
  const { findings } = promote(
    [{ ruleId: 'low-contrast', channel: 'render', evidence: [ev('render', 'http://x', { selector: 'p' })] }],
    { renderRan: true },
  );
  assert.equal(findings[0].confidence, 'confirmed');
});

test('unknown rule ids are reported rather than silently dropped', () => {
  const { findings, unknownRules } = promote(
    [{ ruleId: 'not-a-rule', channel: 'source', evidence: [] }],
    { renderRan: false },
  );
  assert.equal(findings.length, 0);
  assert.deepEqual(unknownRules, ['not-a-rule']);
});

test('project ignores move findings aside with their reason intact', () => {
  const { findings, ignored } = promote(
    [{ ruleId: 'ai-purple', channel: 'source', evidence: [ev('source', 'a.css', { line: 1 })] }],
    { renderRan: false, ignored: new Map([['ai-purple', { reason: 'brand is violet', location: 'config' }]]) },
  );
  assert.equal(findings.length, 0);
  assert.equal(ignored.length, 1);
  assert.equal(ignored[0].ignored.reason, 'brand is violet');
});

test('findings sort by confidence before weight', () => {
  const { findings } = promote(
    [
      // weight 94, but source-only on a render-observable rule
      { ruleId: 'ai-purple', channel: 'source', evidence: [ev('source', 'a.css', { line: 1 })] },
      // weight 50, but source is the only channel that can see it
      { ruleId: 'placeholder-name', channel: 'source', evidence: [ev('source', 'b.html', { line: 1 })] },
    ],
    { renderRan: true },
  );
  assert.equal(findings[0].ruleId, 'placeholder-name');
  assert.equal(findings[1].ruleId, 'ai-purple');
});

test('meetsThreshold gates by confidence order', () => {
  const f = (confidence) => ({ confidence });
  assert.ok(meetsThreshold(f('confirmed'), 'likely'));
  assert.ok(meetsThreshold(f('likely'), 'likely'));
  assert.ok(!meetsThreshold(f('possible'), 'likely'));
  assert.ok(meetsThreshold(f('possible'), 'possible'));
});

test('score is 100 with no findings and falls with evidence', () => {
  assert.equal(score([]), 100);
  const one = score([{ weight: 90, confidence: 'confirmed', evidence: [ev('source', 'a', { line: 1 })] }]);
  const many = score([
    { weight: 90, confidence: 'confirmed', evidence: Array.from({ length: 20 }, (_, i) => ev('source', 'a', { line: i })) },
  ]);
  assert.ok(one < 100);
  assert.ok(many < one, 'systemic evidence should cost more than a single instance');
  assert.ok(many >= 0);
});

test('low-confidence findings cost less than confirmed ones', () => {
  const base = { weight: 90, evidence: [ev('source', 'a', { line: 1 })] };
  assert.ok(
    score([{ ...base, confidence: 'possible' }]) > score([{ ...base, confidence: 'confirmed' }]),
  );
});

test('grade labels track the score', () => {
  assert.equal(grade(100), 'clean');
  assert.equal(grade(80), 'minor tells');
  assert.equal(grade(60), 'reads as generated');
  assert.equal(grade(10), 'slop');
});

/* ---- surface gating and split scoring -------------------------------- */

test('an off-surface rule produces no finding at all, not a weak one', () => {
  const raw = [
    { ruleId: 'default-sans', channel: 'render', evidence: [ev('render', 'http://x')] },
    { ruleId: 'low-contrast', channel: 'render', evidence: [ev('render', 'http://x')] },
  ];
  const on = promote(raw, { renderRan: true });
  assert.equal(on.findings.length, 2);

  const off = promote(raw, { renderRan: true, offSurface: new Set(['default-sans']) });
  assert.deepEqual(off.findings.map((f) => f.ruleId), ['low-contrast']);
});

test('findings carry their kind through promotion', () => {
  const { findings } = promote(
    [
      { ruleId: 'ai-purple', channel: 'render', evidence: [ev('render', 'http://x')] },
      { ruleId: 'low-contrast', channel: 'render', evidence: [ev('render', 'http://x')] },
    ],
    { renderRan: true },
  );
  const byId = Object.fromEntries(findings.map((f) => [f.ruleId, f.kind]));
  assert.equal(byId['ai-purple'], 'slop');
  assert.equal(byId['low-contrast'], 'quality');
});

test('advisory findings never move a score', () => {
  const base = { weight: 90, confidence: 'confirmed', evidence: [ev('source', 'a', { line: 1 })] };
  assert.equal(score([{ ...base, advisory: true }]), 100);
  assert.ok(score([{ ...base, advisory: false }]) < 100);
});

test('scoreKind isolates one axis from the other', () => {
  const findings = [
    { ruleId: 'a', kind: 'slop', advisory: false, weight: 95, confidence: 'confirmed', evidence: [ev('render', 'x')] },
    { ruleId: 'b', kind: 'quality', advisory: false, weight: 10, confidence: 'confirmed', evidence: [ev('render', 'x')] },
  ];
  const slop = scoreKind(findings, 'slop');
  const quality = scoreKind(findings, 'quality');
  assert.ok(slop < quality, 'a heavy slop finding must not drag the quality score down with it');
  assert.equal(scoreKind([], 'slop'), 100);
});

test('a hidden input is not an unlabelled input', async () => {
  // A hidden field cannot be labelled and must not be. Reported from the
  // field: three CSRF/routing hidden inputs per form made this the most-cited
  // rule in an entire scan, at 12 occurrences.
  const { loadCorpus } = await import('../dist/corpus/load.js');
  const rule = loadCorpus().find((r) => r.id === 'unlabelled-input');
  const re = new RegExp(rule.source.patterns[0], 'giu');
  const hidden = '<input type="hidden" name="csrf" value="x">';
  const real = '<input name="email" placeholder="Email">';
  assert.equal(hidden.match(re), null, 'a hidden input must not match');
  re.lastIndex = 0;
  assert.ok(real.match(re), 'a real unlabelled input must still match');
});

test('the headline verdict names whichever axis is actually worse', async () => {
  const { verdict } = await import('../dist/score.js');
  // A real dashboard scored 78 slop / 55 quality and was headlined "heavily
  // templated" while the report under it listed clipped text and unhittable
  // controls and not one sameness finding.
  assert.equal(verdict(78, 55), 'visibly rough');
  assert.equal(verdict(40, 95), 'heavily templated');
  assert.equal(verdict(100, 100), 'clean');
});

test('a baseline records which channels produced it', async () => {
  // Without this a later check cannot tell that it ran fewer channels, sees
  // fewer findings and a higher score, and passes for having looked at less.
  const { saveBaseline, loadBaseline } = await import('../dist/config.js');
  const dir = mkdtempSync(join(tmpdir(), 'redpen-baseline-'));
  saveBaseline(dir, {
    score: 100,
    recordedAt: '2026-01-01T00:00:00.000Z',
    knownRules: [],
    channels: ['source', 'render', 'fingerprint'],
  });
  assert.deepEqual(loadBaseline(dir).channels, ['source', 'render', 'fingerprint']);
  rmSync(dir, { recursive: true, force: true });
});
