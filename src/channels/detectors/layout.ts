/** Layout: hero stacks, nested surfaces, section rhythm, tap targets, overflow and alignment. */
export const LAYOUT_CHECKS = `
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
    // A hero does not contain the rest of the page. Height alone cannot
    // separate the two; what makes a wrapper not a hero is that the other
    // sections are inside it. topLevelSections only returns direct children of
    // main, so count the sections it contains instead: an opener holds none.
    if (hero.querySelectorAll('section, article').length > 1) return [];

    var h = hero.getBoundingClientRect().height;
    var vh = h / window.innerHeight;
    // A hero is a screenful, or two. On a long page the first section can be
    // the whole content column, where a centred prose measure naturally puts
    // two dozen elements on one axis. Above the ceiling this is a page, and the
    // check does not apply to pages.
    if (vh < (p.minHeroVh || 0.85) || vh > (p.maxHeroVh || 2.5)) return [];
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
      // the four signals below. Card-in-card is about two levels of chrome
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
  // Not gated on document.scrollWidth, which overflow-x: clip on the root
  // sets equal to clientWidth, so a page could put nav destinations and a
  // destructive action off-screen at 375px and still measure clean. Measure
  // element rects against the viewport, and treat a clipping root as a reason
  // to look harder rather than as a pass.
  function pastViewport() {
    var vw = window.innerWidth;
    return all('*').filter(function (el) {
      // The standard visually-hidden idiom parks content at -9999px on purpose.
      if (isVisuallyHidden(el)) return false;
      var r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return false;
      if (r.right <= vw + 1 && r.left >= -1) return false;

      // A wide table inside its own overflow-x: auto wrapper is the correct
      // pattern, not a defect; measuring it against the viewport rather than
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
      // Comparing box height to line height would count an icon beside the
      // label, or any extra padding, as a wrap. Count the text's own line boxes
      // instead: a Range over the text node yields one client rect per
      // rendered line.
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
      // A textarea scrolls by contract: scrollHeight > clientHeight is its
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

      // Off-canvas by design: skip links, focus-revealed controls. Their
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
`;
