import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import pc from 'picocolors';
import { stateRoot } from '../config.js';
import { fail } from './args.js';

/**
 * Print the brief for a human.
 *
 * Deliberately does not print the key. The whole point of the brief is that it
 * can be answered by someone who has not seen the project, and knowing which
 * rule a question belongs to is the one thing that biases the answer.
 */
export function cmdBrief(root: string): void {
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
