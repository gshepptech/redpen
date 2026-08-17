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
 * Merge by page id: a page re-scanned replaces its own record rather than
 * accumulating duplicates that would clash with themselves.
 */
export function save(root: string, prints: Fingerprint[]): void {
  if (!prints.length) return;
  const dir = join(stateRoot(root), DIR);
  mkdirSync(dir, { recursive: true });

  const existing = load(root);
  const pages: Record<string, Fingerprint> = {};
  for (const p of existing) pages[p.page] = p;
  for (const p of prints) pages[p.page] = p;

  const out: StoreShape = { version: 1, pages };
  writeFileSync(path(root), JSON.stringify(out, null, 2) + '\n', 'utf8');
}

/** Everything on record except the pages in this run, for cross-time comparison. */
export function priorPages(root: string, currentPages: string[]): Fingerprint[] {
  const current = new Set(currentPages);
  return load(root).filter((p) => !current.has(p.page));
}

export function clear(root: string): void {
  const file = path(root);
  if (existsSync(file)) {
    writeFileSync(file, JSON.stringify({ version: 1, pages: {} }, null, 2) + '\n', 'utf8');
  }
}
