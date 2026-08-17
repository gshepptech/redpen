import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildBrief, readAnswers, MIN_CONFIDENCE } from '../dist/channels/vision.js';
import { rulesForChannel } from '../dist/corpus/load.js';

/**
 * The vision channel takes no credentials and calls no API — whatever runs
 * redpen answers the questions itself. So what is tested here is the contract
 * on both sides of that handoff: the brief has to be answerable without
 * external docs, and the answer reader has to be strict enough that a
 * half-filled file cannot pass as a clean page.
 */

const shots = (n = 1) =>
  new Map(Array.from({ length: n }, (_, i) => [`http://x/${i}`, `/tmp/shot-${i}.png`]));

function answerFile(answers) {
  const dir = mkdtempSync(join(tmpdir(), 'redpen-vision-'));
  const path = join(dir, 'answers.json');
  writeFileSync(path, JSON.stringify({ version: 1, answers }, null, 2), 'utf8');
  return path;
}

const anyVisionRule = () => rulesForChannel('vision')[0].id;

test('the brief carries its own instructions', () => {
  const brief = buildBrief({ screenshots: shots() });
  assert.ok(brief.instructions.length > 100, 'a reader without the docs must still know what to do');
  assert.match(brief.instructions, /present=true means the tell IS present/);
  assert.match(brief.instructions, /--answers/);
});

test('the brief pre-builds one answer row per page and question', () => {
  const brief = buildBrief({ screenshots: shots(3) });
  assert.equal(brief.answers.length, 3 * brief.questions.length);
  assert.ok(brief.answers.every((a) => a.present === null), 'rows start unanswered');
  assert.ok(brief.questions.every((q) => q.ask && q.fix), 'each question ships its own fix');
});

test('rules two channels already agree on are not asked about again', () => {
  const all = rulesForChannel('vision').map((r) => r.id);
  const full = buildBrief({ screenshots: shots() });
  const trimmed = buildBrief({ screenshots: shots(), alreadyConfirmed: new Set([all[0]]) });
  assert.equal(trimmed.questions.length, full.questions.length - 1);
  assert.equal(buildBrief({ screenshots: shots(), alreadyConfirmed: new Set(all) }), null);
});

test('no screenshots means no brief', () => {
  assert.equal(buildBrief({ screenshots: new Map() }), null);
});

test('a confident yes with evidence becomes a finding', () => {
  const id = anyVisionRule();
  const result = readAnswers(
    answerFile([
      { page: 'http://x', ruleId: id, present: true, confidence: 0.9, evidence: 'three icon-tile cards under the headline' },
    ]),
  );
  assert.equal(result.unavailable, null);
  assert.equal(result.accepted, 1);
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].ruleId, id);
  assert.equal(result.findings[0].channel, 'vision');
  assert.match(result.findings[0].evidence[0].excerpt, /icon-tile/);
});

test('a no, and an unanswered row, produce nothing and are not complained about', () => {
  const id = anyVisionRule();
  const result = readAnswers(
    answerFile([
      { page: 'http://x', ruleId: id, present: false, confidence: 0.95, evidence: 'headings are roman' },
      { page: 'http://x', ruleId: id, present: null, confidence: 0, evidence: '' },
    ]),
  );
  assert.deepEqual(result.findings, []);
  assert.deepEqual(result.discarded, []);
});

test('a hedged yes is discarded and said out loud', () => {
  const id = anyVisionRule();
  const result = readAnswers(
    answerFile([
      { page: 'http://x', ruleId: id, present: true, confidence: MIN_CONFIDENCE - 0.01, evidence: 'maybe?' },
    ]),
  );
  assert.deepEqual(result.findings, []);
  assert.equal(result.discarded.length, 1);
  assert.match(result.discarded[0], /confidence/);
});

test('a yes with no evidence is a guess and is rejected', () => {
  const id = anyVisionRule();
  const result = readAnswers(
    answerFile([{ page: 'http://x', ruleId: id, present: true, confidence: 1, evidence: '   ' }]),
  );
  assert.deepEqual(result.findings, []);
  assert.match(result.discarded[0], /evidence/);
});

test('an unknown rule id is reported rather than skipped', () => {
  const result = readAnswers(
    answerFile([{ page: 'http://x', ruleId: 'not-a-rule', present: true, confidence: 1, evidence: 'x' }]),
  );
  assert.deepEqual(result.findings, []);
  assert.match(result.discarded[0], /unknown rule id/);
});

test('an unreadable or malformed file reports unavailable, never clean', () => {
  assert.match(readAnswers('/definitely/not/a/file.json').unavailable, /could not read/);

  const dir = mkdtempSync(join(tmpdir(), 'redpen-vision-'));
  const bad = join(dir, 'bad.json');
  writeFileSync(bad, '{not json', 'utf8');
  assert.match(readAnswers(bad).unavailable, /not valid JSON/);

  const noArray = join(dir, 'noarray.json');
  writeFileSync(noArray, JSON.stringify({ version: 1 }), 'utf8');
  assert.match(readAnswers(noArray).unavailable, /no "answers" array/);
});

test('every vision rule asks a question whose yes-answer means the tell is present', () => {
  const rules = rulesForChannel('vision');
  assert.ok(rules.length > 0, 'the corpus must declare some vision rules');
  for (const r of rules) {
    assert.ok(r.vision?.ask, `${r.id} declares vision but asks nothing`);
    const ask = r.vision.ask.trim();
    assert.ok(ask.endsWith('?'), `${r.id}: the ask must be a question — got "${ask.slice(0, 60)}"`);

    // An either/or question breaks the contract: the reader answers "yes" and
    // the channel cannot tell which half they meant. The ambiguous shape is a
    // second *clause* after "or" — "does X, or does Y". A plain list of ways
    // the same tell can appear ("cut off, running under, or clipped") is fine,
    // and so is a "rather than" contrast, which names the tell first.
    const flat = ask.replace(/\s+/g, ' ');
    assert.ok(
      !/\bor (does|is|are|do|can|could|would|has|have)\b/i.test(flat) ||
        /\brather than\b/i.test(flat),
      `${r.id}: the ask reads as an either/or, so "yes" is ambiguous — "${flat.slice(0, 90)}"`,
    );
  }
});
