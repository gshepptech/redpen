import { writeFileSync } from 'node:fs';
import pc from 'picocolors';
import { runScan } from '../scan.js';
import { renderTerminal } from '../report/terminal.js';
import { renderMarkdown } from '../report/markdown.js';
import { loadBaseline } from '../config.js';
import { verdict } from '../score.js';
import { compareToBaseline } from '../gate.js';
import type { Args } from './args.js';

export async function cmdScan(root: string, args: Args, gating: boolean, code = false): Promise<void> {
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
