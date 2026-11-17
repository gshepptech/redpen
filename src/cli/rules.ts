import pc from 'picocolors';
import { loadCorpus } from '../corpus/load.js';
import type { Args } from './args.js';

export function cmdRules(args: Args): void {
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
    // Rank 0 is reserved for the study's headline finding: "they all look the
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
