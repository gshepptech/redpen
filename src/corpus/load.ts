import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import type { Rule, Category, Channel } from '../types.js';

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * The corpus ships beside the compiled code in the published package and two
 * levels up in the repo, so resolve both without caring which one we're in.
 */
function rulesDir(): string {
  for (const candidate of [
    join(HERE, '..', '..', 'rules'),
    join(HERE, '..', '..', '..', 'rules'),
  ]) {
    try {
      readdirSync(candidate);
      return candidate;
    } catch {
      continue;
    }
  }
  throw new Error('redpen: could not locate the rules/ directory');
}

const VALID_CATEGORIES: ReadonlySet<string> = new Set<Category>([
  'color',
  'typography',
  'layout',
  'depth',
  'motion',
  'iconography',
  'copy',
  'usability',
  'a11y',
  'sameness',
]);

const VALID_CHANNELS: ReadonlySet<string> = new Set<Channel>([
  'source',
  'render',
  'vision',
  'fingerprint',
]);

/**
 * Validate on load rather than trusting the YAML. The corpus is the one thing
 * every channel reads, so a malformed rule should fail loudly at startup
 * instead of silently never matching.
 */
function validate(rule: unknown, file: string, index: number): Rule {
  const r = rule as Partial<Rule>;
  const where = `${file}[${index}]`;

  if (!r.id) throw new Error(`redpen: ${where} has no id`);
  if (!r.title) throw new Error(`redpen: rule "${r.id}" has no title`);
  if (!r.category || !VALID_CATEGORIES.has(r.category)) {
    throw new Error(`redpen: rule "${r.id}" has invalid category "${r.category}"`);
  }
  if (!Array.isArray(r.sources) || r.sources.length === 0) {
    throw new Error(`redpen: rule "${r.id}" has no sources — provenance is mandatory`);
  }
  if (!Array.isArray(r.channels) || r.channels.length === 0) {
    throw new Error(`redpen: rule "${r.id}" declares no channels`);
  }
  for (const ch of r.channels) {
    if (!VALID_CHANNELS.has(ch)) {
      throw new Error(`redpen: rule "${r.id}" declares unknown channel "${ch}"`);
    }
  }
  if (typeof r.weight !== 'number' || r.weight < 0 || r.weight > 100) {
    throw new Error(`redpen: rule "${r.id}" weight must be 0-100, got ${r.weight}`);
  }
  if (!r.why || !r.fix) {
    throw new Error(`redpen: rule "${r.id}" must explain both why and fix`);
  }

  // A rule that declares a channel but gives it no matcher can never fire on
  // that channel, which silently weakens cross-channel promotion.
  for (const ch of r.channels) {
    if (ch === 'source' && !r.source) {
      throw new Error(`redpen: rule "${r.id}" declares the source channel but has no matcher`);
    }
    if (ch === 'render' && !r.render) {
      throw new Error(`redpen: rule "${r.id}" declares the render channel but has no matcher`);
    }
    if (ch === 'vision' && !r.vision) {
      throw new Error(`redpen: rule "${r.id}" declares the vision channel but has no matcher`);
    }
  }

  // Compile every pattern once, here, so a bad regex surfaces at load.
  if (r.source?.patterns) {
    for (const p of r.source.patterns) {
      try {
        new RegExp(p, 'giu');
      } catch (err) {
        throw new Error(`redpen: rule "${r.id}" has an invalid pattern /${p}/: ${err}`);
      }
    }
  }

  const complete = r as Rule;
  // `evidenceRank: null` is meaningful — it says the tell was never measured
  // against human complaint data — so default it rather than leaving undefined.
  return { ...complete, evidenceRank: complete.evidenceRank ?? null };
}

let cached: Rule[] | null = null;

export function loadCorpus(): Rule[] {
  if (cached) return cached;

  const dir = rulesDir();
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
    .sort();

  const rules: Rule[] = [];
  const seen = new Map<string, string>();

  for (const file of files) {
    const raw = parse(readFileSync(join(dir, file), 'utf8')) as unknown[];
    if (!Array.isArray(raw)) {
      throw new Error(`redpen: ${file} must contain a top-level list of rules`);
    }
    raw.forEach((entry, i) => {
      const rule = validate(entry, file, i);
      const prior = seen.get(rule.id);
      if (prior) {
        throw new Error(`redpen: duplicate rule id "${rule.id}" in ${file} and ${prior}`);
      }
      seen.set(rule.id, file);
      rules.push(rule);
    });
  }

  cached = rules;
  return rules;
}

export function rulesForChannel(channel: Channel): Rule[] {
  return loadCorpus().filter((r) => r.channels.includes(channel));
}

export function ruleById(id: string): Rule | undefined {
  return loadCorpus().find((r) => r.id === id);
}

/** Provenance rollup, for `redpen sources` and the NOTICE check. */
export function catalogueCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const rule of loadCorpus()) {
    for (const s of rule.sources) {
      counts[s.catalogue] = (counts[s.catalogue] ?? 0) + 1;
    }
  }
  return counts;
}
