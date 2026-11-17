/** Depth and iconography: radius and shadow uniformity, cards, chips, icons and illustrations. */
export const DEPTH_CHECKS = `
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
      // sequence, where items of similar length there are a sign of good editing,
      // not of content written to fill a component.
      var cardish = cards.filter(function (c) {
        var cs = getComputedStyle(c);
        var bg = parseColor(cs.backgroundColor);
        return (bg && bg.a > 0.02) ||
               parseFloat(cs.borderTopWidth) > 0 && parseFloat(cs.borderLeftWidth) > 0 ||
               (cs.boxShadow && cs.boxShadow !== 'none');
      });
      if (cardish.length < cards.length) return;

      // Full text length, not the truncated excerpt: textOf caps at 80 chars,
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
      // SVG initial value of 1, a number nobody authored. Counting it would make a
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
      // Background texture is not an assembled illustration. A full-bleed svg
      // that sits behind the content and cannot be clicked is chrome the author
      // drew on purpose, such as a topographic contour wash.
      var cs = getComputedStyle(svg);
      var behind = parseFloat(cs.zIndex) < 0;
      var pinned = cs.position === 'fixed' || cs.position === 'absolute';
      if (cs.pointerEvents === 'none' && pinned && behind) return false;

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
`;
