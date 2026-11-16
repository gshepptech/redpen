import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderTerminal } from '../dist/report/terminal.js';

/**
 * The terminal report holds an 80-column right edge. Everything except a
 * finding's title line respects it — a title is a heading, and the 78-character
 * limit redpen enforces on the pages it scans is about running text, which a
 * single-line heading is not.
 *
 * The category strip, every `fix` paragraph and every evidence excerpt are
 * held to it, or redpen breaks its own `line-length` rule (typography.yaml,
 * 45-78ch, weight 60) in the act of reporting it.
 */

const MARKS = ['●', '◐', '○'];
const ESC = String.fromCharCode(27);
const ANSI = new RegExp(ESC + '\\[[0-9;]*m', 'g');
const strip = (s) => s.replace(ANSI, '');
const OPTS = { verbose: false, showIgnored: false, maxEvidence: 3 };

function busy() {
  const kinds = ['slop', 'quality'];
  const cats = ['color', 'copy', 'motion', 'typography', 'layout', 'a11y', 'depth'];
  const confs = ['confirmed', 'likely', 'possible'];
  const findings = [];
  for (let i = 0; i < 14; i++) {
    findings.push({
      ruleId: `rule-with-a-fairly-long-identifier-${i}`,
      title: 'Interactive element missing focus, active, or disabled styling',
      kind: kinds[i % 2],
      category: cats[i % cats.length],
      weight: 60 + i,
      confidence: confs[i % 3],
      channels: ['source'],
      why: 'A sentence long enough that it has to wrap more than once before it runs out, so the wrapping itself is under test rather than merely present on the page.',
      fix: 'Another sentence long enough to wrap, because the fix label sits on the same line as the first row and used to be charged to nobody at all.',
      evidence: [
        {
          location: 'src/components/some/deeply/nested/path/to/a/file.tsx',
          line: 128,
          excerpt:
            '<button className="inline-flex items-center justify-center rounded-full px-6 py-3 transition-all" onClick={handleSubmit}>Get started</button>',
        },
      ],
      sources: [{ origin: 'study', ref: 'focus-visible' }],
    });
  }
  return {
    score: 40,
    slopScore: 30,
    qualityScore: 55,
    findings,
    advisory: [],
    ignored: [],
    clashes: [],
    surfaces: {},
    channelsRun: ['source'],
    warnings: [],
  };
}

test('every line but a heading holds the 80-column edge', () => {
  const lines = renderTerminal(busy(), OPTS).split('\n').map(strip);
  const offenders = lines
    .filter((l) => l.length > 80)
    .filter((l) => !MARKS.some((m) => l.includes(`  ${m} `)));
  assert.deepEqual(offenders, [], `not headings, must fit:\n${offenders.join('\n')}`);
});

test('a long evidence excerpt is cut but its address never is', () => {
  const lines = renderTerminal(busy(), OPTS).split('\n').map(strip);
  const ev = lines.find((l) => l.includes('file.tsx:128'));
  assert.ok(ev, 'evidence line missing');
  assert.ok(ev.length <= 80, `evidence ran to ${ev.length}: ${ev}`);
  assert.match(ev, /file\.tsx:128/, 'the address was cut, and the address is what you copy');
  assert.match(ev, /…$/, 'a cut excerpt has to say it was cut');
});

test('the fold argues fewer findings but never hides one', () => {
  const r = busy();
  const lines = renderTerminal(r, OPTS).split('\n').map(strip);
  const body = lines.join('\n');

  // Every finding is on the page somewhere, argued in full or named in the
  // roster. A report that says how many it is not showing reads as complete;
  // the reader cannot tell what they were not shown.
  for (const f of r.findings) {
    assert.ok(body.includes(f.ruleId), `${f.ruleId} appears nowhere in the report`);
  }

  // ...and it is a fold, not a reprint: the full report is materially longer.
  const full = renderTerminal(r, { ...OPTS, verbose: true }).split('\n').length;
  assert.ok(lines.length < full * 0.75, `fold saved nothing: ${lines.length} vs ${full}`);
});

test('a roster line carries the rule id whole, so it can be looked up', () => {
  const r = busy();
  const lines = renderTerminal(r, OPTS).split('\n').map(strip);
  const roster = lines.filter((l) => /^  [\u25cf\u25d0\u25cb] +\d+ /.test(l));
  assert.ok(roster.length > 0, 'nothing was folded into a roster');
  for (const l of roster) {
    assert.ok(l.length <= 80, `roster line ran to ${l.length}: ${l}`);
    assert.match(l, /rule-with-a-fairly-long-identifier-\d+/, `rule id was cut: ${l}`);
  }
});

test('the possible tier says which of the two things happened', () => {
  // "Checked the same thing and did not confirm it" is only true when render
  // ran. The never-ran case shares the tier, and the two are not the same
  // thing to whoever is deciding what to fix.
  const base = busy();
  base.findings = base.findings.map((f) => ({ ...f, confidence: 'possible' }));

  const checked = strip(renderTerminal({ ...base, channelsRun: ['source', 'render'] }, OPTS));
  assert.match(checked, /render pass checked the same thing/);

  const unchecked = strip(renderTerminal({ ...base, channelsRun: ['source'] }, OPTS));
  assert.match(unchecked, /nothing checked it/);
  assert.doesNotMatch(
    unchecked,
    /render pass checked the same thing/,
    'claimed a render pass that never ran',
  );
});
