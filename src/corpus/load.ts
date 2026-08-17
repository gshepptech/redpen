import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import type { Rule, Category, Channel, Kind, Surface } from '../types.js';

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
  'chrome',
  'system',
  'composition',
]);

const VALID_CHANNELS: ReadonlySet<string> = new Set<Channel>([
  'source',
  'render',
  'vision',
  'fingerprint',
]);

const VALID_KINDS: ReadonlySet<string> = new Set<Kind>(['slop', 'quality']);

const VALID_SURFACES: ReadonlySet<string> = new Set<Surface>(['persuade', 'operate', 'read']);

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
  if (!r.kind || !VALID_KINDS.has(r.kind)) {
    throw new Error(
      `redpen: rule "${r.id}" must declare kind: slop | quality — "does it look machine-made" and "is it broken" are scored separately`,
    );
  }
  if (r.surfaces !== undefined) {
    if (!Array.isArray(r.surfaces) || r.surfaces.length === 0) {
      throw new Error(`redpen: rule "${r.id}" has an empty surfaces list — omit the field to mean all`);
    }
    for (const s of r.surfaces) {
      if (!VALID_SURFACES.has(s)) {
        throw new Error(`redpen: rule "${r.id}" names unknown surface "${s}"`);
      }
    }
    if (r.surfaces.length === 3) {
      throw new Error(`redpen: rule "${r.id}" lists every surface — omit the field instead`);
    }
  }
  if (r.requires !== undefined) {
    if (!Array.isArray(r.requires) || r.requires.length === 0) {
      throw new Error(`redpen: rule "${r.id}" has an empty requires list`);
    }
    for (const cap of r.requires) {
      if (!VALID_CAPABILITIES.has(cap)) {
        throw new Error(`redpen: rule "${r.id}" requires unknown capability "${cap}"`);
      }
    }
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
  return {
    ...complete,
    evidenceRank: complete.evidenceRank ?? null,
    advisory: complete.advisory ?? false,
  };
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

/**
 * Does this rule apply on this surface?
 *
 * A rule with no `surfaces` holds everywhere. One that names surfaces holds
 * only there — which is how "a single type family" stops being a finding on a
 * dashboard, where it is the correct choice.
 */
export function appliesTo(rule: Rule, surface: Surface | null): boolean {
  if (!rule.surfaces) return true;
  // With no surface established, keep the rule rather than silently dropping it.
  if (!surface) return true;
  return rule.surfaces.includes(surface);
}

const VALID_CAPABILITIES: ReadonlySet<string> = new Set(['javascript', 'externalAssets']);

/**
 * Is this rule actionable given what the project can do? A no-JavaScript
 * project told to add inline validation on every scan forever learns to ignore
 * the whole report.
 */
export function isActionable(rule: Rule, capabilities: Record<string, boolean>): boolean {
  if (!rule.requires) return true;
  return rule.requires.every((cap) => capabilities[cap] !== false);
}

export function rulesForSurface(surface: Surface | null): Rule[] {
  return loadCorpus().filter((r) => appliesTo(r, surface));
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
