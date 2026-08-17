#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pc from 'picocolors';
import { runScan, ruleIds } from './scan.js';
import { renderTerminal } from './report/terminal.js';
import { renderMarkdown } from './report/markdown.js';
import { loadCorpus, catalogueCounts, ruleById } from './corpus/load.js';
import {
  loadBaseline,
  saveBaseline,
  saveConfig,
  loadConfig,
  DEFAULT_CONFIG,
} from './config.js';
import * as store from './fingerprint/store.js';
import { grade } from './score.js';
import type { Confidence } from './types.js';

const HELP = `
${pc.bold('redpen')} — one verdict on your UI

  ${pc.bold('redpen scan')} [path]        run every available channel and print the report
  ${pc.bold('redpen check')} [path]       same, but exit non-zero when the score drops
  ${pc.bold('redpen baseline')} [path]    record the current score as the bar to hold
  ${pc.bold('redpen rules')}              list the merged corpus
  ${pc.bold('redpen why')} <rule-id>      explain one rule and where it came from
  ${pc.bold('redpen sources')}            provenance rollup across upstream catalogues
  ${pc.bold('redpen fingerprints')}       show recorded page signatures
  ${pc.bold('redpen init')} [path]        write .redpen/config.json

${pc.dim('Options')}
  --url <u>          page to render (repeatable). Without one, render never runs.
  --viewport <n>     viewport width (repeatable). Default 375, 768, 1440.
  --json [file]      machine-readable output
  --markdown [file]  markdown report
  --screenshots      capture full-page PNGs to .redpen/screenshots
  --vision           capture screenshots and write .redpen/vision-brief.json
  --answers <file>   fold answered vision questions back into the verdict
  --min <level>      confidence floor for scoring: confirmed | likely | possible
  --verbose          include single-channel findings and rule provenance
  --show-ignored     list findings suppressed by redpen-ignore
  --quiet            suppress progress output

${pc.dim('Suppressing a finding')}
  Add ${pc.bold('redpen-ignore <reason>')} in a comment on or above the line, or
  ${pc.bold('redpen-ignore:<rule-id> <reason>')} to suppress just one rule. The reason is
  required — an ignore with no reason is how a rule set stops meaning anything.
`;

interface Args {
  command: string;
  positional: string[];
  urls: string[];
  viewports: number[];
  json: string | boolean;
  markdown: string | boolean;
  screenshots: boolean;
  vision: boolean;
  answers: string | null;
  min: Confidence | null;
  verbose: boolean;
  showIgnored: boolean;
  quiet: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    command: 'scan',
    positional: [],
    urls: [],
    viewports: [],
    json: false,
    markdown: false,
    screenshots: false,
    vision: false,
    answers: null,
    min: null,
    verbose: false,
    showIgnored: false,
    quiet: false,
  };

  let first = true;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === '--help' || a === '-h') {
      args.command = 'help';
      return args;
    }
    if (a === '--url') { args.urls.push(argv[++i]!); continue; }
    if (a === '--viewport') { args.viewports.push(Number(argv[++i])); continue; }
    if (a === '--json') {
      const next = argv[i + 1];
      args.json = next && !next.startsWith('--') ? (i++, next) : true;
      continue;
    }
    if (a === '--markdown') {
      const next = argv[i + 1];
      args.markdown = next && !next.startsWith('--') ? (i++, next) : true;
      continue;
    }
    if (a === '--screenshots') { args.screenshots = true; continue; }
    if (a === '--vision') { args.vision = true; continue; }
    if (a === '--answers') { args.answers = argv[++i] ?? null; continue; }
    if (a === '--min') { args.min = argv[++i] as Confidence; continue; }
    if (a === '--verbose' || a === '-v') { args.verbose = true; continue; }
    if (a === '--show-ignored') { args.showIgnored = true; continue; }
    if (a === '--quiet' || a === '-q') { args.quiet = true; continue; }
    if (a.startsWith('--')) {
      fail(`unknown option ${a}`);
    }
    if (first && ['scan', 'check', 'baseline', 'rules', 'why', 'sources', 'fingerprints', 'init', 'help'].includes(a)) {
      args.command = a;
      first = false;
      continue;
    }
    first = false;
    args.positional.push(a);
  }
  return args;
}

function fail(message: string): never {
  process.stderr.write(pc.red(`redpen: ${message}\n`));
  process.exit(2);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.command === 'help') {
    process.stdout.write(HELP);
    return;
  }

  const root = resolve(args.positional[0] ?? '.');

  switch (args.command) {
    case 'rules':
      return cmdRules(args);
    case 'why':
      return cmdWhy(args);
    case 'sources':
      return cmdSources();
    case 'fingerprints':
      return cmdFingerprints(root);
    case 'init':
      return cmdInit(root);
    case 'baseline':
      return cmdBaseline(root, args);
    case 'check':
      return cmdScan(root, args, true);
    default:
      return cmdScan(root, args, false);
  }
}

async function cmdScan(root: string, args: Args, gating: boolean): Promise<void> {
  const onProgress = args.quiet
    ? undefined
    : (m: string) => process.stderr.write(pc.dim(`  … ${m}\n`));

  const result = await runScan({
    root,
    urls: args.urls,
    viewports: args.viewports,
    screenshots: args.screenshots,
    vision: args.vision,
    answers: args.answers,
    ephemeral: gating,
    onProgress,
  });

  if (args.min) result.config.minConfidence = args.min;

  for (const w of result.warnings) {
    process.stderr.write(pc.yellow(`  ! ${w}\n`));
  }

  if (args.json) {
    const payload = JSON.stringify(
      {
        score: result.score,
        slopScore: result.slopScore,
        qualityScore: result.qualityScore,
        grade: grade(result.score),
        surfaces: result.surfaces,
        channelsRun: result.channelsRun,
        findings: result.findings,
        advisory: result.advisory,
        ignored: result.ignored,
        clashes: result.clashes,
        fingerprints: result.fingerprints,
        warnings: result.warnings,
        timing: result.timing,
      },
      null,
      2,
    );
    if (typeof args.json === 'string') {
      writeFileSync(args.json, payload + '\n', 'utf8');
      process.stderr.write(pc.dim(`  wrote ${args.json}\n`));
    } else {
      process.stdout.write(payload + '\n');
    }
  }

  if (args.markdown) {
    const md = renderMarkdown(result);
    if (typeof args.markdown === 'string') {
      writeFileSync(args.markdown, md + '\n', 'utf8');
      process.stderr.write(pc.dim(`  wrote ${args.markdown}\n`));
    } else {
      process.stdout.write(md + '\n');
    }
  }

  if (!args.json && !args.markdown) {
    process.stdout.write(
      renderTerminal(result, {
        verbose: args.verbose,
        showIgnored: args.showIgnored,
        maxEvidence: args.verbose ? 12 : 3,
      }),
    );
  }

  if (result.briefPath) {
    process.stderr.write(
      '\n' +
        pc.bold('  vision brief ready\n') +
        pc.dim(`  ${result.briefPath}\n`) +
        pc.dim('  Open each screenshot it lists, fill in the pre-built answer rows, then re-run with\n') +
        pc.dim(`  --answers ${result.briefPath}\n`),
    );
  }

  if (!gating) return;

  const baseline = loadBaseline(root);
  if (!baseline) {
    process.stderr.write(
      pc.yellow(
        '  ! no baseline recorded — run `redpen baseline` to set the bar this check holds against\n',
      ),
    );
    process.exit(0);
  }

  const drop = baseline.score - result.score;
  const known = new Set(baseline.knownRules);
  const introduced = ruleIds(result.findings.filter((f) => f.confidence !== 'possible')).filter(
    (id) => !known.has(id),
  );

  process.stderr.write('\n');
  if (drop > result.config.tolerance) {
    process.stderr.write(
      pc.red(
        `  score dropped ${drop} point(s) below the baseline of ${baseline.score} (tolerance ${result.config.tolerance})\n`,
      ),
    );
  }
  if (introduced.length) {
    process.stderr.write(pc.red(`  new tells since baseline: ${introduced.join(', ')}\n`));
  }

  if (drop > result.config.tolerance || introduced.length) {
    process.exit(1);
  }

  process.stderr.write(
    pc.green(`  holding at ${result.score} against a baseline of ${baseline.score}\n`),
  );
}

async function cmdBaseline(root: string, args: Args): Promise<void> {
  const result = await runScan({
    root,
    urls: args.urls,
    viewports: args.viewports,
    onProgress: args.quiet ? undefined : (m) => process.stderr.write(pc.dim(`  … ${m}\n`)),
  });

  saveBaseline(root, {
    score: result.score,
    recordedAt: new Date().toISOString(),
    knownRules: ruleIds(result.findings.filter((f) => f.confidence !== 'possible')),
  });

  process.stdout.write(
    `\n  baseline set at ${pc.bold(String(result.score))} (${grade(result.score)}) with ${result.findings.length} finding(s) on record\n` +
      pc.dim('  `redpen check` now fails when the score drops or a new tell appears\n\n'),
  );
}

function cmdRules(args: Args): void {
  const rules = loadCorpus();
  const filter = args.positional[0]?.toLowerCase();
  const shown = (
    filter ? rules.filter((r) => r.category === filter || r.id.includes(filter)) : rules
  )
    .slice()
    .sort((a, b) => a.category.localeCompare(b.category) || b.weight - a.weight);

  process.stdout.write(
    `\n  ${pc.bold(`${rules.length} rules`)}${filter ? pc.dim(` · filtered to ${shown.length}`) : ''}\n\n`,
  );

  let lastCategory = '';
  for (const r of shown) {
    if (r.category !== lastCategory) {
      process.stdout.write(`  ${pc.bold(pc.underline(r.category))}\n`);
      lastCategory = r.category;
    }
    // Rank 0 is reserved for the study's headline finding — "they all look the
    // same" outscored every individual tell, so it sits above the ranking.
    const rank =
      r.evidenceRank === 0
        ? pc.green('top')
        : r.evidenceRank !== null
          ? pc.green(`#${String(r.evidenceRank).padEnd(2)}`)
          : pc.dim('  —');
    process.stdout.write(
      `    ${String(r.weight).padStart(3)} ${rank}  ${r.id.padEnd(32)} ${pc.dim(r.channels.join('+'))}\n`,
    );
  }
  process.stdout.write(
    pc.dim(
      '\n  weight = 0-100 · rank = position in the 3,033-comment Reddit sample\n' +
        '  "top" = the headline finding (sameness outranked every individual tell)\n' +
        '  "—"  = never measured against human complaint data; weight is assigned by consequence\n\n',
    ),
  );
}

function cmdWhy(args: Args): void {
  const id = args.positional[0];
  if (!id) fail('usage: redpen why <rule-id>');
  const rule = ruleById(id);
  if (!rule) fail(`no rule "${id}" — run \`redpen rules\` to list them`);

  process.stdout.write(`\n  ${pc.bold(rule.title)}  ${pc.dim(rule.id)}\n\n`);
  process.stdout.write(`  ${pc.dim('category')}   ${rule.category}\n`);
  process.stdout.write(
    `  ${pc.dim('kind')}       ${rule.kind === 'slop' ? 'slop — reads as machine-made' : 'quality — broken regardless of taste'}${rule.advisory ? pc.yellow('  (advisory: reported, never scored)') : ''}\n`,
  );
  process.stdout.write(
    `  ${pc.dim('surfaces')}   ${rule.surfaces ? rule.surfaces.join(', ') + pc.dim(' only') : 'all (persuade, operate, read)'}\n`,
  );
  process.stdout.write(`  ${pc.dim('weight')}     ${rule.weight}/100\n`);
  process.stdout.write(
    `  ${pc.dim('evidence')}   ${
      rule.evidenceRank === 0
        ? 'the headline finding of the 3,033-comment Reddit sample — it outranked every individual tell'
        : rule.evidenceRank !== null
          ? `rank #${rule.evidenceRank} in the 3,033-comment Reddit sample`
          : 'never measured against human complaint data — weight is assigned by consequence'
    }\n`,
  );
  process.stdout.write(`  ${pc.dim('channels')}   ${rule.channels.join(', ')}\n`);
  process.stdout.write(`  ${pc.dim('from')}       ${rule.sources.map((s) => `${s.catalogue}:${s.ref}`).join('\n             ')}\n\n`);
  process.stdout.write(`  ${rule.why}\n\n`);
  process.stdout.write(`  ${pc.green('fix')}  ${rule.fix}\n\n`);
  if (rule.legitimateWhen) {
    process.stdout.write(pc.dim(`  legitimate when: ${rule.legitimateWhen}\n\n`));
  }
}

function cmdSources(): void {
  const counts = catalogueCounts();
  const total = loadCorpus().length;
  process.stdout.write(`\n  ${pc.bold(`${total} rules`)} merged from:\n\n`);
  for (const [cat, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    process.stdout.write(`    ${String(n).padStart(4)}  ${cat}\n`);
  }
  process.stdout.write(
    pc.dim(
      '\n  Counts exceed the rule total because most rules were named by more than one\n  catalogue — that overlap is what the merge collapsed. See NOTICE for licences.\n\n',
    ),
  );
}

function cmdFingerprints(root: string): void {
  const prints = store.load(root);
  if (!prints.length) {
    process.stdout.write(
      pc.dim('\n  no fingerprints on record — run `redpen scan --url <u>` to record one\n\n'),
    );
    return;
  }
  process.stdout.write(`\n  ${pc.bold(`${prints.length} page(s) on record`)}\n\n`);
  for (const p of prints) {
    process.stdout.write(`  ${pc.bold(p.page)}\n`);
    process.stdout.write(`    ${pc.dim('skeleton')}  ${p.macrostructure}\n`);
    process.stdout.write(`    ${pc.dim('rhythm')}    ${p.sectionRhythm.join(' → ')}\n`);
    process.stdout.write(`    ${pc.dim('hero/nav')}  ${p.hero} / ${p.nav}\n`);
    process.stdout.write(`    ${pc.dim('type')}      ${p.typeScale.join(', ')}px · ${p.families.join(', ')}\n`);
    process.stdout.write(
      `    ${pc.dim('anchor')}    ${p.paletteAnchor === null ? 'monochrome' : `hue ${p.paletteAnchor}`}\n\n`,
    );
  }
}

function cmdInit(root: string): void {
  const existing = loadConfig(root);
  saveConfig(root, { ...DEFAULT_CONFIG, ...existing });
  process.stdout.write(
    `\n  wrote ${pc.bold('.redpen/config.json')}\n` +
      pc.dim('  add your dev-server urls so the render channel can run:\n') +
      pc.dim('    { "urls": ["http://localhost:3000", "http://localhost:3000/pricing"] }\n\n'),
  );
}

main().catch((err: unknown) => {
  process.stderr.write(pc.red(`redpen: ${err instanceof Error ? err.message : String(err)}\n`));
  if (process.env.REDPEN_DEBUG && err instanceof Error) {
    process.stderr.write(pc.dim(String(err.stack)) + '\n');
  }
  process.exit(2);
});
