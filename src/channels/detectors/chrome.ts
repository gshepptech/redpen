export const CHROME_CHECKS = `
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
`;
