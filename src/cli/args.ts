import pc from 'picocolors';
import type { Confidence } from '../types.js';

export interface Args {
  command: string;
  positional: string[];
  urls: string[];
  viewports: number[];
  json: string | boolean;
  markdown: string | boolean;
  screenshots: boolean;
  vision: boolean;
  answers: string | null;
  only: string[];
  min: Confidence | null;
  verbose: boolean;
  showIgnored: boolean;
  quiet: boolean;
  /**
   * `redpen login --headless`: fill a password form from the environment so a
   * session can be captured in CI, where nobody can complete a headed flow.
   */
  headless: boolean;
  userSelector: string | null;
  passwordSelector: string | null;
  submitSelector: string | null;
  expectSelector: string | null;
  expectUrl: string | null;
  timeoutMs: number | null;
}

export function fail(message: string): never {
  process.stderr.write(pc.red(`redpen: ${message}\n`));
  process.exit(2);
}
