import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runScan } from '../dist/scan.js';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
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

test('a reason written above the block is still a reason', async () => {
  // Suppression read only the line the hit was on, and reasons are written
  // above the code they explain. It reported
  // `try { await refresh(); } catch {}` on a project whose three lines above it
  // say "Swallow a refresh failure so the error surface below always fires" —
  // a better justification than most code carries inside the braces.
  const result = await scanCode('clean-code');
  assert.ok(
    !result.findings.some((f) => f.ruleId === 'swallowed-error'),
    'a catch whose reason sits above it was reported as an omission',
  );

  // ...and a block with no reason anywhere near it still is one.
  const sloppy = await scanCode('sloppy-code');
  assert.ok(
    sloppy.findings.some((f) => f.ruleId === 'swallowed-error'),
    'an unexplained empty catch stopped being reported',
  );
});

test('the rules catch code that looks like it shipped, not just the caricature', async () => {
  // sloppy-code is a caricature: every tell, one per line, unmistakable. This
  // fixture is what actually gets committed — a plausible service class with
  // four tells buried in working code — and on the first run the rules found
  // two of them.
  //
  // Both misses had causes. `swallowed-error` needed the console call to be the
  // only statement in the block, so `catch (e) { console.log(e); return ""; }`
  // went unreported. And the docstring rule only knew JSDoc that carries a
  // type, which TypeScript does not write, because the type is in the
  // signature — so a TypeScript codebase could not trip it at all.
  const result = await scanCode('realistic-code');
  const fired = new Set(result.findings.map((f) => f.ruleId));
  for (const id of [
    'stub-shipped',
    'swallowed-error',
    'edit-narrating-comment',
    'signature-restating-docstring',
  ]) {
    assert.ok(fired.has(id), `${id} missed a tell buried in working code`);
  }
});

test('the residue rules find tells buried in a working feature', async () => {
  // Six of the twelve had never fired outside sloppy-code, which is a
  // caricature: every tell on its own line, unmistakable. This fixture is a
  // sync feature that works — a retry queue, a conflict resolver, a totals
  // helper — with the tells where they actually turn up.
  //
  // agent-attribution was the one that needed widening. It knew "generated by
  // Claude Code" and not `@author Claude` or "Written with AI assistance",
  // which are the two shapes a real file carries.
  const result = await scanCode('realistic-residue');
  const fired = new Set(result.findings.map((f) => f.ruleId));
  for (const id of [
    'agent-attribution',
    'conversation-artifact',
    'dead-scaffold-reference',
    'defensive-impossible-check',
    'junk-drawer-module',
    'versioned-filename',
  ]) {
    assert.ok(fired.has(id), `${id} missed a tell buried in a working feature`);
  }
});

test('no code rule rests on the caricature alone', async () => {
  // Every rule has to fire on something that is not sloppy-code — either one of
  // the realistic fixtures, or a real project. A rule that only fires on the
  // exaggerated case is a rule that fires on nothing anyone would commit.
  const realistic = await scanCode('realistic-code');
  const residue = await scanCode('realistic-residue');
  const names = await scanCode('sloppy-names');
  const proven = new Set([
    ...realistic.findings.map((f) => f.ruleId),
    ...residue.findings.map((f) => f.ruleId),
    ...names.findings.map((f) => f.ruleId),
    // These two have never needed a fixture: they fire on real projects.
    'orchestration-marker',
    'swallowed-error',
  ]);
  const unproven = CODE_RULES.filter((id) => !proven.has(id));
  assert.deepEqual(unproven, [], `resting on the caricature alone: ${unproven.join(', ')}`);
});

/**
 * One phrasing is not the class.
 *
 * Every miss this session was the same shape: the pattern encoded one way of
 * writing a tell and there were more. agent-attribution knew "generated by
 * Claude Code" and not `@author Claude`; invented-metrics listed the nouns it
 * would accept; no-loading-state knew only the inline handler;
 * signature-restating-docstring knew only JSDoc that carries a type;
 * swallowed-error needed the log to be the only statement in the block.
 *
 * A regex is a whitelist. The fixture is where the whitelist gets thought
 * about, so each tell carries every phrasing that turns up, and the assertion
 * is per line — a failure names the phrasing that escaped rather than saying
 * the rule went quiet.
 */
const VARIANTS = {
  'attribution.ts': [1, 3, 5, 6, 7, 8],
  'swallow.ts': [2, 5, 8, 11, 14],
  'docstring.ts': [1, 9, 15, 19],
  'editnote.ts': [1, 4, 7, 10, 13],
  'residue.ts': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  'stubs.ts': [2, 5, 7, 10, 12, 15],
  'names.ts': [1, 2, 3, 4, 5, 6, 7],
  'guards.ts': [2, 7, 9],
};

/** Names, which have no line to report — a path hit is always line 1. */
const PATH_VARIANTS = [
  'handler-v2.ts',
  'config-new.ts',
  'schema-final.ts',
  'index-copy.ts',
  'parser2.ts',
  'utils.ts',
  'helpers.ts',
  'common.ts',
  'misc.ts',
  'enhanced-parser.ts',
  'improved-client.ts',
  'smart-defaults.ts',
];

test('each tell is caught in every phrasing it is written in', async () => {
  const result = await scanCode('variants');
  const seen = new Set(
    result.findings.flatMap((f) => f.evidence.map((e) => `${e.location}:${e.line}`)),
  );
  const escaped = [];
  for (const [file, lines] of Object.entries(VARIANTS)) {
    for (const line of lines) {
      if (!seen.has(`${file}:${line}`)) escaped.push(`${file}:${line}`);
    }
  }
  for (const file of PATH_VARIANTS) {
    if (!seen.has(`${file}:1`)) escaped.push(file);
  }
  assert.deepEqual(escaped, [], `these phrasings escaped:\n${escaped.join('\n')}`);
});

test('an ignore written in the source is reported, not just obeyed', async () => {
  // The channel collected in-source ignores into a map and scan.ts dropped it
  // on the floor, so `--show-ignored` — whose help says it lists findings
  // suppressed by redpen-ignore — listed only the ones named in
  // .redpen/config.json. The reason a person is required to write, on the
  // argument that an ignore with a reason is a decision on record, went
  // nowhere and could not be read back.
  //
  // The renderer had the second half of the same bug: the block sat below the
  // early return for a clean report, which is exactly when someone asks what
  // was excused to get it.
  const r = await runScan({
    root: join(HERE, 'fixtures', 'excused'),
    codeCategories: true,
    ephemeral: true,
  });

  assert.equal(r.findings.length, 0, 'the ignore did not suppress the finding');
  assert.equal(r.ignored.length, 1, 'the ignore was obeyed and then forgotten');

  const [only] = r.ignored;
  assert.equal(only.ruleId, 'swallowed-error');
  assert.match(only.ignored.reason, /best-effort/);
  assert.equal(only.evidence[0].location, 'worker.ts', 'the excuse has to name the file it excused');
  assert.ok(only.evidence[0].line > 0, 'and the line');
});

/**
 * The rules added from code-slop CODE-03, 06, 09, 10 and 12.
 *
 * Each one is here with the false positive it produced on a real codebase
 * before it was narrowed, because that is the only evidence that the narrowing
 * is real rather than asserted.
 */
const ADDED_CODE_RULES = [
  'weak-type-escape',
  'long-parameter-list',
  'rewritten-standard-library',
  'named-magic-number',
  'barrel-file',
];

test('the rules added from the code catalogue fire on the shapes they name', async () => {
  const result = await scanCode('sloppy-code');
  const fired = new Set(result.findings.map((f) => f.ruleId));
  for (const id of ADDED_CODE_RULES) {
    assert.ok(fired.has(id), `${id} did not fire on the shape it describes`);
  }
});

test('a tuple in a signature is not six parameters', async () => {
  // `compare(x: [number, number, number], y: [number, number, number])` counted
  // its tuple commas and reported redpen's own cascade.ts as a six-parameter
  // function. Brackets are excluded from a parameter segment for this reason.
  const { runScan } = await import('../dist/scan.js');
  const result = await runScan({
    root: join(HERE, '..', 'src'),
    codeCategories: true,
    ephemeral: true,
  });
  assert.deepEqual(
    result.findings.map((f) => f.ruleId),
    [],
    "redpen's own source must stay clean of everything it reports",
  );
});

test('a number that already has a name is not a magic number', async () => {
  const { runScan } = await import('../dist/scan.js');
  const dir = mkdtempSync(join(tmpdir(), 'redpen-magic-'));
  try {
    writeFileSync(join(dir, 'package.json'), '{"name":"m","private":true}');
    writeFileSync(
      join(dir, 'a.ts'),
      [
        'const MAX_IDS = 1000; // cap array-of-ids fields',
        'const rows = tier(acres, [[10, 25]]);          // max 25',
      ].join('\n'),
      'utf8',
    );
    const result = await runScan({ root: dir, codeCategories: true, ephemeral: true });
    const magic = result.findings.find((f) => f.ruleId === 'named-magic-number');
    assert.ok(magic, 'the unnamed literal is still reported');
    assert.equal(magic.evidence.length, 1, 'only the unnamed one');
    assert.match(magic.evidence[0].excerpt, /max 25/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('English prose is not a type annotation', async () => {
  // `# same as any other failure` in a shell script matched `as any` and was
  // reported as a widened type. The rule now reads only languages that have
  // one.
  const { runScan } = await import('../dist/scan.js');
  const dir = mkdtempSync(join(tmpdir(), 'redpen-prose-'));
  try {
    writeFileSync(join(dir, 'package.json'), '{"name":"p","private":true}');
    writeFileSync(
      join(dir, 'run.sh'),
      '# an undefined target is skipped, same as any other failure\n'.repeat(4),
      'utf8',
    );
    const result = await runScan({ root: dir, codeCategories: true, ephemeral: true });
    assert.ok(
      !result.findings.some((f) => f.ruleId === 'weak-type-escape'),
      'a shell comment is not a widened type',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a local named for a standard helper is not a reimplementation of one', async () => {
  // `const pick = features.find(...)` is a variable that shares a name with a
  // lodash helper, and eleven honest `const sleep = ms => ...` lines are not
  // duplicates of anything — nothing in the runtime is called sleep.
  const { runScan } = await import('../dist/scan.js');
  const dir = mkdtempSync(join(tmpdir(), 'redpen-stdlib-'));
  try {
    writeFileSync(join(dir, 'package.json'), '{"name":"s","private":true}');
    writeFileSync(
      join(dir, 'a.ts'),
      [
        'const pick = features.find((f) => f.kind === "boundary");',
        'const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));',
        'const clamp = (n: number) => Math.max(0, Math.min(100, n));',
      ].join('\n'),
      'utf8',
    );
    const result = await runScan({ root: dir, codeCategories: true, ephemeral: true });
    assert.ok(!result.findings.some((f) => f.ruleId === 'rewritten-standard-library'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a Python or Go test file is test material, not shipped source', async () => {
  // `test_corridor.py` gave a magic-number finding on an array index and
  // `conftest.py` gave eleven swallowed-error findings. SKIP_FILE only knew
  // the JavaScript spellings.
  const { runScan } = await import('../dist/scan.js');
  const dir = mkdtempSync(join(tmpdir(), 'redpen-pytest-'));
  try {
    writeFileSync(join(dir, 'package.json'), '{"name":"py","private":true}');
    writeFileSync(join(dir, 'conftest.py'), 'try:\n    go()\nexcept Exception:\n    pass\n');
    writeFileSync(join(dir, 'test_grid.py'), 'geom[10:50, 20:22] = 5     # two spur lines\n');
    writeFileSync(join(dir, 'thing_test.go'), 'func TestX(t *testing.T) {\n}\n');
    const result = await runScan({ root: dir, codeCategories: true, ephemeral: true });
    assert.deepEqual(result.findings.map((f) => f.ruleId), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
