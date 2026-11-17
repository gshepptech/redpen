import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCorpus, rulesForChannel, ruleById, originCounts } from '../dist/corpus/load.js';

test('corpus loads and every rule validates', () => {
  const rules = loadCorpus();
  assert.ok(rules.length > 80, `expected a substantial corpus, got ${rules.length}`);
});

test('every rule carries provenance', () => {
  for (const r of loadCorpus()) {
    assert.ok(r.sources.length > 0, `${r.id} has no sources`);
    for (const s of r.sources) {
      assert.ok(s.origin && s.ref, `${r.id} has a malformed source`);
    }
  }
});

test('every declared channel has a matcher', () => {
  for (const r of loadCorpus()) {
    // A cascade matcher reads the stylesheet rather than regexing it, but it
    // observes the same channel.
    if (r.channels.includes('source')) {
      assert.ok(r.source || r.cascade, `${r.id}: source channel, no matcher`);
    }
    if (r.channels.includes('render')) assert.ok(r.render, `${r.id}: render channel, no matcher`);
    if (r.channels.includes('vision')) assert.ok(r.vision, `${r.id}: vision channel, no matcher`);
  }
});

test('every source pattern compiles', () => {
  for (const r of loadCorpus()) {
    for (const p of r.source?.patterns ?? []) {
      assert.doesNotThrow(() => new RegExp(p, 'giu'), `${r.id}: /${p}/ does not compile`);
    }
  }
});

test('rule ids are unique', () => {
  const ids = loadCorpus().map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('weights sit in range and measured tells outrank unmeasured ones on average', () => {
  const rules = loadCorpus();
  for (const r of rules) {
    assert.ok(r.weight >= 0 && r.weight <= 100, `${r.id} weight ${r.weight}`);
  }
  const measured = rules.filter((r) => r.evidenceRank !== null);
  const unmeasured = rules.filter((r) => r.evidenceRank === null);
  const avg = (xs) => xs.reduce((a, r) => a + r.weight, 0) / xs.length;
  assert.ok(
    avg(measured) > avg(unmeasured),
    'tells humans actually name should outweigh tells only a catalogue author named',
  );
});

test('the merge collapsed real overlap', () => {
  const counts = originCounts();
  const references = Object.values(counts).reduce((a, b) => a + b, 0);
  const rules = loadCorpus().length;
  assert.ok(
    references > rules * 1.5,
    `expected heavy overlap between sources; ${references} refs across ${rules} rules`,
  );
  // Every kind of authority must actually be represented. A corpus that lost
  // its `study` refs would be pure taste; one that lost `redpen` would be a
  // reprint rather than a merge.
  for (const c of ['catalogue', 'study', 'heuristics', 'redpen']) {
    assert.ok(counts[c] > 0, `nothing in the corpus is backed by ${c}`);
  }
});

test('sameness rules are fingerprint-only', () => {
  for (const r of loadCorpus().filter((x) => x.category === 'sameness')) {
    assert.deepEqual(r.channels, ['fingerprint'], `${r.id} should only be observable by fingerprint`);
  }
});

test('rulesForChannel and ruleById agree with the corpus', () => {
  const src = rulesForChannel('source');
  assert.ok(src.every((r) => r.channels.includes('source')));
  assert.equal(ruleById('ai-purple')?.category, 'color');
  assert.equal(ruleById('does-not-exist'), undefined);
});

/* ---- kind, surfaces, advisory ----------------------------------------- */

test('every rule declares whether it is slop or quality', () => {
  for (const r of loadCorpus()) {
    assert.ok(['slop', 'quality'].includes(r.kind), `${r.id} has kind "${r.kind}"`);
  }
});

test('the corpus carries a real split, not a token one', () => {
  const rules = loadCorpus();
  const slop = rules.filter((r) => r.kind === 'slop').length;
  const quality = rules.filter((r) => r.kind === 'quality').length;
  assert.ok(slop > 25 && quality > 25, `expected both kinds well represented, got ${slop}/${quality}`);
});

test('a11y and usability rules are quality — broken is broken whatever your taste', () => {
  for (const r of loadCorpus()) {
    if (r.category === 'a11y' || r.category === 'usability') {
      assert.equal(r.kind, 'quality', `${r.id} (${r.category}) should be quality`);
    }
  }
});

test('sameness rules are slop — nothing is broken, it just looks generated', () => {
  for (const r of loadCorpus().filter((r) => r.category === 'sameness')) {
    assert.equal(r.kind, 'slop', `${r.id} should be slop`);
  }
});

test('a rule that names surfaces never names all three', () => {
  for (const r of loadCorpus()) {
    if (!r.surfaces) continue;
    assert.ok(r.surfaces.length > 0 && r.surfaces.length < 3, `${r.id}: ${r.surfaces}`);
    for (const s of r.surfaces) {
      assert.ok(['persuade', 'operate', 'read'].includes(s), `${r.id} names surface "${s}"`);
    }
  }
});

test('the rules that punish familiarity are off on an operate surface', () => {
  // On a task surface familiarity is a feature: one type family is often right,
  // and consistent repeating components are the point. These must not fire there.
  const rules = new Map(loadCorpus().map((r) => [r.id, r]));
  for (const id of ['default-sans', 'monotonous-spacing', 'ghost-cards', 'over-rounding']) {
    const r = rules.get(id);
    assert.ok(r, `${id} missing from the corpus`);
    assert.ok(r.surfaces, `${id} must be surface-gated`);
    assert.ok(!r.surfaces.includes('operate'), `${id} must not apply on an operate surface`);
  }
});

test('quality rules apply on every surface — broken is broken everywhere', () => {
  const gatedQuality = loadCorpus().filter((r) => r.kind === 'quality' && r.surfaces);
  // line-length is the one deliberate exception: dense data tables legitimately
  // run past the prose measure, so it is scoped away from operate.
  const unexpected = gatedQuality.filter((r) => r.id !== 'line-length');
  assert.deepEqual(
    unexpected.map((r) => r.id),
    [],
    'a quality rule was surface-gated without justification',
  );
});

test('advisory rules exist and are never the loudest thing in the corpus', () => {
  const advisory = loadCorpus().filter((r) => r.advisory);
  assert.ok(advisory.length > 0, 'the corpus should mark some tells advisory');
  for (const r of advisory) {
    assert.ok(r.weight < 70, `${r.id} is advisory but weighted ${r.weight}`);
  }
});

test('the detector bundle is valid JavaScript', async () => {
  // The bundle lives inside a TS template literal, so a stray backtick or a
  // single-backslash regex silently corrupts it and every render check dies at
  // runtime with "window.__redpenDetect is not a function".
  const { detectorSource } = await import('../dist/channels/detectors.js');
  const { fingerprintSource } = await import('../dist/fingerprint/extract.js');
  const { surfaceSource } = await import('../dist/channels/surface.js');

  for (const [name, fn] of [
    ['detector', detectorSource],
    ['fingerprint', fingerprintSource],
    ['surface', surfaceSource],
  ]) {
    const src = fn();
    assert.doesNotThrow(
      () => new Function(`return ${src}`),
      `the ${name} bundle does not parse`,
    );
    assert.ok(
      !/[^\\]`/.test(src.slice(1, -1)),
      `the ${name} bundle contains an unescaped backtick, which truncates it`,
    );
  }
});

test('every render check named by a rule exists in the bundle', async () => {
  const { detectorSource } = await import('../dist/channels/detectors.js');
  const src = detectorSource();
  const missing = loadCorpus()
    .filter((r) => r.render)
    .map((r) => r.render.check)
    .filter((check) => !src.includes(`CHECKS['${check}']`));
  assert.deepEqual(missing, [], 'rules name render checks that do not exist');
});

test('no rule depends on case while compiling case-insensitively', () => {
  // This inverts a rule silently: `const food` reads as a SCREAMING_CASE
  // constant, every sentence-case heading as Title Case, and `- [x]` task
  // checkboxes as chat-transcript markup. Patterns compile
  // with the `i` flag unless a rule opts out, so an uppercase-only class or
  // literal means the opposite of what it says.
  const offenders = [];
  for (const rule of loadCorpus()) {
    const m = rule.source;
    if (!m || m.caseSensitive) continue;
    for (const field of ['patterns', 'paths']) {
      for (const pattern of m[field] ?? []) {
        // An uppercase-only character class, or a bracketed alternation of
        // single uppercase letters. Both are meaningless under `i`.
        if (/\[A-Z[^\]]*\]/.test(pattern) || /\[\^?[A-Z](\|[A-Z])+\]/.test(pattern)) {
          offenders.push(`${rule.id}: ${pattern}`);
        }
      }
    }
    if (m.suppress && /\[A-Z[^\]]*\]/.test(m.suppress)) {
      offenders.push(`${rule.id} (suppress): ${m.suppress}`);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `these rules need caseSensitive: true, or the [A-Z] means nothing:\n${offenders.join('\n')}`,
  );
});
