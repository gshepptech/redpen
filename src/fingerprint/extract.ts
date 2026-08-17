/**
 * Fingerprint extraction — the thing no upstream catalogue does.
 *
 * A fingerprint is a page's structural signature: the skeleton, the section
 * rhythm, the type scale, the palette anchor. Two pages that share one are the
 * same page wearing different words, which is what "they all look the same"
 * actually means and what a single-page rule check cannot see.
 *
 * Runs in the browser alongside the detectors, on the widest viewport only,
 * because the signature is a desktop-layout property.
 */

export interface RawFingerprint {
  macrostructure: string;
  sectionRhythm: string[];
  typeScale: number[];
  families: string[];
  paletteAnchor: number | null;
  nav: string;
  hero: string;
  sectionCount: number;
}

export function fingerprintSource(): string {
  return `() => {
  function visible(el) {
    var s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function text(el) {
    return (el.textContent || '').replace(/\\s+/g, ' ').trim();
  }

  // Decorative and non-layout nodes are children of body on plenty of pages.
  // Counting them would put noise into the signature, which is the one thing a
  // signature cannot tolerate — it is compared against other pages.
  var NON_SECTION = { SVG: 1, IMG: 1, SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, CANVAS: 1, TEMPLATE: 1, LINK: 1, DIALOG: 1 };

  function layoutChildren(parent) {
    return Array.prototype.slice.call(parent.children).filter(function (el) {
      if (NON_SECTION[String(el.tagName).toUpperCase()]) return false;
      if (el.getAttribute && el.getAttribute('aria-hidden') === 'true') return false;
      return visible(el) && el.getBoundingClientRect().height > 80;
    });
  }

  function sections() {
    var main = document.querySelector('main') || document.body;
    var kids = layoutChildren(main);
    // A single wrapper div is the common case; descend through it once.
    if (kids.length === 1 && kids[0].children.length > 2) {
      kids = layoutChildren(kids[0]);
    }
    return kids;
  }

  /**
   * Classify a section by what it structurally *is*, not what it is called.
   * Class names are unreliable (and often absent); geometry is not.
   */
  function classify(el, index) {
    var tag = el.tagName.toLowerCase();
    if (tag === 'footer') return 'footer';
    if (tag === 'header' || tag === 'nav') return 'nav';

    var r = el.getBoundingClientRect();
    var tall = r.height / window.innerHeight;
    var grids = el.querySelectorAll('*');
    var gridChild = null;
    for (var i = 0; i < grids.length; i++) {
      var gs = getComputedStyle(grids[i]);
      if (gs.display === 'grid' && grids[i].children.length >= 2) { gridChild = grids[i]; break; }
    }

    if (el.querySelector('table')) return 'table';
    if (el.querySelector('form') && el.querySelectorAll('input, textarea').length >= 2) return 'form';

    if (gridChild) {
      var cols = getComputedStyle(gridChild).gridTemplateColumns.split(' ').filter(Boolean).length;
      var cards = gridChild.children.length;
      if (cards >= 6) return 'catalogue';
      return 'card-grid-' + cols;
    }

    var h1 = el.querySelector('h1');
    if (index === 0 || h1) {
      if (tall >= 0.85) return 'hero-full';
      return 'hero';
    }

    var quotes = el.querySelectorAll('blockquote, q, [class*="quote"], [class*="testimonial"]');
    if (quotes.length) return 'quote';

    var stats = Array.prototype.slice.call(el.querySelectorAll('*')).filter(function (n) {
      var t = text(n);
      return t.length < 12 && /^[\\d.,]+[%+xkKmM]?$/.test(t) && parseFloat(getComputedStyle(n).fontSize) > 28;
    });
    if (stats.length >= 3) return 'stat-strip';

    var imgs = el.querySelectorAll('img, video, canvas, picture');
    var chars = text(el).length;
    if (imgs.length >= 1 && chars < 300) return 'media';

    var ctas = el.querySelectorAll('a[class], button');
    if (chars < 240 && ctas.length >= 1 && ctas.length <= 3) return 'cta';

    var details = el.querySelectorAll('details, [class*="accordion"], [class*="faq"]');
    if (details.length >= 2) return 'faq';

    var lists = el.querySelectorAll('ol > li, ul > li');
    if (lists.length >= 4 && chars > 400) return 'index';

    if (chars > 900) return 'prose';
    return 'block';
  }

  /**
   * The macrostructure is the shape of the whole page, named from the rhythm.
   * Deliberately coarse — two pages should collide here only when they really
   * are the same skeleton.
   */
  function macrostructure(rhythm) {
    var body = rhythm.filter(function (r) { return r !== 'nav' && r !== 'footer'; });
    var joined = body.join('|');

    if (/^hero(-full)?\\|card-grid-3/.test(joined)) return 'hero-triptych';
    if (/^hero(-full)?\\|(cta|media)?\\|?stat-strip/.test(joined)) return 'stat-led';
    if (body.filter(function (r) { return r === 'prose'; }).length >= 3) return 'long-document';
    if (body[0] === 'catalogue' || body.filter(function (r) { return r === 'catalogue'; }).length) return 'catalogue';
    if (body[0] === 'stat-strip') return 'stat-led';
    if (body[0] === 'quote') return 'quote-led';
    if (body[0] === 'media') return 'photographic';
    if (body.indexOf('faq') !== -1 && body.length <= 4) return 'conversational-faq';
    if (body.indexOf('table') !== -1) return 'specimen';
    if (body[0] === 'index') return 'index-first';
    if (body.filter(function (r) { return /^card-grid/.test(r); }).length >= 2) return 'feature-stack';
    if (body.length <= 3) return 'manifesto';
    return 'mixed';
  }

  function navShape() {
    var nav = document.querySelector('header nav, nav, header');
    if (!nav || !visible(nav)) return 'none';
    var s = getComputedStyle(nav);
    var r = nav.getBoundingClientRect();
    var links = nav.querySelectorAll('a').length;
    var radius = parseFloat(s.borderRadius) || 0;

    if (s.position === 'fixed' || s.position === 'sticky') {
      if (radius > 16 && r.width < window.innerWidth * 0.9) return 'floating-pill';
      return 'sticky-bar';
    }
    if (r.height > window.innerHeight * 0.5) return 'side-rail';
    if (links <= 3) return 'wordmark-links';
    if (links >= 8) return 'mega-menu';
    return 'bar';
  }

  function heroShape(first) {
    if (!first) return 'none';
    var r = first.getBoundingClientRect();
    var tall = r.height / window.innerHeight;
    var s = getComputedStyle(first);
    var hasMedia = first.querySelector('img, video, canvas, picture');

    var kids = Array.prototype.slice.call(first.querySelectorAll('h1, h2, p, a, button')).filter(visible);
    var centred = kids.filter(function (el) {
      var kr = el.getBoundingClientRect();
      return Math.abs((kr.left + kr.width / 2) - window.innerWidth / 2) < 8 ||
             getComputedStyle(el).textAlign === 'center';
    });

    if (hasMedia && r.width > window.innerWidth * 0.9 && !centred.length) return 'photographic-fold';
    if (hasMedia && kids.length >= 2 && centred.length < 2) return 'split-diptych';
    if (centred.length >= 4 && tall >= 0.85) return 'centered-full';
    if (centred.length >= 3) return 'centered-narrow';
    if (first.querySelector('blockquote, q')) return 'quote-led';
    return 'asymmetric';
  }

  function typeScale() {
    var sizes = {};
    Array.prototype.slice.call(document.querySelectorAll('*')).forEach(function (el) {
      if (!visible(el)) return;
      var hasText = false;
      for (var i = 0; i < el.childNodes.length; i++) {
        if (el.childNodes[i].nodeType === 3 && el.childNodes[i].textContent.trim().length > 1) hasText = true;
      }
      if (!hasText) return;
      var px = Math.round(parseFloat(getComputedStyle(el).fontSize));
      if (px) sizes[px] = (sizes[px] || 0) + 1;
    });
    // Sizes used once are usually a one-off override, not part of the scale.
    return Object.keys(sizes)
      .map(Number)
      .filter(function (px) { return sizes[px] >= 2; })
      .sort(function (a, b) { return a - b; });
  }

  function families() {
    var out = {};
    Array.prototype.slice.call(document.querySelectorAll('*')).forEach(function (el) {
      if (!visible(el)) return;
      var f = getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
      if (f) out[f] = 1;
    });
    return Object.keys(out).sort();
  }

  function paletteAnchor() {
    function srgbToLinear(c) {
      c = c / 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }
    function oklch(str) {
      var m = /rgba?\\(([^)]+)\\)/.exec(str);
      if (!m) return null;
      var p = m[1].split(/[\\s,\\/]+/).filter(Boolean).map(parseFloat);
      if (p.length < 3) return null;
      var alpha = p.length > 3 ? p[3] : 1;
      if (alpha < 0.5) return null;
      var r = srgbToLinear(p[0]), g = srgbToLinear(p[1]), b = srgbToLinear(p[2]);
      var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
      var mm = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
      var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
      var A = 1.9779984951 * l - 2.4285922050 * mm + 0.4505937099 * s;
      var B = 0.0259040371 * l + 0.7827717662 * mm - 0.8086757660 * s;
      var C = Math.sqrt(A * A + B * B);
      var H = (Math.atan2(B, A) * 180) / Math.PI;
      if (H < 0) H += 360;
      return { c: C, h: H };
    }

    // Weight each chromatic colour by the area it covers, then take the hue of
    // the heaviest. Accent colours win over incidental ones this way.
    var buckets = {};
    Array.prototype.slice.call(document.querySelectorAll('*')).forEach(function (el) {
      if (!visible(el)) return;
      var r = el.getBoundingClientRect();
      var a = Math.max(0, r.width) * Math.max(0, r.height);
      if (a <= 0) return;
      var col = oklch(getComputedStyle(el).backgroundColor);
      if (!col || col.c < 0.04) return;
      var bucket = Math.round(col.h / 15) * 15;
      buckets[bucket] = (buckets[bucket] || 0) + a;
    });
    var keys = Object.keys(buckets);
    if (!keys.length) return null;
    var best = keys[0];
    keys.forEach(function (k) { if (buckets[k] > buckets[best]) best = k; });
    return Number(best) % 360;
  }

  var secs = sections();
  var rhythm = secs.map(classify);
  // The nav and footer bookends are structural even when they sit outside
  // <main>, but they must appear exactly once.
  if (rhythm[0] !== 'nav' && document.querySelector('header, nav')) rhythm.unshift('nav');
  if (rhythm.indexOf('footer') === -1 && document.querySelector('footer')) rhythm.push('footer');

  return {
    macrostructure: macrostructure(rhythm),
    sectionRhythm: rhythm,
    typeScale: typeScale(),
    families: families(),
    paletteAnchor: paletteAnchor(),
    nav: navShape(),
    hero: heroShape(secs[0]),
    sectionCount: secs.length,
  };
}`;
}
