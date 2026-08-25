import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * What someone actually gets when they install the plugin.
 *
 * A Claude Code plugin installs from git, so it receives what is tracked and
 * nothing else. `dist/` was ignored, which meant every one of the eight
 * commands resolved `${CLAUDE_PLUGIN_ROOT}/dist/cli.js`, found nothing, fell
 * back to a `redpen` on PATH that a user has no reason to have, and exited 127.
 *
 * It looked fine when tested by hand, because this machine has
 * /opt/homebrew/bin/redpen symlinked straight into the working tree. The
 * environment was answering for the package. So this test exports a clean tree
 * out of git and runs with PATH stripped to /usr/bin:/bin — nothing of the
 * developer's setup survives that.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Exactly the block every command file tells the agent to run, read out of a
 * command file rather than copied — a preamble that drifts from the one under
 * test is a test of nothing.
 */
function commandPreamble() {
  const body = readFileSync(join(ROOT, 'commands', 'audit.md'), 'utf8');
  const m = /```bash\n([\s\S]*?)```/.exec(body);
  assert.ok(m, 'no bash block in commands/audit.md');
  return m[1];
}

function freshInstall() {
  const dir = mkdtempSync(join(tmpdir(), 'redpen-install-'));
  const tar = execFileSync('git', ['archive', 'HEAD'], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
  execFileSync('tar', ['-x', '-C', dir], { input: tar });
  return dir;
}

test('a plugin install carries the binary it tells people to run', () => {
  const dir = freshInstall();
  try {
    assert.ok(
      existsSync(join(dir, 'bundle', 'redpen.mjs')),
      'bundle/redpen.mjs is not in the tree a plugin install receives',
    );
    assert.ok(
      !existsSync(join(dir, 'node_modules')),
      'the fixture is not a real install if it brought dependencies with it',
    );
    for (const needed of ['rules', 'commands', 'skills', '.claude-plugin']) {
      assert.ok(existsSync(join(dir, needed)), `${needed} is missing from a plugin install`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the commands run with nothing of the developer on PATH', () => {
  const dir = freshInstall();
  try {
    // node has to be reachable — every Claude Code user has it — but the
    // directory it lives in also holds /opt/homebrew/bin/redpen, symlinked
    // straight into this working tree. That symlink is what masked the failure
    // the first time it was tested by hand, so node gets its own bin directory
    // and nothing else comes with it.
    const bin = join(dir, '__bin');
    execFileSync('mkdir', ['-p', bin]);
    symlinkSync(process.execPath, join(bin, 'node'));

    const out = execFileSync(
      '/bin/bash',
      ['-c', `${commandPreamble()}\nrun scan . 2>&1 | head -20`],
      {
        cwd: dir,
        encoding: 'utf8',
        env: { PATH: `${bin}:/usr/bin:/bin`, CLAUDE_PLUGIN_ROOT: dir, HOME: dir },
      },
    );
    assert.doesNotMatch(out, /command not found/, out);
    assert.match(out, /redpen\s+\d+\/100/, `no report in the output:\n${out}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the committed build is the build the source produces', () => {
  // A tracked artefact drifts the moment someone edits src and forgets. The
  // suite builds before it runs, so an out-of-date dist shows up as a diff.
  const changed = execFileSync('git', ['status', '--porcelain', '--', 'bundle'], {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim();
  assert.equal(
    changed,
    '',
    `bundle is out of date with src — run npm run build and commit:\n${changed}`,
  );
});

test('no command file tells anyone to run a path that may not be there', () => {
  // Eight files carry the same preamble by hand, and the check that reads only
  // the first bash block passed while three of them still carried a second one
  // pointing straight at dist/cli.js — a path a plugin install does not have.
  // Every block, not the first.
  const commands = execFileSync('ls', [join(ROOT, 'commands')], { encoding: 'utf8' })
    .split('\n')
    .filter((f) => f.endsWith('.md'));
  assert.ok(commands.length >= 8, `expected the full command set, saw ${commands.length}`);

  for (const file of commands) {
    const body = readFileSync(join(ROOT, 'commands', file), 'utf8');
    assert.match(body, /CLAUDE_PLUGIN_ROOT/, `${file} does not resolve through CLAUDE_PLUGIN_ROOT`);

    for (const block of body.match(/```bash\n[\s\S]*?```/g) ?? []) {
      // The resolver itself names dist as its second choice, which is correct.
      // Anything else invoking it directly is a stale copy.
      const direct = block
        .split('\n')
        .filter((l) => l.includes('dist/cli.js') && !l.trimStart().startsWith('elif'));
      assert.deepEqual(direct, [], `${file} invokes dist/cli.js directly:\n${direct.join('\n')}`);
    }
  }
});

test('the version is answered, and answered from every install shape', () => {
  // `redpen --version` returned "unknown option --version" and exited 2. It is
  // the first thing anyone types when a report looks wrong and they want to
  // know which build produced it.
  //
  // It is read from package.json by walking up, not from a constant, because a
  // constant drifts from what npm and the plugin manifest publish — and
  // because dist/, bundle/ and a global install sit at three different depths,
  // which is the same thing that broke the rules/ lookup.
  const expected = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;

  const dir = freshInstall();
  try {
    const bin = join(dir, '__bin');
    execFileSync('mkdir', ['-p', bin]);
    symlinkSync(process.execPath, join(bin, 'node'));

    for (const flag of ['--version', '-V', 'version']) {
      const out = execFileSync(process.execPath, [join(ROOT, 'dist', 'cli.js'), flag], {
        encoding: 'utf8',
      }).trim();
      assert.equal(out, `redpen ${expected}`, `dist/ answered "${out}" for ${flag}`);
    }

    const fromBundle = execFileSync(
      '/bin/bash',
      ['-c', `node "${dir}/bundle/redpen.mjs" --version`],
      { cwd: dir, encoding: 'utf8', env: { PATH: `${bin}:/usr/bin:/bin`, HOME: dir } },
    ).trim();
    assert.equal(fromBundle, `redpen ${expected}`, 'the bundle could not find its own package.json');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
