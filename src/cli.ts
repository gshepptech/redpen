#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pc from 'picocolors';
import { fail, type Args } from './cli/args.js';
import type { Confidence } from './types.js';
import { cmdScan } from './cli/scan.js';
import { cmdBaseline } from './cli/baseline.js';
import { cmdRules } from './cli/rules.js';
import { cmdWhy } from './cli/why.js';
import { cmdWhyScore } from './cli/why-score.js';
import { cmdSources } from './cli/sources.js';
import { cmdFingerprints } from './cli/fingerprints.js';
import { cmdBrief } from './cli/brief.js';
import { cmdLogin } from './cli/login.js';
import { cmdInit } from './cli/init.js';

export { maskAccount, ensureGitignored } from './cli/login.js';

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

${pc.dim('Logging in without a person (redpen login --headless)')}
  Covers one shape of login: a form with a username field, a password field
  and a submit. Anything else — SSO, a magic link, a second factor — is the
  headed \`redpen login\`, and this fails rather than pretending.

  --headless         fill the form instead of waiting for you
  --user-selector    the username or email field, e.g. '#email'
  --password-selector  the password field, e.g. '#password'
  --submit-selector  the submit button. Omitted presses Enter in the password
  --expect <sel>     a selector that only exists once logged in (required,
                     unless --expect-url: a refused password still sets cookies)
  --expect-url <s>   a substring the url must contain once logged in
  --timeout <ms>     per-step timeout. Default 30000

  The account comes from REDPEN_LOGIN_USER and REDPEN_LOGIN_PASSWORD. There is
  no flag for either, because a credential in an argument is in the CI log.

${pc.dim('Suppressing a finding')}
  Add ${pc.bold('redpen-ignore <reason>')} in a comment on or above the line, or
  ${pc.bold('redpen-ignore:<rule-id> <reason>')} to suppress just one rule. The reason is
  required — an ignore with no reason is how a rule set stops meaning anything.
`;

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
    headless: false,
    userSelector: null,
    passwordSelector: null,
    submitSelector: null,
    expectSelector: null,
    expectUrl: null,
    timeoutMs: null,
  };

  let first = true;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === '--version' || a === '-V') {
      // The first thing anyone types when a report looks wrong and they want
      // to know which build produced it.
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
    if (a === '--headless') { args.headless = true; continue; }
    if (a === '--user-selector') { args.userSelector = argv[++i] ?? null; continue; }
    if (a === '--password-selector') { args.passwordSelector = argv[++i] ?? null; continue; }
    if (a === '--submit-selector') { args.submitSelector = argv[++i] ?? null; continue; }
    if (a === '--expect') { args.expectSelector = argv[++i] ?? null; continue; }
    if (a === '--expect-url') { args.expectUrl = argv[++i] ?? null; continue; }
    if (a === '--timeout') { args.timeoutMs = Number(argv[++i]); continue; }
    // There is deliberately no --user or --password. A credential passed as an
    // argument is in the process table, the shell history and, on the machine
    // this matters most, the CI log. They come from the environment or not at all.
    if (a.startsWith('--')) {
      fail(`unknown option ${a}`);
    }
    if (first && ['scan', 'code', 'check', 'baseline', 'rules', 'why', 'sources', 'fingerprints', 'brief', 'init', 'login', 'why-score', 'help', 'version'].includes(a)) {
      args.command = a;
      first = false;
      continue;
    }
    first = false;
    // A bare URL is what everyone types. Taken as the root path, it would scan
    // a directory that cannot exist while quietly using the config's urls, and
    // the report would describe pages the command never named.
    if (/^https?:\/\//i.test(a)) { args.urls.push(a); continue; }
    args.positional.push(a);
  }
  return args;
}

/**
 * The version, found by walking up rather than by a fixed depth.
 *
 * A checkout runs this from dist/, a plugin install runs it from bundle/, and
 * a global install runs it from somewhere else again. These are the same three
 * shapes the rules/ lookup handles, so this uses the same walk.
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
      // Not this level. Keep walking.
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
  // and `rules` takes a category filter; checking either against the
  // filesystem would reject `redpen why ai-purple` with "no such directory".
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

main().catch((err: unknown) => {
  process.stderr.write(pc.red(`redpen: ${err instanceof Error ? err.message : String(err)}\n`));
  if (process.env.REDPEN_DEBUG && err instanceof Error) {
    process.stderr.write(pc.dim(String(err.stack)) + '\n');
  }
  process.exit(2);
});
