/** Typography: families, scale, measure, leading, tracking and heading order. */
export const TYPOGRAPHY_CHECKS = `
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
    }).map(function (el) {
      // Which bound. This is a range check, so 44ch and 79ch are opposite
      // problems with opposite fixes, and the finding printed them identically.
      var ch = Math.round(measureCh(el));
      var lo = p.minCh || 45;
      return hit(el, ch < lo
        ? 'measure ~' + ch + 'ch — narrower than ' + lo + 'ch, so the eye returns too often'
        : 'measure ~' + ch + 'ch — wider than ' + (p.maxCh || 78) + 'ch, so the eye loses the line');
    });
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

      // A heading is display type at any size; tight leading is correct there,
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
    // incidental UI chrome". An id, a timestamp or a unit label is chrome by
    // any reading, not only interactive elements.
    function isChrome(el) {
      if (isInteractive(el)) return true;
      var t = textOf(el);
      if (!t) return true;
      // A short, sentence-less label is chrome. Prose has sentences.
      if (t.length <= 24 && !/[.!?]\\s/.test(t)) return true;
      // Nothing without a space in it is prose. A file path, a url, a hash or
      // an id is chrome at any length. Otherwise a 68-character temp path in a
      // menu is held to the 14px prose floor with no way to satisfy the rule.
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
`;
