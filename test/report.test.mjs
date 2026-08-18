import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../dist/report/markdown.js';

/**
 * The markdown report is the one a human pastes into a pull request, which
 * means it is read by people who never ran the command and cannot ask the
 * terminal a follow-up question. Everything it says has to survive being read
 * cold.
 *
 * It shipped with no test at all, and the first time anyone rendered it the
 * score table said `slop | 100 | reads as machine-made` — a perfect score
 * sitting next to the description of failure. These pin the parts that a
 * reader can misread.
 */

function result(over = {}) {
  return {
    score: 100,
    slopScore: 100,
    qualityScore: 100,
    findings: [],
    advisory: [],
    ignored: [],
    clashes: [],
    surfaces: {},
    channelsRun: ['source'],
    warnings: [],
    ...over,
  };
}

function finding(over = {}) {
  return {
    ruleId: 'ai-purple',
    title: 'AI purple as the primary colour',
    kind: 'slop',
    category: 'color',
    weight: 94,
    confidence: 'likely',
    channels: ['source'],
    why: 'why',
    fix: 'fix',
    evidence: [],
    sources: [{ origin: 'study', ref: 'ai-purple' }],
    ...over,
  };
}

test('the score table cannot be read as a verdict on the number beside it', () => {
  const md = renderMarkdown(result());
  const row = md.split('\n').find((l) => l.includes('**slop**'));
  assert.ok(row, 'no slop row in the score table');

  // A bare gloss next to a score is ambiguous in exactly the wrong direction:
  // "slop | 100 | reads as machine-made" reads as a judgement, not a legend.
  // The finding count is what disambiguates it, so it has to be in the row.
  assert.match(row, /\|\s*0\s*\|/, `slop row carries no finding count: ${row}`);
  assert.match(row, /whether it/, `slop row states a verdict, not a measure: ${row}`);
});

test('the counts in the score table are the counts of the findings below it', () => {
  const md = renderMarkdown(
    result({
      score: 40,
      slopScore: 30,
      qualityScore: 60,
      findings: [
        finding(),
        finding({ ruleId: 'gradient-text', title: 'Gradient-filled heading text' }),
        finding({ ruleId: 'missing-alt', title: 'Image without alt text', kind: 'quality' }),
      ],
    }),
  );
  const slopRow = md.split('\n').find((l) => l.includes('**slop**'));
  const qualRow = md.split('\n').find((l) => l.includes('**quality**'));
  assert.match(slopRow, /\|\s*30\s*\|\s*2\s*\|/, slopRow);
  assert.match(qualRow, /\|\s*60\s*\|\s*1\s*\|/, qualRow);
});

test('a channel that did not run is named, so absent findings are not read as clean', () => {
  const md = renderMarkdown(result({ channelsRun: ['source'] }));
  assert.match(md, /Not run: render, vision/);
  assert.match(md, /unconfirmed rather than absent/);
});

test('every finding carries where the rule came from', () => {
  const md = renderMarkdown(result({ score: 40, slopScore: 30, findings: [finding()] }));
  assert.match(md, /from study:ai-purple/);
  assert.match(md, /`ai-purple` · weight 94 · seen by source/);
});

test('the markdown fold names every finding it does not argue', () => {
  const findings = [];
  for (let i = 0; i < 12; i++) {
    findings.push(
      finding({
        ruleId: `rule-number-${i}`,
        title: `Finding number ${i}`,
        weight: 90 - i,
        confidence: ['confirmed', 'likely', 'possible'][i % 3],
        kind: i % 2 ? 'quality' : 'slop',
      }),
    );
  }
  const md = renderMarkdown(result({ score: 40, slopScore: 30, qualityScore: 55, findings }));

  for (const f of findings) {
    assert.ok(md.includes(f.ruleId), `${f.ruleId} appears nowhere in the report`);
    assert.ok(md.includes(f.title), `${f.title} appears nowhere in the report`);
  }
  assert.match(md, /listed not argued/, 'nothing was folded');
  // A pull-request comment that argues all twelve is one nobody finishes.
  assert.ok(
    (md.match(/^### /gm) ?? []).length < findings.length,
    'every finding was argued in full — the fold did nothing',
  );
});
