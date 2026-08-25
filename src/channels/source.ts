import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { rulesForChannel } from '../corpus/load.js';
import { CODE_CATEGORIES } from '../scan.js';
import type { RawFinding, Evidence, Rule } from '../types.js';
import { findCancelledFloors } from './cascade.js';

/**
 * The source channel: regex over the repo.
 *
 * Fast, and blind to anything computed at runtime — a gradient assembled from
 * theme variables or injected after a fetch is invisible here. That blindness
 * is the reason promotion exists: a source-only hit is a lead, not a verdict.
 */

/** What a UI lives in. The corpus's page rules only mean anything here. */
const UI_EXTENSIONS = new Set([
  '.html', '.htm', '.css', '.scss', '.sass', '.less',
  '.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx',
  '.vue', '.svelte', '.astro', '.mdx',
]);

/**
 * What a project is written in, which is a different and much longer list.
 *
 * The craft and residue rules are about comments, stubs and process residue,
 * and none of that is particular to a web language. Reading only the UI list
 * meant `redpen code` on a 174-file Go repository read the fourteen HTML files
 * and reported it clean — the most confident possible way to say nothing.
 */
const CODE_EXTENSIONS = new Set([
  ...UI_EXTENSIONS,
  '.go', '.py', '.rs', '.rb', '.java', '.kt', '.swift', '.cs', '.php',
  '.c', '.h', '.cc', '.cpp', '.hpp', '.m', '.mm', '.scala', '.ex', '.exs',
  '.lua', '.pl', '.r', '.dart', '.sh', '.bash', '.zsh', '.sql', '.gradle',
]);

const SCANNED_EXTENSIONS = CODE_EXTENSIONS;

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
const SKIP_FILE = /\.(golden|snap|snapshot)\.|\.golden$|\.snap$|\.(test|spec|testkit|fixture|mock|stub|e2e)\.[jt]sx?$/i;

/** Files above this size are almost always bundles, minified, or vendored. */
/**
 * A line that defines a pattern rather than containing prose.
 *
 * Regex literals with a group or a class in them, and lines that are plainly a
 * list of words being matched against. Copy rules read these as copy.
 */
const PATTERN_LINE = /\/(\^|\\b|\(\?:)|\\b\(\?:|\[\^|\bnew RegExp\(/;

/**
 * A comment is not the interface.
 *
 * Thirteen copy rules carried `suppress: '^\s*(//|\*|...)'` by hand, which is
 * how it was discovered — and a11y and usability never got it, so 23 of 632
 * source hits across four real projects landed on a comment line. Every one was
 * false: a note above a ConfirmDialog reported as a modal with no escape, a
 * commit message quoting "Something went wrong" reported as the message itself,
 * a paragraph about `outline: none` reported as removing the focus ring.
 *
 * craft and residue are exempt, because a comment is the thing they read.
 *
 * `*` needs the lookahead. A JSDoc continuation and the CSS universal selector
 * open the same way, and `* { box-sizing }` is a rule that a UI check should
 * still see. `#` is left out entirely — at the start of a line it is a comment
 * in shell and an id selector in CSS, and the CSS reading is the one that
 * matters here.
 */
const COMMENT_LINE = /^\s*(\/\/|\/\*|<!--|\*(?!\s*[,{]))/;

const MAX_FILE_BYTES = 512 * 1024;

/** A line this long is minified output; regex over it produces noise. */
const MAX_LINE_LENGTH = 2000;

/**
 * Source files in the tree that no rule can read.
 *
 * `redpen code` on a 174-file Go repository read the fourteen HTML files in it
 * and reported 100/100 clean, because the extension list was the UI one. That
 * list is longer now, but it will always be a list, and a scan that read almost
 * nothing must not answer with a score.
 */
export function unreadLanguages(root: string): Array<[string, number]> {
  const counts = new Map<string, number>();
  const visit = (dir: string): void => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.startsWith('.') || SKIP_DIRS.has(entry)) continue;
      const full = join(dir, entry);
      let stat;
      try {
        stat = statSync(full);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        visit(full);
        continue;
      }
      const ext = extname(entry);
      // Only things that plausibly hold source. A .png is not a gap.
      if (!ext || SCANNED_EXTENSIONS.has(ext) || !SOURCE_SHAPED.test(ext)) continue;
      counts.set(ext, (counts.get(ext) ?? 0) + 1);
    }
  };
  visit(root);
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 4);
}

/** Extensions that look like code without being on the read list. */
const SOURCE_SHAPED = /^\.(zig|nim|hs|clj|cljs|erl|fs|fsx|ml|pas|pro|tcl|vb|groovy|jl|cr|d|v|elm|purs|res|rkt|scm|lisp|f90|f95|for|cob|adb|ads|asm|s)$/i;

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
  paths: RegExp[];
  suppress: RegExp | null;
  suppressProject: RegExp | null;
  suppressLines: number;
  suppressAfter: number;
  extensions: Set<string> | null;
  minHits: number;
  readsCode: boolean;
}

function compile(rules: Rule[]): CompiledRule[] {
  return rules
    .filter((r) => r.source?.patterns?.length || r.source?.paths?.length)
    .map((rule) => {
      const m = rule.source!;
      return {
        rule,
        // 'u' for the emoji ranges, 'i' because CSS and class names vary in
        // case — except where a rule reads prose, where case is the signal.
        patterns: (m.patterns ?? []).map((p) => new RegExp(p, m.caseSensitive ? 'gu' : 'giu')),
        paths: (m.paths ?? []).map((p) => new RegExp(p, m.caseSensitive ? 'u' : 'iu')),
        suppress: m.suppress ? new RegExp(m.suppress, m.caseSensitive ? 'u' : 'iu') : null,
        suppressProject: m.suppressProject ? new RegExp(m.suppressProject, 'iu') : null,
        suppressLines: m.suppressLines ?? 0,
        suppressAfter: m.suppressAfter ?? 0,
        /**
         * A rule reads the files its category is about.
         *
         * The walk carries every source language now, and a UI rule let loose
         * on Go would report a colour literal in a terminal theme. Page rules
         * stay on page files; craft and residue read whatever the project is
         * written in. An explicit `extensions` on the rule still wins.
         */
        extensions: m.extensions
          ? new Set(m.extensions)
          : CODE_CATEGORIES.has(rule.category)
            ? CODE_EXTENSIONS
            : UI_EXTENSIONS,
        minHits: m.minHits ?? 1,
        readsCode: CODE_CATEGORIES.has(rule.category),
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

  /**
   * Rules whose project-wide question was answered yes, so every hit is off.
   *
   * Filled during the same pass that collects hits — a second walk of the tree
   * to answer one regex would double the read for no reason.
   */
  const projectSuppressed = new Set<string>();

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

    for (const c of compiled) {
      if (c.suppressProject && !projectSuppressed.has(c.rule.id) && c.suppressProject.test(text)) {
        projectSuppressed.add(c.rule.id);
      }
    }

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

      // The name first. A path match is reported at line 1 with the path as the
      // excerpt, because there is no line in a file that its own name is on.
      for (const pattern of c.paths) {
        if (!pattern.test(rel)) continue;
        const list = hits.get(c.rule.id) ?? [];
        list.push({ channel: 'source', location: rel, line: 1, excerpt: rel });
        hits.set(c.rule.id, list);
        break;
      }

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
          // A line that is a pattern is not a line that has the problem.
          //
          // huechemy ships a voice test kit whose job is to catch marketing
          // verbs, so it contains the regex that lists them — and
          // marketing-buzzword reported it, at `confirmed`. Same shape as
          // redpen's own artifact page being flagged for quoting the bad
          // example out of its own report. A prose rule reading a regex literal
          // is reading the detector, not the copy.
          if (PATTERN_LINE.test(line)) continue;

          // A note about the interface is not the interface. Skipped for every
          // rule except the two categories whose subject is the comment.
          if (!c.readsCode && COMMENT_LINE.test(line)) continue;

          // The line itself, and the few above it when the rule asks — a reason
          // is written above the code it explains, not beside it.
          if (c.suppress) {
            const from = Math.max(0, lineNo - 1 - c.suppressLines);
            const to = Math.min(lines.length, lineNo + c.suppressAfter);
            const window = lines.slice(from, to).join('\n');
            if (c.suppress.test(window)) continue;
          }

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

    // A question about the project, answered once. The line-level suppression
    // cannot see a live region declared in another file, so it reported every
    // consumer of a toast system that has one.
    if (c.suppressProject && projectSuppressed.has(c.rule.id)) continue;

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
