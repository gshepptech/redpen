import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { stateRoot } from '../config.js';
import type { Fingerprint } from '../types.js';

/**
 * Fingerprint persistence.
 *
 * The point of writing these to disk is that sameness is a property of a
 * *project over time*, not of one scan. A page scanned today has to be
 * comparable against a page built three weeks ago by someone else.
 */

const DIR = '.redpen';
const FILE = 'fingerprints.json';

interface StoreShape {
  version: 1;
  pages: Record<string, Fingerprint>;
}

function path(root: string): string {
  return join(stateRoot(root), DIR, FILE);
}

export function load(root: string): Fingerprint[] {
  const file = path(root);
  if (!existsSync(file)) return [];
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as StoreShape;
    if (parsed.version !== 1) return [];
    return Object.values(parsed.pages);
  } catch {
    // A corrupt store must not stop a scan. Treat it as empty and rewrite.
    return [];
  }
}

/**
 * The identity of a page, with a dev server's port taken out of it.
 *
 * Merging by page id exists so a re-scanned page replaces its own record
 * instead of clashing with itself. That only works if the id is stable, and a
 * loopback port is the least stable thing about a local URL — Vite walks
 * 5173, 5174, 5175 as ports are taken, Next walks 3000, 3001. Two runs on two
 * ports would leave two records of one page, reported as two pages that share
 * a skeleton.
 *
 * Only loopback hosts are normalised. On a real host a port is a deliberate
 * address and two ports are two deployments.
 */
export function pageId(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '[::1]' || u.hostname === '::1') {
      u.port = '';
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}

/**
 * Merge by page id: a page re-scanned replaces its own record rather than
 * accumulating duplicates that would clash with themselves.
 */
export function save(root: string, prints: Fingerprint[]): void {
  if (!prints.length) return;
  const dir = join(stateRoot(root), DIR);
  mkdirSync(dir, { recursive: true });

  const existing = load(root);
  const pages: Record<string, Fingerprint> = {};
  for (const p of existing) pages[pageId(p.page)] = p;
  for (const p of prints) pages[pageId(p.page)] = p;

  const out: StoreShape = { version: 1, pages };
  writeFileSync(path(root), JSON.stringify(out, null, 2) + '\n', 'utf8');
}

/** Everything on record except the pages in this run, for cross-time comparison. */
export function priorPages(root: string, currentPages: string[]): Fingerprint[] {
  const current = new Set(currentPages.map(pageId));
  return load(root).filter((p) => !current.has(pageId(p.page)));
}

export function clear(root: string): void {
  const file = path(root);
  if (existsSync(file)) {
    writeFileSync(file, JSON.stringify({ version: 1, pages: {} }, null, 2) + '\n', 'utf8');
  }
}
