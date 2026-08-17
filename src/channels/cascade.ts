/**
 * Cascade analysis: a specific rule quietly cancelling a promise made by a
 * weaker one.
 *
 * The render channel can see that a control computes to 32px when the design
 * system promised 44. It cannot see *why*, so the reader gets the symptom and
 * has to find the cause — one project fixed the same defect three times
 * because each report named a different button.
 *
 * The defect is a source-level question and it is answerable:
 *
 *   does a rule set `height` below a floor on a selector that also matches a
 *   rule setting `min-height` at or above that floor, with nothing restoring
 *   it?
 *
 * Reporting the pair — `.qacts .btn { height: 32px }` (0,2,0) cancels
 * `.btn { min-height: 44px }` (0,1,0) — names the cause, which is the thing
 * the reader can act on.
 *
 * Soundness is the whole design constraint here. This does not implement a
 * selector matcher, so it only reports a pair when overlap is *guaranteed*:
 * the weak selector must be a single compound that appears whole inside the
 * strong selector's rightmost compound. `.btn` subsumes `.qacts .btn` because
 * anything matching the latter matches the former, by definition. Anything
 * needing real matching — a `:where()` wrapper, a parent restoring the value,
 * a utility class — is left alone rather than guessed at, because a cascade
 * false positive costs more than a missed pair: it sends someone hunting for
 * a bug that is not there.
 */

export interface CascadeConflict {
  /** The rule that cancels the promise. */
  offender: { selector: string; declaration: string; specificity: [number, number, number] };
  /** The rule whose promise was cancelled. */
  promise: { selector: string; declaration: string; specificity: [number, number, number] };
  /** 1-indexed line of the offending declaration. */
  line: number;
  /**
   * Set when a conditional rule restores the floor for part of the space —
   * the finding still stands for everywhere that condition does not match.
   */
  restoredUnder?: string | null;
  /** Human-readable summary for the evidence excerpt. */
  summary: string;
}

export interface RuleSet {
  selector: string;
  body: string;
  line: number;
  /** Media/supports conditions wrapping this rule, outermost first. */
  conditions: string[];
}

/** Strip comments but keep byte offsets, so reported line numbers stay true. */
function blankComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

/**
 * CSS specificity as (ids, classes, elements).
 *
 * Pseudo-elements count as elements, `:not()`/`:is()`/`:has()` contribute
 * their most specific argument, and `:where()` contributes nothing — which is
 * exactly why `:where()` wrappers are excluded from the subsumption test.
 */
export function specificity(selector: string): [number, number, number] {
  let s = selector.trim();
  let a = 0;
  let b = 0;
  let c = 0;

  s = s.replace(/:where\([^)]*\)/g, ' ');
  s = s.replace(/:(not|is|has|matches)\(([^)]*)\)/g, (_m, _fn, inner: string) => {
    const best = inner
      .split(',')
      .map((part) => specificity(part))
      .sort((x, y) => y[0] - x[0] || y[1] - x[1] || y[2] - x[2])[0];
    if (best) {
      a += best[0];
      b += best[1];
      c += best[2];
    }
    return ' ';
  });

  a += (s.match(/#[\w-]+/g) ?? []).length;
  s = s.replace(/#[\w-]+/g, ' ');

  b += (s.match(/\.[\w-]+/g) ?? []).length;
  s = s.replace(/\.[\w-]+/g, ' ');
  b += (s.match(/\[[^\]]*\]/g) ?? []).length;
  s = s.replace(/\[[^\]]*\]/g, ' ');
  // Remaining pseudo-classes are class-weight; pseudo-elements are element-weight.
  c += (s.match(/::[\w-]+/g) ?? []).length;
  s = s.replace(/::[\w-]+/g, ' ');
  b += (s.match(/:[\w-]+/g) ?? []).length;
  s = s.replace(/:[\w-]+/g, ' ');

  c += (s.match(/\b[a-zA-Z][\w-]*/g) ?? []).length;
  return [a, b, c];
}

/**
 * Does this condition restrict *where* a rule applies, rather than whether the
 * browser supports it?
 *
 * A restore under `@supports` or a bare `@media screen` covers every context
 * the promise does. One under a width, a pointer type or an orientation covers
 * only part of it, and the part it misses is usually the common one.
 */
function isNarrowing(condition: string): boolean {
  return /\b(max-width|min-width|max-height|min-height|pointer|any-pointer|hover|any-hover|orientation|max-device-width|min-device-width)\b/i.test(
    condition,
  );
}

/** Whitespace-insensitive selector identity, so formatting is not semantics. */
function normalise(selector: string): string {
  return selector.trim().replace(/\s*([>+~])\s*/g, '$1').replace(/\s+/g, ' ');
}

function compare(x: [number, number, number], y: [number, number, number]): number {
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
}

/** The simple selectors of the last compound: ".qacts .btn" -> [".btn"]. */
function rightmostCompound(selector: string): string[] {
  const last = selector.trim().split(/\s*[\s>+~]\s*/).filter(Boolean).pop() ?? '';
  return last.match(/[#.]?[\w-]+|\[[^\]]*\]|::?[\w-]+(?:\([^)]*\))?/g) ?? [];
}

/** Is every simple selector of `weak` present in `strong`'s rightmost compound? */
export function subsumes(weak: string, strong: string): boolean {
  const w = weak.trim();
  // Only single compounds: a descendant weak selector needs real matching.
  if (/[\s>+~]/.test(w)) return false;
  if (/:where|:has|:is|:not|:nth|::/.test(w)) return false;
  const weakParts = rightmostCompound(w);
  if (!weakParts.length) return false;
  const strongParts = new Set(rightmostCompound(strong));
  return weakParts.every((p) => strongParts.has(p));
}

/** px value of a length, or null for anything not comparable at parse time. */
function px(value: string): number | null {
  const v = value.trim();
  if (/var\(|calc\(|clamp\(|min\(|max\(|%/.test(v)) return null;
  const m = /^(-?[\d.]+)(px|rem|em)?$/.exec(v);
  if (!m) return null;
  const n = parseFloat(m[1]!);
  if (!Number.isFinite(n)) return null;
  if (m[2] === 'rem') return n * 16;
  // `em` depends on the element's own font size, which is not knowable here.
  if (m[2] === 'em') return null;
  return n;
}

function declValue(body: string, prop: string): { value: string; offset: number } | null {
  const re = new RegExp(`(^|[;{\\s])${prop}\\s*:\\s*([^;}]+)`, 'i');
  const m = re.exec(body);
  if (!m) return null;
  return { value: m[2]!.trim(), offset: m.index };
}

/** Flatten a stylesheet into rule sets, tracking the conditions around each. */
export function parse(css: string): RuleSet[] {
  const text = blankComments(css);
  const sets: RuleSet[] = [];
  const conditions: string[] = [];
  let i = 0;
  let selectorStart = 0;

  const lineAt = (offset: number) => text.slice(0, offset).split('\n').length;

  while (i < text.length) {
    const ch = text[i];
    if (ch === '{') {
      const head = text.slice(selectorStart, i).trim();
      if (head.startsWith('@')) {
        conditions.push(head);
        i++;
        selectorStart = i;
        continue;
      }
      // Find the matching close brace, allowing one level of nesting.
      let depth = 1;
      let j = i + 1;
      while (j < text.length && depth > 0) {
        if (text[j] === '{') depth++;
        else if (text[j] === '}') depth--;
        j++;
      }
      const body = text.slice(i + 1, j - 1);
      if (head) sets.push({ selector: head, body, line: lineAt(i), conditions: [...conditions] });
      i = j;
      selectorStart = i;
      continue;
    }
    if (ch === '}') {
      conditions.pop();
      i++;
      selectorStart = i;
      continue;
    }
    i++;
  }
  return sets;
}

export interface CascadeOptions {
  /** Minimum size the weak rule must promise for a conflict to matter. */
  floorPx?: number;
}

/**
 * Find rules that pin a dimension below a floor another rule promised.
 *
 * Only `height` against `min-height` today, which is the case that produced
 * three separate reports of one bug. The shape generalises — a specific rule
 * opting out of a guarantee a base rule made — and `max-width`/`min-width`
 * and `overflow` are the obvious next instances.
 */
export function findCancelledFloors(css: string, opts: CascadeOptions = {}): CascadeConflict[] {
  const floor = opts.floorPx ?? 44;
  const sets = parse(css);

  const promises = sets
    .map((r) => {
      const d = declValue(r.body, 'min-height');
      if (!d) return null;
      const value = px(d.value);
      if (value === null || value < floor) return null;
      return { rule: r, value, decl: `min-height: ${d.value}` };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (!promises.length) return [];

  const conflicts: CascadeConflict[] = [];

  for (const r of sets) {
    const d = declValue(r.body, 'height');
    if (!d) continue;
    const value = px(d.value);
    if (value === null || value >= floor) continue;

    for (const p of promises) {
      if (p.rule === r) continue;
      // Only report where every element matching the offender also matches the
      // promise. Anything less certain is left alone.
      if (!subsumes(p.rule.selector, r.selector)) continue;

      const off = specificity(r.selector);
      const weak = specificity(p.rule.selector);
      if (compare(off, weak) <= 0) continue;

      // A restore inside a condition only covers what that condition matches.
      //
      // The first version treated any conditional restore as a full one, which
      // declined to report a control that is under the floor at the *most
      // common* viewport on the grounds that it is fine at an uncommon one.
      // Reported from the field, from the stylesheet this rule was built for:
      // a restore under `(pointer: coarse), (max-width: 720px)` leaves the
      // control at 44px on a phone and 32px on every desktop.
      let partialUnder: string | null = null;
      const restored = sets.some((other) => {
        if (other === r) return false;
        if (!other.conditions.length) return false;
        const od = declValue(other.body, 'height') ?? declValue(other.body, 'min-height');
        if (!od) return false;
        const ov = px(od.value);
        if (ov === null || ov < floor) return false;
        // The restoring rule must be the *same* selector, not merely one that
        // ends the same way. Comparing rightmost compounds meant a single
        // `.qacts .btn` restore silently excused `.acts .btn` and
        // `.prompt-side .btn` too — which is exactly the bug this rule exists
        // to find, suppressed by the check meant to avoid false positives.
        if (compare(specificity(other.selector), off) < 0) return false;
        if (normalise(other.selector) !== normalise(r.selector)) return false;
        const narrowing = other.conditions.filter(isNarrowing);
        if (narrowing.length) {
          // Covers some contexts, not all. Keep looking for a full restore;
          // if none exists this becomes a finding that says where it holds.
          partialUnder = narrowing.join(' and ');
          return false;
        }
        return true;
      });
      if (restored) continue;

      const fmt = (s: [number, number, number]) => `(${s.join(',')})`;
      const caveat = partialUnder
        ? ` — restored only under ${partialUnder}, so it stays ${value}px everywhere else`
        : ` — computes to ${value}px, floor is ${floor}px`;
      conflicts.push({
        offender: { selector: r.selector, declaration: `height: ${d.value}`, specificity: off },
        promise: { selector: p.rule.selector, declaration: p.decl, specificity: weak },
        line: r.line,
        restoredUnder: partialUnder,
        summary:
          `${r.selector} { height: ${d.value} } ${fmt(off)} cancels ` +
          `${p.rule.selector} { ${p.decl} } ${fmt(weak)}${caveat}`,
      });
      break;
    }
  }

  return conflicts;
}
