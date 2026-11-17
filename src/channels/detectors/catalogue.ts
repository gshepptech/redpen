export const CATALOGUE_CHECKS = `
  // ---- the tells the upstream catalogues name above their fortieth gate ----
  // Cited densely up to gate 40 and not at all above it, which is where the
  // most specific and most recent ones live.

  CHECKS['grid-track-bare-fr'] = function () {
    // Measured, not inferred.
    //
    // Reading grid-template-columns out of the stylesheet would cite classes
    // that only apply above a breakpoint, at a viewport where they do not
    // apply. A stylesheet rule is not a fact about the page.
    //
    // What is a fact: a grid whose content is wider than the grid, holding an
    // image whose own natural width is what makes it so. That is the defect,
    // and it is visible from the element.
    var out = [];
    all('*').forEach(function (el) {
      if (out.length >= 5) return;
      var s = getComputedStyle(el);
      if (s.display.indexOf('grid') === -1) return;
      if (el.scrollWidth <= el.clientWidth + 1) return;
      var imgs = Array.prototype.slice.call(el.querySelectorAll('img, picture img, video')).filter(function (im) {
        // Not "rendered smaller than natural" — when the track cannot shrink the
        // image is rendered AT its natural width, which is the defect. What
        // matters is that its own width is what the grid cannot fit.
        var natural = im.naturalWidth || im.videoWidth || 0;
        return natural > 0 && natural > el.clientWidth;
      });
      if (!imgs.length) return;
      var im = imgs[0];
      out.push(hit(el, 'grid overflows by ' + Math.round(el.scrollWidth - el.clientWidth) +
        'px around a ' + (im.naturalWidth || im.videoWidth) + 'px image — the track has no minmax(0, ...) to shrink into'));
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
`;
