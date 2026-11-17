import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { stateRoot } from '../dist/config.js';

/**
 * Where redpen is allowed to write.
 *
 * It walks up from the scanned path looking for a project marker so that
 * scanning `internal/dash` puts state at the repo root. Unbounded, that walk
 * could write a baseline into `~/.claude/.redpen`, a directory five levels
 * above the scan with a package.json in it, so a project by the rule and
 * nothing anyone meant by it. A tool that writes outside the tree you pointed
 * it at has to be wrong on purpose, not by accident.
 */

function tree(...segments) {
  const base = mkdtempSync(join(tmpdir(), 'redpen-state-'));
  const dir = join(base, ...segments);
  mkdirSync(dir, { recursive: true });
  return { base, dir };
}

test('a marker above the scan is used, so state lands at the repo root', () => {
  const { base, dir } = tree('packages', 'web', 'src', 'components');
  try {
    writeFileSync(join(base, 'package.json'), '{}');
    assert.equal(stateRoot(dir), resolve(base));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('a dot-directory is never the project, however many markers it has', () => {
  const { base, dir } = tree('.claude', 'jobs', '1', 'tmp', 'site');
  try {
    writeFileSync(join(base, '.claude', 'package.json'), '{}');
    assert.notEqual(
      stateRoot(dir),
      resolve(join(base, '.claude')),
      'wrote state into a dot-directory — .claude, .config and .cache are not projects',
    );
    assert.equal(stateRoot(dir), resolve(dir), 'should fall back beside what was scanned');
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('the scan root itself counts even when it is a dot-directory', () => {
  // Pointing redpen straight at one is an explicit instruction, not a walk.
  const { base, dir } = tree('.config');
  try {
    writeFileSync(join(dir, 'package.json'), '{}');
    assert.equal(stateRoot(dir), resolve(dir));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('the walk never reaches the home directory', () => {
  const home = resolve(homedir());
  const deep = join(home, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h');
  assert.notEqual(stateRoot(deep), home, 'the home directory is not a project');
  assert.ok(
    !resolve(stateRoot(deep)).split('/').includes('..'),
    'state root should be an absolute resolved path',
  );
});

test('with no marker anywhere, state goes beside what was scanned', () => {
  const { base, dir } = tree('a', 'b', 'c');
  try {
    assert.equal(stateRoot(dir), resolve(dir));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
