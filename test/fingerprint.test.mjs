import { test } from 'node:test';
import assert from 'node:assert/strict';
import { distance, findClashes, fingerprintFindings, CLASH_THRESHOLD } from '../dist/fingerprint/distance.js';

const base = {
  page: 'a',
  recordedAt: '2026-01-01T00:00:00.000Z',
  macrostructure: 'hero-triptych',
  sectionRhythm: ['hero-full', 'card-grid-3', 'cta'],
  shell: ['nav', 'footer'],
  typeScale: [14, 16, 20, 32, 56],
  families: ['inter'],
  paletteAnchor: 270,
  nav: 'wordmark-links',
  hero: 'centered-full',
  sectionCount: 5,
};

const withChanges = (changes) => ({ ...base, ...changes });

test('a page is identical to itself', () => {
  assert.equal(distance(base, base), 0);
});

test('a colour swap is not variety', () => {
  // This is the claim the whole feature rests on: readers register structure,
  // not palette. Changing only the hue must stay well inside the clash band.
  const teal = withChanges({ page: 'b', paletteAnchor: 180 });
  const d = distance(base, teal);
  assert.ok(d < CLASH_THRESHOLD, `colour-only change scored ${d}, should still clash`);
  assert.ok(d <= 0.1, `colour alone should barely move the distance, got ${d}`);
});

test('a different skeleton is variety', () => {
  const doc = withChanges({
    page: 'b',
    macrostructure: 'long-document',
    sectionRhythm: ['prose', 'prose', 'prose', 'table'],
    hero: 'asymmetric',
  });
  assert.ok(distance(base, doc) > CLASH_THRESHOLD, 'a genuinely different page should not clash');
});

test('changing the type scale alone is not enough to clear a clash', () => {
  const resized = withChanges({ page: 'b', typeScale: [15, 17, 21, 33, 57] });
  assert.ok(distance(base, resized) < CLASH_THRESHOLD);
});

test('section rhythm dominates the metric', () => {
  const sameStructureDifferentEverythingElse = withChanges({
    page: 'b',
    paletteAnchor: 40,
    typeScale: [13, 15, 19, 30, 50],
    nav: 'sticky-bar',
  });
  const differentStructureSameEverythingElse = withChanges({
    page: 'c',
    macrostructure: 'catalogue',
    sectionRhythm: ['catalogue', 'catalogue'],
    hero: 'asymmetric',
  });
  assert.ok(
    distance(base, sameStructureDifferentEverythingElse) <
      distance(base, differentStructureSameEverythingElse),
  );
});

test('findClashes pairs every colliding page and sorts by closeness', () => {
  const a = withChanges({ page: 'a' });
  const b = withChanges({ page: 'b', paletteAnchor: 180 });
  const c = withChanges({ page: 'c', paletteAnchor: 120, nav: 'sticky-bar' });
  const d = withChanges({
    page: 'd',
    macrostructure: 'long-document',
    sectionRhythm: ['prose', 'prose', 'prose'],
    hero: 'asymmetric',
  });

  const clashes = findClashes([a, b, c, d]);
  assert.ok(clashes.length >= 2);
  assert.ok(clashes.every((x) => x.page !== 'd' && x.against !== 'd'));
  for (let i = 1; i < clashes.length; i++) {
    assert.ok(clashes[i].distance >= clashes[i - 1].distance, 'clashes must sort closest-first');
  }
  assert.ok(clashes[0].sharedDimensions.length > 0);
});

test('a single page never clashes with itself', () => {
  assert.deepEqual(findClashes([base]), []);
});

test('an app shape never clashes with another app shape', () => {
  // Two routes of the same product sharing a skeleton is the consistency
  // heuristic working. Telling the author to reshape one would make the
  // product worse — reported from the field twice.
  const a = withChanges({ page: 'a', macrostructure: 'record-list', sectionRhythm: ['table'] });
  const b = withChanges({ page: 'b', macrostructure: 'record-list', sectionRhythm: ['table'] });
  assert.deepEqual(findClashes([a, b]), []);
});

test('two marketing pages sharing a skeleton still clash', () => {
  const a = withChanges({ page: 'a' });
  const b = withChanges({ page: 'b', paletteAnchor: 180 });
  assert.equal(findClashes([a, b]).length, 1);
});

test('the shell is excluded from the compared rhythm', () => {
  // Same content, different chrome. The shell is not what makes two pages the
  // same page, so this must still clash.
  const a = withChanges({ page: 'a', shell: ['nav', 'footer'] });
  const b = withChanges({ page: 'b', shell: ['nav', 'side-rail', 'footer'] });
  assert.ok(findClashes([a, b]).length === 1, 'differing shells must not clear a clash');
});

test('the generic template archetype is reported on its own', () => {
  const findings = fingerprintFindings([base], []);
  const ids = findings.map((f) => f.ruleId);
  assert.ok(ids.includes('template-archetype'), 'nav → hero → 3 cards → cta → footer is the archetype');
});

test('a non-template page raises no archetype finding', () => {
  const doc = withChanges({
    macrostructure: 'long-document',
    sectionRhythm: ['prose', 'prose', 'table'],
  });
  const ids = fingerprintFindings([doc], []).map((f) => f.ruleId);
  assert.ok(!ids.includes('template-archetype'));
});

test('a project with one section vocabulary is reported', () => {
  const pages = ['a', 'b', 'c'].map((page) =>
    withChanges({ page, sectionRhythm: ['nav', 'hero-full', 'card-grid-3', 'cta', 'footer'] }),
  );
  const ids = fingerprintFindings(pages, []).map((f) => f.ruleId);
  assert.ok(ids.includes('single-section-vocabulary'));
  assert.ok(ids.includes('uniform-type-scale-across-pages'));
  assert.ok(ids.includes('palette-monoculture'));
});

test('corpus-wide rules stay quiet with fewer than three pages', () => {
  const ids = fingerprintFindings([base, withChanges({ page: 'b' })], []).map((f) => f.ruleId);
  assert.ok(!ids.includes('single-section-vocabulary'));
  assert.ok(!ids.includes('palette-monoculture'));
});
