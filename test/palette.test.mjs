process.env.FORCE_COLOR = '3';

import { test } from 'node:test';
import assert from 'node:assert/strict';

/**
 * The number and the bar are one quantity, so they get one colour.
 *
 * They used to carry separate band tables — four bands for the number, three
 * for the bar — so a 70 drew a bold-yellow number beside a yellow bar and an 80
 * drew a plain-yellow number beside the same yellow bar. Nobody would have
 * noticed, which is the point: two encodings of one number that disagree about
 * where the lines fall is the same defect as a header whose word and number
 * came from different sums, only quieter.
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
  // Its bar was 24 cells while the axis bars were 14, so the same number was
  // drawn at two lengths on one screen.
  assert.ok(!header.includes('█'), `the header is drawing a bar again: ${header}`);
  assert.match(header, /22/);
});
