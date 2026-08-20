import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runScan } from '../dist/scan.js';
import { CODE_CATEGORIES } from '../dist/scan.js';

/**
 * The source a project is written in, rather than the page it serves.
 *
 * Two categories, both source-channel, both outside a UI scan on purpose: they
 * fired on redpen's own src the moment they existed, and folding them into
 * `scan` would have moved every score anyone holds a baseline against.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const NAME_RULES = ['versioned-filename', 'grandiose-identifier', 'placeholder-identifier'];

const CODE_RULES = [
  'edit-narrating-comment',
  'signature-restating-docstring',
  'stub-shipped',
  'swallowed-error',
  'defensive-impossible-check',
  'orchestration-marker',
  'agent-attribution',
  'conversation-artifact',
  'dead-scaffold-reference',
];

const scanCode = (fixture) =>
  runScan({ root: join(HERE, 'fixtures', fixture), codeCategories: true, ephemeral: true });

test('every code rule fires on the shape it describes', async () => {
  const result = await scanCode('sloppy-code');
  const fired = new Set(result.findings.map((f) => f.ruleId));
  for (const id of CODE_RULES) {
    assert.ok(fired.has(id), `${id} did not fire on the shape it describes`);
  }
});

test('none of them fire on code written without them', async () => {
  const result = await scanCode('clean-code');
  assert.deepEqual(
    result.findings.map((f) => f.ruleId),
    [],
    'a rule fired on code that does not have the defect',
  );
});

test('a caught error with a stated reason is a decision, not a swallow', async () => {
  // The rule's own fix says so, and the first version contradicted it — firing
  // on redpen's `catch (e) { /* cross-origin stylesheet */ }`, which is exactly
  // the shape the advice calls correct. Same principle as redpen-ignore: the
  // reason is what makes it a decision.
  const result = await scanCode('clean-code');
  assert.ok(
    !result.findings.some((f) => f.ruleId === 'swallowed-error'),
    'a catch carrying its reason was reported as swallowing',
  );

  const sloppy = await scanCode('sloppy-code');
  const swallow = sloppy.findings.find((f) => f.ruleId === 'swallowed-error');
  assert.ok(swallow, 'an empty catch should still be reported');
  const seen = swallow.evidence.map((e) => e.excerpt ?? '').join('\n');
  assert.match(seen, /catch|ignore/, seen);
});

test('a UI scan never returns a code finding, and a code scan never returns a UI one', async () => {
  // The gate that keeps existing baselines meaningful.
  const ui = await runScan({ root: join(HERE, 'fixtures', 'sloppy-code'), ephemeral: true });
  const leaked = ui.findings.filter((f) => CODE_CATEGORIES.has(f.category));
  assert.deepEqual(leaked.map((f) => f.ruleId), [], 'code rules leaked into a UI scan');

  const code = await scanCode('sloppy');
  const wrongWay = code.findings.filter((f) => !CODE_CATEGORIES.has(f.category));
  assert.deepEqual(wrongWay.map((f) => f.ruleId), [], 'UI rules leaked into a code scan');
});

test("redpen's own source stays clean of what it reports", async () => {
  // A real-world check rather than a fixture: the code that ships the rules has
  // to pass them. It found three catches in detectors.ts the first time, which
  // turned out to be the rule's fault rather than the code's.
  const result = await runScan({
    root: join(HERE, '..', 'src'),
    codeCategories: true,
    ephemeral: true,
  });
  const found = result.findings.map((f) => `${f.ruleId} — ${f.evidence[0]?.location}:${f.evidence[0]?.line}`);
  assert.deepEqual(found, [], `redpen's own source trips its own code rules:\n${found.join('\n')}`);
});

test('a code scan reads the language the project is written in', async () => {
  // The extension list was the UI one, so `redpen code` on a 174-file Go
  // repository read the fourteen HTML files in it and answered 100/100 clean.
  const result = await runScan({
    root: join(HERE, 'fixtures', 'go-code'),
    codeCategories: true,
    ephemeral: true,
  });
  const fired = result.findings.map((f) => f.ruleId);
  assert.ok(fired.includes('orchestration-marker'), `read nothing in the .go files: ${fired}`);
  const files = result.findings
    .flatMap((f) => f.evidence.map((e) => e.location))
    .filter((l) => l.endsWith('.go'));
  assert.ok(files.length > 0, 'no evidence came from a .go file');
});

test('a language nothing can read is said out loud, not scored around', async () => {
  const result = await runScan({
    root: join(HERE, 'fixtures', 'unreadable-code'),
    codeCategories: true,
    ephemeral: true,
  });
  assert.ok(
    result.warnings.some((w) => w.includes('were not read')),
    `nothing said the files were skipped: ${result.warnings.join(' | ')}`,
  );
});

test('a code scan opens no browser and claims no missing one', async () => {
  // It launched chromium against eight configured urls with no server behind
  // them, then reported the connection failures as though the run had lost
  // something. No craft or residue rule has a render half.
  const result = await runScan({
    root: join(HERE, 'fixtures', 'sloppy-code'),
    urls: ['http://127.0.0.1:9/nothing-here'],
    codeCategories: true,
    ephemeral: true,
  });
  assert.ok(!result.channelsRun.includes('render'), 'a code scan rendered');
  assert.ok(
    !result.warnings.some((w) => w.includes('capped at')),
    `claimed a render half that no code rule has: ${result.warnings.join(' | ')}`,
  );
});

test('a name is evidence too', async () => {
  // Every rule before these read file contents. A file called
  // `enhanced-parser-v2.ts` says as much about how it came to exist as
  // anything inside it, and no amount of reading the contents finds it.
  const result = await scanCode('sloppy-names');
  const fired = new Set(result.findings.map((f) => f.ruleId));
  for (const id of NAME_RULES) {
    assert.ok(fired.has(id), `${id} did not fire on the name it describes`);
  }

  // A path hit reports the path, because no line in a file carries its name.
  const byPath = result.findings.find((f) => f.ruleId === 'versioned-filename');
  const excerpts = byPath.evidence.map((e) => e.excerpt);
  assert.ok(
    excerpts.some((e) => e && e.endsWith('.ts')),
    `the filename is not the evidence: ${excerpts.join(', ')}`,
  );
});

test('the naming rules leave ordinary naming alone', async () => {
  // Learned from four codebases, one prefix at a time. `newToken` and
  // `newCompileCmd` are the Go constructor idiom; `tempDir` and `testService`
  // are test helpers named exactly right; `sampleProfile` takes samples along a
  // path and `sampleTemplates` returns sample templates. Every one of those
  // fired before the prefix list was cut down to the words nobody picks on
  // purpose.
  const result = await scanCode('ordinary-names');
  assert.deepEqual(
    result.findings.map((f) => `${f.ruleId}: ${f.evidence[0]?.excerpt}`),
    [],
    'a naming rule fired on ordinary code',
  );
});

test('one junk drawer is a project, three is a filing system nobody designed', async () => {
  // The rule counts rather than matches. One utils.ts is where the two
  // functions that fit nowhere live, and that is fine; three means "where does
  // this go" has three answers and no reason to prefer any of them.
  const three = await scanCode('junk-drawers');
  assert.ok(
    three.findings.some((f) => f.ruleId === 'junk-drawer-module'),
    'three drawers did not fire',
  );

  const two = await scanCode('two-drawers');
  assert.ok(
    !two.findings.some((f) => f.ruleId === 'junk-drawer-module'),
    'two drawers fired, which is a project keeping its odds and ends',
  );
});

test('a directory of odds and ends counts once, not once per file', async () => {
  // Matching a `utils/` directory would count every file inside it and report
  // one drawer as thirty, which is why the pattern is on the basename.
  const result = await scanCode('junk-drawers');
  const drawer = result.findings.find((f) => f.ruleId === 'junk-drawer-module');
  const locations = new Set(drawer.evidence.map((e) => e.location));
  assert.equal(locations.size, drawer.evidence.length, 'a file was counted twice');
});
