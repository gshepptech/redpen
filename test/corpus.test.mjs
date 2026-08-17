import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCorpus, rulesForChannel, ruleById, catalogueCounts } from '../dist/corpus/load.js';

test('corpus loads and every rule validates', () => {
  const rules = loadCorpus();
  assert.ok(rules.length > 80, `expected a substantial corpus, got ${rules.length}`);
});

test('every rule carries provenance', () => {
  for (const r of loadCorpus()) {
    assert.ok(r.sources.length > 0, `${r.id} has no sources`);
    for (const s of r.sources) {
      assert.ok(s.catalogue && s.ref, `${r.id} has a malformed source`);
    }
  }
});

test('every declared channel has a matcher', () => {
  for (const r of loadCorpus()) {
    if (r.channels.includes('source')) assert.ok(r.source, `${r.id}: source channel, no matcher`);
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
  const counts = catalogueCounts();
  const references = Object.values(counts).reduce((a, b) => a + b, 0);
  const rules = loadCorpus().length;
  assert.ok(
    references > rules * 1.5,
    `expected heavy overlap between catalogues; ${references} refs across ${rules} rules`,
  );
  // Every upstream catalogue must actually be represented.
  for (const c of ['impeccable', 'hallmark', 'unslop-ui', 'frontend-design-audit']) {
    assert.ok(counts[c] > 0, `${c} contributed nothing`);
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
