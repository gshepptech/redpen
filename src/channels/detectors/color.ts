/** Colour: hue bands, gradients, neutrals, contrast and glow. */
export const COLOR_CHECKS = `
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
      // sets it, and html/body usually set only layout. Reading it would report
      // a pure black that appears nowhere in the source. A text colour only
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
`;
