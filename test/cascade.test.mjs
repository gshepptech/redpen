import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findCancelledFloors, specificity } from '../dist/channels/cascade.js';

/**
 * The claim: a more specific rule pinning `height` below a floor a weaker rule
 * promised with `min-height` is a defect, and reporting the *pair* names the
 * cause rather than the symptom.
 *
 * Soundness matters more than recall here. A cascade false positive sends
 * someone hunting a bug that is not there, so anything needing real selector
 * matching is left alone.
 */

const find = (css) => findCancelledFloors(css);

test('specificity counts ids, classes and elements separately', () => {
  assert.deepEqual(specificity('.btn'), [0, 1, 0]);
  assert.deepEqual(specificity('.qacts .btn'), [0, 2, 0]);
  assert.deepEqual(specificity('#main .btn:hover'), [1, 2, 0]);
  assert.deepEqual(specificity('button'), [0, 0, 1]);
  assert.deepEqual(specificity('a[href]'), [0, 1, 1]);
});

test(':where contributes nothing and :not contributes its argument', () => {
  assert.deepEqual(specificity(':where(.a, .b) .btn'), [0, 1, 0]);
  assert.deepEqual(specificity('.btn:not(.ghost)'), [0, 2, 0]);
});

test('the reported pair names both rules and both specificities', () => {
  const [c] = find('.btn { min-height: 44px } .acts .btn { height: 32px }');
  assert.ok(c, 'the conflict must be found');
  assert.match(c.summary, /\.acts \.btn/);
  assert.match(c.summary, /\.btn \{ min-height: 44px \}/);
  assert.match(c.summary, /\(0,2,0\)/);
  assert.match(c.summary, /\(0,1,0\)/);
});

test('a media block restoring the same selector clears the conflict', () => {
  const css = `
    .btn { min-height: 44px }
    .qacts .btn { height: 32px }
    @media (pointer: coarse) { .qacts .btn { min-height: 44px } }
  `;
  assert.deepEqual(find(css), []);
});

test('one restored selector does not excuse its siblings', () => {
  // The bug that made this rule necessary: three components pinned the height
  // and only one was fixed, so a check keyed on the shared trailing class
  // reported none of them.
  const css = `
    .btn { min-height: 44px }
    .qacts .btn { height: 32px }
    .acts .btn { height: 32px }
    .prompt-side .btn { height: 40px }
    @media (pointer: coarse) { .qacts .btn { min-height: 44px } }
  `;
  const found = find(css).map((c) => c.offender.selector);
  assert.deepEqual(found.sort(), ['.acts .btn', '.prompt-side .btn']);
});

test('a weaker or equal rule cannot cancel the floor', () => {
  assert.deepEqual(find('.qacts .btn { min-height: 44px } .btn { height: 32px }'), []);
  assert.deepEqual(find('.btn { min-height: 44px } .btn { height: 32px }'), []);
});

test('overlap must be guaranteed, never guessed', () => {
  // Different components entirely: .card never matches .btn, so a height on
  // one says nothing about a floor on the other.
  assert.deepEqual(find('.btn { min-height: 44px } .card .thumb { height: 32px }'), []);
  // A :where() wrapper needs real matching to reason about.
  assert.deepEqual(find(':where(.btn) { min-height: 44px } .acts .btn { height: 32px }'), []);
  // A descendant weak selector is not a single compound.
  assert.deepEqual(find('.bar .btn { min-height: 44px } .bar .acts .btn { height: 32px }'), []);
});

test('values that cannot be compared at parse time are left alone', () => {
  assert.deepEqual(find('.btn { min-height: 44px } .acts .btn { height: var(--h) }'), []);
  assert.deepEqual(find('.btn { min-height: 44px } .acts .btn { height: calc(100% - 4px) }'), []);
  assert.deepEqual(find('.btn { min-height: 44px } .acts .btn { height: 2em }'), []);
  // rem is knowable against the 16px root default.
  assert.equal(find('.btn { min-height: 44px } .acts .btn { height: 2rem }').length, 1);
});

test('a height at or above the floor is not a conflict', () => {
  assert.deepEqual(find('.btn { min-height: 44px } .acts .btn { height: 48px }'), []);
});

test('comments cannot hide a conflict and do not shift line numbers', () => {
  const css = `.btn { min-height: 44px }\n/* a comment\n   spanning lines */\n.acts .btn { height: 32px }`;
  const [c] = find(css);
  assert.ok(c);
  assert.equal(c.line, 4, 'the reported line must survive comment blanking');
});
