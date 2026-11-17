/**
 * The browser-side detector bundle.
 *
 * The libraries and checks under detectors/ are plain strings, concatenated
 * here and evaluated inside the page, so they cannot close over anything from
 * the Node side and must stay dependency-free. Each check module adds its
 * entries to one shared CHECKS table, and helpers are visible across modules
 * because everything ends up in a single function body. The function receives
 * the render matchers from the corpus and returns raw hits keyed by rule id.
 *
 * This is the channel that distinguishes redpen from a linter: it reads
 * getComputedStyle, so a tell reaches it identically whether it was written
 * as a Tailwind class, a CSS-in-JS object, a theme variable, or injected after
 * hydration.
 */

import { OKLCH_LIB, CONTRAST_LIB, HELPERS_LIB } from './detectors/lib.js';
import { COLOR_CHECKS } from './detectors/color.js';
import { TYPOGRAPHY_CHECKS } from './detectors/typography.js';
import { LAYOUT_CHECKS } from './detectors/layout.js';
import { MOTION_CHECKS } from './detectors/motion.js';
import { DEPTH_CHECKS } from './detectors/depth.js';
import { INTERACTION_CHECKS } from './detectors/interaction.js';
import { CHROME_CHECKS } from './detectors/chrome.js';
import { TOKEN_CHECKS } from './detectors/tokens.js';
import { CATALOGUE_CHECKS } from './detectors/catalogue.js';
import { WCAG_CHECKS } from './detectors/wcag.js';

export interface DetectorSpec {
  ruleId: string;
  check: string;
  params: Record<string, unknown>;
  minHits: number;
}

export interface DetectorHit {
  ruleId: string;
  selector: string;
  excerpt: string;
}

/**
 * Returned as a string and passed to page.evaluate. Written as a function
 * body rather than an imported module because Playwright serialises the
 * function, and any import would be undefined by the time it runs.
 */
export function detectorSource(): string {
  return `(specs) => {
${OKLCH_LIB}
${CONTRAST_LIB}
${HELPERS_LIB}
  var CHECKS = {};
${COLOR_CHECKS}
${TYPOGRAPHY_CHECKS}
${LAYOUT_CHECKS}
${MOTION_CHECKS}
${DEPTH_CHECKS}
${INTERACTION_CHECKS}
${CHROME_CHECKS}
${TOKEN_CHECKS}
${CATALOGUE_CHECKS}
${WCAG_CHECKS}

  const hits = [];
  const byCheck = {};
  for (const spec of specs) {
    (byCheck[spec.check] = byCheck[spec.check] || []).push(spec);
  }

  for (const name in byCheck) {
    const fn = CHECKS[name];
    if (!fn) continue;
    for (const spec of byCheck[name]) {
      let found = [];
      try {
        found = fn(spec.params || {}) || [];
      } catch (err) {
        // A detector that throws must not take the whole run with it. Report
        // the failure as a hit against a reserved id so it is visible.
        hits.push({
          ruleId: '__detector_error__',
          selector: name,
          excerpt: String((err && err.message) || err).slice(0, 160),
        });
        continue;
      }
      if (found.length < (spec.minHits || 1)) continue;
      for (const f of found.slice(0, 12)) {
        hits.push({ ruleId: spec.ruleId, selector: f.selector, excerpt: f.excerpt });
      }
    }
  }
  return hits;
}`;
}
