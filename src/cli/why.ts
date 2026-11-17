import pc from 'picocolors';
import { ruleById } from '../corpus/load.js';
import { fail, type Args } from './args.js';

export function cmdWhy(args: Args): void {
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
