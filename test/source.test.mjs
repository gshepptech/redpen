import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanSource, parseIgnore, walk } from '../dist/channels/source.js';

function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), 'redpen-'));
  for (const [name, content] of Object.entries(files)) {
    const full = join(dir, name);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content, 'utf8');
  }
  return dir;
}

const hits = (dir) => new Set(scanSource({ root: dir }).findings.map((f) => f.ruleId));

test('catches AI purple once it is a pattern rather than one value', () => {
  const one = fixture({ 'a.css': ':root { --primary: #7c3aed; }' });
  const many = fixture({
    'a.css': ':root { --primary: #7c3aed; --accent: #6366f1; }\n.x { color: #8b5cf6; }',
  });
  assert.ok(!hits(one).has('ai-purple'), 'one violet value is a decision');
  assert.ok(hits(many).has('ai-purple'), 'violet throughout is a default');
});

test('catches gradient text in both CSS and Tailwind form', () => {
  assert.ok(hits(fixture({ 'a.css': 'h1 { -webkit-background-clip: text; }' })).has('gradient-text'));
  assert.ok(
    hits(fixture({ 'a.tsx': '<h1 className="bg-clip-text text-transparent">Hi</h1>' })).has('gradient-text'),
  );
});

test('background-clip: border-box is not a gradient-text hit', () => {
  assert.ok(!hits(fixture({ 'a.css': '.x { background-clip: border-box; }' })).has('gradient-text'));
});

test('suppression kills the documented false positive', () => {
  // rounded-full on a small box is an avatar, not a pill button.
  const avatars = fixture({
    'a.tsx': Array.from({ length: 8 }, () => '<img className="rounded-full h-8 w-8" />').join('\n'),
  });
  assert.ok(!hits(avatars).has('over-rounding'));

  const pills = fixture({
    'b.tsx': Array.from({ length: 8 }, (_, i) => `<button className="rounded-full px-${i + 2}">Go</button>`).join('\n'),
  });
  assert.ok(hits(pills).has('over-rounding'));
});

test('emoji in a UI slot is caught, emoji in prose is not', () => {
  assert.ok(hits(fixture({ 'a.html': '<div class="icon">🚀</div>' })).has('emoji-as-icon'));
  assert.ok(!hits(fixture({ 'b.html': '<p>we shipped it 🚀 last week and it went well</p>' })).has('emoji-as-icon'));
});

test('aggregate rules respect their minHits floor', () => {
  const three = fixture({ 'a.css': 'p { padding: 17px; }\nh1 { margin: 13px; }\n.x { gap: 9px; }' });
  const six = fixture({
    'a.css': [17, 13, 9, 21, 15, 11].map((n, i) => `.c${i} { padding: ${n}px; }`).join('\n'),
  });
  assert.ok(!hits(three).has('off-scale-spacing'), 'three odd values is not yet a pattern');
  assert.ok(hits(six).has('off-scale-spacing'));
});

test('redpen-ignore suppresses a hit and requires a reason', () => {
  assert.equal(parseIgnore('/* redpen-ignore brand is genuinely violet */').reason, 'brand is genuinely violet');
  assert.equal(parseIgnore('/* redpen-ignore:ai-purple brand colour */').ruleId, 'ai-purple');
  assert.equal(parseIgnore('/* redpen-ignore */'), null, 'an ignore with no reason must not suppress');
  assert.equal(parseIgnore('nothing here'), null);
  assert.equal(parseIgnore(undefined), null);
});

test('an ignore on the line above suppresses the hit and is recorded', () => {
  const dir = fixture({
    'a.css': [
      '/* redpen-ignore:gradient-text the wordmark is a licensed lockup */',
      'h1 { -webkit-background-clip: text; }',
    ].join('\n'),
  });
  const result = scanSource({ root: dir });
  assert.ok(!result.findings.some((f) => f.ruleId === 'gradient-text'));
  assert.ok(result.ignored.has('gradient-text'));
  assert.equal(result.ignored.get('gradient-text')[0].reason, 'the wordmark is a licensed lockup');
});

test('an ignore for a different rule does not suppress this one', () => {
  const dir = fixture({
    'a.css': ['/* redpen-ignore:ai-purple unrelated */', 'h1 { -webkit-background-clip: text; }'].join('\n'),
  });
  assert.ok(scanSource({ root: dir }).findings.some((f) => f.ruleId === 'gradient-text'));
});

test('walk skips build output and dependency directories', () => {
  const dir = fixture({
    'src/a.css': 'body{}',
    'node_modules/pkg/b.css': 'body{}',
    'dist/c.css': 'body{}',
    '.next/d.css': 'body{}',
  });
  const files = walk(dir).map((f) => f.replace(dir, ''));
  assert.equal(files.length, 1);
  assert.ok(files[0].includes('a.css'));
});

test('evidence carries a usable location', () => {
  const dir = fixture({ 'a.css': '\n\nh1 { -webkit-background-clip: text; }' });
  const finding = scanSource({ root: dir }).findings.find((f) => f.ruleId === 'gradient-text');
  assert.equal(finding.evidence[0].line, 3);
  assert.equal(finding.evidence[0].location, 'a.css');
  assert.ok(finding.evidence[0].excerpt.includes('background-clip'));
});

test('a single-field newsletter form is not flagged for missing validation', () => {
  const newsletter = fixture({
    'a.html': '<form><label for="e">Email</label><input id="e" type="email" required><button>Go</button></form>',
  });
  assert.ok(!hits(newsletter).has('no-inline-validation'));

  const realForm = fixture({
    'b.html': '<form><input name="a"><input name="b"><input name="c"><button>Go</button></form>',
  });
  assert.ok(hits(realForm).has('no-inline-validation'));
});
