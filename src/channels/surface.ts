import type { Surface } from '../types.js';

/**
 * Surface detection.
 *
 * The idea redpen most needed: what the
 * visitor is doing on a page decides which rules are true there:
 *
 *   persuade — the visitor decides and acts. Landing, marketing, pricing.
 *   operate  — the visitor completes a task. App UI, dashboards, settings.
 *   read     — the visitor understands something. Docs, articles, changelogs.
 *
 * On an operate surface, familiarity is a feature. A single type family, uniform
 * spacing, and identical repeating components are the correct answers there and
 * tells on a landing page. A rule set that fires the same way on both is wrong
 * half the time.
 *
 * Detection is a heuristic and it says so: the result carries a confidence, and
 * a declared surface in .redpen/config.json always wins. When nothing is
 * declared and nothing is confident, every rule stays on — the safe failure is
 * a false positive the reader can dismiss, not a silently skipped check.
 */

export interface SurfaceVerdict {
  surface: Surface;
  /** 0-1. Below 0.6 the caller should treat this as "unknown" and gate nothing. */
  confidence: number;
  /** The signals that decided it, for the report. */
  signals: string[];
  /**
   * How much page there was to classify from.
   *
   * The same commit scored 49 or 61 depending on how many rows happened to be
   * in the dev database, and nothing said so. When a page abstains, the honest
   * diagnosis is usually "too little content here", not "declare it in config".
   */
  density: { rows: number; controls: number; characters: number };
  /** True when the page had too little on it to classify from. */
  sparse: boolean;
}

/**
 * Runs in the browser alongside the detectors. Counts the structural evidence
 * for each surface rather than pattern-matching a URL, because a route named
 * /dashboard can be a marketing page about a dashboard.
 */
export function surfaceSource(): string {
  return `() => {
  function visible(el) {
    var s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }
  function all(sel) {
    return Array.prototype.slice.call(document.querySelectorAll(sel)).filter(visible);
  }
  function textLen(el) {
    return ((el || document.body).innerText || '').replace(/\\s+/g, ' ').trim().length;
  }

  var body = document.body;

  // --- operate: the page is a set of controls over data ---
  var inputs   = all('input:not([type=hidden]), select, textarea').length;
  var buttons  = all('button, [role="button"]').length;
  var tables   = all('table, [role="table"], [role="grid"]').length;
  var rows     = all('tbody tr, [role="row"]').length;
  var tabs     = all('[role="tab"], [role="tablist"]').length;
  var menus    = all('[role="menu"], [role="menuitem"], [role="listbox"]').length;
  var toggles  = all('[role="switch"], [role="checkbox"], input[type=checkbox]').length;
  var sidebar  = all('aside, [class*="sidebar"], [class*="side-nav"], nav[aria-orientation="vertical"]').length;
  var toolbars = all('[role="toolbar"], [class*="toolbar"]').length;
  var authish  = all('[class*="avatar"], [class*="account"], [aria-label*="profile" i]').length;

  // A list of records with per-row actions. This is the strongest operate
  // signal there is: eight rows each carrying Promote/Drop are not a landing
  // page repeating its call to action. No marketing page repeats a control
  // cluster per item.
  var recordRows = (function () {
    var best = 0;
    all('*').forEach(function (parent) {
      var kids = Array.prototype.slice.call(parent.children).filter(visible);
      if (kids.length < 3) return;
      // Actions only. Counting inputs and selects would make a form's field
      // wrappers — one label and one input each — look exactly like record rows.
      var ACTIONS = 'button, a[class], a[href], [role="button"]';
      var withControls = kids.filter(function (k) {
        if (!k.querySelector(ACTIONS)) return false;
        // A record carries content of its own, not just a control.
        return (k.textContent || '').replace(/\s+/g, ' ').trim().length > 12;
      });
      if (withControls.length < 3) return;

      // Compare structure, not labels. Row actions legitimately differ by
      // state — Start / Claim / Close — and matching on text would fail a real
      // list with per-row state while passing a uniform form.
      var sig = withControls.map(function (k) {
        return Array.prototype.slice.call(k.querySelectorAll(ACTIONS))
          .map(function (c) { return c.tagName; }).sort().join('|');
      });
      var same = sig.filter(function (x) { return x === sig[0]; }).length;
      if (sig[0] && same >= Math.max(3, Math.floor(withControls.length * 0.6))) {
        best = Math.max(best, withControls.length);
      }
    });
    return best;
  })();

  // Controls that are NOT inside a repeated record row. Row actions are not
  // calls to action, and counting them misclassifies app pages as landing pages.
  var standaloneCtas = all('a[class], button').filter(function (el) {
    var t = (el.textContent || '').trim();
    if (!t.length || t.length >= 32) return false;
    var p = el.parentElement, depth = 0;
    while (p && depth < 4) {
      var sibs = Array.prototype.slice.call(p.children).filter(visible);
      if (sibs.length >= 3 && sibs.filter(function (s2) {
        return s2.querySelector('button, a[class], [role="button"]');
      }).length >= 3) return false;
      p = p.parentElement; depth++;
    }
    return true;
  }).length;

  // Repeated structure with no controls at all. A read-only data list is still
  // a task surface — controls are one way of showing repetition, not the
  // definition of it. An 11-row queue view with zero buttons is an operate page.
  var repeatedShape = (function () {
    var best = 0;
    all('*').forEach(function (parent) {
      var kids = Array.prototype.slice.call(parent.children).filter(visible);
      if (kids.length < 4) return;
      // Signature is the child's own tag skeleton — same shape repeated is the
      // signal, whatever it contains.
      var sig = kids.map(function (k) {
        return Array.prototype.slice.call(k.children)
          .map(function (c) { return c.tagName; }).join('>') || k.tagName;
      });
      var same = sig.filter(function (x) { return x === sig[0]; }).length;
      // Uniform height as well: a repeated shape that varies wildly in size is
      // a page of sections, not a list of records.
      var heights = kids.map(function (k) { return Math.round(k.getBoundingClientRect().height); });
      var uniform = heights.filter(function (h) { return Math.abs(h - heights[0]) <= 8; }).length;

      // Stacked, not side by side. Without this a five-card feature grid on a
      // marketing page read as five rows of records and classified the page
      // operate at 0.8, switching off 21 rules that exist for exactly that
      // page. Records are a list going down; feature cards sit in a row.
      // Records shown as cards still stack into rows, so each row of them
      // shares a top edge and the count still lands.
      var tops = {};
      kids.forEach(function (k) { tops[Math.round(k.getBoundingClientRect().top)] = 1; });
      var stacked = Object.keys(tops).length >= kids.length * 0.8;

      if (stacked && same >= kids.length * 0.8 && uniform >= kids.length * 0.8) {
        best = Math.max(best, kids.length);
      }
    });
    return best;
  })();

  // A page that is mostly one form is an operate surface even with no rows.
  var labelled = all('label').length;
  var submits  = all('button[type=submit], input[type=submit]').length;

  // --- persuade: the page is selling something ---
  var h1       = all('h1').length;
  var ctas     = standaloneCtas;
  var pricing  = /\\b(pricing|per month|\\/mo\\b|free trial|get started|book a demo|sign up)\\b/i
                   .test(textLen(body) ? body.innerText : '');
  var hero     = (function () {
    var first = body.querySelector('main > *, body > section, body > div > section');
    if (!first || !visible(first)) return false;
    return first.getBoundingClientRect().height / window.innerHeight > 0.6;
  })();
  var testimonial = all('blockquote, [class*="testimonial"], [class*="quote"]').length;
  var logoWall = all('[class*="logo"] img, [class*="logos"] img').length;

  // --- read: the page is prose ---
  var paras    = all('p').length;
  var prose    = all('p').reduce(function (n, p) { return n + textLen(p); }, 0);
  var headings = all('h2, h3').length;
  var lists    = all('article ol, article ul, main ol, main ul').length;
  var article  = all('article, [role="article"], [class*="prose"], [class*="markdown"]').length;
  var codeBlk  = all('pre, pre code').length;
  var toc      = all('[class*="toc"], [class*="table-of-contents"], nav[aria-label*="content" i]').length;
  var total    = textLen(body);

  return {
    inputs: inputs, buttons: buttons, tables: tables, rows: rows, tabs: tabs,
    menus: menus, toggles: toggles, sidebar: sidebar, toolbars: toolbars, authish: authish,
    recordRows: recordRows, repeatedShape: repeatedShape, labelled: labelled, submits: submits,
    h1: h1, ctas: ctas, pricing: pricing, hero: hero, testimonial: testimonial, logoWall: logoWall,
    paras: paras, prose: prose, headings: headings, lists: lists, article: article,
    codeBlk: codeBlk, toc: toc, total: total,
  };
}`;
}

export interface SurfaceSignals {
  inputs: number; buttons: number; tables: number; rows: number; tabs: number;
  menus: number; toggles: number; sidebar: number; toolbars: number; authish: number;
  recordRows: number; repeatedShape: number; labelled: number; submits: number;
  h1: number; ctas: number; pricing: boolean; hero: boolean;
  testimonial: number; logoWall: number;
  paras: number; prose: number; headings: number; lists: number;
  article: number; codeBlk: number; toc: number; total: number;
}

/**
 * Score each surface from the signals and pick the winner.
 *
 * Weights are deliberately blunt. This decides which rules run, so a
 * near-tie must produce low confidence and leave every rule on rather than
 * quietly disabling a third of the corpus on a guess.
 */
export function classify(s: SurfaceSignals): SurfaceVerdict {
  const reasons: Record<Surface, string[]> = { persuade: [], operate: [], read: [] };
  let operate = 0;
  let persuade = 0;
  let read = 0;

  // operate — controls, data, and a task chrome
  //
  // recordRows and a labelled form are the two shapes marketing pages never
  // have. They are weighted to win on their own, because a list of records or
  // a page that is one form is an operate surface whatever else is present.
  if (s.recordRows >= 3) {
    operate += 4;
    reasons.operate.push(`${s.recordRows} rows with identical per-row controls`);
  }
  if (s.labelled >= 4 && s.submits >= 1) {
    operate += 4;
    reasons.operate.push(`a ${s.labelled}-field labelled form`);
  }
  if (s.recordRows < 3 && s.repeatedShape >= 5) {
    operate += 3.5;
    reasons.operate.push(`${s.repeatedShape} rows of identical structure`);
  }
  if (s.tables > 0 && s.rows >= 5) { operate += 3; reasons.operate.push(`${s.rows} data rows`); }
  if (s.inputs >= 4) { operate += 2.5; reasons.operate.push(`${s.inputs} form controls`); }
  if (s.sidebar > 0) { operate += 2; reasons.operate.push('side navigation'); }
  if (s.tabs > 0) { operate += 1.5; reasons.operate.push('tabs'); }
  if (s.toolbars > 0) { operate += 1.5; reasons.operate.push('toolbar'); }
  if (s.menus >= 2) { operate += 1; reasons.operate.push('menus'); }
  if (s.toggles >= 3) { operate += 1; reasons.operate.push(`${s.toggles} toggles`); }
  if (s.authish > 0) { operate += 1; reasons.operate.push('account chrome'); }
  if (s.buttons >= 12) { operate += 1; reasons.operate.push(`${s.buttons} buttons`); }

  // persuade — a hero, a pitch, and a call to action
  if (s.hero) { persuade += 2.5; reasons.persuade.push('full-height opener'); }
  if (s.pricing) { persuade += 2; reasons.persuade.push('pricing or signup language'); }
  if (s.testimonial > 0) { persuade += 1.5; reasons.persuade.push('testimonial'); }
  if (s.logoWall >= 3) { persuade += 1.5; reasons.persuade.push('logo wall'); }
  // Only counts standalone calls to action — row actions are excluded above.
  // A page with almost no content is not evidence of a landing page: an empty
  // list and a hero look alike.
  if (s.h1 === 1 && s.ctas >= 2 && s.prose < 2500 && s.recordRows < 3 && s.total > 600) {
    persuade += 2;
    reasons.persuade.push('single headline with repeated CTAs and little prose');
  }

  // read — sustained prose with structure
  if (s.prose > 4000) { read += 3; reasons.read.push(`${Math.round(s.prose / 1000)}k characters of prose`); }
  else if (s.prose > 2000) { read += 1.5; reasons.read.push('substantial prose'); }
  if (s.article > 0) { read += 2; reasons.read.push('article or prose container'); }
  if (s.headings >= 5 && s.paras >= 10) { read += 2; reasons.read.push('many headings over many paragraphs'); }
  if (s.toc > 0) { read += 1.5; reasons.read.push('table of contents'); }
  if (s.codeBlk >= 3) { read += 1; reasons.read.push('code blocks'); }

  const scored: Array<[Surface, number]> = [
    ['operate', operate],
    ['persuade', persuade],
    ['read', read],
  ];
  scored.sort((a, b) => b[1] - a[1]);

  const [winner, top] = scored[0]!;
  const runnerUp = scored[1]![1];

  // Confidence is about the *margin*, not the raw score. A page scoring 6-5 is
  // genuinely ambiguous however strong the evidence looks in isolation.
  let confidence = 0;
  if (top > 0) {
    const margin = (top - runnerUp) / top;
    confidence = Math.min(1, (top / 6) * 0.5 + margin * 0.5);
    // A signal no other surface can produce settles it on its own. A page with
    // per-row controls or a labelled form is not a landing page, whatever else
    // the raw totals say.
    if (winner === 'operate' && (s.recordRows >= 3 || s.repeatedShape >= 5 ||
        (s.labelled >= 4 && s.submits >= 1))) {
      confidence = Math.max(confidence, 0.8);
    }
  }

  const density = {
    rows: Math.max(s.recordRows, s.repeatedShape, s.rows),
    controls: s.inputs + s.buttons,
    characters: s.total,
  };
  // A page with almost nothing on it cannot be classified, and saying so is a
  // different message from "we could not decide".
  const sparse = density.rows < 3 && density.controls < 4 && density.characters < 1200;

  return {
    surface: winner,
    confidence: Number(confidence.toFixed(2)),
    signals: reasons[winner].slice(0, 4),
    density,
    sparse,
  };
}

/** Below this the detection is not trusted and no rule is gated. */
export const MIN_SURFACE_CONFIDENCE = 0.6;
