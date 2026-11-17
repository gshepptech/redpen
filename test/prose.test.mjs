import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runScan } from '../dist/scan.js';
import { loadCorpus } from '../dist/corpus/load.js';

/**
 * Writing that reads as machine-made.
 *
 * READMEs, changelogs and design docs are read as documents: `.md` is a
 * scanned file type, and the prose rules apply to it.
 */

function doc(name, body) {
  const dir = mkdtempSync(join(tmpdir(), 'redpen-prose-'));
  writeFileSync(join(dir, 'package.json'), '{"name":"p","private":true}');
  writeFileSync(join(dir, name), body, 'utf8');
  return dir;
}

const prose = async (dir) => {
  const r = await runScan({ root: dir, codeCategories: true, ephemeral: true, tools: false });
  return r.findings.filter((f) => f.category === 'prose');
};

test('markdown is read at all', async () => {
  const dir = doc('README.md', 'Certainly! Here is the overview you asked for.\n');
  try {
    const found = await prose(dir);
    assert.ok(found.some((f) => f.ruleId === 'chatbot-artifact'), 'a .md file must be read');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a prose finding never appears in a page scan', async () => {
  // A document in the repository and the words on a rendered page are different
  // questions, and averaging them into one score answers neither.
  const dir = doc('README.md', 'Certainly! Here is the overview you asked for.\n');
  try {
    const r = await runScan({ root: dir, ephemeral: true });
    assert.deepEqual(r.findings.filter((f) => f.category === 'prose'), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('one reachy word is not a register, four is', async () => {
  const one = doc('a.md', 'The system is robust and handles retries.\n');
  const many = doc(
    'b.md',
    [
      'Let us delve into the tapestry of this realm.',
      'A meticulous, seamless approach at its core.',
      'This underscores the importance of best practices.',
      'We embark on a holistic paradigm.',
    ].join('\n'),
  );
  try {
    assert.ok(!(await prose(one)).some((f) => f.ruleId === 'ai-vocabulary'));
    assert.ok((await prose(many)).some((f) => f.ruleId === 'ai-vocabulary'));
  } finally {
    rmSync(one, { recursive: true, force: true });
    rmSync(many, { recursive: true, force: true });
  }
});

test('an underscore is a character, not a verb', async () => {
  // A document explaining APP_CACHE_DIR can say "the single-underscore form"
  // four times without being machine prose.
  const dir = doc(
    'a.md',
    [
      'Use the single-underscore form: APP_CACHE_DIR.',
      'The double-underscore form is wrong. Check the underscore count.',
      'A trailing underscore is also wrong. Underscore, not hyphen.',
    ].join('\n'),
  );
  try {
    assert.ok(!(await prose(dir)).some((f) => f.ruleId === 'ai-vocabulary'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('sentence case is not Title Case', async () => {
  // Patterns compile case-insensitively, so without caseSensitive [A-Z] would
  // match lowercase and every sentence-case heading would read as Title Case.
  const sentence = doc(
    'a.md',
    ['## Maintained development host', '', '## Running the test suite', '', '## Building a release', ''].join('\n'),
  );
  const title = doc(
    'b.md',
    ['## Helm Values Snippets', '', '## Pull Request Checklist', '', '## Acceptance Journeys And Receipts', ''].join('\n'),
  );
  try {
    assert.ok(!(await prose(sentence)).some((f) => f.ruleId === 'title-case-heading'));
    const hits = (await prose(title)).find((f) => f.ruleId === 'title-case-heading');
    assert.ok(hits, 'real Title Case is caught');
    assert.match(hits.evidence[0].excerpt, /Helm Values Snippets/);
    assert.ok(hits.evidence[0].line > 0, 'the reported line is the heading, not the blank line above it');
  } finally {
    rmSync(sentence, { recursive: true, force: true });
    rmSync(title, { recursive: true, force: true });
  }
});

test('wordiness is advisory, because people have always written that way', async () => {
  // The catalogue naming these measured them against 257 paragraphs of verified
  // pre-2023 human prose and found they fire on ordinary professional writing.
  // Presenting a wordiness fix as evidence of machine authorship is the error
  // the split exists to prevent.
  const rule = loadCorpus().find((r) => r.id === 'inflated-formality');
  assert.ok(rule.advisory, 'inflated-formality must never score');
  const measured = loadCorpus().find((r) => r.id === 'ai-vocabulary');
  assert.ok(!measured.advisory, 'the frequency markers do score');
});

test('every prose rule reads documents and nothing else', () => {
  for (const r of loadCorpus().filter((x) => x.category === 'prose')) {
    assert.deepEqual(r.channels, ['source'], `${r.id} is source-only`);
    // A whole-document measure has no patterns to carry an extension list; the
    // scanner confines it to document types instead. See stylometry.test.mjs.
    if (r.cascade && !r.source) continue;
    assert.ok(r.source?.extensions?.includes('.md'), `${r.id} must read .md`);
    for (const ext of r.source.extensions) {
      assert.ok(
        ['.md', '.markdown', '.rst', '.txt', '.adoc'].includes(ext),
        `${r.id} reads ${ext}, which is not a document`,
      );
    }
  }
});

test('a document is checked for em dashes; the page rule never saw one', async () => {
  // The em-dash rule reads .md too, the format where the tell was named in
  // the first place.
  const dir = doc('README.md', 'A sentence — with an aside — and another one.\n'.repeat(8));
  try {
    const r = await runScan({ root: dir, codeCategories: true, ephemeral: true, tools: false });
    const advisory = (r.advisory ?? []).map((f) => f.ruleId);
    assert.ok(advisory.includes('em-dash-in-prose'), advisory.join(' '));
    assert.ok(
      !r.findings.some((f) => f.ruleId === 'em-dash-in-prose'),
      'it is advisory, so it never scores — humans punctuate this way too',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a bolded lead term in a list is typography, not a prose splice', async () => {
  // `- **Term** — description` is a definition list wearing markdown, and the
  // catalogue carves it out by name, so it must not count.
  const dir = doc(
    'README.md',
    Array.from({ length: 12 }, (_, i) => `- **Term ${i}** — what it means`).join('\n') + '\n',
  );
  try {
    const r = await runScan({ root: dir, codeCategories: true, ephemeral: true, tools: false });
    assert.ok(!(r.advisory ?? []).some((f) => f.ruleId === 'em-dash-in-prose'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('every writing tell borrowed from the catalogue is credited', async () => {
  // Every rule carrying a `writing:` reference needs a writing catalogue named
  // in NOTICE; a gap there is an attribution gap in a corpus whose whole claim
  // is provenance.
  const { readFileSync } = await import('node:fs');
  const notice = readFileSync(new URL('../NOTICE', import.meta.url), 'utf8');
  const cited = loadCorpus().filter((r) => r.sources.some((s) => /^writing:/.test(s.ref)));
  assert.ok(cited.length >= 15, `${cited.length} rules cite the writing catalogue`);
  assert.match(notice, /avoid-ai-writing/, 'NOTICE must name the catalogue those rules came from');
  assert.match(notice, /false-positive/, 'and carry the caveat it ships with');
});
