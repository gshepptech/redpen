/**
 * The browser-side detector bundle.
 *
 * Everything below the `DETECTOR_SOURCE` boundary is stringified and evaluated
 * inside the page, so it cannot close over anything from the Node side and must
 * stay dependency-free. It receives the render matchers from the corpus and
 * returns raw hits keyed by rule id.
 *
 * This is the channel that distinguishes redpen from a linter: it reads
 * `getComputedStyle`, so a tell reaches it identically whether it was written
 * as a Tailwind class, a CSS-in-JS object, a theme variable, or injected after
 * hydration.
 */

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
 * Returned as a string and passed to `page.evaluate`. Written as a function
 * body rather than an imported module because Playwright serialises the
 * function, and any import would be undefined by the time it runs.
 */
export function detectorSource(): string {
  return `(specs) => {
${OKLCH_LIB}
${CONTRAST_LIB}
${HELPERS_LIB}
${CHECKS_LIB}

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

/* ------------------------------------------------------------------ *
 * Colour science. sRGB -> linear -> OKLab -> OKLCH.
 * ------------------------------------------------------------------ */
const OKLCH_LIB = `
  function parseColor(str) {
    if (!str) return null;
    var m = /rgba?\\(([^)]+)\\)/.exec(str);
    if (!m) return null;
    var parts = m[1].split(/[\\s,\\/]+/).filter(Boolean).map(parseFloat);
    if (parts.length < 3) return null;
    var a = parts.length > 3 ? parts[3] : 1;
    return { r: parts[0], g: parts[1], b: parts[2], a: isNaN(a) ? 1 : a };
  }

  function srgbToLinear(c) {
    c = c / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  function toOklch(rgb) {
    if (!rgb) return null;
    var r = srgbToLinear(rgb.r), g = srgbToLinear(rgb.g), b = srgbToLinear(rgb.b);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    var L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
    var A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
    var B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
    var C = Math.sqrt(A * A + B * B);
    var H = (Math.atan2(B, A) * 180) / Math.PI;
    if (H < 0) H += 360;
    return { l: L, c: C, h: H, alpha: rgb.a };
  }

  function inHueBand(oklch, range, minChroma) {
    if (!oklch || oklch.c < (minChroma || 0)) return false;
    var lo = range[0], hi = range[1];
    return lo <= hi ? (oklch.h >= lo && oklch.h <= hi)
                    : (oklch.h >= lo || oklch.h <= hi);
  }
`;

const CONTRAST_LIB = `
  function relLuminance(rgb) {
    var r = srgbToLinear(rgb.r), g = srgbToLinear(rgb.g), b = srgbToLinear(rgb.b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function contrastRatio(fg, bg) {
    var l1 = relLuminance(fg), l2 = relLuminance(bg);
    var hi = Math.max(l1, l2), lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  }

  // Walk up for the first non-transparent background. Alpha-compositing a
  // semi-transparent card over its parent is what makes muted-text-on-tinted-
  // surface failures so easy to miss.
  function effectiveBackground(el) {
    var node = el;
    var stack = [];
    while (node && node !== document.documentElement.parentNode) {
      var bg = parseColor(getComputedStyle(node).backgroundColor);
      if (bg && bg.a > 0) {
        stack.push(bg);
        if (bg.a >= 0.999) break;
      }
      node = node.parentElement;
    }
    if (!stack.length) return { r: 255, g: 255, b: 255, a: 1 };
    var out = stack[stack.length - 1];
    for (var i = stack.length - 2; i >= 0; i--) {
      var top = stack[i];
      out = {
        r: top.r * top.a + out.r * (1 - top.a),
        g: top.g * top.a + out.g * (1 - top.a),
        b: top.b * top.a + out.b * (1 - top.a),
        a: 1,
      };
    }
    return out;
  }
`;

const HELPERS_LIB = `
  function visible(el) {
    var s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function selectorFor(el) {
    if (!el || el === document.body) return 'body';
    if (el.id) return '#' + el.id;
    var parts = [];
    var node = el;
    var depth = 0;
    while (node && node.nodeType === 1 && node !== document.body && depth < 4) {
      var part = node.tagName.toLowerCase();
      var cls = (node.getAttribute('class') || '')
        .split(/\\s+/).filter(Boolean).slice(0, 2).join('.');
      if (cls) part += '.' + cls;
      parts.unshift(part);
      node = node.parentElement;
      depth++;
    }
    return parts.join(' > ').slice(0, 120);
  }

  function textOf(el) {
    return (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 80);
  }

  function all(sel) {
    return Array.prototype.slice.call(document.querySelectorAll(sel || '*')).filter(visible);
  }

  function hit(el, excerpt) {
    return { selector: selectorFor(el), excerpt: String(excerpt).slice(0, 160) };
  }

  function area(el) {
    var r = el.getBoundingClientRect();
    return Math.max(0, r.width) * Math.max(0, r.height);
  }

  function viewportArea() {
    return window.innerWidth * Math.max(window.innerHeight, document.documentElement.scrollHeight);
  }

  function isTextBearing(el) {
    if (!el.childNodes) return false;
    for (var i = 0; i < el.childNodes.length; i++) {
      var n = el.childNodes[i];
      if (n.nodeType === 3 && n.textContent.trim().length > 1) return true;
    }
    return false;
  }

  // Layout sections only. A decorative svg or a stray img is a child of body on
  // plenty of pages and would otherwise skew every rhythm measurement.
  var NON_SECTION = { SVG: 1, IMG: 1, SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, CANVAS: 1, TEMPLATE: 1, LINK: 1 };

  function topLevelSections() {
    var main = document.querySelector('main') || document.body;
    return Array.prototype.slice.call(main.children).filter(function (el) {
      if (NON_SECTION[String(el.tagName).toUpperCase()]) return false;
      return visible(el) && el.getBoundingClientRect().height > 80;
    });
  }

  function bodySections() {
    return topLevelSections().filter(function (el) {
      var t = el.tagName;
      return t !== 'NAV' && t !== 'HEADER' && t !== 'FOOTER';
    });
  }

  function isInteractive(el) {
    var tag = el.tagName.toLowerCase();
    if (tag === 'a' || tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea') return true;
    var role = el.getAttribute('role');
    if (role && /button|link|menuitem|tab|checkbox|switch/.test(role)) return true;
    return el.hasAttribute('tabindex') && el.getAttribute('tabindex') !== '-1';
  }

  function coefficientOfVariation(values) {
    if (values.length < 2) return 1;
    var mean = values.reduce(function (a, b) { return a + b; }, 0) / values.length;
    if (mean === 0) return 0;
    var variance = values.reduce(function (a, b) { return a + Math.pow(b - mean, 2); }, 0) / values.length;
    return Math.sqrt(variance) / mean;
  }
`;

/* ------------------------------------------------------------------ *
 * The checks themselves. One entry per `render.check` name in the corpus.
 * ------------------------------------------------------------------ */
const CHECKS_LIB = `
  var CHECKS = {};

  CHECKS['hue-band-share'] = function (p) {
    var range = p.hueRange || [265, 305];
    var minChroma = p.minChroma || 0.1;
    var minShare = p.minAreaShare || 0.03;
    var total = viewportArea();
    var accum = 0;
    var examples = [];
    all('*').forEach(function (el) {
      var s = getComputedStyle(el);
      var bg = toOklch(parseColor(s.backgroundColor));
      if (bg && bg.alpha > 0.2 && inHueBand(bg, range, minChroma)) {
        accum += area(el);
        if (examples.length < 8) examples.push(hit(el, 'background ' + s.backgroundColor));
      }
      var fg = toOklch(parseColor(s.color));
      if (fg && isTextBearing(el) && inHueBand(fg, range, minChroma)) {
        if (examples.length < 8) examples.push(hit(el, 'text ' + s.color));
      }
    });
    if (!examples.length) return [];
    if (accum / total < minShare && examples.length < 3) return [];
    return examples;
  };

  CHECKS['clipped-gradient-text'] = function () {
    return all('*').filter(function (el) {
      var s = getComputedStyle(el);
      var clip = s.webkitBackgroundClip || s.backgroundClip;
      return clip === 'text' && /gradient/.test(s.backgroundImage) && isTextBearing(el);
    }).map(function (el) { return hit(el, textOf(el)); });
  };

  CHECKS['gradient-hue-span'] = function (p) {
    var minSpan = p.minHueSpan || 40;
    var involving = p.involvingHueRange;
    return all('*').filter(function (el) {
      var img = getComputedStyle(el).backgroundImage;
      if (!/gradient/.test(img)) return false;
      var colors = (img.match(/rgba?\\([^)]+\\)/g) || []).map(function (c) {
        return toOklch(parseColor(c));
      }).filter(function (c) { return c && c.c > 0.03; });
      if (colors.length < 2) return false;
      var hues = colors.map(function (c) { return c.h; });
      var span = Math.max.apply(null, hues) - Math.min.apply(null, hues);
      if (span > 180) span = 360 - span;
      if (span < minSpan) return false;
      if (involving) {
        return colors.some(function (c) { return inHueBand(c, involving, 0.05); });
      }
      return true;
    }).map(function (el) { return hit(el, getComputedStyle(el).backgroundImage.slice(0, 120)); });
  };

  CHECKS['warm-neutral-ground'] = function (p) {
    var body = toOklch(effectiveBackground(document.body));
    if (!body) return [];
    var lightOk = body.l >= (p.lightnessMin || 0.93);
    var cr = p.chromaRange || [0.008, 0.035];
    var chromaOk = body.c >= cr[0] && body.c <= cr[1];
    var hueOk = inHueBand(body, p.hueRange || [60, 110], cr[0]);
    if (!(lightOk && chromaOk && hueOk)) return [];
    if (p.requiresSerifDisplay) {
      var headings = all('h1, h2, .hero__title, [class*="display"]');
      var serif = headings.some(function (h) {
        return /serif|georgia|garamond|fraunces|playfair|cormorant|spectral|instrument/i
          .test(getComputedStyle(h).fontFamily);
      });
      if (!serif) return [];
    }
    return [hit(document.body, 'cream ground L=' + body.l.toFixed(2) + ' C=' + body.c.toFixed(3) + ' H=' + body.h.toFixed(0))];
  };

  CHECKS['unmixed-extremes'] = function (p) {
    var minShare = p.minAreaShare || 0.25;
    var total = viewportArea();
    var accum = 0;
    var examples = [];
    all('*').forEach(function (el) {
      var bg = parseColor(getComputedStyle(el).backgroundColor);
      if (!bg || bg.a < 0.9) return;
      var pure = (bg.r === 0 && bg.g === 0 && bg.b === 0) || (bg.r === 255 && bg.g === 255 && bg.b === 255);
      if (!pure) return;
      accum += area(el);
      if (examples.length < 4) examples.push(hit(el, getComputedStyle(el).backgroundColor));
    });
    return accum / total >= minShare ? examples : [];
  };

  CHECKS['neutral-chroma-floor'] = function (p) {
    var min = p.minChroma || 0.005;
    var seen = {};
    all('*').forEach(function (el) {
      var s = getComputedStyle(el);
      [s.backgroundColor, s.color].forEach(function (c) {
        var ok = toOklch(parseColor(c));
        if (!ok || ok.alpha < 0.5) return;
        if (ok.c < min) seen[c] = (seen[c] || 0) + 1;
      });
    });
    var keys = Object.keys(seen);
    if (keys.length < (p.minDistinctNeutrals || 3)) return [];
    return [hit(document.body, keys.slice(0, 6).join(', ') + ' (zero chroma)')];
  };

  CHECKS['contrast-threshold'] = function (p) {
    var out = [];
    all('*').forEach(function (el) {
      if (!isTextBearing(el)) return;
      var s = getComputedStyle(el);
      var fg = parseColor(s.color);
      if (!fg || fg.a < 0.1) return;
      var bg = effectiveBackground(el);
      var size = parseFloat(s.fontSize);
      var weight = parseInt(s.fontWeight, 10) || 400;
      var large = size >= (p.largePx || 24) || (weight >= 700 && size >= (p.largeBoldPx || 18));
      var need = large ? (p.largeRatio || 3) : (p.bodyRatio || 4.5);
      var ratio = contrastRatio(fg, bg);
      if (ratio < need) {
        out.push(hit(el, ratio.toFixed(2) + ':1 needs ' + need + ':1 — "' + textOf(el) + '"'));
      }
    });
    return out;
  };

  CHECKS['neutral-text-on-chromatic-ground'] = function (p) {
    return all('*').filter(function (el) {
      if (!isTextBearing(el)) return false;
      var fg = toOklch(parseColor(getComputedStyle(el).color));
      var bg = toOklch(effectiveBackground(el));
      if (!fg || !bg) return false;
      return bg.c >= (p.minGroundChroma || 0.04) && fg.c <= (p.maxTextChroma || 0.01);
    }).map(function (el) { return hit(el, 'grey text on chromatic ground: "' + textOf(el) + '"'); });
  };

  CHECKS['chromatic-glow-shadow'] = function (p) {
    var minBlur = p.minBlur || 16;
    return all('*').filter(function (el) {
      var s = getComputedStyle(el);
      var shadows = s.boxShadow + ' ' + s.textShadow;
      if (shadows === 'none none' || !/\\d/.test(shadows)) return false;
      var m = /rgba?\\([^)]+\\)\\s+(-?[\\d.]+)px\\s+(-?[\\d.]+)px\\s+([\\d.]+)px/.exec(shadows);
      if (!m) return false;
      var ox = parseFloat(m[1]), oy = parseFloat(m[2]), blur = parseFloat(m[3]);
      if (blur < minBlur) return false;
      if (p.requiresZeroOffset && (Math.abs(ox) > 2 || Math.abs(oy) > 2)) return false;
      var col = toOklch(parseColor(shadows));
      return !!col && col.c >= (p.minShadowChroma || 0.05);
    }).map(function (el) { return hit(el, getComputedStyle(el).boxShadow.slice(0, 120)); });
  };

  CHECKS['blurred-decorative-blob'] = function (p) {
    var total = viewportArea();
    return all('*').filter(function (el) {
      var s = getComputedStyle(el);
      var m = /blur\\(([\\d.]+)px\\)/.exec(s.filter);
      if (!m || parseFloat(m[1]) < (p.minBlurPx || 40)) return false;
      if (textOf(el).length > 0) return false;
      return area(el) / total >= (p.minAreaShare || 0.08);
    }).map(function (el) { return hit(el, 'blurred decorative element ' + getComputedStyle(el).filter); });
  };

  CHECKS['off-token-color'] = function (p) {
    var seen = {};
    all('*').forEach(function (el) {
      var s = getComputedStyle(el);
      [s.color, s.backgroundColor, s.borderTopColor].forEach(function (c) {
        var col = parseColor(c);
        if (col && col.a > 0.05) seen[c] = (seen[c] || 0) + 1;
      });
    });
    var keys = Object.keys(seen);
    if (keys.length <= (p.maxDistinctColors || 14)) return [];
    return [hit(document.body, keys.length + ' distinct colours in use (ceiling ' + (p.maxDistinctColors || 14) + ')')];
  };

  CHECKS['single-family-default'] = function (p) {
    var defaults = (p.defaults || []).map(function (d) { return d.toLowerCase(); });
    var families = {};
    var total = 0;
    all('*').forEach(function (el) {
      if (!isTextBearing(el)) return;
      var f = getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
      if (!f) return;
      families[f] = (families[f] || 0) + 1;
      total++;
    });
    var keys = Object.keys(families);
    if (!keys.length) return [];

    // Measure by share, not by count of distinct names. One stray element
    // inheriting a UA default should not excuse a page set entirely in Inter.
    var dominant = keys[0];
    keys.forEach(function (k) { if (families[k] > families[dominant]) dominant = k; });
    if (families[dominant] / total < (p.minDominantShare || 0.8)) return [];
    if (!defaults.some(function (d) { return dominant.indexOf(d) !== -1; })) return [];

    // A display face carrying the headings means a decision was made, even if
    // the body is a default.
    var display = all('h1, h2, [class*="title"], [class*="display"]').some(function (h) {
      var f = getComputedStyle(h).fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
      return f && f !== dominant;
    });
    if (display) return [];

    return [hit(document.body, Math.round((families[dominant] / total) * 100) + '% of text set in ' + dominant)];
  };

  CHECKS['family-count'] = function (p) {
    var families = {};
    all('*').forEach(function (el) {
      if (!isTextBearing(el)) return;
      var f = getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
      if (f) families[f] = (families[f] || 0) + 1;
    });
    var keys = Object.keys(families);
    if (keys.length <= (p.max || 3)) return [];
    return [hit(document.body, keys.length + ' families: ' + keys.join(', '))];
  };

  CHECKS['italic-heading'] = function () {
    var out = [];
    all('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="display"], [class*="hero"]').forEach(function (el) {
      if (getComputedStyle(el).fontStyle === 'italic') { out.push(hit(el, 'italic: "' + textOf(el) + '"')); return; }
      var inner = el.querySelectorAll('em, i, [class*="italic"]');
      for (var i = 0; i < inner.length; i++) {
        if (getComputedStyle(inner[i]).fontStyle === 'italic') {
          out.push(hit(el, 'italic word inside heading: "' + textOf(el) + '"'));
          return;
        }
      }
    });
    return out;
  };

  CHECKS['type-scale-spread'] = function (p) {
    var sizes = {};
    all('*').forEach(function (el) {
      if (!isTextBearing(el)) return;
      var px = Math.round(parseFloat(getComputedStyle(el).fontSize));
      if (px) sizes[px] = (sizes[px] || 0) + 1;
    });
    var keys = Object.keys(sizes).map(Number).sort(function (a, b) { return a - b; });
    if (!keys.length) return [];
    var body = keys.reduce(function (best, k) { return sizes[k] > sizes[best] ? k : best; }, keys[0]);
    var top = keys[keys.length - 1];
    var ratio = top / body;
    var problems = [];
    if (ratio < (p.minRatioTopToBody || 2.2)) {
      problems.push('largest type is only ' + ratio.toFixed(2) + 'x body');
    }
    if (keys.length < (p.minDistinctSizes || 4)) {
      problems.push('only ' + keys.length + ' distinct sizes');
    }
    return problems.length ? [hit(document.body, problems.join('; '))] : [];
  };

  CHECKS['measure-range'] = function (p) {
    // A narrow measure on a phone is the viewport, not a decision. Only judge
    // measure where the author actually had room to get it wrong.
    if (window.innerWidth < (p.minViewport || 900)) return [];

    return all('p, blockquote').filter(function (el) {
      // Direct text only. A <p> that is mostly nested elements is a layout
      // wrapper, and its box width says nothing about the line length.
      var direct = 0;
      for (var i = 0; i < el.childNodes.length; i++) {
        if (el.childNodes[i].nodeType === 3) direct += el.childNodes[i].textContent.trim().length;
      }
      if (direct < 120) return false;

      var ch = measureCh(el);
      return ch < (p.minCh || 45) || ch > (p.maxCh || 78);
    }).map(function (el) { return hit(el, 'measure ~' + Math.round(measureCh(el)) + 'ch'); });
  };

  // Width of the text box in characters. Uses the rendered width of a real
  // string rather than a fudge factor, because 0.5em is wrong by 30% on a
  // condensed or a monospaced face.
  var _chCache = {};
  function measureCh(el) {
    var s = getComputedStyle(el);
    var key = s.fontFamily + '|' + s.fontSize + '|' + s.fontWeight + '|' + s.letterSpacing;
    if (_chCache[key] === undefined) {
      var probe = document.createElement('span');
      probe.textContent = 'abcdefghijklmnopqrstuvwxyz';
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;';
      probe.style.font = s.font || (s.fontWeight + ' ' + s.fontSize + '/' + s.lineHeight + ' ' + s.fontFamily);
      probe.style.letterSpacing = s.letterSpacing;
      document.body.appendChild(probe);
      _chCache[key] = probe.getBoundingClientRect().width / 26;
      document.body.removeChild(probe);
    }
    var avg = _chCache[key] || parseFloat(s.fontSize) * 0.5;
    var box = el.getBoundingClientRect().width
      - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
    return box / avg;
  }

  CHECKS['leading-ratio'] = function (p) {
    return all('p, li, h1, h2, h3, h4').filter(function (el) {
      if (!isTextBearing(el)) return false;
      var s = getComputedStyle(el);
      var size = parseFloat(s.fontSize);
      var lh = s.lineHeight === 'normal' ? size * 1.2 : parseFloat(s.lineHeight);
      if (!size || !lh) return false;

      // A heading is display type at any size — tight leading is correct there,
      // and judging a 22px h2 by the body rule flags good typography as bad.
      var isHeading = /^H[1-6]$/.test(el.tagName);
      var ratio = lh / size;

      if (isHeading || size >= 32) return ratio > (p.maxDisplayRatio || 1.35);

      // Single-line body elements have no leading to get wrong.
      if (el.getBoundingClientRect().height < size * 1.9) return false;
      return ratio < (p.minBodyRatio || 1.4);
    }).map(function (el) {
      var s = getComputedStyle(el);
      var size = parseFloat(s.fontSize);
      var lh = s.lineHeight === 'normal' ? size * 1.2 : parseFloat(s.lineHeight);
      return hit(el, 'leading ' + (lh / size).toFixed(2) + ' at ' + s.fontSize);
    });
  };

  CHECKS['font-size-floor'] = function (p) {
    return all('*').filter(function (el) {
      if (!isTextBearing(el)) return false;
      var px = parseFloat(getComputedStyle(el).fontSize);
      var floor = isInteractive(el) ? (p.uiFloorPx || 12) : (p.bodyFloorPx || 14);
      return px < floor;
    }).map(function (el) { return hit(el, getComputedStyle(el).fontSize + ' — "' + textOf(el) + '"'); });
  };

  CHECKS['tracking-bounds'] = function (p) {
    return all('*').filter(function (el) {
      if (!isTextBearing(el)) return false;
      var s = getComputedStyle(el);
      if (s.letterSpacing === 'normal') return false;
      var em = parseFloat(s.letterSpacing) / parseFloat(s.fontSize);
      return em < (p.minEm || -0.05) || em > (p.maxEm || 0.2);
    }).map(function (el) {
      var s = getComputedStyle(el);
      return hit(el, 'tracking ' + (parseFloat(s.letterSpacing) / parseFloat(s.fontSize)).toFixed(3) + 'em');
    });
  };

  CHECKS['uppercase-run-length'] = function (p) {
    return all('p, li, div, span').filter(function (el) {
      if (!isTextBearing(el)) return false;
      var s = getComputedStyle(el);
      var t = textOf(el);
      var isUpper = s.textTransform === 'uppercase' || (t.length > 10 && t === t.toUpperCase() && /[A-Z]/.test(t));
      return isUpper && t.length > (p.maxChars || 60);
    }).map(function (el) { return hit(el, textOf(el)); });
  };

  CHECKS['text-align-justify'] = function () {
    return all('p, li, div').filter(function (el) {
      return isTextBearing(el) && getComputedStyle(el).textAlign === 'justify';
    }).map(function (el) { return hit(el, textOf(el)); });
  };

  CHECKS['display-size-vs-viewport'] = function (p) {
    return all('h1, [class*="hero"] h1, [class*="display"]').filter(function (el) {
      var px = parseFloat(getComputedStyle(el).fontSize);
      return px / window.innerWidth > (p.maxShareOfViewportWidth || 0.14);
    }).map(function (el) {
      return hit(el, getComputedStyle(el).fontSize + ' at ' + window.innerWidth + 'px viewport');
    });
  };

  CHECKS['heading-order'] = function () {
    var headings = all('h1, h2, h3, h4, h5, h6');
    var out = [];
    var prev = 0;
    headings.forEach(function (el) {
      var level = parseInt(el.tagName.charAt(1), 10);
      if (prev && level > prev + 1) {
        out.push(hit(el, 'h' + prev + ' -> h' + level + ': "' + textOf(el) + '"'));
      }
      prev = level;
    });
    return out;
  };

  CHECKS['repeated-eyebrow'] = function (p) {
    var sections = topLevelSections();
    var withEyebrow = sections.filter(function (sec) {
      var first = sec.querySelector('p, span, div');
      if (!first) return false;
      var t = textOf(first);
      if (!t || t.length > 40) return false;
      var s = getComputedStyle(first);
      return s.textTransform === 'uppercase' || parseFloat(s.letterSpacing) > 1;
    });
    if (withEyebrow.length < (p.minSections || 3)) return [];
    return withEyebrow.map(function (el) { return hit(el, 'eyebrow: "' + textOf(el.querySelector('p, span, div')) + '"'); });
  };

  CHECKS['icon-above-heading-triptych'] = function (p) {
    var grids = all('*').filter(function (el) {
      var s = getComputedStyle(el);
      if (s.display !== 'grid') return false;
      var cols = s.gridTemplateColumns.split(' ').filter(Boolean).length;
      return cols === (p.exactColumns || 3);
    });
    var out = [];
    grids.forEach(function (grid) {
      var cards = Array.prototype.slice.call(grid.children);
      if (cards.length < 3) return;
      var matching = cards.filter(function (card) {
        var icon = card.querySelector('svg, img, i, [class*="icon"]');
        var heading = card.querySelector('h1,h2,h3,h4,h5,h6,[class*="title"]');
        if (!icon || !heading) return false;
        return icon.getBoundingClientRect().top < heading.getBoundingClientRect().top;
      });
      if (matching.length >= 3) out.push(hit(grid, matching.length + ' icon-above-heading cards in a 3-column grid'));
    });
    return out;
  };

  CHECKS['centered-axis-stack'] = function (p) {
    var hero = document.querySelector('header + section, main > section:first-child, [class*="hero"]') ||
               topLevelSections()[0];
    if (!hero) return [];
    var h = hero.getBoundingClientRect().height;
    if (h / window.innerHeight < (p.minHeroVh || 0.85)) return [];
    var centered = Array.prototype.slice.call(hero.querySelectorAll('h1, h2, p, a, button, span'))
      .filter(visible)
      .filter(function (el) {
        var s = getComputedStyle(el);
        if (s.textAlign === 'center') return true;
        var r = el.getBoundingClientRect();
        var mid = r.left + r.width / 2;
        return Math.abs(mid - window.innerWidth / 2) < 8;
      });
    if (centered.length < (p.minStackedCentered || 4)) return [];
    return [hit(hero, centered.length + ' elements on the same centred axis in a ' + Math.round(h / window.innerHeight * 100) + 'vh hero')];
  };

  CHECKS['nested-surface'] = function (p) {
    var signals = p.signals || ['borderRadius', 'boxShadow', 'borderWidth'];
    var minSignals = p.minSignals || 2;
    function isSurface(el) {
      var s = getComputedStyle(el);
      var n = 0;
      if (parseFloat(s.borderRadius) > 2) n++;
      if (s.boxShadow && s.boxShadow !== 'none') n++;
      if (parseFloat(s.borderTopWidth) > 0) n++;
      var bg = parseColor(s.backgroundColor);
      if (bg && bg.a > 0.02) n++;
      return n >= minSignals;
    }
    return all('*').filter(function (el) {
      if (!isSurface(el)) return false;
      var parent = el.parentElement;
      var depth = 0;
      while (parent && depth < 3) {
        if (isSurface(parent) && parent !== document.body) return true;
        parent = parent.parentElement;
        depth++;
      }
      return false;
    }).map(function (el) { return hit(el, 'surface nested inside another surface'); });
  };

  CHECKS['asymmetric-accent-border'] = function (p) {
    var min = p.minWidthPx || 3;
    return all('*').filter(function (el) {
      var s = getComputedStyle(el);
      var w = [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth].map(parseFloat);
      var thick = w.filter(function (x) { return x >= min; });
      if (thick.length !== 1) return false;
      var idx = w.indexOf(thick[0]);
      if (p.requiresSingleSide && idx !== 1 && idx !== 3) return false;
      var colors = [s.borderTopColor, s.borderRightColor, s.borderBottomColor, s.borderLeftColor];
      var c = toOklch(parseColor(colors[idx]));
      return !!c && c.c > 0.05;
    }).map(function (el) { return hit(el, 'side stripe ' + getComputedStyle(el).borderLeftWidth); });
  };

  CHECKS['section-rhythm-variance'] = function (p) {
    // Nav and footer have their own rhythm by convention, so including them
    // manufactures variance the reader never perceives.
    var sections = bodySections();
    if (sections.length < 3) return [];
    var pads = sections.map(function (s) {
      var cs = getComputedStyle(s);
      return parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    });
    var cv = coefficientOfVariation(pads);
    if (cv >= (p.minCoefficientOfVariation || 0.18)) return [];

    // The rule is "sections separated only by equal whitespace". A boundary
    // drawn with a rule or a colour shift is legible rhythm even when the
    // padding is uniform, so the tell does not apply.
    var drawn = sections.filter(function (s) {
      var cs = getComputedStyle(s);
      if (parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderBottomWidth) > 0) return true;
      var bg = parseColor(cs.backgroundColor);
      return !!bg && bg.a > 0.02;
    });
    if (drawn.length >= sections.length - 1) return [];

    return [hit(document.body, sections.length + ' sections all padded ~' + Math.round(pads[0]) + 'px with no drawn boundary (variance ' + cv.toFixed(3) + ')')];
  };

  CHECKS['horizontal-scroll'] = function () {
    var doc = document.documentElement;
    if (doc.scrollWidth <= window.innerWidth + 1) return [];
    var culprits = all('*').filter(function (el) {
      var r = el.getBoundingClientRect();
      return r.right > window.innerWidth + 1 || r.left < -1;
    }).slice(0, 6);
    var overflow = doc.scrollWidth - window.innerWidth;
    if (!culprits.length) return [hit(document.body, overflow + 'px of horizontal overflow at ' + window.innerWidth + 'px')];
    return culprits.map(function (el) {
      return hit(el, 'extends past the viewport at ' + window.innerWidth + 'px (page overflows by ' + overflow + 'px)');
    });
  };

  CHECKS['clipped-text'] = function (p) {
    var min = p.minOverflowPx || 2;
    return all('*').filter(function (el) {
      if (!isTextBearing(el)) return false;
      var s = getComputedStyle(el);
      if (s.overflow === 'visible' && s.overflowY === 'visible') return false;
      if (/ellipsis/.test(s.textOverflow)) return false;
      return el.scrollHeight > el.clientHeight + min || el.scrollWidth > el.clientWidth + min;
    }).map(function (el) { return hit(el, 'content clipped: "' + textOf(el) + '"'); });
  };

  CHECKS['edge-gutter'] = function (p) {
    var min = p.minGutterPx || 16;
    return all('p, h1, h2, h3, li').filter(function (el) {
      if (!isTextBearing(el)) return false;
      var r = el.getBoundingClientRect();
      return r.left < min || (window.innerWidth - r.right) < min;
    }).map(function (el) {
      var r = el.getBoundingClientRect();
      return hit(el, Math.round(Math.min(r.left, window.innerWidth - r.right)) + 'px from the viewport edge');
    });
  };

  CHECKS['control-padding-floor'] = function (p) {
    var minH = p.minHeightPx || 44;
    return all('button, a, input, select, [role="button"]').filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.height === 0) return false;

      // Off-canvas by design — skip links, focus-revealed controls. Their
      // resting geometry is not what the user ever touches.
      if (r.right < 0 || r.left > window.innerWidth) return false;

      var s = getComputedStyle(el);

      // A link is only a control when it is drawn as one. A styled anchor with
      // no fill, border, or radius is running text and has no height floor.
      if (el.tagName === 'A') {
        var bg = parseColor(s.backgroundColor);
        var painted = (bg && bg.a > 0.05) ||
                      parseFloat(s.borderTopWidth) > 0 ||
                      parseFloat(s.borderRadius) > 2;
        if (!painted) return false;
      }

      return r.height < minH || parseFloat(s.paddingLeft) < (p.minPaddingX || 12);
    }).map(function (el) {
      return hit(el, Math.round(el.getBoundingClientRect().height) + 'px tall — "' + textOf(el) + '"');
    });
  };

  CHECKS['sibling-control-height'] = function (p) {
    var max = p.maxDeltaPx || 2;
    var out = [];
    all('form, [class*="form"], [class*="input-group"]').forEach(function (form) {
      var controls = Array.prototype.slice.call(form.querySelectorAll('input, select, button'))
        .filter(visible)
        .filter(function (el) { return el.type !== 'checkbox' && el.type !== 'radio' && el.type !== 'hidden'; });
      if (controls.length < 2) return;
      var heights = controls.map(function (c) { return Math.round(c.getBoundingClientRect().height); });
      var span = Math.max.apply(null, heights) - Math.min.apply(null, heights);
      if (span > max) out.push(hit(form, 'control heights differ by ' + span + 'px: ' + heights.join(', ')));
    });
    return out;
  };

  CHECKS['flex-baseline-drift'] = function (p) {
    var max = p.maxDeltaPx || 3;
    var out = [];
    all('*').forEach(function (el) {
      var s = getComputedStyle(el);
      if (s.display !== 'flex' || s.flexDirection.indexOf('column') === 0) return;
      if (s.alignItems === 'center' || s.alignItems === 'baseline') return;
      var kids = Array.prototype.slice.call(el.children).filter(visible);
      if (kids.length < 2) return;
      var centers = kids.map(function (k) {
        var r = k.getBoundingClientRect();
        return r.top + r.height / 2;
      });
      var span = Math.max.apply(null, centers) - Math.min.apply(null, centers);
      if (span > max) out.push(hit(el, 'row items off-centre by ' + Math.round(span) + 'px (align-items: ' + s.alignItems + ')'));
    });
    return out;
  };

  CHECKS['duplicate-block-text'] = function (p) {
    var counts = {};
    all('p, h2, h3, li, span').forEach(function (el) {
      var t = textOf(el);
      if (t.length < (p.minLength || 24)) return;
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.keys(counts)
      .filter(function (t) { return counts[t] >= (p.minRepeats || 3); })
      .slice(0, 5)
      .map(function (t) { return { selector: 'body', excerpt: 'repeated ' + counts[t] + 'x: "' + t + '"' }; });
  };

  CHECKS['repeating-background-pattern'] = function (p) {
    var total = viewportArea();
    return all('*').filter(function (el) {
      var img = getComputedStyle(el).backgroundImage;
      if (!/repeating-(linear|radial)-gradient/.test(img)) return false;
      return area(el) / total >= (p.minAreaShare || 0.3);
    }).map(function (el) { return hit(el, getComputedStyle(el).backgroundImage.slice(0, 120)); });
  };

  CHECKS['uniform-entrance-animation'] = function (p) {
    var sections = topLevelSections();
    var animated = sections.filter(function (s) {
      var cs = getComputedStyle(s);
      if (cs.animationName !== 'none') return true;
      var inner = s.querySelector('[style*="opacity"], [class*="fade"], [class*="animate"], [data-aos]');
      return !!inner;
    });
    if (animated.length < (p.minAnimatedSections || 4)) return [];
    return [hit(document.body, animated.length + ' of ' + sections.length + ' sections carry an entrance animation')];
  };

  CHECKS['transition-property-all'] = function () {
    return all('*').filter(function (el) {
      var s = getComputedStyle(el);
      // "all" is the CSS initial value, so every element on every page reports
      // it. Only an element that actually transitions has made the mistake.
      if (s.transitionProperty !== 'all') return false;
      return parseFloat(s.transitionDuration) > 0;
    }).slice(0, 10).map(function (el) {
      return hit(el, 'transition: all ' + getComputedStyle(el).transitionDuration);
    });
  };

  CHECKS['uniform-hover-transform'] = function (p) {
    // Hover styles are not in the computed cascade at rest, so read the
    // stylesheets instead. Same-origin only; cross-origin sheets throw.
    var rules = [];
    for (var i = 0; i < document.styleSheets.length; i++) {
      try {
        var cssRules = document.styleSheets[i].cssRules;
        for (var j = 0; j < cssRules.length; j++) {
          var r = cssRules[j];
          if (r.selectorText && /:hover/.test(r.selectorText) && /scale\\(/.test(r.style.transform || '')) {
            rules.push({ sel: r.selectorText, transform: r.style.transform });
          }
        }
      } catch (e) { /* cross-origin stylesheet */ }
    }
    var byTransform = {};
    rules.forEach(function (r) { (byTransform[r.transform] = byTransform[r.transform] || []).push(r.sel); });
    var out = [];
    Object.keys(byTransform).forEach(function (t) {
      var sels = byTransform[t];
      if (sels.length >= (p.minElements || 4)) {
        out.push({ selector: sels.slice(0, 3).join(', '), excerpt: t + ' on ' + sels.length + ' distinct selectors' });
      }
    });
    return out;
  };

  CHECKS['overshoot-timing-function'] = function () {
    return all('*').filter(function (el) {
      var tf = getComputedStyle(el).transitionTimingFunction + ' ' + getComputedStyle(el).animationTimingFunction;
      var m = /cubic-bezier\\(([^)]+)\\)/.exec(tf);
      if (!m) return false;
      var nums = m[1].split(',').map(parseFloat);
      return nums.length === 4 && (nums[1] > 1.05 || nums[3] > 1.05);
    }).slice(0, 8).map(function (el) { return hit(el, getComputedStyle(el).transitionTimingFunction); });
  };

  CHECKS['layout-affecting-transition'] = function () {
    var layoutProps = /\\b(width|height|top|left|right|bottom|margin|padding)\\b/;
    return all('*').filter(function (el) {
      var tp = getComputedStyle(el).transitionProperty;
      return tp !== 'none' && tp !== 'all' && layoutProps.test(tp);
    }).slice(0, 10).map(function (el) { return hit(el, 'transition-property: ' + getComputedStyle(el).transitionProperty); });
  };

  CHECKS['reduced-motion-coverage'] = function () {
    var hasMotion = all('*').some(function (el) {
      var s = getComputedStyle(el);
      return s.animationName !== 'none' || (s.transitionDuration !== '0s' && s.transitionProperty !== 'none');
    });
    if (!hasMotion) return [];
    var covered = false;
    for (var i = 0; i < document.styleSheets.length; i++) {
      try {
        var rules = document.styleSheets[i].cssRules;
        for (var j = 0; j < rules.length; j++) {
          if (rules[j].conditionText && /prefers-reduced-motion/.test(rules[j].conditionText)) covered = true;
        }
      } catch (e) { /* cross-origin */ }
    }
    return covered ? [] : [hit(document.body, 'page animates with no prefers-reduced-motion block')];
  };

  CHECKS['infinite-small-pulse'] = function (p) {
    return all('*').filter(function (el) {
      var s = getComputedStyle(el);
      if (s.animationIterationCount !== 'infinite') return false;
      var r = el.getBoundingClientRect();
      return r.width <= (p.maxElementPx || 16) && r.height <= (p.maxElementPx || 16);
    }).map(function (el) { return hit(el, 'infinite animation on a ' + Math.round(el.getBoundingClientRect().width) + 'px element'); });
  };

  CHECKS['continuous-translate-loop'] = function () {
    return all('*').filter(function (el) {
      var s = getComputedStyle(el);
      if (s.animationIterationCount !== 'infinite') return false;
      if (parseFloat(s.animationDuration) <= 3) return false;
      // A slow infinite fade is a pulse, not a marquee. Require travel.
      return /translate|marquee|scroll/i.test(s.animationName + ' ' + s.transform);
    }).slice(0, 5).map(function (el) {
      var s = getComputedStyle(el);
      return hit(el, s.animationName + ' ' + s.animationDuration + ' infinite');
    });
  };

  CHECKS['focus-ring-transition'] = function () {
    var out = [];
    for (var i = 0; i < document.styleSheets.length; i++) {
      try {
        var rules = document.styleSheets[i].cssRules;
        for (var j = 0; j < rules.length; j++) {
          var r = rules[j];
          if (!r.selectorText || !/:focus/.test(r.selectorText)) continue;
          var t = r.style.transition || r.style.transitionProperty || '';
          if (/outline|box-shadow|all/.test(t)) {
            out.push({ selector: r.selectorText, excerpt: 'focus ring transitions: ' + t });
          }
        }
      } catch (e) { /* cross-origin */ }
    }
    return out;
  };

  CHECKS['radius-uniformity'] = function (p) {
    var radii = {};
    all('*').forEach(function (el) {
      var r = Math.round(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0);
      if (r > 0) radii[r] = (radii[r] || 0) + 1;
    });
    var keys = Object.keys(radii).map(Number);
    if (!keys.length) return [];
    var total = keys.reduce(function (a, k) { return a + radii[k]; }, 0);
    var max = Math.max.apply(null, keys);
    var shareAtMax = radii[max] / total;
    var problems = [];
    if (keys.length < (p.minDistinctRadii || 2)) problems.push('only one radius in use (' + max + 'px)');
    if (shareAtMax > (p.maxShareAtMaxRadius || 0.6)) {
      problems.push(Math.round(shareAtMax * 100) + '% of rounded elements use the largest radius');
    }
    return problems.length ? [hit(document.body, problems.join('; '))] : [];
  };

  CHECKS['shadow-uniformity'] = function (p) {
    var shadows = {};
    all('*').forEach(function (el) {
      var s = getComputedStyle(el).boxShadow;
      if (s && s !== 'none') shadows[s] = (shadows[s] || 0) + 1;
    });
    var keys = Object.keys(shadows);
    if (!keys.length) return [];
    var problems = [];
    if (keys.length > (p.maxDistinctShadows || 2)) problems.push(keys.length + ' distinct shadows');
    if (p.requiresNeutralShadow) {
      var neutral = keys.filter(function (k) {
        var c = toOklch(parseColor(k));
        return c && c.c < 0.01;
      });
      if (neutral.length) problems.push(neutral.length + ' untinted black shadow(s)');
    }
    return problems.length ? [hit(document.body, problems.join('; '))] : [];
  };

  CHECKS['border-and-shadow-double-edge'] = function () {
    return all('*').filter(function (el) {
      var s = getComputedStyle(el);
      var hasBorder = parseFloat(s.borderTopWidth) > 0 && parseFloat(s.borderTopWidth) <= 1.5;
      var hasWideShadow = /(\\d{2,})px/.test(s.boxShadow) && s.boxShadow !== 'none';
      return hasBorder && hasWideShadow;
    }).slice(0, 8).map(function (el) { return hit(el, 'hairline border + wide shadow on the same edge'); });
  };

  CHECKS['backdrop-blur-over-flat'] = function () {
    return all('*').filter(function (el) {
      var s = getComputedStyle(el);
      if (!/blur/.test(s.backdropFilter || s.webkitBackdropFilter || '')) return false;
      // Blur is only meaningful over content. If the thing behind is one flat
      // colour, the effect is invisible and only costs paint time.
      var behind = el.parentElement ? effectiveBackground(el.parentElement) : null;
      var parentHasContent = el.parentElement && el.parentElement.querySelectorAll('img, svg, video, canvas').length > 0;
      return !!behind && !parentHasContent;
    }).map(function (el) { return hit(el, 'backdrop-blur over a flat surface'); });
  };

  CHECKS['card-content-uniformity'] = function (p) {
    var out = [];
    all('*').forEach(function (grid) {
      var s = getComputedStyle(grid);
      if (s.display !== 'grid' && s.display !== 'flex') return;
      var cards = Array.prototype.slice.call(grid.children).filter(visible);
      if (cards.length < (p.minCards || 3)) return;

      // Only judge things drawn as cards. An <ol> of numbered steps is a
      // sequence — items of similar length there are a sign of good editing,
      // not of content written to fill a component.
      var cardish = cards.filter(function (c) {
        var cs = getComputedStyle(c);
        var bg = parseColor(cs.backgroundColor);
        return (bg && bg.a > 0.02) ||
               parseFloat(cs.borderTopWidth) > 0 && parseFloat(cs.borderLeftWidth) > 0 ||
               (cs.boxShadow && cs.boxShadow !== 'none');
      });
      if (cardish.length < cards.length) return;

      // Full text length, not the truncated excerpt — textOf caps at 80 chars,
      // which made every card of any real length look identical.
      var lengths = cards.map(function (c) {
        return (c.textContent || '').replace(/\\s+/g, ' ').trim().length;
      }).filter(function (l) { return l > 0; });
      if (lengths.length < cards.length) return;

      var cv = coefficientOfVariation(lengths);
      if (cv < (p.maxTextLengthVariance || 0.15)) {
        out.push(hit(grid, cards.length + ' cards with near-identical content length (variance ' + cv.toFixed(3) + ')'));
      }
    });
    return out;
  };

  CHECKS['chip-density'] = function (p) {
    var out = [];
    topLevelSections().forEach(function (sec) {
      var chips = Array.prototype.slice.call(sec.querySelectorAll('span, div')).filter(function (el) {
        if (!visible(el) || !isTextBearing(el)) return false;
        var s = getComputedStyle(el);
        var r = el.getBoundingClientRect();
        return parseFloat(s.borderRadius) >= r.height / 2 - 2 && r.height < 40 && textOf(el).length < 24;
      });
      if (chips.length > (p.maxChipsPerSection || 6)) {
        out.push(hit(sec, chips.length + ' chips in one section'));
      }
    });
    return out;
  };

  CHECKS['emoji-in-ui-slot'] = function () {
    var EMOJI = /[\\u{1F300}-\\u{1FAFF}\\u{2600}-\\u{27BF}\\u{2B00}-\\u{2BFF}]/u;
    return all('button, a, li, h1, h2, h3, h4, [class*="card"] > *, [class*="feature"] > *')
      .filter(function (el) {
        var t = textOf(el);
        return t.length > 0 && t.length < 60 && EMOJI.test(t);
      })
      .slice(0, 10)
      .map(function (el) { return hit(el, textOf(el)); });
  };

  CHECKS['icon-stroke-variance'] = function (p) {
    var widths = {};
    all('svg').forEach(function (svg) {
      var w = svg.getAttribute('stroke-width') ||
              (svg.querySelector('[stroke-width]') || {}).getAttribute?.('stroke-width') ||
              getComputedStyle(svg).strokeWidth;
      if (w && w !== '0px' && w !== 'none') widths[String(parseFloat(w))] = (widths[String(parseFloat(w))] || 0) + 1;
    });
    var keys = Object.keys(widths).filter(function (k) { return k !== 'NaN'; });
    if (keys.length <= (p.maxDistinctStrokeWidths || 1)) return [];
    return [hit(document.body, 'icon stroke widths in use: ' + keys.join(', '))];
  };

  CHECKS['icon-tile-above-heading'] = function (p) {
    var tiles = all('*').filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.width < 28 || r.width > 72) return false;
      if (Math.abs(r.width - r.height) > 4) return false;
      var s = getComputedStyle(el);
      if (parseFloat(s.borderRadius) < 4) return false;
      var bg = parseColor(s.backgroundColor);
      if (!bg || bg.a < 0.03) return false;
      // The glyph inside is often an emoji rather than an icon element, which
      // is the same component with a worse choice inside it.
      if (el.querySelector('svg, img, i')) return true;
      var t = textOf(el);
      return t.length > 0 && t.length <= 3;
    });
    if (tiles.length < (p.minInstances || 3)) return [];
    return tiles.slice(0, 6).map(function (el) { return hit(el, 'icon tile ' + Math.round(el.getBoundingClientRect().width) + 'px'); });
  };

  CHECKS['image-load-failure'] = function () {
    return Array.prototype.slice.call(document.images)
      .filter(function (img) { return img.complete && img.naturalWidth === 0; })
      .map(function (img) { return hit(img, 'failed to load: ' + img.getAttribute('src')); });
  };

  CHECKS['primitive-shape-cluster'] = function (p) {
    return all('svg').filter(function (svg) {
      var shapes = svg.querySelectorAll('circle, rect, ellipse, path[d]');
      if (shapes.length < (p.minShapes || 8)) return false;
      var kinds = {};
      Array.prototype.forEach.call(shapes, function (s) { kinds[s.tagName] = 1; });
      return Object.keys(kinds).length <= (p.maxDistinctShapeTypes || 3);
    }).map(function (svg) { return hit(svg, svg.querySelectorAll('circle, rect, ellipse, path').length + ' primitive shapes'); });
  };

  CHECKS['svg-accessible-name'] = function () {
    return all('svg').filter(function (svg) {
      if (svg.getAttribute('aria-hidden') === 'true') return false;
      if (svg.getAttribute('aria-label') || svg.getAttribute('aria-labelledby')) return false;
      if (svg.querySelector('title')) return false;
      return true;
    }).slice(0, 10).map(function (svg) { return hit(svg, 'inline svg with no accessible name and no aria-hidden'); });
  };

  CHECKS['img-alt-presence'] = function () {
    return Array.prototype.slice.call(document.images)
      .filter(function (img) { return !img.hasAttribute('alt'); })
      .map(function (img) { return hit(img, 'no alt attribute: ' + img.getAttribute('src')); });
  };

  CHECKS['duplicate-cta-label'] = function (p) {
    var counts = {};
    all('a, button').forEach(function (el) {
      var t = textOf(el).toLowerCase();
      if (t.length > 1 && t.length < 32) counts[t] = (counts[t] || 0) + 1;
    });
    return Object.keys(counts)
      .filter(function (t) { return counts[t] >= (p.minRepeats || 3); })
      .slice(0, 5)
      .map(function (t) { return { selector: 'a, button', excerpt: '"' + t + '" appears ' + counts[t] + ' times' }; });
  };

  CHECKS['empty-container'] = function () {
    return all('ul, ol, tbody, [role="list"]').filter(function (el) {
      return el.children.length === 0 && textOf(el).length === 0;
    }).map(function (el) { return hit(el, 'empty list container with no empty state'); });
  };

  CHECKS['hover-revealed-control'] = function () {
    var out = [];
    for (var i = 0; i < document.styleSheets.length; i++) {
      try {
        var rules = document.styleSheets[i].cssRules;
        for (var j = 0; j < rules.length; j++) {
          var r = rules[j];
          if (!r.selectorText || !/:hover/.test(r.selectorText)) continue;
          if (/opacity\\s*:\\s*1/.test(r.cssText) || /visibility\\s*:\\s*visible/.test(r.cssText)) {
            out.push({ selector: r.selectorText, excerpt: 'control only revealed on hover' });
          }
        }
      } catch (e) { /* cross-origin */ }
    }
    return out.slice(0, 8);
  };

  CHECKS['interactive-state-coverage'] = function (p) {
    var required = p.required || ['hover', 'focus-visible', 'active', 'disabled'];
    var covered = {};
    for (var i = 0; i < document.styleSheets.length; i++) {
      try {
        var rules = document.styleSheets[i].cssRules;
        for (var j = 0; j < rules.length; j++) {
          var sel = rules[j].selectorText || '';
          required.forEach(function (state) {
            if (sel.indexOf(':' + state) !== -1) covered[state] = true;
          });
        }
      } catch (e) { /* cross-origin */ }
    }
    var missing = required.filter(function (s) { return !covered[s]; });
    if (!missing.length) return [];
    return [hit(document.body, 'no styling found for: ' + missing.join(', '))];
  };

  CHECKS['nonsemantic-interactive'] = function () {
    return all('div, span').filter(function (el) {
      if (isInteractive(el)) return false;
      var s = getComputedStyle(el);
      return s.cursor === 'pointer';
    }).slice(0, 10).map(function (el) { return hit(el, 'cursor:pointer with no role or tabindex — "' + textOf(el) + '"'); });
  };

  CHECKS['skip-link-present'] = function () {
    var links = Array.prototype.slice.call(document.querySelectorAll('a[href^="#"]'));
    var found = links.some(function (a) { return /skip/i.test(a.textContent || ''); });
    return found ? [] : [hit(document.body, 'no skip-to-content link')];
  };

  CHECKS['nav-current-marker'] = function () {
    var navs = all('nav');
    if (!navs.length) return [];
    var marked = navs.filter(function (nav) {
      return nav.querySelector('[aria-current], .active, [data-active="true"], [class*="active"]');
    });
    return marked.length ? [] : navs.slice(0, 2).map(function (n) { return hit(n, 'no current-page indicator'); });
  };

  CHECKS['dialog-dismissal'] = function () {
    return all('[role="dialog"], dialog, [class*="modal"]').filter(function (el) {
      var hasClose = el.querySelector('[aria-label*="lose" i], [class*="close"], button[data-dismiss]');
      return !hasClose;
    }).map(function (el) { return hit(el, 'dialog with no visible close control'); });
  };

  CHECKS['html-lang-present'] = function () {
    var lang = document.documentElement.getAttribute('lang');
    return lang ? [] : [{ selector: 'html', excerpt: 'no lang attribute' }];
  };

  CHECKS['control-accessible-name'] = function () {
    return all('input, select, textarea').filter(function (el) {
      if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button') return false;
      if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return false;
      if (el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"]')) return false;
      if (el.closest('label')) return false;
      return true;
    }).map(function (el) { return hit(el, '<' + el.tagName.toLowerCase() + '> with no accessible name'); });
  };

  CHECKS['color-only-state'] = function () {
    return all('[class*="error"], [class*="success"], [class*="warning"], [aria-invalid="true"]')
      .filter(function (el) {
        var hasIcon = el.querySelector('svg, img, [class*="icon"]');
        var hasText = textOf(el).length > 2;
        return !hasIcon && !hasText;
      })
      .map(function (el) { return hit(el, 'state carried by colour alone'); });
  };

  CHECKS['disabled-signal-channels'] = function (p) {
    var min = p.minChannels || 3;
    return all('[disabled], [aria-disabled="true"], [class*="disabled"]').filter(function (el) {
      var s = getComputedStyle(el);
      var channels = 0;
      if (parseFloat(s.opacity) < 1) channels++;
      if (s.cursor === 'not-allowed') channels++;
      if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') channels++;
      return channels < min;
    }).map(function (el) { return hit(el, 'disabled signalled through too few channels'); });
  };

  CHECKS['console-errors'] = function () {
    var errs = window.__redpenErrors || [];
    return errs.slice(0, 8).map(function (e) { return { selector: 'window', excerpt: e }; });
  };
`;
