import pc from 'picocolors';
import { runScan, ruleIds } from '../scan.js';
import { saveBaseline } from '../config.js';
import { verdict } from '../score.js';
import type { Args } from './args.js';

export async function cmdBaseline(root: string, args: Args): Promise<void> {
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
