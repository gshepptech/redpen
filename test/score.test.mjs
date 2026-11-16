import { test } from 'node:test';
import assert from 'node:assert/strict';
import { score, scoreKind, headline, verdict, explainScore } from '../dist/score.js';

/**
 * The numbers on the header line, and whether they agree with each other.
 *
 * A headline from the union of both axes would disagree with the axes under it:
 * penalties add before the curve is applied, so the union sits at or below
 * *both* parts (two axes of 89 would headline 79). The headline, the word and
 * the two axes have to answer the same question.
 */

const SLOP_BANDS = [
  [90, 'clean'],
  [75, 'minor tells'],
  [55, 'reads as generated'],
  [35, 'heavily templated'],
  [0, 'slop'],
];
const QUALITY_BANDS = [
  [90, 'clean'],
  [75, 'minor defects'],
  [55, 'visibly rough'],
  [35, 'broken in places'],
  [0, 'broken'],
];
const bandIndex = (n) => SLOP_BANDS.findIndex(([floor]) => n >= floor);

function finding(kind, weight, id) {
  return {
    ruleId: id,
    title: id,
    kind,
    category: 'color',
    weight,
    confidence: 'confirmed',
    channels: ['source'],
    why: '',
    fix: '',
    advisory: false,
    evidence: [{ location: 'a.css', line: 1 }],
    sources: [],
  };
}

/** n slop findings and m quality findings, all the same weight. */
function page(n, m, weight = 70) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(finding('slop', weight, `s${i}`));
  for (let i = 0; i < m; i++) out.push(finding('quality', weight, `q${i}`));
  return out;
}

const SHAPES = [
  [0, 0],
  [1, 0],
  [0, 1],
  [2, 4],
  [4, 2],
  [8, 8],
  [1, 12],
  [12, 1],
];

test('the headline is the worse axis, never below both of them', () => {
  for (const [n, m] of SHAPES) {
    const fs = page(n, m);
    const slop = scoreKind(fs, 'slop');
    const quality = scoreKind(fs, 'quality');
    const head = headline(slop, quality);
    assert.equal(head, Math.min(slop, quality), `${n} slop / ${m} quality`);
    assert.ok(
      head >= Math.min(slop, quality),
      `headline ${head} sits below both axes (${slop}, ${quality}) — the parts do not add up to the whole`,
    );
  }
});

test('the word on the header names the band the number is in', () => {
  for (const [n, m] of SHAPES) {
    const fs = page(n, m);
    const slop = scoreKind(fs, 'slop');
    const quality = scoreKind(fs, 'quality');
    const head = headline(slop, quality);
    const word = verdict(slop, quality);

    const bands = quality < slop ? QUALITY_BANDS : SLOP_BANDS;
    assert.equal(
      word,
      bands[bandIndex(head)][1],
      `header reads "${head} ${word}" but ${head} is the ${bands[bandIndex(head)][1]} band` +
        ` (slop ${slop}, quality ${quality})`,
    );
  }
});

test('why-score and scan cannot report different numbers', () => {
  for (const [n, m] of SHAPES) {
    const fs = page(n, m);
    const e = explainScore(fs);
    assert.equal(e.score, headline(scoreKind(fs, 'slop'), scoreKind(fs, 'quality')));
    assert.equal(e.slop, scoreKind(fs, 'slop'));
    assert.equal(e.quality, scoreKind(fs, 'quality'));
  }
});

test('worth is what fixing it gives back on its own axis', () => {
  // A page failing hard on quality and mildly on slop. Measured against the
  // headline, every slop fix would be worth zero — true, and no use to anyone
  // deciding what to do next.
  const fs = page(2, 9);
  const e = explainScore(fs);
  const slopRows = e.contributions.filter((c) => c.kind === 'slop');
  assert.ok(slopRows.length, 'no slop contributions to check');
  for (const c of slopRows) {
    assert.ok(c.worth > 0, `slop fix reported as worth ${c.worth} on a quality-limited page`);
  }

  // And the number is real: drop one and the axis moves by that much.
  const one = slopRows[0];
  const axis = fs.filter((f) => f.kind === 'slop');
  const without = score(axis.filter((f) => f.ruleId !== one.ruleId));
  assert.equal(Number((without - scoreKind(fs, 'slop')).toFixed(1)), one.worth);
});

test('two findings sharing a rule id do not each claim the whole group', () => {
  // promote.ts emits one finding per rule, so this cannot happen today. It is
  // pinned because matching on rule id rather than identity would, the day
  // that invariant slips, make every sibling report the group's worth as its
  // own.
  const fs = [finding('slop', 60, 'same'), finding('slop', 60, 'same'), finding('slop', 60, 'other')];
  const e = explainScore(fs);
  const dupes = e.contributions.filter((c) => c.ruleId === 'same');
  assert.equal(dupes.length, 2);

  const real = score(fs.slice(1)) - score(fs);
  for (const c of dupes) {
    assert.equal(c.worth, Number(real.toFixed(1)), `claims ${c.worth}, removing one gives ${real}`);
  }
});
