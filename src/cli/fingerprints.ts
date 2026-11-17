import pc from 'picocolors';
import * as store from '../fingerprint/store.js';

export function cmdFingerprints(root: string): void {
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
