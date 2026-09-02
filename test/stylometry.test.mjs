import { test } from 'node:test';
import assert from 'node:assert/strict';
import { burstiness, typeTokenRatio, MEASURED_AND_REJECTED } from '../dist/channels/stylometry.js';
import { loadCorpus } from '../dist/corpus/load.js';

/**
 * Measures over a whole document.
 *
 * The catalogue lists four. One shipped, three did not, and the reason is the
 * same for all three: without a reference corpus of human prose there is no
 * threshold to compare a number against, and a threshold guessed rather than
 * measured is how a tool starts making confident claims about who wrote
 * something.
 */

const varied = [
  'The provisioner reads the manifest, resolves every credential it names, and applies the result in the order the wizard wrote it.',
  'That order matters.',
  'A region set after the network is a region the network never saw, which is why the wizard writes them the other way round and why the manifest is not sorted alphabetically.',
  'It reads oddly.',
  'It is also correct.',
  'When a deployment fails at the third step, the operator wants the second step still standing, so nothing is rolled back automatically and the failure is left exactly where it happened.',
  'Cleaning up is a separate command.',
  'The alternative — unwinding on error — sounds tidier until the day it deletes the only working half of a cluster while you are looking at it.',
  'We tried that.',
  'Once.',
  'Since then the rule has been that failure stops and waits, because an operator who can see the wreckage can reason about it.',
  'An operator handed a clean slate cannot.',
  'That is the whole design.',
  'The wizard itself is three screens, and the third is the only one that writes anything.',
  'Screens one and two read.',
  'That split exists because an operator who abandons the flow halfway should leave nothing behind, and the only way to guarantee that is to make the first two screens incapable of writing.',
  'It costs a round trip.',
  'It is worth it.',
  'Every support ticket about a half-created deployment predates the split, and there have been none since, which is not proof but is the closest thing to it available.',
  'The manifest format is versioned separately from the binary.',
  'A deployment written last year still applies.',
  'That guarantee is load-bearing for airgapped installs, where the binary on the far side may be six months behind the one that produced the manifest, and nobody can upgrade it without a physical visit.',
  'So the reader is permissive and the writer is strict.',
  'Unknown keys are ignored on read and refused on write, which is the only combination that lets an old binary run a new manifest without pretending it understood all of it.',
].join(' ');

const uniform = Array.from({ length: 16 }, (_, i) =>
  `The ${['reporter', 'adapter', 'monitor', 'finding'][i % 4]} module provides a clear interface for handling ${['output', 'input', 'events', 'errors'][i % 4]} operations. ` +
  `This design allows the system to remain flexible while providing a consistent experience for callers.`,
).join(' ');

test('prose that alternates long and short is not flagged', () => {
  const b = burstiness(varied);
  assert.ok(b, 'there is enough prose to measure');
  assert.ok(b.cv > 0.32, `varied prose measured ${b.cv.toFixed(2)}, which would be reported`);
});

test('prose that comes out at one length is', () => {
  const b = burstiness(uniform);
  assert.ok(b, 'there is enough prose to measure');
  assert.ok(b.cv <= 0.32, `uniform prose measured ${b.cv.toFixed(2)}, which would not be reported`);
});

test('a short document is not measured at all', () => {
  // A note is uniform because it is short, and reporting that would be
  // measuring length rather than rhythm.
  assert.equal(burstiness('One sentence. Then another. And a third.'), null);
});

test('markdown furniture is not prose', () => {
  // A document that is mostly table or code fence would measure as uniform for
  // reasons that have nothing to do with how it was written.
  const table = ['| a | b |', '|---|---|', ...Array.from({ length: 40 }, () => '| one | two |')].join('\n');
  assert.equal(burstiness(table), null, 'a table has no prose to measure');
  const fenced = '```\n' + Array.from({ length: 60 }, () => 'const x = compute(a, b);').join('\n') + '\n```';
  assert.equal(burstiness(fenced), null, 'a code fence has no prose to measure');
});

test('the rule reports as advisory and never as a score', () => {
  // This is the class of check with the worst false-positive record in the
  // literature — independent audits put commercial detectors above 60% on
  // non-native English writers. It corroborates; it never convicts.
  const rule = loadCorpus().find((r) => r.id === 'uniform-sentence-length');
  assert.ok(rule, 'the rule exists');
  assert.ok(rule.advisory, 'it must never cost a score');
  assert.ok(rule.legitimateWhen, 'and must name the genre it is wrong about');
  assert.match(rule.legitimateWhen, /[Rr]eference/);
});

test('the threshold is recorded with the measurement behind it', () => {
  const rule = loadCorpus().find((r) => r.id === 'uniform-sentence-length');
  assert.equal(rule.cascade.check, 'sentence-burstiness');
  assert.equal(rule.cascade.params.maxCv, 0.32);
});

test('type-token ratio is computable and deliberately unused', () => {
  // Kept as a function because the measurement is the evidence for not shipping
  // a rule: across the same 1,113 documents the machine-written ones scored
  // 0.58-0.63 against a population median of 0.645 — inside the ordinary range,
  // overlapping it on both sides.
  const t = typeTokenRatio(varied + ' ' + uniform);
  assert.ok(t === null || (t > 0 && t <= 1), 'it computes a ratio');
  assert.ok(MEASURED_AND_REJECTED.includes('type-token-ratio'));
  assert.equal(
    loadCorpus().filter((r) => MEASURED_AND_REJECTED.some((x) => r.id.includes(x))).length,
    0,
    'nothing rejected by measurement is in the corpus',
  );
});
