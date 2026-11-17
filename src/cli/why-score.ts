import pc from 'picocolors';
import { runScan } from '../scan.js';
import { meetsThreshold } from '../promote.js';
import { verdict, explainScore } from '../score.js';
import type { Args } from './args.js';

export async function cmdWhyScore(root: string, args: Args): Promise<void> {
  const result = await runScan({
    root,
    urls: args.urls,
    viewports: args.viewports,
    only: args.only,
    ephemeral: true,
    onProgress: args.quiet ? undefined : (m) => process.stderr.write(pc.dim(`  … ${m}\n`)),
  });

  // Every other command prints these. Without them, a run whose browser could
  // not reach the urls would print a confident number with nothing to say the
  // render pass had not looked.
  for (const warning of result.warnings) {
    process.stderr.write(pc.yellow(`  ! ${warning}\n`));
  }

  // Score exactly what `scan` scores. Anything below the confidence floor is
  // reported but never counted, so `why-score` and `scan` agree on the number.
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
  // worth a fraction of a point. True, and useless for deciding what to do.
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
