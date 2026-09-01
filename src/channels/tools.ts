import { execFileSync } from 'node:child_process';
import { accessSync, constants, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { delimiter, join } from 'node:path';
import { tmpdir } from 'node:os';
import type { RawFinding } from '../types.js';
import { SKIP_DIRS } from './source.js';

/**
 * The directories redpen's own walk skips, handed to tools that do their own.
 *
 * Without this jscpd read `node_modules` and the lockfile beside it and
 * returned 1,309 findings, the loudest of which was a package-lock duplicating
 * itself. A tool pointed at the whole tree answers a question nobody asked.
 */
//
// Computed on call rather than at module load. As a top-level const this read
// SKIP_DIRS while source.ts was still initialising — a circular import between
// the two channels, introduced in the same change that added the rule for
// circular imports.
//
// Test material too. redpen's own walk skips it by filename, but a tool doing
// its own walk knows nothing about that: on a 1,872-file repository the single
// largest source of reported duplication was `*_integration_test.go`, where
// setup blocks repeat by design and sharing them is the wrong answer.
const SKIP_FILE_GLOBS = [
  '**/*_test.go',
  '**/*_test.py',
  '**/*_test.rb',
  '**/*_test.rs',
  '**/test_*.py',
  '**/conftest.py',
  '**/*.test.*',
  '**/*.spec.*',
  '**/*.e2e.*',
  '**/*.mock.*',
  '**/*.stub.*',
  '**/*.golden',
  '**/*.snap',
  '**/*.pb.go',
  '**/*_pb.ts',
  '**/*_connect.ts',
  '**/*.gen.go',
  '**/*.generated.*',
];

const ignoreGlobs = () =>
  [...[...SKIP_DIRS].map((d) => `**/${d}/**`), ...SKIP_FILE_GLOBS].join(',');
const excludeRe = () => `^(${[...SKIP_DIRS].map((d) => d.replace(/\./g, '\\.')).join('|')})/`;

/**
 * External analysers, where the project already has them.
 *
 * Three of the tells that most mark a codebase as machine-written cannot be
 * seen by a pattern: whether a block is a copy of another block, whether an
 * export has any caller, and whether the import graph has a cycle. Each needs a
 * parse of the whole project, and each already has a tool that does it well.
 *
 * So redpen does not reimplement them. It runs the ones the project already
 * carries and reports what they say, the same way the render channel borrows a
 * browser rather than shipping one.
 *
 * Two rules govern this, both learned from the render channel:
 *
 *   Never install anything. A scan that reaches the network is a scan that
 *   behaves differently on a plane, and a tool fetched mid-run is a tool nobody
 *   chose. Only `node_modules/.bin` inside the scanned project and then PATH.
 *
 *   Say which ones did not run. A missing analyser means findings are absent
 *   rather than clean, and that difference is the whole point of the channel
 *   model.
 */

export interface ToolRun {
  /** Analysers that produced output. */
  ran: string[];
  /** Analysers that were looked for and not found, so the caller can say so. */
  missing: string[];
  findings: RawFinding[];
}

interface Analyser {
  bin: string;
  /** The rule its output maps onto. One tool, one claim. */
  ruleId: string;
  run(exe: string, root: string): RawFinding[];
}

/**
 * Where a binary lives, without asking the network.
 *
 * The project's own `node_modules/.bin` comes first: a repo pinning jscpd 4
 * should be read by jscpd 4, not by whatever a global install happens to be.
 */
export function resolveBin(root: string, bin: string): string | null {
  // On Windows the executable is `jscpd.cmd`, not `jscpd`, and PATH is
  // semicolon-separated. Without this every analyser resolved to null there and
  // the tools channel was permanently absent on a platform `engines` claims to
  // support — reported as "not installed", which is the wrong reason.
  const names = process.platform === 'win32' ? [`${bin}.cmd`, `${bin}.exe`, bin] : [bin];

  for (const name of names) {
    const local = join(root, 'node_modules', '.bin', name);
    if (existsSync(local)) return local;
  }

  // PATH walked directly rather than shelled out to `command -v`: passing args
  // with `shell: true` concatenates rather than escapes them, and a lookup does
  // not need a shell to begin with.
  for (const dir of (process.env.PATH ?? '').split(delimiter)) {
    if (!dir) continue;
    for (const name of names) {
      const candidate = join(dir, name);
      try {
        // X_OK is meaningless on Windows — every readable file reports as
        // executable — so existence is the check there.
        if (process.platform === 'win32') {
          if (existsSync(candidate)) return candidate;
        } else {
          accessSync(candidate, constants.X_OK);
          return candidate;
        }
      } catch {
        continue;
      }
    }
  }
  return null;
}

function tmp(): string {
  return mkdtempSync(join(tmpdir(), 'redpen-tools-'));
}

const jscpd: Analyser = {
  bin: 'jscpd',
  ruleId: 'copy-paste-duplication',
  run(exe, root) {
    const out = tmp();
    try {
      // `--min-lines 8` rather than the default 5: five lines of an import
      // block or a switch arm are the same in every codebase ever written, and
      // reporting those would bury the blocks that are genuinely a copy.
      execFileSync(
        exe,
        [
          root,
          '--reporters', 'json',
          '--output', out,
          '--silent',
          '--min-lines', '8',
          '--min-tokens', '60',
          '--ignore', ignoreGlobs(),
        ],
        { stdio: ['ignore', 'ignore', 'ignore'], timeout: 120_000 },
      );
      const report = JSON.parse(readFileSync(join(out, 'jscpd-report.json'), 'utf8'));
      return (report.duplicates ?? []).map((d: Record<string, any>) => ({
        ruleId: 'copy-paste-duplication',
        channel: 'tools' as const,
        evidence: [
          {
            channel: 'tools' as const,
            location: String(d.firstFile?.name ?? ''),
            line: Number(d.firstFile?.start ?? 1),
            excerpt:
              `${d.firstFile?.end - d.firstFile?.start + 1} lines repeated at ` +
              `${d.secondFile?.name}:${d.secondFile?.start}`,
          },
        ],
      }));
    } catch {
      return [];
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  },
};

const madge: Analyser = {
  bin: 'madge',
  ruleId: 'circular-dependency',
  run(exe, root) {
    try {
      // Without `--extensions` madge resolves `./d.js` against a `d.ts` file
      // and reports no cycle where there are two — the NodeNext import style
      // every current TypeScript project writes.
      // madge exits non-zero precisely when it finds a cycle, so the throw is
      // the success case and the output rides on it. Reading only the happy
      // path meant the adapter reported no cycles on a project with two.
      let raw: string;
      try {
        raw = execFileSync(exe, [
        '--circular',
        '--json',
        '--extensions', 'ts,tsx,js,jsx,mjs,cjs',
        '--exclude', excludeRe(),
        root,
        ], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
          timeout: 120_000,
        });
      } catch (err: unknown) {
        raw = String((err as { stdout?: string })?.stdout ?? '');
      }
      if (!raw.trim()) return [];
      const cycles: string[][] = JSON.parse(raw);
      return cycles.map((cycle) => ({
        ruleId: 'circular-dependency',
        channel: 'tools' as const,
        evidence: [
          {
            channel: 'tools' as const,
            location: cycle[0] ?? '',
            line: 1,
            excerpt: cycle.join(' → ') + ' → ' + (cycle[0] ?? ''),
          },
        ],
      }));
    } catch {
      return [];
    }
  },
};

const knip: Analyser = {
  bin: 'knip',
  ruleId: 'unused-export',
  run(exe, root) {
    try {
      // knip exits non-zero when it finds anything, which is the normal case
      // here — the output is on stdout either way, so the throw carries it.
      let raw: string;
      try {
        raw = execFileSync(exe, ['--reporter', 'json', '--no-progress'], {
          cwd: root,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
          timeout: 180_000,
        });
      } catch (err: unknown) {
        raw = String((err as { stdout?: string })?.stdout ?? '');
      }
      if (!raw.trim()) return [];
      const report = JSON.parse(raw);
      const entries: Array<Record<string, any>> = report.issues ?? report.files ?? [];
      const out: RawFinding[] = [];
      const add = (file: string, line: number, excerpt: string) =>
        out.push({
          ruleId: 'unused-export',
          channel: 'tools' as const,
          evidence: [{ channel: 'tools' as const, location: file, line, excerpt }],
        });
      for (const entry of entries) {
        const file = String(entry.file ?? '');
        for (const symbol of entry.exports ?? []) {
          add(file, Number(symbol.line ?? 1), `export ${symbol.name ?? symbol} has no importer`);
        }
        // A module nothing imports is every one of its exports unused at once,
        // and knip reports it as a file rather than as a list of symbols.
        for (const unused of entry.files ?? []) {
          add(String(unused.name ?? unused ?? file), 1, 'nothing in the project imports this file');
        }
      }
      return out;
    } catch {
      return [];
    }
  },
};

const ANALYSERS: Analyser[] = [jscpd, madge, knip];

export function runTools(root: string, onProgress?: (m: string) => void): ToolRun {
  const ran: string[] = [];
  const missing: string[] = [];
  const findings: RawFinding[] = [];

  for (const analyser of ANALYSERS) {
    const exe = resolveBin(root, analyser.bin);
    if (!exe) {
      missing.push(analyser.bin);
      continue;
    }
    onProgress?.(`tools: running ${analyser.bin}`);
    const produced = analyser.run(exe, root);
    ran.push(analyser.bin);
    findings.push(...produced);
  }

  return { ran, missing, findings };
}
