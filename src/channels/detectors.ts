/**
 * The browser-side detector bundle.
 *
 * Everything below the DETECTOR_SOURCE boundary is stringified and evaluated
 * inside the page, so it cannot close over anything from the Node side and must
 * stay dependency-free. It receives the render matchers from the corpus and
 * returns raw hits keyed by rule id.
 *
 * This is the channel that distinguishes redpen from a linter: it reads
 * getComputedStyle, so a tell reaches it identically whether it was written
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
 * Returned as a string and passed to page.evaluate. Written as a function
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

    // Anything that went through color-mix() serialises as color(srgb r g b / a)
    // with 0-1 channels, not rgb(). A parser that only knows rgba() returns null
    // for every control on a sheet that tints with color-mix — and null here
    // means the translucent layer silently drops out of the composite, so the
    // measured ground is the layer behind it rather than the one on screen.
    var fn = /color\\(\\s*srgb\\s+([^)]+)\\)/.exec(str);
    if (fn) {
      var p = fn[1].split(/[\\s\\/]+/).filter(Boolean).map(parseFloat);
      if (p.length < 3) return null;
      var fa = p.length > 3 ? p[3] : 1;
      return {
        r: p[0] * 255,
        g: p[1] * 255,
        b: p[2] * 255,
        a: isNaN(fa) ? 1 : fa,
      };
    }

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
  /**
   * True when a gradient or image sits between this element and the first
   * solid colour above it. Contrast cannot be computed against those from
   * computed styles alone, and guessing produced a confident 1.00:1 for white
   * text on a violet gradient button.
   */
  function hasPaintedAncestor(el) {
    var node = el, depth = 0;
    while (node && depth < 4) {
      var s = getComputedStyle(node);
      if (s.backgroundImage && s.backgroundImage !== 'none') return true;
      var bg = parseColor(s.backgroundColor);
      if (bg && bg.a >= 0.999) return false;
      node = node.parentElement; depth++;
    }
    return false;
  }

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
    // A form whose control is named "id" shadows form.id with the element
    // itself, so a naive '#' + el.id stringifies a DOM node. Only trust a
    // string, and only one that can actually be written as a selector.
    var id = el.getAttribute ? el.getAttribute('id') : null;
    if (typeof id === 'string' && id && /^[A-Za-z_][\\w:.-]*$/.test(id)) return '#' + id;
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

  // The standard visually-hidden recipe: 1px box, clipped, off-canvas. It is
  // meant to be unreadable on screen and readable to a screen reader, so every
  // geometry check has to skip it or adding a skip link creates findings.
  function isVisuallyHidden(el) {
    var s = getComputedStyle(el);
    if (s.clip === 'rect(0px, 0px, 0px, 0px)' || /inset\\(100%|circle\\(0/.test(s.clipPath)) return true;
    var r = el.getBoundingClientRect();
    if (r.width <= 1 && r.height <= 1 && (el.textContent || '').trim().length > 1) return true;
    // Parked off-canvas rather than clipped.
    if (r.right < 0 || r.bottom < 0 || r.left > window.innerWidth * 2) return true;
    var node = el.parentElement, depth = 0;
    while (node && depth < 3) {
      var ps = getComputedStyle(node);
      if (ps.clip === 'rect(0px, 0px, 0px, 0px)') return true;
      node = node.parentElement; depth++;
    }
    return false;
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
 * The checks themselves. One entry per render.check name in the corpus.
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
    var area = {};
    all('*').forEach(function (el) {
      var s = getComputedStyle(el);
      var r = el.getBoundingClientRect();
      // The root carries the CSS initial color: rgb(0,0,0) unless something
      // sets it, and html/body usually set only layout. Reading it reported a
      // pure black that appears nowhere in the source. A text colour only
      // counts where there is text wearing it.
      var pairs = [s.backgroundColor];
      if (isTextBearing(el)) pairs.push(s.color);
      pairs.forEach(function (c) {
        var ok = toOklch(parseColor(c));
        if (!ok || ok.alpha < 0.5) return;
        // Pure black at full opacity on a zero-area element is almost always a
        // UA default on something invisible, not a colour the page chose.
        if (ok.l < 0.02 && r.width * r.height < 4) return;
        if (ok.c < min) {
          seen[c] = ok.c;
          area[c] = (area[c] || 0) + r.width * r.height;
        }
      });
    });
    var keys = Object.keys(seen).filter(function (k) { return area[k] > 0; });
    if (keys.length < (p.minDistinctNeutrals || 3)) return [];
    // Say the measured chroma and the floor. "Tinted" is not actionable; a
    // number is — someone tinted their greys twice because of this rule and it
    // kept firing, because 2% RGB spread is still under 0.005 OKLCH chroma.
    var detail = keys.slice(0, 5).map(function (k) {
      return k + ' (chroma ' + seen[k].toFixed(4) + ')';
    }).join(', ');
    return [hit(document.body, detail + ' — floor is ' + min + ' OKLCH chroma')];
  };

  CHECKS['contrast-threshold'] = function (p) {
    var out = [];
    all('*').forEach(function (el) {
      if (!isTextBearing(el)) return;
      if (isVisuallyHidden(el)) return;
      // A gradient or image behind the text cannot be measured from computed
      // styles. Reporting a number derived from the wrong surface is worse
      // than reporting nothing — this is a job for the vision channel.
      if (hasPaintedAncestor(el)) return;
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
    // The rule's own fix promises "14px for anything read as prose, 12px for
    // incidental UI chrome". Treating only interactive elements as chrome broke
    // that promise: an id, a timestamp or a unit label is chrome by any reading,
    // and was being held to the prose floor with no way to satisfy the rule.
    function isChrome(el) {
      if (isInteractive(el)) return true;
      var t = textOf(el);
      if (!t) return true;
      // A short, sentence-less label is chrome. Prose has sentences.
      if (t.length <= 24 && !/[.!?]\\s/.test(t)) return true;
      // Nothing without a space in it is prose. A file path, a url, a hash or
      // an id is chrome at any length — a 68-character temp path in a menu was
      // being held to the 14px prose floor with no way to satisfy the rule.
      if (!/\\s/.test(t)) return true;
      // Monospace is how a page says "this is an identifier, not sentences".
      if (/mono/i.test(getComputedStyle(el).fontFamily)) return true;
      return /^(label|badge|chip|tag|meta|caption|id|count|unit|hint|status)$/i.test(
        (el.getAttribute('class') || '').split(/[\\s_-]/).pop() || '',
      );
    }
    return all('*').filter(function (el) {
      if (!isTextBearing(el)) return false;
      var px = parseFloat(getComputedStyle(el).fontSize);
      var floor = isChrome(el) ? (p.uiFloorPx || 12) : (p.bodyFloorPx || 14);
      return px < floor;
    }).map(function (el) {
      var chrome = isChrome(el);
      return hit(el, getComputedStyle(el).fontSize + (chrome ? ' chrome' : ' prose') +
        ' (floor ' + (chrome ? (p.uiFloorPx || 12) : (p.bodyFloorPx || 14)) + 'px) — "' + textOf(el) + '"');
    });
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
    var minPx = p.minSurfacePx || 24;
    var CONTROLS = { INPUT: 1, SELECT: 1, TEXTAREA: 1, BUTTON: 1, OPTION: 1, PROGRESS: 1, METER: 1 };
    function isSurface(el) {
      // A control is not a container. Every design system gives its inputs and
      // buttons a background, a border, a radius and padding, which is four of
      // the four signals below — so on the first real app this ever scanned,
      // input.field inside div.card was reported as a card inside a card,
      // twelve times, at weight 73. Card-in-card is about two levels of chrome
      // around the same content; a field inside a card is one level of chrome
      // around a control that has always looked like that.
      if (CONTROLS[el.tagName] || el.getAttribute('role') === 'button') return false;
      // Anything smaller than a tap target is an indicator, not a card. A 5px
      // status dot inside a menu item is not a nested surface.
      var r = el.getBoundingClientRect();
      if (r.width < minPx || r.height < minPx) return false;
      var s = getComputedStyle(el);

      // A container holds things: it has its own ground and its own padding.
      // Without that requirement a row carrying a 2px inset state stripe read
      // as a card, and the button inside it read as a card within a card.
      var bg = parseColor(s.backgroundColor);
      var hasGround = (bg && bg.a > 0.02) || parseFloat(s.borderTopWidth) > 0;
      var pad = parseFloat(s.paddingTop) + parseFloat(s.paddingBottom) +
                parseFloat(s.paddingLeft) + parseFloat(s.paddingRight);
      if (!hasGround || pad < 8) return false;

      var n = 0;
      if (parseFloat(s.borderRadius) > 2) n++;
      // An inset shadow is a state marker, not elevation.
      if (s.boxShadow && s.boxShadow !== 'none' && s.boxShadow.indexOf('inset') === -1) n++;
      if (parseFloat(s.borderTopWidth) > 0) n++;
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

  // Elements that sit past the viewport edge.
  //
  // This used to gate on document.scrollWidth, which overflow-x: clip on the
  // root sets equal to clientWidth — so a page could put three of five nav
  // destinations and a destructive action off-screen at 375px and measure as
  // perfectly clean. Reported from a project that applied the clip *because
  // redpen told it to*. So: measure element rects against the viewport, and
  // treat a clipping root as a reason to look harder rather than as a pass.
  function pastViewport() {
    var vw = window.innerWidth;
    return all('*').filter(function (el) {
      // The standard visually-hidden idiom parks content at -9999px on purpose.
      if (isVisuallyHidden(el)) return false;
      var r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return false;
      if (r.right <= vw + 1 && r.left >= -1) return false;

      // A wide table inside its own overflow-x: auto wrapper is the correct
      // pattern, not a defect — measuring it against the viewport rather than
      // against its scroll parent manufactures a finding.
      for (var p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
        var ps = getComputedStyle(p);
        if (ps.overflowX === 'auto' || ps.overflowX === 'scroll') {
          var pr = p.getBoundingClientRect();
          if (pr.right <= vw + 1 && pr.left >= -1) return false;
        }
      }
      return true;
    });
  }

  CHECKS['input-zoom-font-size'] = function (p) {
    // iOS Safari zooms the whole page when a text input under 16px takes
    // focus, and does not zoom back out. The layout the author tested is not
    // the layout the user gets, and nothing about the page looks wrong until
    // someone taps a field.
    var floor = p.minFontSizePx || 16;
    var types = /^(text|email|password|search|tel|url|number|date|datetime-local|month|week|time)$/;
    return all('input, select, textarea').filter(function (el) {
      if (el.tagName === 'INPUT') {
        var t = (el.getAttribute('type') || 'text').toLowerCase();
        if (!types.test(t)) return false;
      }
      return parseFloat(getComputedStyle(el).fontSize) < floor;
    }).map(function (el) {
      return hit(el, getComputedStyle(el).fontSize + ' on a focusable field — iOS zooms below ' + floor + 'px');
    });
  };

  CHECKS['adjacent-tap-targets'] = function (p) {
    // Size is only half of a tap target. Two 44px buttons touching each other
    // still produce mis-taps, because the finger contact patch is wider than
    // the gap between them.
    var min = p.minGapPx || 8;
    var controls = all('a, button, input, select, [role="button"], [role="tab"], [role="menuitem"]')
      .filter(function (el) {
        var r = el.getBoundingClientRect();
        return r.width >= 12 && r.height >= 12;
      });
    var out = [];
    for (var i = 0; i < controls.length && out.length < 8; i++) {
      for (var j = i + 1; j < controls.length; j++) {
        var a = controls[i].getBoundingClientRect();
        var b = controls[j].getBoundingClientRect();
        if (controls[i].contains(controls[j]) || controls[j].contains(controls[i])) continue;
        // Gap along whichever axis they are separated on. Overlapping on both
        // means one is stacked over the other, which is a different defect.
        var gapX = Math.max(a.left - b.right, b.left - a.right);
        var gapY = Math.max(a.top - b.bottom, b.top - a.bottom);
        var overlapX = gapX < 0;
        var overlapY = gapY < 0;
        if (overlapX && overlapY) continue;
        var gap = overlapY ? gapX : (overlapX ? gapY : Math.max(gapX, gapY));
        if (gap >= 0 && gap < min) {
          out.push(hit(controls[i], Math.round(gap) + 'px from the next control, floor is ' + min + 'px — "' + textOf(controls[i]) + '"'));
          break;
        }
      }
    }
    return out;
  };

  CHECKS['wrapped-control-label'] = function (p) {
    // A button whose label wraps was sized for a shorter string than the one
    // it holds. It reads as a layout accident rather than a decision, and it
    // is the first thing a longer translation breaks.
    var minWidth = p.desktopOnlyAbovePx || 1000;
    if (window.innerWidth < minWidth) return [];
    return all('button, a[class], [role="button"], input[type=submit]').filter(function (el) {
      var t = textOf(el);
      if (!t || t.length < 2) return false;
      var s = getComputedStyle(el);
      if (s.display === 'inline') return false;
      if (s.whiteSpace === 'nowrap' || s.whiteSpace === 'pre') return false;
      // Comparing box height to line height counted an icon beside the label,
      // or any extra padding, as a wrap — it fired on a correct button in the
      // clean fixture. Count the text's own line boxes instead: a Range over
      // the text node yields one client rect per rendered line.
      var lines = 0;
      for (var i = 0; i < el.childNodes.length; i++) {
        var n = el.childNodes[i];
        if (n.nodeType !== 3 || !n.textContent.trim()) continue;
        var range = document.createRange();
        range.selectNodeContents(n);
        var rects = range.getClientRects();
        // Rects on the same baseline are one line split by inline markup.
        var tops = {};
        for (var k = 0; k < rects.length; k++) {
          if (rects[k].width > 0) tops[Math.round(rects[k].top)] = 1;
        }
        lines += Object.keys(tops).length;
      }
      return lines > 1;
    }).map(function (el) {
      return hit(el, 'label wraps to more than one line at ' + window.innerWidth + 'px — "' + textOf(el) + '"');
    });
  };

  CHECKS['empty-grid-cell'] = function (p) {
    // A grid whose item count does not fill its final row. The gap reads as a
    // missing card rather than a choice, and it is what happens when a layout
    // was written for a number of items the content did not supply.
    var minItems = p.minItems || 4;
    return all('*').filter(function (el) {
      var s = getComputedStyle(el);
      if (s.display !== 'grid') return false;
      var cols = (s.gridTemplateColumns || '').split(' ').filter(Boolean).length;
      if (cols < 2) return false;
      var items = Array.prototype.slice.call(el.children).filter(visible);
      if (items.length < minItems) return false;
      // A single full row, or an exactly-filled grid, is fine.
      if (items.length <= cols) return false;
      return items.length % cols !== 0;
    }).map(function (el) {
      var s = getComputedStyle(el);
      var cols = (s.gridTemplateColumns || '').split(' ').filter(Boolean).length;
      var n = Array.prototype.slice.call(el.children).filter(visible).length;
      return hit(el, n + ' items in a ' + cols + '-column grid leaves ' + (cols - (n % cols)) + ' empty cell(s) in the last row');
    });
  };

  CHECKS['horizontal-scroll'] = function () {
    var doc = document.documentElement;
    var rootClips = /clip|hidden/.test(getComputedStyle(doc).overflowX);
    var scrolls = doc.scrollWidth > window.innerWidth + 1;
    if (!rootClips && !scrolls) return [];

    var culprits = pastViewport();
    if (!culprits.length) {
      if (!scrolls) return [];
      return [hit(document.body, (doc.scrollWidth - window.innerWidth) + 'px of horizontal overflow at ' + window.innerWidth + 'px')];
    }

    return culprits.slice(0, 6).map(function (el) {
      var over = Math.round(el.getBoundingClientRect().right - window.innerWidth);
      // Clipped is strictly worse than scrollable: the reader cannot even drag
      // to it. Say which, because the two need different fixes.
      var how = rootClips
        ? over + 'px past the edge at ' + window.innerWidth + 'px — unreachable, the root sets overflow-x: ' + getComputedStyle(doc).overflowX
        : over + 'px past the edge at ' + window.innerWidth + 'px';
      return hit(el, how + (textOf(el) ? ': "' + textOf(el) + '"' : ''));
    });
  };

  CHECKS['clipped-text'] = function (p) {
    var min = p.minOverflowPx || 2;
    return all('*').filter(function (el) {
      if (!isTextBearing(el)) return false;
      // A visually-hidden label is clipped on purpose.
      if (isVisuallyHidden(el)) return false;
      // A textarea scrolls by contract — scrollHeight > clientHeight is its
      // resting state, not clipped content. Same for a multi-row select.
      var tag = el.tagName;
      if (tag === 'TEXTAREA' || tag === 'SELECT') return false;
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
      if (isVisuallyHidden(el)) return false;
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
      // Say the assumption. A page may well have a coarse-pointer rule that
      // grows this control; the scan runs with a fine pointer and never
      // triggers it, and "32px tall" reads as unconditional without this.
      return hit(el, Math.round(el.getBoundingClientRect().height) +
        'px tall at ' + window.innerWidth + 'px with a fine pointer — "' + textOf(el) + '"');
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
      // The rule looks for placeholder prose that survived into production.
      // An identifier repeating is data, not copy: three queue rows naming the
      // same file is how you see one file blocking three items. Prose has
      // spaces and does not look like a path, a url, or a code point.
      if (!/\\s/.test(t)) return;
      if (/^[^\\s]+\\/[^\\s]+$/.test(t)) return;
      if (el.closest('a[href], code, pre, kbd, samp')) return;
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
      // A filled mark draws no stroke, so its *computed* stroke-width is the
      // SVG initial value of 1 — a number nobody authored. Counting it made a
      // brand mark beside stroked nav icons read as two icon libraries, which
      // is a normal and deliberate pairing.
      var parts = Array.prototype.slice.call(svg.querySelectorAll('*'));
      parts.unshift(svg);
      var stroked = parts.filter(function (el) {
        var st = getComputedStyle(el).stroke;
        return st && st !== 'none';
      });
      if (!stroked.length) return;
      var w = svg.getAttribute('stroke-width') ||
              (svg.querySelector('[stroke-width]') || {}).getAttribute?.('stroke-width') ||
              getComputedStyle(stroked[0]).strokeWidth;
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


  /* ---- browser surfaces -------------------------------------------------
   * The parts nobody drew still carry the design. Selection, caret, scrollbar,
   * focus ring, underline offset and tabular numerals all ship with browser
   * defaults belonging to no design system — the cheapest signal a page was built
   * rather than assembled, and the one models skip most reliably.
   *
   * All six read the stylesheets rather than computed styles, because a
   * pseudo-element that was never authored has no computed style to inspect.
   * ------------------------------------------------------------------- */

  function eachRule(fn) {
    // Since CSS Nesting shipped, every CSSStyleRule carries a cssRules list —
    // usually empty. An empty CSSRuleList is still an object, so a truthiness
    // check descends into nothing and never visits the rule itself. Visit
    // first, then recurse only when there is something to recurse into.
    function walk(r) {
      if (r.selectorText || r.style) fn(r);
      if (r.cssRules && r.cssRules.length) {
        for (var k = 0; k < r.cssRules.length; k++) walk(r.cssRules[k]);
      }
    }
    for (var i = 0; i < document.styleSheets.length; i++) {
      var rules;
      try { rules = document.styleSheets[i].cssRules; } catch (e) { continue; }
      if (!rules) continue;
      for (var j = 0; j < rules.length; j++) walk(rules[j]);
    }
  }

  function anySelector(re) {
    var found = false;
    eachRule(function (r) { if (r.selectorText && re.test(r.selectorText)) found = true; });
    return found;
  }

  function anyDeclaration(prop) {
    var found = false;
    eachRule(function (r) {
      if (r.style && r.style.getPropertyValue(prop)) found = true;
    });
    return found;
  }

  CHECKS['selection-unthemed'] = function () {
    if (anySelector(/::(-moz-)?selection/)) return [];
    // Only a finding on a page with enough prose for anyone to select any.
    var prose = all('p, li, article, main').reduce(function (n, el) {
      return n + textOf(el).length;
    }, 0);
    if (prose < 400) return [];
    return [hit(document.body, 'no ::selection rule — highlight falls back to the browser blue')];
  };

  CHECKS['caret-unthemed'] = function (p) {
    var fields = all('input:not([type=checkbox]):not([type=radio]):not([type=hidden]), textarea, [contenteditable="true"]');
    if (fields.length < (p.minFields || 1)) return [];
    if (anyDeclaration('caret-color')) return [];
    return [hit(fields[0], fields.length + ' text field(s) with no caret-color')];
  };

  CHECKS['scrollbar-unthemed'] = function () {
    var scrollers = all('*').filter(function (el) {
      var s = getComputedStyle(el);
      if (!/auto|scroll/.test(s.overflowY + ' ' + s.overflowX)) return false;
      return el.scrollHeight > el.clientHeight + 8 || el.scrollWidth > el.clientWidth + 8;
    });
    if (!scrollers.length) return [];
    if (anySelector(/::-webkit-scrollbar/) || anyDeclaration('scrollbar-color') ||
        anyDeclaration('scrollbar-width')) return [];
    return scrollers.slice(0, 4).map(function (el) {
      return hit(el, 'scrolling container with an unthemed scrollbar');
    });
  };

  CHECKS['focus-ring-unthemed'] = function () {
    // A page with no :focus-visible rule at all is already caught by
    // interactive-state-coverage. This is the subtler case: the rule exists
    // but only turns the ring off, or leaves the UA default in place.
    var themed = false, suppressedOnly = false;
    eachRule(function (r) {
      if (!r.selectorText || !/:focus(-visible)?/.test(r.selectorText)) return;
      // "outline" is a shorthand and the CSSOM expands it, so a rule that sets
      // it correctly returns empty for the shorthand. Read the longhands too.
      var outline = [
        'outline', 'outline-style', 'outline-width', 'outline-color', 'box-shadow',
      ].map(function (prop) { return r.style.getPropertyValue(prop); }).join(' ');
      if (/none|0px|^\\s*$/.test(outline) && !/solid|auto|rgb|#|var\\(/.test(outline)) {
        suppressedOnly = true;
      }
      if (/solid|double|dashed|rgb|#|var\\(/.test(outline)) themed = true;
    });
    if (themed) return [];
    if (!all('a, button, input, select, textarea, [tabindex]').length) return [];
    return [hit(document.body, suppressedOnly
      ? 'focus rings are switched off without a replacement'
      : 'no themed focus ring — the browser default is doing the work')];
  };

  CHECKS['underline-default'] = function (p) {
    var links = all('p a, li a, article a, main a').filter(function (a) {
      return getComputedStyle(a).textDecorationLine.indexOf('underline') !== -1;
    });
    if (links.length < (p.minLinks || 2)) return [];
    if (anyDeclaration('text-underline-offset') || anyDeclaration('text-decoration-thickness')) return [];
    return [hit(links[0], links.length + ' underlined in-prose link(s) at the default offset and thickness')];
  };

  CHECKS['tabular-nums-missing'] = function () {
    var out = [];
    all('table').forEach(function (table) {
      var cells = Array.prototype.slice.call(table.querySelectorAll('td'));
      // A column is numeric when most of its cells are numbers.
      var numeric = cells.filter(function (c) {
        return /^[\\s$£€]*[\\d,.]+\\s*[%a-zA-Z]{0,3}$/.test(textOf(c));
      });
      if (cells.length < 4 || numeric.length < cells.length * 0.4) return;
      var variant = getComputedStyle(numeric[0]).fontVariantNumeric || '';
      var feature = getComputedStyle(numeric[0]).fontFeatureSettings || '';
      if (/tabular-nums/.test(variant) || /tnum/.test(feature)) return;
      out.push(hit(table, numeric.length + ' numeric cells without tabular-nums — digits will not align'));
    });
    return out;
  };

  /* ---- token drift ------------------------------------------------------
   * the prior art checks literal values against a declared DESIGN.md. redpen
   * reads the declaration the project already has: the custom properties on
   * :root. A project that defines --color-* and then hard-codes hex values
   * elsewhere has drifted from its own system, and no external file is needed
   * to prove it.
   * ------------------------------------------------------------------- */

  /**
   * Tokens declared for one role, found by NAME not by value.
   *
   * Matching on value shape alone is what made the first version noise: a
   * --space-2xs of 4px looks exactly like a font-size token, so a project with
   * a spacing scale and no type scale was told its type scale was broken. A
   * design system names its roles; read the names.
   */
  function declaredTokens(namePattern) {
    var out = {};
    var found = 0;
    eachRule(function (r) {
      if (!r.style || !r.selectorText || !/(^|,)\s*(:root|html)\s*($|,)/.test(r.selectorText)) return;
      for (var i = 0; i < r.style.length; i++) {
        var name = r.style[i];
        if (name.indexOf('--') !== 0 || !namePattern.test(name)) continue;
        var value = r.style.getPropertyValue(name).trim().toLowerCase();
        if (!value) continue;
        out[value] = name;
        found++;
        // A stack is a declaration of every face in it, not just the first.
        if (value.indexOf(',') !== -1) {
          value.split(',').forEach(function (part) {
            var f = part.replace(/["']/g, '').trim();
            if (f) out[f] = name;
          });
        }
      }
    });
    out.__count = found;
    return out;
  }

  function usedLiterals(props, valuePattern) {
    var seen = {};
    eachRule(function (r) {
      if (!r.style || !r.selectorText) return;
      if (/(^|,)\s*(:root|html)\s*($|,)/.test(r.selectorText)) return;
      props.forEach(function (prop) {
        var v = r.style.getPropertyValue(prop);
        // A value routed through a token is by definition not drift.
        if (!v || v.indexOf('var(') !== -1) return;
        var m = String(v).match(valuePattern);
        if (m) m.forEach(function (x) { seen[x.toLowerCase()] = 1; });
      });
    });
    return Object.keys(seen);
  }

  function driftCheck(opts) {
    var tokens = declaredTokens(opts.namePattern);
    var declared = tokens.__count;
    // No tokens for this role means there is no system to drift from. That is
    // a different (and weaker) finding, and stating it here would state it
    // badly — so stay silent.
    if (declared < opts.minTokens) return [];
    var off = usedLiterals(opts.props, opts.valuePattern).filter(function (v) {
      return !(v in tokens);
    });
    if (off.length < opts.minDrift) return [];
    return [hit(document.body,
      off.length + ' ' + opts.label + ' outside the ' + declared +
      ' declared token(s): ' + off.slice(0, 6).join(', '))];
  }

  CHECKS['color-token-drift'] = function (p) {
    return driftCheck({
      namePattern: /color|colour|bg|background|surface|ink|paper|accent|brand|fg|foreground|border/i,
      props: ['color', 'background-color', 'border-color', 'fill', 'stroke'],
      valuePattern: /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|oklch\([^)]*\)|hsla?\([^)]*\)/gi,
      label: 'literal colour(s)',
      minTokens: p.minTokens || 4,
      minDrift: p.minDrift || 4,
    });
  };

  CHECKS['radius-token-drift'] = function (p) {
    return driftCheck({
      namePattern: /radius|rounded|corner/i,
      props: ['border-radius'],
      valuePattern: /\b\d+(?:\.\d+)?(?:px|rem|em)\b/gi,
      label: 'literal radius value(s)',
      minTokens: p.minTokens || 2,
      minDrift: p.minDrift || 3,
    });
  };

  CHECKS['font-size-token-drift'] = function (p) {
    return driftCheck({
      // Type-scale names only. A --space-* of 4px is not a font size, and
      // treating it as one told projects with a spacing scale that their
      // (nonexistent) type scale was broken.
      namePattern: /font-size|fontsize|text-(xs|sm|base|md|lg|xl|\d)|type-(scale|step)|step-\d/i,
      props: ['font-size'],
      valuePattern: /\b\d+(?:\.\d+)?(?:px|rem)\b/gi,
      label: 'literal font-size(s)',
      minTokens: p.minTokens || 3,
      minDrift: p.minDrift || 4,
    });
  };

  CHECKS['font-family-drift'] = function (p) {
    var tokens = declaredTokens(/font(?!-size)|typeface|family/i);
    if (tokens.__count < 1) return [];
    var used = {};
    all('*').forEach(function (el) {
      if (!isTextBearing(el)) return;
      var f = getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
      if (f) used[f] = 1;
    });
    var off = Object.keys(used).filter(function (f) {
      // Generic and platform families are never "declared" and never drift.
      if (/^(ui-|system-|-apple-)/.test(f)) return false;
      if (/^(serif|sans-serif|monospace|cursive|fantasy|system-ui)$/.test(f)) return false;
      return !(f in tokens);
    });
    if (off.length < (p.minDrift || 1)) return [];
    return [hit(document.body,
      'face(s) not in the declared type system: ' + off.slice(0, 4).join(', '))];
  };

  // ---- the tells the upstream catalogues name above their fortieth gate ----
  // Cited densely up to gate 40 and not at all above it, which is where the
  // most specific and most recent ones live.

  CHECKS['grid-track-bare-fr'] = function () {
    // A bare 1fr track is minmax(auto, 1fr), and auto's minimum is the widest
    // content in it. Put a 1024px image in one and the track cannot go below
    // 1024px, so the page runs off a phone. redpen already reports the symptom
    // as horizontal-overflow; this names the declaration that causes it, which
    // is the thing you can change.
    var hasGridImage = all('img, picture, svg, video').some(function (el) {
      var pnt = el.parentElement;
      for (var d = 0; pnt && d < 3; d++) {
        if (getComputedStyle(pnt).display.indexOf('grid') !== -1) return true;
        pnt = pnt.parentElement;
      }
      return false;
    });
    if (!hasGridImage) return [];

    var out = [];
    eachRule(function (r) {
      if (!r.style || !r.selectorText) return;
      ['grid-template-columns', 'grid-template-rows', 'grid-template'].forEach(function (prop) {
        var v = r.style.getPropertyValue(prop);
        if (!v) return;
        // Strip every minmax(...) first; whatever fr survives is a bare one.
        var bare = v.replace(/minmax\\([^)]*\\)/g, '');
        if (!/\\d*\\.?\\d*fr/.test(bare)) return;
        if (out.length < 6) {
          out.push({ selector: r.selectorText, excerpt: prop + ': ' + v.trim() + ' — an image in this track cannot shrink below its own width' });
        }
      });
    });
    return out;
  };

  CHECKS['display-no-word-wrap'] = function (p) {
    var minPx = p.minSizePx || 28;
    return all('h1, h2, h3, [class*="display"], [class*="hero"]').filter(function (el) {
      var s = getComputedStyle(el);
      if (parseFloat(s.fontSize) < minPx) return false;
      var wrap = (s.overflowWrap || '') + ' ' + (s.wordBreak || '');
      if (/anywhere|break-word|break-all/.test(wrap)) return false;
      // Only where the risk is real: a token long enough to overflow a phone at
      // this size, whose only break opportunity is a hyphen or nothing at all.
      var longest = textOf(el).split(/\\s+/).reduce(function (a, w) { return w.length > a.length ? w : a; }, '');
      return longest.length >= 12;
    }).slice(0, 5).map(function (el) {
      var longest = textOf(el).split(/\\s+/).reduce(function (a, w) { return w.length > a.length ? w : a; }, '');
      return hit(el, 'display type with no overflow-wrap and an unbreakable ' + longest.length + '-character word: ' + longest);
    });
  };

  CHECKS['caps-tight-leading'] = function (p) {
    var minPx = p.minSizePx || 22;
    return all('*').filter(function (el) {
      if (!textOf(el) || el.children.length) return false;
      var s = getComputedStyle(el);
      if (s.textTransform !== 'uppercase') return false;
      var size = parseFloat(s.fontSize);
      if (size < minPx) return false;
      var lh = parseFloat(s.lineHeight);
      if (!lh || isNaN(lh)) return false;
      return lh / size < 1.0;
    }).slice(0, 5).map(function (el) {
      var s = getComputedStyle(el);
      var ratio = (parseFloat(s.lineHeight) / parseFloat(s.fontSize)).toFixed(2);
      return hit(el, 'uppercase display at line-height ' + ratio + ' — cap-tops collide with the line above when it wraps');
    });
  };

  CHECKS['double-sticky-top'] = function () {
    var stuck = all('*').filter(function (el) {
      var s = getComputedStyle(el);
      return s.position === 'sticky' && parseFloat(s.top) === 0;
    });
    if (stuck.length < 2) return [];
    // Only a defect when one of them is the page banner, which is what the
    // others would paint over.
    var banner = stuck.filter(function (el) {
      return /^(HEADER|NAV)$/.test(el.tagName) || el.getAttribute('role') === 'banner' ||
             /nav|header|banner/i.test(el.className || '');
    });
    if (!banner.length) return [];
    return stuck.filter(function (el) { return banner.indexOf(el) === -1; }).slice(0, 4).map(function (el) {
      return hit(el, 'a second element stuck at top: 0 under a sticky banner — they overlap on scroll');
    });
  };

  CHECKS['redrawn-chrome'] = function () {
    // Three small circles in a row at the top of a bordered box is a hand-built
    // browser or terminal window. The model drew a UI the reader's own machine
    // already provides, which is among the strongest tells there is.
    var out = [];
    all('*').forEach(function (parent) {
      if (out.length >= 4) return;
      var kids = Array.prototype.slice.call(parent.children);
      if (kids.length < 3) return;
      var dots = kids.filter(function (k) {
        var r = k.getBoundingClientRect();
        var s = getComputedStyle(k);
        if (r.width < 6 || r.width > 18) return false;
        if (Math.abs(r.width - r.height) > 2) return false;
        if (parseFloat(s.borderRadius) < r.width * 0.4) return false;
        var bg = parseColor(s.backgroundColor);
        return bg && bg.a > 0.2;
      });
      if (dots.length < 3) return;
      // On one row, not a scattered set of indicators.
      var tops = {};
      dots.forEach(function (d) { tops[Math.round(d.getBoundingClientRect().top)] = 1; });
      if (Object.keys(tops).length > 1) return;
      out.push(hit(parent, dots.length + ' traffic-light dots in a row — a hand-drawn window frame'));
    });
    return out;
  };

  CHECKS['bare-noun-bullets'] = function (p) {
    var minItems = p.minItems || 5;
    var FINITE = /\\b(is|are|was|were|has|have|had|does|do|did|can|will|runs?|stays?|takes?|drops?|holds?|cuts?|adds?|keeps?|returns?|costs?|saves?|beats?|survives?|fails?|reports?)\\b/i;
    return all('ul, ol').filter(function (list) {
      var items = Array.prototype.slice.call(list.children).filter(function (li) {
        return li.tagName === 'LI';
      });
      if (items.length < minItems) return false;
      // Every item short, none of them asserting anything. The symmetry is the
      // tell: a real list has items of different lengths and at least one that
      // breaks the shape.
      return items.every(function (li) {
        var t = textOf(li);
        var words = t.split(/\\s+/).filter(Boolean).length;
        return words > 0 && words <= 6 && !FINITE.test(t);
      });
    }).slice(0, 4).map(function (list) {
      var n = list.querySelectorAll('li').length;
      return hit(list, n + ' items, none of them a claim — every one an adjective and a noun');
    });
  };

  CHECKS['shadcn-default-card'] = function () {
    // The untouched starter card: 1px hairline, the default 0.5rem radius, and
    // the stock shadow, repeated across a grid. shadcn itself is fine; the
    // tell is that nobody opened the file.
    var cards = all('*').filter(function (el) {
      var s = getComputedStyle(el);
      var r = el.getBoundingClientRect();
      if (r.width < 120 || r.height < 80) return false;
      if (parseFloat(s.borderTopWidth) !== 1) return false;
      var rad = parseFloat(s.borderRadius);
      if (Math.abs(rad - 8) > 0.6) return false;
      return /rgba?\\([^)]*0\\.1\\)|0 1px 2px|0 1px 3px/.test(s.boxShadow || '');
    });
    if (cards.length < 3) return [];
    return [hit(cards[0], cards.length + ' cards on the starter defaults — 1px border, 0.5rem radius, stock shadow')];
  };

  CHECKS['stock-illustration'] = function () {
    // Not all(): an image that failed to load is 0x0, and visible() drops it.
    // The src is the evidence and it is in the markup whether it loaded or not.
    var nodes = Array.prototype.slice.call(document.querySelectorAll('img, image, use, object'));
    var sources = nodes.map(function (el) {
      return (el.getAttribute('src') || el.getAttribute('href') || el.getAttribute('data') || '');
    }).filter(Boolean);
    var STOCK = /undraw|storyset|humaaans|opendoodles|illustrations\\.co|drawkit|manypixels|absurd\\.design/i;
    var hits = sources.filter(function (u) { return STOCK.test(u); });
    if (!hits.length) return [];
    return hits.slice(0, 4).map(function (u) {
      return { selector: 'img', excerpt: 'stock illustration set: ' + u.slice(0, 90) };
    });
  };

  CHECKS['nav-fingerprint'] = function () {
    // The banner is the element carrying the rule and the width, which is not
    // always the <nav> — a header with a nav inside it wears both, and reading
    // the inner one finds a flex row with no border and no width.
    var banner = document.querySelector('header[role="banner"], body > header, header') ||
                 document.querySelector('body > nav, nav');
    if (!banner || !visible(banner)) return [];
    var s = getComputedStyle(banner);
    var links = Array.prototype.slice.call(banner.querySelectorAll('a')).filter(visible);
    var buttons = links.filter(function (a) {
      var cs = getComputedStyle(a);
      return /btn|button|cta/i.test(a.className || '') ||
             (parseColor(cs.backgroundColor) || { a: 0 }).a > 0.5;
    });
    if (links.length < 4 || links.length > 7) return [];
    if (!buttons.length) return [];
    if (parseFloat(s.borderBottomWidth) !== 1) return [];
    var r = banner.getBoundingClientRect();
    if (r.width < window.innerWidth * 0.95) return [];
    var plain = links.filter(function (a) { return buttons.indexOf(a) === -1; });
    if (plain.length < 3) return [];
    var tops = {};
    plain.forEach(function (a) { tops[Math.round(a.getBoundingClientRect().top)] = 1; });
    if (Object.keys(tops).length !== 1) return [];
    return [hit(banner, plain.length + ' inline links between a wordmark and a button, on one hairline rule — the default bar')];
  };

  CHECKS['footer-fingerprint'] = function () {
    var foot = document.querySelector('footer');
    if (!foot) return [];
    var lists = Array.prototype.slice.call(foot.querySelectorAll('ul, nav > div, div[class*="col"]')).filter(function (el) {
      return el.querySelectorAll('a').length >= 3 && visible(el);
    });
    if (lists.length < 4) return [];
    var tops = {};
    lists.forEach(function (l) { tops[Math.round(l.getBoundingClientRect().top)] = 1; });
    if (Object.keys(tops).length > 1) return [];
    return [hit(foot, lists.length + ' columns of links in one row — the Product / Company / Resources / Legal default')];
  };

  CHECKS['decorative-no-anchor'] = function () {
    // Ornament with nothing in the content to motivate it, on the opening
    // screen where the decorative reflex lives. Keyed on where it sits rather
    // than on being inside a <section>, because it often is not.
    var fold = window.innerHeight;
    var out = [];
    Array.prototype.slice.call(document.querySelectorAll(
      '[class*="blob"], [class*="ornament"], [class*="sticker"], [class*="scanline"], [class*="glow"], [class*="sparkle"], [class*="orb"]'
    )).forEach(function (el) {
      if (out.length >= 4) return;
      if (!visible(el)) return;
      if (textOf(el)) return;
      var r = el.getBoundingClientRect();
      if (r.top > fold) return;
      if (r.width < 40 || r.height < 40) return;
      if (el.closest('figure')) return;
      out.push(hit(el, 'ornament on the opening screen with no anchor in the content around it'));
    });
    return out;
  };

  CHECKS['console-errors'] = function () {
    var errs = window.__redpenErrors || [];
    return errs.slice(0, 8).map(function (e) { return { selector: 'window', excerpt: e }; });
  };
`;
