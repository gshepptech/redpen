import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { SKIP_DIRS } from './source.js';

/**
 * Routes, read out of the project rather than typed in by hand.
 *
 * redpen already has the source. Asking someone to list their own URLs is
 * asking them to do work the repository can answer — and getting it wrong is
 * expensive in a way that is invisible: a scan with no urls caps every
 * render-observable finding at `possible`, so the same page scored 76 with no
 * url and 3 with one. A tool that quietly rewards being pointed at nothing is
 * worse than one that refuses.
 *
 * So the routes are discovered and named. What redpen does *not* do is guess an
 * origin: it has no idea whether the dev server is on 3000, 5173 or 8080, and a
 * scan of the wrong port would report a page nobody asked about. Discovery
 * produces paths; the caller supplies the origin, or is shown what it is
 * missing.
 */

/**
 * Which conventions this project actually uses.
 *
 * Applying every convention to every project would read a React Router app's
 * `web/src/pages/`, which holds components, as hundreds of routes. A directory
 * named `pages` means nothing on its own; `next` in the dependency list is
 * what makes it a router.
 */
function frameworks(root: string): Set<string> {
  const found = new Set<string>();
  for (const rel of ['package.json', 'web/package.json', 'frontend/package.json', 'client/package.json']) {
    let pkg: Record<string, unknown>;
    try {
      pkg = JSON.parse(readFileSync(join(root, rel), 'utf8'));
    } catch {
      continue;
    }
    const deps = Object.keys({
      ...(pkg.dependencies as object ?? {}),
      ...(pkg.devDependencies as object ?? {}),
    });
    for (const d of deps) {
      if (d === 'next') found.add('next-app'), found.add('next-pages');
      if (d === '@sveltejs/kit') found.add('sveltekit');
      if (d === 'astro') found.add('astro');
      if (d === 'nuxt') found.add('nuxt');
      if (d === 'react-router' || d === 'react-router-dom') found.add('react-router');
      if (d === 'vue-router') found.add('vue-router');
    }
  }
  return found;
}

export interface DiscoveredRoute {
  /** Path only — `/pricing`. Never an absolute url. */
  path: string;
  /** Where it was found, so a wrong guess can be traced to a file. */
  from: string;
  framework: string;
}

/** A segment that only a running app can fill in. */
const DYNAMIC = /^[[:(]|^\.\.\.|\*$/;

function walk(root: string, dir: string, out: string[], depth = 0): void {
  if (depth > 12) return;
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry) || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) walk(root, full, out, depth + 1);
    else out.push(relative(root, full));
  }
}

/**
 * File-based routing: the directory path *is* the url.
 *
 * Next's app router, Next's pages router, SvelteKit, Astro and Nuxt all encode
 * the route in the path and differ only in which filename terminates it.
 */
const FILE_ROUTED: Array<{ framework: string; base: RegExp; leaf: RegExp }> = [
  // The leaf is matched against the remainder after the base, so it has to
  // tolerate sitting at position zero: `app/page.tsx` is the root route, and a
  // leaf anchored on a leading slash left it named `/page.tsx`.
  { framework: 'next-app', base: /(^|\/)(src\/)?app\//, leaf: /(^|\/)page\.[jt]sx?$/ },
  { framework: 'next-pages', base: /(^|\/)(src\/)?pages\//, leaf: /\.[jt]sx?$/ },
  { framework: 'sveltekit', base: /(^|\/)src\/routes\//, leaf: /(^|\/)\+page\.svelte$/ },
  { framework: 'astro', base: /(^|\/)src\/pages\//, leaf: /\.(astro|md|mdx)$/ },
  { framework: 'nuxt', base: /(^|\/)pages\//, leaf: /\.vue$/ },
];

/** Test material sits beside the thing it tests and is not a page. */
const NOT_A_PAGE = /(^|\/)(__tests__|__mocks__|__fixtures__)\/|\.(test|spec|stories|e2e)\.[jt]sx?$/;

function fileRoute(rel: string, use: Set<string>): DiscoveredRoute | null {
  const path = rel.split(sep).join('/');
  if (NOT_A_PAGE.test(path)) return null;
  for (const { framework, base, leaf } of FILE_ROUTED) {
    if (!use.has(framework)) continue;
    const m = base.exec(path);
    if (!m || !leaf.test(path)) continue;
    let route = path.slice(m.index + m[0].length).replace(leaf, '');
    // A route group — `(marketing)` in Next — is organisation, not url.
    route = route
      .split('/')
      .filter((s) => s && !/^\(.*\)$/.test(s))
      .join('/');
    if (framework === 'next-pages' || framework === 'astro' || framework === 'nuxt') {
      route = route.replace(/(^|\/)index$/, '');
    }
    // `/` + '' is the root, and `//` is nothing.
    if (route === '/') route = '';
    if (route.split('/').some((s) => DYNAMIC.test(s))) return null;
    return { path: '/' + route, from: path, framework };
  }
  return null;
}

/** Config-based routing: the path is a string in a route table. */
const DECLARED: Array<{ framework: string; pattern: RegExp }> = [
  { framework: 'react-router', pattern: /\bpath\s*:\s*["'`]([^"'`]*)["'`]/g },
  { framework: 'react-router', pattern: /<Route\b[^>]*\bpath=["']([^"']*)["']/g },
  { framework: 'vue-router', pattern: /\bpath\s*:\s*["'`](\/[^"'`]*)["'`]/g },
];

function declaredRoutes(root: string, files: string[], use: Set<string>): DiscoveredRoute[] {
  const out: DiscoveredRoute[] = [];
  // Only files that look like a route table. Scanning every source file for
  // `path:` finds filesystem paths, API paths and test fixtures.
  const candidates = files.filter((f) => {
    const path = f.split(sep).join('/');
    return !NOT_A_PAGE.test(path) && /(^|\/)(routes?|router|App|main)\.[jt]sx?$/i.test(path);
  });
  for (const file of candidates) {
    let text: string;
    try {
      text = readFileSync(join(root, file), 'utf8');
    } catch {
      continue;
    }
    for (const { framework, pattern } of DECLARED) {
      if (!use.has(framework)) continue;
      pattern.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(text)) !== null) {
        const raw = (m[1] ?? '').trim();
        if (!raw && raw !== '') continue;
        if (raw.split('/').some((s) => DYNAMIC.test(s))) continue;
        const path = raw.startsWith('/') ? raw : '/' + raw;
        out.push({ path, from: file.split(sep).join('/'), framework });
      }
    }
  }
  return out;
}

export function discoverRoutes(root: string): DiscoveredRoute[] {
  if (!existsSync(root)) return [];
  const files: string[] = [];
  walk(root, root, files);

  const use = frameworks(root);
  if (!use.size) return [];

  const found = new Map<string, DiscoveredRoute>();
  for (const rel of files) {
    const r = fileRoute(rel, use);
    // First writer wins, so a real page file is not replaced by a layout that
    // happens to sort later.
    if (r && !found.has(r.path)) found.set(r.path, r);
  }
  for (const r of declaredRoutes(root, files, use)) {
    if (!found.has(r.path)) found.set(r.path, r);
  }

  return [...found.values()].sort((a, b) => a.path.localeCompare(b.path));
}
