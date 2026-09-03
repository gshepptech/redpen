#!/usr/bin/env node
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import pc from 'picocolors';
import { runScan, ruleIds } from './scan.js';
import { loadPlaywright } from './channels/render.js';
import { captureLogin } from './channels/login.js';
import { meetsThreshold } from './promote.js';
import { renderTerminal } from './report/terminal.js';
import { renderMarkdown } from './report/markdown.js';
import { loadCorpus, originCounts, ruleById } from './corpus/load.js';
import {
  loadBaseline,
  saveBaseline,
  saveConfig,
  loadConfig,
  stateRoot,
  DEFAULT_CONFIG,
} from './config.js';
import * as store from './fingerprint/store.js';
import { verdict, explainScore } from './score.js';
import { compareToBaseline } from './gate.js';
import type { Confidence } from './types.js';

const HELP = `
${pc.bold('redpen')} — one verdict on your UI

  ${pc.bold('redpen scan')} [path] [url...]  run every available channel and print the report
  ${pc.bold('redpen code')} [path]        the source it is written in, not the page it serves
  ${pc.bold('redpen check')} [path]       same, but exit non-zero when the score drops
  ${pc.bold('redpen baseline')} [path]    record the current score as the bar to hold
  ${pc.bold('redpen rules')}              list the merged corpus
  ${pc.bold('redpen why')} <rule-id>      explain one rule and where it came from
  ${pc.bold('redpen why-score')} [path]   what the score is made of and what would move it
  ${pc.bold('redpen sources')}            provenance rollup across upstream catalogues
  ${pc.bold('redpen fingerprints')}       show recorded page signatures
  ${pc.bold('redpen brief')} [path]       print the vision brief so nobody has to open JSON
  ${pc.bold('redpen login')} <url>        log in in a real browser; save the session
  ${pc.bold('redpen init')} [path]        write .redpen/config.json

${pc.dim('Options')}
  --url <u>          page to render (repeatable). Bare urls work too. Without
                     one, render never runs and every source finding is capped.
  --viewport <n>     viewport width (repeatable). Default 375, 768, 1440.
  --json [file]      machine-readable output
  --markdown [file]  markdown report
  --screenshots      capture full-page PNGs to .redpen/screenshots
  --vision           capture screenshots and write .redpen/vision-brief.json
  --answers <file>   fold answered vision questions back into the verdict
  --only <cats>      report only these categories, comma separated
                     (color typography layout depth motion iconography copy
                      usability a11y sameness chrome system composition)
  --min <level>      confidence floor for scoring: confirmed | likely | possible
  --verbose          argue every finding in full, and show rule provenance
  --show-ignored     list findings suppressed by redpen-ignore
  --version, -V      print the version and exit
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
  only: string[];
  min: Confidence | null;
  verbose: boolean;
  showIgnored: boolean;
  quiet: boolean;
}

export function parseArgs(argv: string[]): Args {
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
    only: [],
    min: null,
    verbose: false,
    showIgnored: false,
    quiet: false,
  };

  let first = true;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === '--version' || a === '-V') {
      // Every CLI has this and redpen answered `unknown option --version`. It
      // is the first thing anyone types when a report looks wrong and they
      // want to know which build produced it.
      args.command = 'version';
      return args;
    }
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
    if (a === '--only') { args.only = (argv[++i] ?? '').split(',').map((x) => x.trim()).filter(Boolean); continue; }
    if (a === '--min') { args.min = argv[++i] as Confidence; continue; }
    if (a === '--verbose' || a === '-v') { args.verbose = true; continue; }
    if (a === '--show-ignored') { args.showIgnored = true; continue; }
    if (a === '--quiet' || a === '-q') { args.quiet = true; continue; }
    if (a.startsWith('--')) {
      fail(`unknown option ${a}`);
    }
    if (first && ['scan', 'code', 'check', 'baseline', 'rules', 'why', 'sources', 'fingerprints', 'brief', 'init', 'login', 'why-score', 'help', 'version'].includes(a)) {
      args.command = a;
      first = false;
      continue;
    }
    first = false;
    // A bare URL is what everyone types, and taking it as the root path meant
    // scanning a directory that cannot exist while quietly using the config's
    // urls instead — so the report described pages the command never named.
    if (/^https?:\/\//i.test(a)) { args.urls.push(a); continue; }
    args.positional.push(a);
  }
  return args;
}

function fail(message: string): never {
  process.stderr.write(pc.red(`redpen: ${message}\n`));
  process.exit(2);
}

/**
 * The version, found by walking up rather than by a fixed depth.
 *
 * A checkout runs this from dist/, a plugin install runs it from bundle/, and
 * a global install runs it from somewhere else again — the same three shapes
 * that broke the rules/ lookup, so this uses the same walk.
 */
function packageVersion(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let up = 0; up < 6; up++) {
    try {
      const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
        version?: string;
      };
      if (pkg.version) return pkg.version;
    } catch {
      // Not this level. Keep walking; the throw below is the only failure.
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return 'unknown';
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.command === 'help') {
    process.stdout.write(HELP);
    return;
  }

  if (args.command === 'version') {
    // Read from package.json rather than a constant, so it cannot drift from
    // the thing npm and the plugin manifest actually publish.
    process.stdout.write(`redpen ${packageVersion()}\n`);
    return;
  }

  // Only the commands that scan something take a path. `why` takes a rule id
  // and `rules` takes a category filter, and checking their argument against
  // the filesystem meant every documented use of either exited 2 with "no such
  // directory: ai-purple" — including the `redpen why <rule-id>` the report
  // itself prints under every folded roster.
  const TAKES_A_PATH = new Set(['scan', 'code', 'check', 'baseline', 'fingerprints', 'brief', 'init', 'why-score']);
  const root = resolve(TAKES_A_PATH.has(args.command) ? args.positional[0] ?? '.' : '.');
  if (TAKES_A_PATH.has(args.command) && args.positional[0] && !existsSync(root)) {
    fail(`no such directory: ${args.positional[0]}`);
  }

  switch (args.command) {
    case 'rules':
      return cmdRules(args);
    case 'why':
      return cmdWhy(args);
    case 'why-score':
      return cmdWhyScore(root, args);
    case 'sources':
      return cmdSources();
    case 'fingerprints':
      return cmdFingerprints(root);
    case 'brief':
      return cmdBrief(root);
    case 'init':
      return cmdInit(root);
    case 'baseline':
      return cmdBaseline(root, args);
    case 'login':
      await cmdLogin(root, args);
      return;
    case 'code':
      return cmdScan(root, args, false, true);
    case 'check':
      return cmdScan(root, args, true);
    default:
      return cmdScan(root, args, false);
  }
}

async function cmdScan(root: string, args: Args, gating: boolean, code = false): Promise<void> {
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
    only: args.only,
    ephemeral: gating || code,
    codeCategories: code,
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
        grade: verdict(result.slopScore, result.qualityScore),
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

  const gate = compareToBaseline(
    baseline,
    {
      slop: result.slopScore,
      quality: result.qualityScore,
      channelsRun: result.channelsRun,
      findings: result.findings,
    },
    result.config.tolerance,
  );

  for (const note of gate.notes) {
    process.stderr.write(pc.yellow(`\n  ! ${note}.\n    Re-record it with \`redpen baseline\` to close that hole.\n`));
  }

  if (gate.status === 'incomparable') {
    if (gate.reason === 'missing-channels') {
      process.stderr.write(
        pc.red(
          `\n  cannot check: the baseline was recorded with ${gate.had.join(', ')} but this run` +
            ` only managed ${gate.ran.join(', ')}.\n  Missing ${gate.missing.join(', ')} means fewer findings and a higher score, which would pass for the wrong reason.\n`,
        ),
      );
    } else {
      process.stderr.write(
        pc.red(
          '\n  cannot check: this baseline predates the two-axis score, so its number is not\n' +
            "  the same quantity as this run's. Re-record it with `redpen baseline`.\n",
        ),
      );
    }
    process.exit(2);
  }

  process.stderr.write('\n');

  if (gate.status === 'regressed') {
    for (const a of gate.drops) {
      process.stderr.write(
        pc.red(
          `  ${a.axis} dropped ${a.drop} point(s), ${a.was} to ${a.now} (tolerance ${result.config.tolerance})\n`,
        ),
      );
    }
    if (gate.introduced.length) {
      process.stderr.write(pc.red(`  new tells since baseline: ${gate.introduced.join(', ')}\n`));
    }
    process.exit(1);
  }

  process.stderr.write(
    pc.green(
      `  holding: slop ${gate.slop} against ${baseline.slop}, ` +
        `quality ${gate.quality} against ${baseline.quality}\n`,
    ),
  );
}

async function cmdBaseline(root: string, args: Args): Promise<void> {
  const result = await runScan({
    root,
    urls: args.urls,
    viewports: args.viewports,
    onProgress: args.quiet ? undefined : (m) => process.stderr.write(pc.dim(`  … ${m}\n`)),
  });

  for (const warning of result.warnings) {
    process.stderr.write(pc.yellow(`  ! ${warning}\n`));
  }

  saveBaseline(root, {
    score: result.score,
    slop: result.slopScore,
    quality: result.qualityScore,
    recordedAt: new Date().toISOString(),
    knownRules: ruleIds(result.findings.filter((f) => f.confidence !== 'possible')),
    channels: result.channelsRun,
  });

  process.stdout.write(
    `\n  baseline set at ${pc.bold(String(result.score))} (${verdict(result.slopScore, result.qualityScore)}) with ${result.findings.length} finding(s) on record\n` +
      pc.dim(`  channels: ${result.channelsRun.join(', ')}\n`) +
      pc.dim('  `redpen check` now fails when the score drops or a new tell appears\n\n'),
  );

  // A baseline is the one artefact that outlives the run that made it, so a
  // degraded run silently becomes the bar every later scan is judged against.
  if (!result.channelsRun.includes('render')) {
    process.stderr.write(
      pc.yellow('  ! recorded without the render channel — every later `redpen check` that does\n') +
      pc.yellow('    render will see the extra findings as a regression. Re-record with --url.\n'),
    );
  }
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
  process.stdout.write(`  ${pc.dim('from')}       ${rule.sources.map((s) => `${s.origin}:${s.ref}`).join('\n             ')}\n\n`);
  process.stdout.write(`  ${rule.why}\n\n`);
  process.stdout.write(`  ${pc.green('fix')}  ${rule.fix}\n\n`);
  if (rule.legitimateWhen) {
    process.stdout.write(pc.dim(`  legitimate when: ${rule.legitimateWhen}\n\n`));
  }
}

async function cmdWhyScore(root: string, args: Args): Promise<void> {
  const result = await runScan({
    root,
    urls: args.urls,
    viewports: args.viewports,
    only: args.only,
    ephemeral: true,
    onProgress: args.quiet ? undefined : (m) => process.stderr.write(pc.dim(`  … ${m}\n`)),
  });

  // Every other command prints these. Swallowing them here meant a run whose
  // browser could not reach the urls printed a confident number twenty points
  // off the scan's, with nothing to say one of them had not looked.
  for (const warning of result.warnings) {
    process.stderr.write(pc.yellow(`  ! ${warning}\n`));
  }

  // Score exactly what `scan` scores. Anything below the confidence floor is
  // reported but never counted, and counting it here made `why-score` disagree
  // with `scan` by nine points and a whole verdict band.
  const scorable = result.findings.filter((f) => meetsThreshold(f, result.config.minConfidence));
  const { score: total, contributions } = explainScore(scorable);
  const excluded = result.findings.length - scorable.length;
  const w = process.stdout.write.bind(process.stdout);

  // The word comes from the same pair of numbers the header prints, so it can
  // never name a band the number is not in.
  w(
    `\n  ${pc.bold('redpen')}  ${pc.bold(String(total))}${pc.dim('/100')}   ` +
      `${pc.dim(verdict(result.slopScore, result.qualityScore))}\n`,
  );
  w(`  ${pc.dim('slop')} ${result.slopScore}   ${pc.dim('quality')} ${result.qualityScore}\n\n`);

  if (!contributions.length) {
    w(pc.green('  Nothing is costing you anything.\n\n'));
    return;
  }

  w(`  ${pc.bold('What the score is made of')}\n`);
  w(pc.dim('  share = this finding\'s portion of the total problem.\n'));
  w(pc.dim('  +pts  = what the score gains if it goes away, on its own.\n\n'));

  // On a badly-failing page the curve is saturated and every individual fix is
  // worth a fraction of a point — true, and useless for deciding what to do.
  // Share ranks correctly at any score.
  const saturated = contributions.every((c) => c.worth < 1);
  if (saturated && contributions.length > 3) {
    w(pc.yellow('  The curve is saturated: there is enough here that no single fix\n'));
    w(pc.yellow('  moves the number much. Work down by share — the score starts\n'));
    w(pc.yellow('  responding once the top few are gone.\n\n'));
  }

  for (const c of contributions) {
    const bar = '█'.repeat(Math.max(1, Math.round(c.share * 40)));
    const pct = `${(c.share * 100).toFixed(1)}%`.padStart(6);
    const pts = c.worth >= 1 ? pc.green(`+${c.worth}`.padStart(5)) : pc.dim(`+${c.worth}`.padStart(5));
    w(`   ${pct} ${pts}  ${c.ruleId.padEnd(28)} ${pc.dim(`${c.kind} · ${c.instances}×`)}\n`);
    w(`   ${' '.repeat(12)}${c.kind === 'slop' ? pc.yellow(bar) : pc.red(bar)}\n`);
  }

  const best = contributions[0];
  if (best) {
    w(`\n  ${pc.bold('Start here')}  ${best.ruleId} ${pc.dim(`— ${(best.share * 100).toFixed(0)}% of the total`)}\n`);
    w(pc.dim(`  ${result.findings.find((f) => f.ruleId === best.ruleId)?.fix ?? ''}\n`));
  }

  const advisory = result.advisory.length;
  if (advisory) {
    w(pc.dim(`\n  ${advisory} advisory finding(s) cost nothing and never will.\n`));
  }
  if (excluded) {
    w(pc.dim(
      `  ${excluded} finding(s) below the "${result.config.minConfidence}" floor are not counted here` +
      ' — the render pass checked them and did not agree.\n',
    ));
  }
  w('\n');
}

function cmdSources(): void {
  const counts = originCounts();
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

/**
 * Print the brief for a human.
 *
 * Deliberately does not print the key. The whole point of the brief is that it
 * can be answered by someone who has not seen the project, and knowing which
 * rule a question belongs to is the one thing that biases the answer.
 */
function cmdBrief(root: string): void {
  const file = join(stateRoot(root), '.redpen', 'vision-brief.json');
  if (!existsSync(file)) {
    fail(`no brief at ${file} — run \`redpen scan <path> --url <url> --vision\` first`);
  }
  const brief = JSON.parse(readFileSync(file, 'utf8')) as {
    context: { product: string; audience: string; surface: Record<string, string> };
    screenshots: Record<string, string>;
    questions: Array<{ id: string; ask: string }>;
    answers: Array<{ page: string; question: string; present: boolean | null }>;
  };

  const w = process.stdout.write.bind(process.stdout);
  w(`\n  ${pc.bold('Vision brief')}  ${pc.dim(file)}\n\n`);
  w(`  ${pc.bold('What this is')}\n    ${wrapAt(brief.context.product, 72, '    ')}\n`);
  w(`  ${pc.bold('Who uses it')}\n    ${wrapAt(brief.context.audience, 72, '    ')}\n\n`);

  w(`  ${pc.bold('Pages')}\n`);
  for (const [url, shot] of Object.entries(brief.screenshots)) {
    w(`    ${pc.bold(url)}\n      ${pc.dim(shot)}\n      ${pc.dim(brief.context.surface[url] ?? '')}\n`);
  }
  w('\n');

  w(`  ${pc.bold('Questions')}  ${pc.dim('yes means the thing described IS there')}\n`);
  for (const q of brief.questions) {
    w(`    ${pc.green(q.id.padEnd(4))} ${wrapAt(q.ask, 70, '         ')}\n`);
  }

  const answered = brief.answers.filter((a) => a.present !== null).length;
  w(`\n  ${answered}/${brief.answers.length} rows answered.\n`);
  w(pc.dim(`  Open each screenshot, fill in present / confidence / evidence, then:\n`));
  w(pc.dim(`    redpen scan ${root} --url <url> --answers ${file}\n\n`));
}

function wrapAt(text: string, width: number, indent: string): string {
  const words = String(text).split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length > width) {
      lines.push(line.trim());
      line = word;
    } else line += ' ' + word;
  }
  if (line.trim()) lines.push(line.trim());
  return lines.join('\n' + indent);
}

/**
 * Capture a session by opening a browser and waiting.
 *
 * redpen automates none of the logging in. Every app's flow is different —
 * OAuth, SSO, a magic link, a second factor — and a config schema covering
 * them would be a browser automation language redpen then owns forever. What
 * every flow produces is the same cookie jar, so that is the only part
 * automated.
 */
async function cmdLogin(root: string, args: Args): Promise<void> {
  const url = args.urls[0];
  if (!url) {
    fail('redpen login needs the url to log in at, e.g. `redpen login http://localhost:3000/login`');
  }

  const pw = await loadPlaywright(root);
  if (!pw) {
    fail(
      'playwright is not installed here or in the project being scanned — ' +
        '`npm i -D playwright && npx playwright install chromium`',
    );
  }

  const out = join(stateRoot(root), '.redpen', 'auth.json');

  const result = await captureLogin(
    async () => pw as never,
    url,
    out,
    {
      say: (m) => process.stderr.write(pc.dim(`  ${m}\n`)),
      waitForOperator: () =>
        new Promise<void>((done) => {
          process.stderr.write(pc.bold('\n  Press Enter here once you are logged in. '));
          process.stdin.resume();
          process.stdin.once('data', () => {
            process.stdin.pause();
            done();
          });
        }),
    },
  );

  process.stdout.write(
    `\n  session saved to ${pc.bold(relative(root, result.path) || result.path)}\n` +
      pc.dim(`  ${result.cookies} cookie(s), ${result.origins} stored origin(s), captured at ${result.landedOn}\n`),
  );
  // The command that writes a credential is the command that protects it.
  // This used to print "`redpen init` adds .redpen/ to .gitignore" — which
  // nothing did. A session file sat untracked-but-committable in a repository
  // that had never run init, under a message saying it was handled.
  const ignored = ensureGitignored(root, '.redpen/');
  process.stderr.write(
    pc.yellow('\n  This file is a live credential, and it expires when the session does.\n') +
      pc.yellow(
        ignored === 'added'
          ? '  Added .redpen/ to .gitignore so it cannot be committed.\n'
          : ignored === 'present'
            ? '  .gitignore already covers .redpen/.\n'
            : '  This is not a git repository, so nothing was ignored — keep the file out of any archive you share.\n',
      ),
  );

  const config = loadConfig(root);
  if (!config.storageState) {
    saveConfig(root, { ...config, storageState: '.redpen/auth.json' });
    process.stderr.write(pc.dim('\n  .redpen/config.json now points at it; scans will use it automatically.\n'));
  }
}

/**
 * Put `.redpen/` in .gitignore, if there is one and it is not covered already.
 *
 * Appends rather than rewrites, and never touches a file it cannot parse: an
 * ignore file is the user's, and a tool that reformats one to add a line has
 * done more than it was asked.
 */
export function ensureGitignored(root: string, entry: string): 'added' | 'present' | 'no-repo' {
  const gitDir = join(stateRoot(root), '.git');
  const file = join(stateRoot(root), '.gitignore');
  if (!existsSync(gitDir)) return 'no-repo';
  let body = '';
  try {
    body = readFileSync(file, 'utf8');
  } catch {
    body = '';
  }
  const covered = body
    .split('\n')
    .map((l) => l.trim())
    .some((l) => l === entry || l === entry.replace(/\/$/, '') || l === `/${entry}`);
  if (covered) return 'present';
  try {
    writeFileSync(file, (body && !body.endsWith('\n') ? body + '\n' : body) + entry + '\n', 'utf8');
    return 'added';
  } catch {
    return 'no-repo';
  }
}

function cmdInit(root: string): void {
  const existing = loadConfig(root);
  saveConfig(root, { ...DEFAULT_CONFIG, ...existing });
  process.stdout.write(
    `\n  wrote ${pc.bold(join(stateRoot(root), '.redpen', 'config.json'))}\n\n` +
      pc.dim('  Two fields are worth filling in before anything else:\n\n') +
      pc.dim('    "urls"    — without one the browser pass never runs and every\n') +
      pc.dim('                finding it could confirm is capped at "possible".\n') +
      pc.dim('    "product" — name, purpose, audience. The vision brief is meant to\n') +
      pc.dim('                be answerable by someone who has not seen the project,\n') +
      pc.dim('                and several questions are unfair without it.\n\n') +
      pc.dim('  "schemes" defaults to "auto": redpen probes the first page for a dark\n') +
      pc.dim('  theme and scans it too if there is one. Set ["light"] to skip that.\n\n'),
  );
}

main().catch((err: unknown) => {
  process.stderr.write(pc.red(`redpen: ${err instanceof Error ? err.message : String(err)}\n`));
  if (process.env.REDPEN_DEBUG && err instanceof Error) {
    process.stderr.write(pc.dim(String(err.stack)) + '\n');
  }
  process.exit(2);
});
