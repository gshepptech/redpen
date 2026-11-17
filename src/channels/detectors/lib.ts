/* ------------------------------------------------------------------ *
 * Colour science. sRGB -> linear -> OKLab -> OKLCH.
 * ------------------------------------------------------------------ */
export const OKLCH_LIB = `
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

export const CONTRAST_LIB = `
  function relLuminance(rgb) {
    var r = srgbToLinear(rgb.r), g = srgbToLinear(rgb.g), b = srgbToLinear(rgb.b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function contrastRatio(fg, bg) {
    var l1 = relLuminance(fg), l2 = relLuminance(bg);
    var hi = Math.max(l1, l2), lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  }

  /**
   * True when a gradient or image sits between this element and the first
   * solid colour above it. Contrast cannot be computed against those from
   * computed styles alone, and guessing would report a confident 1.00:1 for
   * white text on a violet gradient button.
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

export const HELPERS_LIB = `
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

  /**
   * Dev tooling the framework injects, which is not the product.
   *
   * redpen is pointed at a dev server by design, and every modern stack mounts
   * something into the page there: TanStack Query's devtools button, Next's
   * build indicator and error portal, Vite's error overlay. The Query devtools
   * button alone is a 64px svg of 31 primitive shapes, which would read as an
   * assembled illustration on every route.
   */
  var DEV_TOOL_SELECTOR = [
    '[class*="tsqd-"]',
    '[id*="tsqd"]',
    'nextjs-portal',
    '[data-nextjs-dialog]',
    '[data-nextjs-toast]',
    '#__next-build-watcher',
    'vite-error-overlay',
    'vite-plugin-checker-error-overlay',
    '#react-refresh-overlay',
    '[data-vite-dev-id]',
  ].join(',');

  function isDevTooling(el) {
    try {
      return !!el.closest(DEV_TOOL_SELECTOR);
    } catch (e) {
      return false;
    }
  }

  function all(sel) {
    return Array.prototype.slice.call(document.querySelectorAll(sel || '*'))
      .filter(function (el) { return !isDevTooling(el); })
      .filter(visible);
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
