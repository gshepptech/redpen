import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promote, meetsThreshold } from '../dist/promote.js';
import { score, grade, scoreKind } from '../dist/score.js';

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

test('the same finding is not demoted when render never ran', () => {
  const { findings } = promote(
    [{ ruleId: 'ai-purple', channel: 'source', evidence: [ev('source', 'a.css', { line: 2 })] }],
    { renderRan: false },
  );
  assert.equal(
    findings[0].confidence,
    'likely',
    'absence of a channel is not disagreement — that distinction is the whole point',
  );
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
