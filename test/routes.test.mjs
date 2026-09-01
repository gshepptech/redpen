import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { discoverRoutes } from '../dist/channels/routes.js';

/**
 * Routes read out of the project instead of typed in.
 *
 * Every case here is one a real repository produced. The expensive failure is
 * not missing a route — it is inventing one, because a scan of a url that does
 * not exist reports a 404 page as though it were the product.
 */

function project(files) {
  const dir = mkdtempSync(join(tmpdir(), 'redpen-routes-'));
  for (const [name, body] of Object.entries(files)) {
    const full = join(dir, name);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body, 'utf8');
  }
  return dir;
}

const next = (extra) => ({ 'package.json': '{"dependencies":{"next":"15.0.0"}}', ...extra });

test("next's app router: a directory path is a route, and app/page.tsx is the root", () => {
  const dir = project(next({
    'app/page.tsx': 'x',
    'app/pricing/page.tsx': 'x',
    'app/docs/guide/page.tsx': 'x',
  }));
  try {
    assert.deepEqual(discoverRoutes(dir).map((r) => r.path), ['/', '/docs/guide', '/pricing']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a route group is organisation, not url', () => {
  const dir = project(next({ 'app/(marketing)/pricing/page.tsx': 'x' }));
  try {
    assert.deepEqual(discoverRoutes(dir).map((r) => r.path), ['/pricing']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a dynamic segment is dropped — only a running app knows what fills it', () => {
  const dir = project(next({ 'app/blog/[slug]/page.tsx': 'x', 'app/about/page.tsx': 'x' }));
  try {
    assert.deepEqual(discoverRoutes(dir).map((r) => r.path), ['/about']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a directory called pages is not a router unless the project has one', () => {
  // A React Router app with `web/src/pages/` holding components produced 188
  // routes, `/​__tests__/AuditLogPage.test` among them. A convention is only a
  // convention when the framework that defines it is installed.
  const dir = project({
    'package.json': '{"dependencies":{"react":"19.0.0"}}',
    'src/pages/Dashboard.tsx': 'export const D = 1;',
    'src/pages/Settings.tsx': 'export const S = 1;',
  });
  try {
    assert.deepEqual(discoverRoutes(dir), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('test material next to a page is not a page', () => {
  const dir = project(next({
    'app/pricing/page.tsx': 'x',
    'app/pricing/__tests__/page.test.tsx': 'x',
    'app/about/page.test.tsx': 'x',
  }));
  try {
    assert.deepEqual(discoverRoutes(dir).map((r) => r.path), ['/pricing']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('react router: paths come from the route table, not from every `path:` in the repo', () => {
  const dir = project({
    'package.json': '{"dependencies":{"react-router":"7.0.0"}}',
    'src/routes.tsx': [
      'export const routes = [',
      '  { path: "/login" },',
      '  { path: "dashboard/errors" },',
      '  { path: "/users/:id" },',
      '];',
    ].join('\n'),
    // Not a route table, and full of the same word.
    'src/storage.ts': 'const path: string = "/var/lib/thing"; export default path;',
  });
  try {
    assert.deepEqual(discoverRoutes(dir).map((r) => r.path), ['/dashboard/errors', '/login']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a project with no router at all reports no routes rather than guessing', () => {
  // A single-page app with no routing library. Zero is the right answer and
  // has to be distinguishable from "did not look".
  const dir = project({
    'package.json': '{"dependencies":{"react":"19.0.0"}}',
    'src/App.tsx': 'export default function App() { return null; }',
  });
  try {
    assert.deepEqual(discoverRoutes(dir), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('one bare origin scans the whole app; an explicit path is obeyed exactly', async () => {
  const { runScan } = await import('../dist/scan.js');
  const dir = project(next({
    'app/page.tsx': '<h1>Home</h1>',
    'app/pricing/page.tsx': '<h1>Pricing</h1>',
  }));
  try {
    // No server is running, so render fails on every url — what is asserted is
    // which urls were *attempted*, which the progress line reports.
    const lines = [];
    await runScan({
      root: dir,
      urls: ['http://127.0.0.1:9/'],
      ephemeral: true,
      onProgress: (m) => lines.push(m),
    });
    assert.ok(
      lines.some((l) => /routes: 2 declared in the source, scanning 2/.test(l)),
      lines.join(' | '),
    );

    const exact = [];
    await runScan({
      root: dir,
      urls: ['http://127.0.0.1:9/pricing'],
      ephemeral: true,
      onProgress: (m) => exact.push(m),
    });
    assert.ok(!exact.some((l) => l.startsWith('routes:')), 'an explicit path is not expanded');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
