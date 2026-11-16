import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareToBaseline } from '../dist/gate.js';

/**
 * The gate is the only part of redpen that can block someone's work. A gate
 * that passes for the wrong reason is worse than no gate, so each decision it
 * makes gets a test.
 */

const BASE = {
  score: 80,
  slop: 80,
  quality: 90,
  recordedAt: '2026-01-01T00:00:00.000Z',
  knownRules: ['ai-purple', 'default-sans'],
  channels: ['source', 'render'],
};

const run = (over = {}) => ({
  slop: 80,
  quality: 90,
  channelsRun: ['source', 'render'],
  findings: [
    { ruleId: 'ai-purple', confidence: 'confirmed' },
    { ruleId: 'default-sans', confidence: 'likely' },
  ],
  ...over,
});

test('a run that matches its baseline holds', () => {
  const r = compareToBaseline(BASE, run(), 0);
  assert.equal(r.status, 'holding');
  assert.equal(r.slop, 80);
  assert.equal(r.quality, 90);
  assert.deepEqual(r.notes, []);
});

test('a slop drop past tolerance fails, and reports both numbers', () => {
  const r = compareToBaseline(BASE, run({ slop: 74 }), 0);
  assert.equal(r.status, 'regressed');
  assert.deepEqual(r.drops, [{ axis: 'slop', was: 80, now: 74, drop: 6 }]);
});

test('a drop within tolerance is not a regression', () => {
  const r = compareToBaseline(BASE, run({ slop: 77 }), 3);
  assert.equal(r.status, 'holding');
});

test('tolerance is exclusive — a drop equal to it still passes', () => {
  // `drop > tolerance`, so tolerance 3 permits exactly 3. Asserted because the
  // off-by-one is invisible until someone's build fails for holding the bar.
  assert.equal(compareToBaseline(BASE, run({ slop: 77 }), 3).status, 'holding');
  assert.equal(compareToBaseline(BASE, run({ slop: 76 }), 3).status, 'regressed');
});

test('quality regressing alone fails, even though the headline never moved', () => {
  // The headline is the worse of the two axes. Quality 90 -> 82 leaves slop 80
  // as the headline either way, so a gate reading the headline sees nothing.
  const r = compareToBaseline(BASE, run({ quality: 82 }), 0);
  assert.equal(r.status, 'regressed');
  assert.deepEqual(r.drops, [{ axis: 'quality', was: 90, now: 82, drop: 8 }]);
});

test('both axes dropping reports both, not the first one found', () => {
  const r = compareToBaseline(BASE, run({ slop: 70, quality: 80 }), 0);
  assert.equal(r.status, 'regressed');
  assert.deepEqual(r.drops.map((d) => d.axis), ['slop', 'quality']);
});

test('a new tell fails the gate even when the score is unchanged', () => {
  const r = compareToBaseline(
    BASE,
    run({
      findings: [...run().findings, { ruleId: 'gradient-text', confidence: 'confirmed' }],
    }),
    0,
  );
  assert.equal(r.status, 'regressed');
  assert.deepEqual(r.introduced, ['gradient-text']);
  assert.deepEqual(r.drops, []);
});

test('a new finding at possible confidence does not fail the gate', () => {
  // `possible` is what a channel checked and did not corroborate. It costs
  // nothing against the score, so it must not cost anything at the gate.
  const r = compareToBaseline(
    BASE,
    run({
      findings: [...run().findings, { ruleId: 'gradient-text', confidence: 'possible' }],
    }),
    0,
  );
  assert.equal(r.status, 'holding');
});

test('a run missing a channel the baseline had refuses to judge', () => {
  // Fewer channels means fewer findings means a higher score. Without this the
  // gate passes for having looked at less, which is the one failure it cannot have.
  const r = compareToBaseline(BASE, run({ channelsRun: ['source'] }), 0);
  assert.equal(r.status, 'incomparable');
  assert.equal(r.reason, 'missing-channels');
  assert.deepEqual(r.missing, ['render']);
});

test('a missing channel refuses even when every score improved', () => {
  const r = compareToBaseline(BASE, run({ channelsRun: ['source'], slop: 100, quality: 100 }), 0);
  assert.equal(r.status, 'incomparable');
});

test('extra channels beyond the baseline are fine', () => {
  const r = compareToBaseline(BASE, run({ channelsRun: ['source', 'render', 'vision'] }), 0);
  assert.equal(r.status, 'holding');
});

test('a baseline predating the two-axis score refuses to judge', () => {
  const { slop, quality, ...old } = BASE;
  const r = compareToBaseline(old, run(), 0);
  assert.equal(r.status, 'incomparable');
  assert.equal(r.reason, 'pre-two-axis');
});

test('a baseline predating channel recording is noted, not refused', () => {
  const { channels, ...old } = BASE;
  const r = compareToBaseline(old, run({ channelsRun: ['source'] }), 0);
  assert.equal(r.status, 'holding');
  assert.equal(r.notes.length, 1);
  assert.match(r.notes[0], /partial run cannot be detected/);
});

test('a note rides along on a failing verdict too', () => {
  const { channels, ...old } = BASE;
  const r = compareToBaseline(old, run({ slop: 60 }), 0);
  assert.equal(r.status, 'regressed');
  assert.equal(r.notes.length, 1);
});
