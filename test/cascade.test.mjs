import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findCancelledFloors, specificity, parse } from '../dist/channels/cascade.js';

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

test('a restore under @supports covers everywhere the promise does', () => {
  const css = `
    .btn { min-height: 44px }
    .qacts .btn { height: 32px }
    @supports (display: grid) { .qacts .btn { min-height: 44px } }
  `;
  assert.deepEqual(find(css), []);
});

test('a restore that only matches coarse pointers still leaves the desktop short', () => {
  // The production case this rule was built from. The restore is real, so the
  // first version treated the conflict as resolved — and declined to report a
  // control that is 44px on a phone and 32px on every desktop, which is where
  // almost everyone uses it.
  const css = `
    .btn { min-height: 44px }
    .qacts .btn { height: 32px }
    @media (pointer: coarse), (max-width: 720px) { .qacts .btn { min-height: 44px } }
  `;
  const [c] = find(css);
  assert.ok(c, 'a partially-restored floor is still short somewhere');
  assert.match(c.summary, /restored only under/);
  assert.match(c.summary, /pointer: coarse/);
  assert.match(c.summary, /stays 32px everywhere else/);
  assert.ok(c.restoredUnder, 'the condition must be reported, not just the conflict');
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
    @supports (display: grid) { .qacts .btn { min-height: 44px } }
  `;
  const found = find(css).map((c) => c.offender.selector);
  assert.deepEqual(found.sort(), ['.acts .btn', '.prompt-side .btn']);
});

test('all three are reported when the one fix only covers coarse pointers', () => {
  // The stylesheet as it actually is. The .qacts restore is real but narrow,
  // so it earns a caveat rather than an exemption — it is still 32px on every
  // desktop, and the other two are short everywhere.
  const css = `
    .btn { min-height: 44px }
    .qacts .btn { height: 32px }
    .acts .btn { height: 32px }
    .prompt-side .btn { height: 40px }
    @media (pointer: coarse), (max-width: 720px) { .qacts .btn { min-height: 44px } }
  `;
  const found = find(css);
  assert.deepEqual(
    found.map((c) => c.offender.selector).sort(),
    ['.acts .btn', '.prompt-side .btn', '.qacts .btn'],
  );
  const qacts = found.find((c) => c.offender.selector === '.qacts .btn');
  assert.ok(qacts.restoredUnder, 'the partial restore must be named');
  const acts = found.find((c) => c.offender.selector === '.acts .btn');
  assert.equal(acts.restoredUnder, null, 'an unrestored floor carries no caveat');
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

/**
 * The stylesheet parser underneath all of the above.
 *
 * Twelve tests covered the cascade logic and none covered the thing that feeds
 * it, so three parser bugs sat under a green suite. Each one silently reported
 * *less* than it was asked to look at, which is this project's recurring
 * failure and the hardest kind to notice: the run succeeds, the count is just
 * quietly wrong.
 *
 * Every case here is a stylesheet shape that occurs in ordinary CSS, not a
 * contrived one.
 */

const CONFLICT = `.btn { min-height: 44px; }
.acts .btn { height: 32px; }
`;

test('a statement at-rule does not swallow the rule after it', () => {
  // `@import` opens no block. The scanner ran past its semicolon to the next
  // rule's brace and read `@import url("base.css"); .btn` as one at-rule head,
  // pushed it as a condition, and lost `.btn`. Since `@import` opens a great
  // many stylesheets, this rule reported nothing at all on them.
  for (const statement of ['@import url("base.css");', '@charset "utf-8";', '@namespace svg url(http://www.w3.org/2000/svg);']) {
    const css = `${statement}\n${CONFLICT}`;
    assert.deepEqual(
      parse(css).map((r) => r.selector),
      ['.btn', '.acts .btn'],
      `${statement} lost a rule`,
    );
    assert.equal(find(css).length, 1, `${statement} suppressed the conflict`);
  }
});

test('a brace inside a string is not a brace', () => {
  // `content: "{"` is ordinary CSS. Counting it desynchronised the brace depth
  // and every rule after it in the file was dropped without a word.
  for (const decl of ['content: "{";', "content: '}';", 'content: "a{b}c";']) {
    const css = `.x::after { ${decl} }\n${CONFLICT}`;
    assert.equal(find(css).length, 1, `${decl} swallowed the rest of the sheet`);
  }
});

test('the last declaration in a block is the one that counts', () => {
  // One bug facing both ways: taking the first value reported a cancelled floor
  // where the browser uses the larger second value, and passed a page clean
  // where it uses the smaller one.
  assert.equal(
    find('.btn { min-height: 44px; }\n.acts .btn { height: 32px; height: 48px; }\n').length,
    0,
    'reported a conflict against a value the browser never uses',
  );
  assert.equal(
    find('.btn { min-height: 44px; }\n.acts .btn { height: 48px; height: 32px; }\n').length,
    1,
    'missed the value the browser does use',
  );
});

test('conditions still wrap the rules inside them', () => {
  // The at-rule fixes must not cost the media-query tracking they sit beside.
  const sets = parse('@media (max-width: 720px) { .btn { height: 32px; } }\n.btn { height: 44px; }\n');
  assert.equal(sets.length, 2);
  assert.deepEqual(sets[0].conditions, ['@media (max-width: 720px)']);
  assert.deepEqual(sets[1].conditions, []);
});
