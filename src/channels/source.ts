import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { rulesForChannel } from '../corpus/load.js';
import type { RawFinding, Evidence, Rule } from '../types.js';
import { findCancelledFloors } from './cascade.js';

/**
 * The source channel: regex over the repo.
 *
 * Fast, and blind to anything computed at runtime — a gradient assembled from
 * theme variables or injected after a fetch is invisible here. That blindness
 * is the reason promotion exists: a source-only hit is a lead, not a verdict.
 */

const SCANNED_EXTENSIONS = new Set([
  '.html', '.htm', '.css', '.scss', '.sass', '.less',
  '.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx',
  '.vue', '.svelte', '.astro', '.mdx',
]);

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', 'out', 'vendor',
  'coverage', '.svelte-kit', '.astro', '.turbo', '.cache', '__pycache__',
  '.vercel', '.netlify', 'storybook-static', '.redpen',
  // Test material is not shipped UI. Reported from the field: a Go render
  // test's golden file was fingerprinted as a page and cited ten times.
  'testdata', '__snapshots__', '__fixtures__', 'fixtures', '__mocks__',
]);

/**
 * Test material, wherever it lives.
 *
 * SKIP_DIRS already covers testdata and __snapshots__, on the principle that a
 * test is not shipped UI. Co-located tests are the same material and were not
 * covered: on the first project with them, a copy rule cited
 * `page.test.tsx:222 it("exports the flag in SUMMARY...")` — matching "in
 * summary" inside an assertion about a CSV column.
 */
const SKIP_FILE = /\.(golden|snap|snapshot)\.|\.golden$|\.snap$|\.(test|spec)\.[jt]sx?$/i;

/** Files above this size are almost always bundles, minified, or vendored. */
const MAX_FILE_BYTES = 512 * 1024;

/** A line this long is minified output; regex over it produces noise. */
const MAX_LINE_LENGTH = 2000;

export function walk(root: string): string[] {
  const found: string[] = [];

  const visit = (dir: string): void => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry)) continue;
      const full = join(dir, entry);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        // Hidden directories are config, not source — except the ones a
        // framework actually builds from, which are all in SKIP_DIRS anyway.
        if (!entry.startsWith('.')) visit(full);
      } else if (
        SCANNED_EXTENSIONS.has(extname(entry)) &&
        st.size <= MAX_FILE_BYTES &&
        !SKIP_FILE.test(entry)
      ) {
        found.push(full);
      }
    }
  };

  visit(root);
  return found;
}

interface CompiledRule {
  rule: Rule;
  patterns: RegExp[];
  suppress: RegExp | null;
  extensions: Set<string> | null;
  minHits: number;
}

function compile(rules: Rule[]): CompiledRule[] {
  return rules
    .filter((r) => r.source?.patterns?.length)
    .map((rule) => {
      const m = rule.source!;
      return {
        rule,
        // 'u' for the emoji ranges, 'i' because CSS and class names vary in case.
        patterns: m.patterns.map((p) => new RegExp(p, 'giu')),
        suppress: m.suppress ? new RegExp(m.suppress, 'iu') : null,
        extensions: m.extensions ? new Set(m.extensions) : null,
        minHits: m.minHits ?? 1,
      };
    });
}

/**
 * Suppression directives. `redpen-ignore` on the line or the line above kills a
 * hit; a reason is required, because an ignore with no reason is how a rule set
 * quietly stops meaning anything.
 */
const IGNORE_RE = /redpen-ignore(?::([a-z0-9-]+))?\s+(.+)$/i;

/** Comment terminators that trail the reason rather than being part of it. */
const TERMINATOR_RE = /\s*(?:\*\/|-->|\}\)?|\*)\s*$/;

export interface IgnoreDirective {
  ruleId: string | null;
  reason: string;
}

export function parseIgnore(line: string | undefined): IgnoreDirective | null {
  if (!line) return null;
  const m = IGNORE_RE.exec(line);
  if (!m) return null;

  const reason = (m[2] ?? '').replace(TERMINATOR_RE, '').trim();

  // A reason has to be words. `/* redpen-ignore */` leaves only the comment
  // terminator behind, and suppressing on that would let a project silence a
  // rule without saying why — which is how a rule set stops meaning anything.
  if (!/[a-z0-9]/i.test(reason)) return null;

  return { ruleId: m[1] ?? null, reason };
}

export interface SourceScanOptions {
  root: string;
  /** Pre-walked file list, so callers can share one walk across passes. */
  files?: string[];
}

export function scanSource(opts: SourceScanOptions): {
  findings: RawFinding[];
  ignored: Map<string, IgnoreDirective[]>;
  filesScanned: number;
} {
  const compiled = compile(rulesForChannel('source'));
  const cascadeRules = rulesForChannel('source').filter((r) => r.cascade);
  const files = opts.files ?? walk(opts.root);

  // ruleId -> evidence collected across every file
  const hits = new Map<string, Evidence[]>();
  const ignored = new Map<string, IgnoreDirective[]>();

  for (const file of files) {
    let text: string;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const rel = relative(opts.root, file) || file;
    const lines = text.split('\n');
    const ext = extname(file);

    if (ext === '.css') {
      for (const rule of cascadeRules) {
        const params = (rule.cascade!.params ?? {}) as { floorPx?: number };
        for (const conflict of findCancelledFloors(text, params)) {
          const list = hits.get(rule.id) ?? [];
          list.push({
            channel: 'source',
            location: rel,
            line: conflict.line,
            excerpt: conflict.summary,
          });
          hits.set(rule.id, list);
        }
      }
    }

    for (const c of compiled) {
      if (c.extensions && !c.extensions.has(ext)) continue;

      for (const pattern of c.patterns) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(text)) !== null) {
          // Zero-length matches would loop forever.
          if (match[0].length === 0) {
            pattern.lastIndex += 1;
            continue;
          }

          const lineNo = countLines(text, match.index);
          const line = lines[lineNo - 1] ?? '';

          if (line.length > MAX_LINE_LENGTH) continue;
          if (c.suppress && c.suppress.test(line)) continue;

          // An ignore on this line or the one above suppresses the hit, and is
          // recorded so `redpen ignores` can list what a project has excused.
          const directive = parseIgnore(line) ?? parseIgnore(lines[lineNo - 2]);
          if (directive && (directive.ruleId === null || directive.ruleId === c.rule.id)) {
            const list = ignored.get(c.rule.id) ?? [];
            list.push(directive);
            ignored.set(c.rule.id, list);
            continue;
          }

          const evidence: Evidence = {
            channel: 'source',
            location: rel,
            line: lineNo,
            excerpt: line.trim().slice(0, 160),
          };
          const list = hits.get(c.rule.id) ?? [];
          list.push(evidence);
          hits.set(c.rule.id, list);
        }
      }
    }
  }

  const findings: RawFinding[] = [];
  for (const c of compiled) {
    const evidence = hits.get(c.rule.id);
    if (!evidence) continue;

    // Aggregate rules ("rounded corners everywhere") need a threshold measured
    // in distinct lines, not raw matches — one line with four violet classes is
    // still one decision.
    const distinctLines = new Set(evidence.map((e) => `${e.location}:${e.line}`));
    if (distinctLines.size < c.minHits) continue;

    findings.push({
      ruleId: c.rule.id,
      channel: 'source',
      evidence: dedupe(evidence).slice(0, 12),
    });
  }

  // Cascade rules have no compiled patterns, so the loop above never sees
  // them. Their hits are already exact — each one is a named pair of rules,
  // not an aggregate — so there is no minHits threshold to clear.
  for (const rule of cascadeRules) {
    const evidence = hits.get(rule.id);
    if (!evidence?.length) continue;
    findings.push({
      ruleId: rule.id,
      channel: 'source',
      evidence: dedupe(evidence).slice(0, 12),
    });
  }

  return { findings, ignored, filesScanned: files.length };
}

function countLines(text: string, index: number): number {
  let n = 1;
  for (let i = 0; i < index; i++) {
    if (text.charCodeAt(i) === 10) n++;
  }
  return n;
}

function dedupe(evidence: Evidence[]): Evidence[] {
  const seen = new Set<string>();
  const out: Evidence[] = [];
  for (const e of evidence) {
    const key = `${e.location}:${e.line}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}
