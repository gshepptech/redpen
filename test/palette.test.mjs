process.env.FORCE_COLOR = '3';

import { test } from 'node:test';
import assert from 'node:assert/strict';

/**
 * The number and the bar are one quantity, so they get one colour.
 *
 * Separate band tables for the number and the bar would paint a number one
 * colour beside a bar of another. Nobody would notice, which is the point: two
 * encodings of one number that disagree about where the lines fall is the same
 * defect as a header whose word and number came from different sums, only
 * quieter.
 *
 * FORCE_COLOR is set before the import because picocolors decides once, at
 * module load, whether it is writing to something that can show colour.
 */

const { renderTerminal } = await import('../dist/report/terminal.js');

const OPTS = { verbose: false, showIgnored: false, maxEvidence: 3 };
const ESC = String.fromCharCode(27);
// 30-37 set a foreground colour; 39 resets it and is not one.
const COLOUR = new RegExp(ESC + '\\[(3[0-7])m', 'g');

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

/** A page built to land near a target score on both axes. */
function pageNear(n) {
  const findings = [];
  for (let i = 0; i < n; i++) {
    findings.push(finding('slop', 70, `s${i}`));
    findings.push(finding('quality', 70, `q${i}`));
  }
  return {
    score: 0,
    slopScore: 0,
    qualityScore: 0,
    findings,
    advisory: [],
    ignored: [],
    clashes: [],
    surfaces: {},
    channelsRun: ['source'],
    warnings: [],
  };
}

test('the number and its bar are always the same colour', () => {
  for (let value = 0; value <= 100; value += 5) {
    const r = { ...pageNear(0), score: value, slopScore: value, qualityScore: value };
    const row = renderTerminal(r, OPTS)
      .split('\n')
      .find((l) => l.includes('slop') && (l.includes('█') || l.includes('░')));
    assert.ok(row, `no slop row with a bar at ${value}`);

    const codes = [...row.matchAll(COLOUR)].map((m) => m[1]);
    const distinct = new Set(codes);
    assert.equal(
      distinct.size,
      1,
      `score ${value} paints the number and the bar differently (${[...distinct].join(', ')}): ${row}`,
    );
  }
});

test('the bar length tracks the score', () => {
  const widths = [];
  for (const value of [0, 25, 50, 75, 100]) {
    const r = { ...pageNear(0), score: value, slopScore: value, qualityScore: value };
    const row = renderTerminal(r, OPTS)
      .split('\n')
      .find((l) => l.includes('slop') && (l.includes('█') || l.includes('░')));
    widths.push((row.match(/█/g) ?? []).length);
  }
  assert.deepEqual(
    widths,
    [...widths].sort((a, b) => a - b),
    `bar length does not rise with the score: ${widths.join(', ')}`,
  );
  assert.equal(widths[0], 0, 'a zero score should draw an empty bar');
  assert.ok(widths.at(-1) > 0, 'a perfect score should draw a full bar');
});

test('the header states a verdict and leaves the measuring to the rows', () => {
  const r = { ...pageNear(0), score: 22, slopScore: 22, qualityScore: 42 };
  const [header] = renderTerminal(r, OPTS)
    .split('\n')
    .filter((l) => l.includes('redpen'));
  // A headline bar would draw the same number as one of the axis bars at a
  // second length on one screen.
  assert.ok(!header.includes('█'), `the header is drawing a bar again: ${header}`);
  assert.match(header, /22/);
});

test('the pip carries its tier colour, so a scrolled report still says which', () => {
  // On a long report the section header that carries the meaning is off the
  // screen for most of the reading, so the pip has to carry its own colour.
  const r = pageNear(0);
  r.findings = [
    { ...finding('slop', 90, 'a-confirmed'), confidence: 'confirmed' },
    { ...finding('slop', 80, 'b-likely'), confidence: 'likely' },
  ];
  r.slopScore = 30;
  r.qualityScore = 70;
  const lines = renderTerminal(r, OPTS).split('\n');

  for (const [id, pip] of [['a-confirmed', '\u25cf'], ['b-likely', '\u25d0']]) {
    const row = lines.find((l) => l.includes(id) && l.includes(pip));
    assert.ok(row, `no row for ${id}`);
    const before = row.slice(0, row.indexOf(pip));
    // A fresh regex per check: COLOUR carries the /g flag, and assert.match
    // advances its lastIndex, so reusing it here fails the second row for a
    // reason that has nothing to do with the pip.
    assert.match(
      before,
      new RegExp(ESC + '\\[3[0-7]m'),
      `the ${id} pip is unpainted: ${JSON.stringify(row)}`,
    );
  }
});

test('the id column is as wide as the widest id and no wider', () => {
  // A fixed width guesses, and every character it guesses too wide comes off
  // the end of every title on screen.
  const r = pageNear(0);
  r.findings = Array.from({ length: 9 }, (_, i) => ({
    ...finding('slop', 70 - i, `short-${i}`),
    confidence: 'likely',
    title: 'A title long enough that the room left for it is worth measuring exactly',
  }));
  r.slopScore = 30;
  const strip2 = (x) => x.replace(COLOUR, '').replace(new RegExp(ESC + '\\[[0-9;]*m', 'g'), '');
  const roster = renderTerminal(r, OPTS)
    .split('\n')
    .map(strip2)
    .filter((l) => /^  [\u25cf\u25d0\u25cb] +\d+ +short-\d/.test(l));
  assert.ok(roster.length, 'nothing was folded into a roster');
  for (const l of roster) {
    const gap = l.match(/short-\d(\s+)/)[1];
    assert.equal(gap.length, 2, `id gutter padded to a guess, not to the ids: ${JSON.stringify(l)}`);
  }
});
