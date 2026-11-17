import { join } from 'node:path';
import pc from 'picocolors';
import { loadConfig, saveConfig, stateRoot, DEFAULT_CONFIG } from '../config.js';

export function cmdInit(root: string): void {
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
