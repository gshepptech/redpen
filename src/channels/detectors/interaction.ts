/** Copy, usability and accessibility of the controls a person actually operates. */
export const INTERACTION_CHECKS = `
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
    // Real code says ok, bad, pass, fail, good, danger, valid and invalid as
    // often as error, success and warning. A state carried by colour alone is
    // the defect whatever it is called.
    return all(
      '[class*="error"], [class*="success"], [class*="warning"], [aria-invalid="true"],' +
      '[class*="danger"], [class*="invalid"], [class~="ok"], [class~="bad"],' +
      '[class~="pass"], [class~="fail"], [class~="good"], [class~="valid"]'
    )
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
`;
