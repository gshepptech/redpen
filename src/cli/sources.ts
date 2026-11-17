import pc from 'picocolors';
import { loadCorpus, originCounts } from '../corpus/load.js';

export function cmdSources(): void {
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
