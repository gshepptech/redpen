import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { captureLoginHeadless } from '../dist/channels/login.js';

/**
 * Logging in where nobody is watching.
 *
 * The headed `redpen login` cannot run in CI, which is where `redpen check`
 * lives, so this is how the gate covers a route behind a session. The failure
 * it has to prevent is subtler than a crash: a refused
 * password still sets cookies, so a naive capture saves a logged-out jar and
 * every authenticated scan afterwards reads the login page under the
 * dashboard's url. That is the same failure auth.test.mjs was written for,
 * arriving by a different door.
 */

const GOOD = { user: 'ada@example.com', password: 'correct-horse' };

function app(port) {
  return new Promise((ready) => {
    const server = createServer((req, res) => {
      const authed = (req.headers.cookie ?? '').includes('session=yes');

      if (req.url.startsWith('/dashboard')) {
        if (!authed) {
          res.writeHead(302, { Location: '/login' });
          return res.end();
        }
        res.writeHead(200, { 'content-type': 'text/html' });
        return res.end('<!doctype html><title>Dash</title><main id="dash"><h1>Dash</h1></main>');
      }

      if (req.url.startsWith('/submit') && req.method === 'POST') {
        let body = '';
        req.on('data', (c) => (body += c));
        return req.on('end', () => {
          const form = new URLSearchParams(body);
          const ok =
            form.get('email') === GOOD.user && form.get('password') === GOOD.password;
          // A refused login still hands out a cookie, exactly as a real app
          // does with its CSRF token. This is the whole point of --expect.
          const cookie = ok ? 'session=yes; Path=/' : 'csrf=abc; Path=/';
          if (ok) {
            res.writeHead(302, { Location: '/dashboard', 'set-cookie': cookie });
            return res.end();
          }
          res.writeHead(200, { 'content-type': 'text/html', 'set-cookie': cookie });
          res.end(
            '<!doctype html><title>Sign in</title><form method="post" action="/submit">' +
              '<p id="error">Invalid email or password</p>' +
              '<input id="email" name="email"><input id="password" name="password" type="password">' +
              '<button id="go">Sign in</button></form>',
          );
        });
      }

      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(
        '<!doctype html><title>Sign in</title><form method="post" action="/submit">' +
          '<input id="email" name="email"><input id="password" name="password" type="password">' +
          '<button id="go">Sign in</button></form>',
      );
    });
    server.listen(port, () => ready(server));
  });
}

const pw = async () => await import('playwright');

function form(port, over = {}) {
  return {
    url: `http://localhost:${port}/login`,
    user: GOOD.user,
    password: GOOD.password,
    userSelector: '#email',
    passwordSelector: '#password',
    submitSelector: '#go',
    expectSelector: '#dash',
    expectUrl: null,
    timeoutMs: 15_000,
    ...over,
  };
}

test('a form login is captured without anyone present', async (t) => {
  const port = 39411;
  const server = await app(port);
  const dir = mkdtempSync(join(tmpdir(), 'redpen-hl-'));
  t.after(() => {
    server.close();
    rmSync(dir, { recursive: true, force: true });
  });

  const out = join(dir, '.redpen', 'auth.json');
  const result = await captureLoginHeadless(pw, form(port), out);

  assert.equal(result.cookies >= 1, true);
  assert.match(result.landedOn, /\/dashboard/);
  const state = JSON.parse(readFileSync(out, 'utf8'));
  assert.equal(
    state.cookies.some((c) => c.name === 'session' && c.value === 'yes'),
    true,
    'the jar has to hold the session cookie, not just any cookie',
  );
});

test('a refused password saves nothing, even though it was handed a cookie', async (t) => {
  const port = 39412;
  const server = await app(port);
  const dir = mkdtempSync(join(tmpdir(), 'redpen-hl-'));
  t.after(() => {
    server.close();
    rmSync(dir, { recursive: true, force: true });
  });

  const out = join(dir, '.redpen', 'auth.json');
  await assert.rejects(
    () => captureLoginHeadless(pw, form(port, { password: 'wrong', timeoutMs: 2_000 }), out),
    /did not complete/,
  );
  assert.equal(existsSync(out), false, 'a refused login must not leave a session file behind');
});

test('the refusal never repeats the credential back', async (t) => {
  const port = 39413;
  const server = await app(port);
  const dir = mkdtempSync(join(tmpdir(), 'redpen-hl-'));
  t.after(() => {
    server.close();
    rmSync(dir, { recursive: true, force: true });
  });

  const secret = 'hunter2-do-not-print';
  const err = await captureLoginHeadless(
    pw,
    form(port, { password: secret, timeoutMs: 2_000 }),
    join(dir, '.redpen', 'auth.json'),
  ).then(
    () => null,
    (e) => e,
  );
  assert.ok(err, 'the login should have failed');
  assert.equal(err.message.includes(secret), false, 'the password must not reach the message');
  assert.equal(err.message.includes(GOOD.user), false, 'nor the account');
});

test('a url is as good as a selector, and either is required', async (t) => {
  const port = 39414;
  const server = await app(port);
  const dir = mkdtempSync(join(tmpdir(), 'redpen-hl-'));
  t.after(() => {
    server.close();
    rmSync(dir, { recursive: true, force: true });
  });

  const result = await captureLoginHeadless(
    pw,
    form(port, { expectSelector: null, expectUrl: '/dashboard' }),
    join(dir, '.redpen', 'auth.json'),
  );
  assert.match(result.landedOn, /\/dashboard/);

  await assert.rejects(
    () =>
      captureLoginHeadless(
        pw,
        form(port, { expectSelector: null, expectUrl: null }),
        join(dir, '.redpen', 'other.json'),
      ),
    /needs something to check for/,
  );
});

test('no submit button means Enter in the password field', async (t) => {
  const port = 39415;
  const server = await app(port);
  const dir = mkdtempSync(join(tmpdir(), 'redpen-hl-'));
  t.after(() => {
    server.close();
    rmSync(dir, { recursive: true, force: true });
  });

  const result = await captureLoginHeadless(
    pw,
    form(port, { submitSelector: null }),
    join(dir, '.redpen', 'auth.json'),
  );
  assert.match(result.landedOn, /\/dashboard/);
});

test('there is no flag that puts a credential in the process table', () => {
  // --user and --password are absent on purpose. If either is ever added, this
  // fails, and the reason is in the parser next to where they are not.
  const src = readFileSync(new URL('../src/cli.ts', import.meta.url), 'utf8');
  assert.equal(/'--user'/.test(src), false, "--user must not become a flag");
  assert.equal(/'--password'/.test(src), false, "--password must not become a flag");
});

test('the flags parse into the shape the command reads', async () => {
  // Imported here rather than at the top, as the other tests that reach into
  // the CLI do: loading that module runs main().
  const { parseArgs } = await import('../dist/cli.js');
  const args = parseArgs([
    'login',
    'http://localhost:1/login',
    '--headless',
    '--user-selector',
    '#email',
    '--password-selector',
    '#password',
    '--submit-selector',
    'button[type=submit]',
    '--expect',
    '#dash',
    '--timeout',
    '9000',
  ]);
  assert.equal(args.command, 'login');
  assert.equal(args.headless, true);
  assert.equal(args.userSelector, '#email');
  assert.equal(args.passwordSelector, '#password');
  assert.equal(args.submitSelector, 'button[type=submit]');
  assert.equal(args.expectSelector, '#dash');
  assert.equal(args.timeoutMs, 9000);
  assert.deepEqual(args.urls, ['http://localhost:1/login']);
});

test('an account is recognisable in a log without being reusable', async () => {
  const { maskAccount } = await import('../dist/cli.js');
  assert.equal(maskAccount('ada@example.com'), 'a***@example.com');
  assert.equal(maskAccount('admin'), 'a***');
  assert.equal(maskAccount('ab'), '***');
});
