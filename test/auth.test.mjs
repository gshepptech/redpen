import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { differentPage } from '../dist/channels/render.js';
import { runScan } from '../dist/scan.js';

/**
 * Scanning something that needs a session.
 *
 * The failure this guards against is the worst one redpen can have: asking for
 * `/dashboard`, being sent to `/login`, and reporting a clean confident score
 * about the login page under the dashboard's url. Every safeguard downstream
 * would work correctly — on the wrong page.
 */

test('a redirect to a different path is a different page', () => {
  assert.equal(differentPage('http://x/dashboard', 'http://x/login'), true);
  assert.equal(differentPage('http://x/', 'http://x/login'), true);
});

test('the ordinary redirects are not', () => {
  // A trailing slash, a query string added by the app, a host or port change
  // behind a proxy. None of these is a different page, and treating them as one
  // would refuse to scan most real sites.
  assert.equal(differentPage('http://x/pricing', 'http://x/pricing/'), false);
  assert.equal(differentPage('http://x/pricing/', 'http://x/pricing'), false);
  assert.equal(differentPage('http://x/pricing', 'http://x/pricing?ref=nav'), false);
  assert.equal(differentPage('http://localhost:3000/a', 'http://127.0.0.1:3000/a'), false);
  assert.equal(differentPage('http://x/', 'http://x'), false);
});

function gated(port) {
  return new Promise((ready) => {
    const server = createServer((req, res) => {
      const authed = (req.headers.cookie ?? '').includes('session=yes');
      if (req.url.startsWith('/dashboard') && !authed) {
        res.writeHead(302, { Location: '/login' });
        return res.end();
      }
      if (req.url.startsWith('/login')) {
        res.writeHead(200, { 'content-type': 'text/html' });
        return res.end('<!doctype html><title>Sign in</title><h1>Sign in</h1>');
      }
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end('<!doctype html><title>Dash</title><h1>Dash</h1><table><tr><td>row</td></tr></table>');
    });
    server.listen(port, () => ready(server));
  });
}

function project(storageState) {
  const dir = mkdtempSync(join(tmpdir(), 'redpen-auth-'));
  mkdirSync(join(dir, '.redpen'), { recursive: true });
  writeFileSync(join(dir, 'package.json'), '{"name":"a","private":true}');
  writeFileSync(
    join(dir, '.redpen', 'config.json'),
    JSON.stringify({ urls: [], viewports: [1440], schemes: ['light'], storageState }),
  );
  writeFileSync(
    join(dir, 'auth.json'),
    JSON.stringify({
      cookies: [
        {
          name: 'session',
          value: 'yes',
          domain: 'localhost',
          path: '/',
          expires: -1,
          httpOnly: false,
          secure: false,
          sameSite: 'Lax',
        },
      ],
      origins: [],
    }),
  );
  return dir;
}

test('a page that redirects to a login is refused, not reported', async (t) => {
  const server = await gated(8893);
  const dir = project(null);
  try {
    const result = await runScan({
      root: dir,
      urls: ['http://localhost:8893/dashboard'],
      ephemeral: true,
    });
    const rendered = result.findings.filter((f) => f.channels.includes('render'));
    assert.equal(rendered.length, 0, 'nothing from the page it was sent to');
    assert.ok(
      result.warnings.some((w) => /redirected to .*\/login/.test(w)),
      `the redirect must be reported: ${result.warnings.join(' | ')}`,
    );
  } finally {
    server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the same page with a stored session is scanned normally', async () => {
  const server = await gated(8894);
  const dir = project('auth.json');
  try {
    const result = await runScan({
      root: dir,
      urls: ['http://localhost:8894/dashboard'],
      ephemeral: true,
    });
    assert.ok(
      result.findings.some((f) => f.channels.includes('render')),
      'the real page was read',
    );
    assert.ok(!result.warnings.some((w) => w.includes('redirected')));
  } finally {
    server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a configured session that is not on disk is said out loud', async () => {
  // Sessions expire and auth.json is gitignored, so "configured but missing" is
  // the normal state on a fresh clone. Scanning anonymously in silence would
  // put someone back to reporting login pages without knowing it.
  const dir = project('does-not-exist.json');
  try {
    const result = await runScan({ root: dir, urls: ['http://127.0.0.1:9/'], ephemeral: true });
    assert.ok(
      result.warnings.some((w) => /storageState .* is configured but not on disk/.test(w)),
      result.warnings.join(' | '),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the command that writes a credential is the one that protects it', async () => {
  // The command that writes the session file is the one that ignores it. A
  // repository that never ran init must not be left with a committable
  // credential under a message saying it was handled.
  const { ensureGitignored } = await import('../dist/cli.js');
  const { execFileSync } = await import('node:child_process');

  const repo = mkdtempSync(join(tmpdir(), 'redpen-ignore-'));
  try {
    execFileSync('git', ['init', '-q', repo], { stdio: 'ignore' });
    writeFileSync(join(repo, 'package.json'), '{"name":"g","private":true}');
    writeFileSync(join(repo, '.gitignore'), 'node_modules\n');

    assert.equal(ensureGitignored(repo, '.redpen/'), 'added');
    assert.match(readFileSync(join(repo, '.gitignore'), 'utf8'), /^\.redpen\/$/m);

    // Idempotent, and it never rewrites what was already there.
    assert.equal(ensureGitignored(repo, '.redpen/'), 'present');
    const after = readFileSync(join(repo, '.gitignore'), 'utf8');
    assert.equal(after.match(/\.redpen/g).length, 1);
    assert.match(after, /^node_modules$/m, 'the existing file is preserved');
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('an existing ignore line in any of its spellings is left alone', async () => {
  const { ensureGitignored } = await import('../dist/cli.js');
  const { execFileSync } = await import('node:child_process');
  for (const spelling of ['.redpen', '.redpen/', '/.redpen/']) {
    const repo = mkdtempSync(join(tmpdir(), 'redpen-ignore-'));
    try {
      execFileSync('git', ['init', '-q', repo], { stdio: 'ignore' });
      writeFileSync(join(repo, 'package.json'), '{"name":"g","private":true}');
      writeFileSync(join(repo, '.gitignore'), `${spelling}\n`);
      assert.equal(ensureGitignored(repo, '.redpen/'), 'present', spelling);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  }
});

test('somewhere that is not a repository is said, not silently skipped', async () => {
  const { ensureGitignored } = await import('../dist/cli.js');
  const dir = mkdtempSync(join(tmpdir(), 'redpen-norepo-'));
  try {
    writeFileSync(join(dir, 'package.json'), '{"name":"n","private":true}');
    assert.equal(ensureGitignored(dir, '.redpen/'), 'no-repo');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
