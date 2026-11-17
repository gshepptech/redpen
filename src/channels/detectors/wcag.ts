export const WCAG_CHECKS = `
  // ---- WCAG criteria the corpus had no rule for ----

  function accessibleName(el) {
    var label = el.getAttribute('aria-label');
    if (label && label.trim()) return label.trim();
    var by = el.getAttribute('aria-labelledby');
    if (by) {
      var parts = by.split(/\\s+/).map(function (id) {
        var t = document.getElementById(id);
        return t ? (t.textContent || '').trim() : '';
      }).filter(Boolean);
      if (parts.length) return parts.join(' ');
    }
    var text = (el.textContent || '').trim();
    if (text) return text;
    var img = el.querySelector('img[alt]');
    if (img && img.getAttribute('alt').trim()) return img.getAttribute('alt').trim();
    var svg = el.querySelector('svg[aria-label], svg > title');
    if (svg) return (svg.getAttribute('aria-label') || svg.textContent || '').trim();
    if (el.tagName === 'INPUT') {
      var t = el.getAttribute('type');
      if (t === 'submit' || t === 'button' || t === 'reset') return (el.getAttribute('value') || '').trim();
    }
    var title = el.getAttribute('title');
    return title && title.trim() ? title.trim() : '';
  }

  CHECKS['control-no-accessible-name'] = function () {
    // 4.1.2. A control with an icon and nothing else is announced as "button"
    // and nothing more, which is the same as unlabelled. It is the most common
    // failure on a toolbar and the least visible, because it looks finished.
    return all('button, a[href], [role="button"], [role="link"], input[type=submit], input[type=button]')
      .filter(function (el) { return !accessibleName(el); })
      .slice(0, 6)
      .map(function (el) {
        return hit(el, el.tagName.toLowerCase() + ' with no accessible name — announced as "' +
          (el.getAttribute('role') || el.tagName.toLowerCase()) + '" and nothing else');
      });
  };

  CHECKS['target-size-minimum'] = function (p) {
    // 2.5.8, AA in WCAG 2.2. 24 by 24 CSS pixels, with an exemption for a
    // control inline in a sentence, where the line is the target.
    var min = p.minPx || 24;
    var targets = all('button, a[href], [role="button"], input[type=checkbox], input[type=radio], select');
    return targets
      .filter(function (el) {
        var r = el.getBoundingClientRect();
        if (r.width >= min && r.height >= min) return false;
        // The WCAG exemption is for a target *in a sentence*, which means the
        // control flows with the text. A <p> used as a flex row is not running
        // text, and reading it as one exempted an 18px button sitting beside a
        // label — so the control's own display has to be inline too.
        var cs = getComputedStyle(el);
        if (cs.display === 'inline' || cs.display === 'inline-block') {
          var pnt = el.parentElement;
          var pd = pnt ? getComputedStyle(pnt).display : '';
          var flowing = pnt && /^(P|LI|TD|SPAN|LABEL|H1|H2|H3|H4|H5|H6)$/.test(pnt.tagName) &&
                        pd.indexOf('flex') === -1 && pd.indexOf('grid') === -1;
          if (flowing) {
            var txt = (pnt.textContent || '').trim().length;
            if (txt > (el.textContent || '').trim().length + 12) return false;
          }
        }
        return r.width > 0 && r.height > 0;
      })
      .filter(function (el) {
        // 2.5.8's spacing exemption, which is the rest of the criterion: an
        // undersized target passes if a min-diameter circle centred on it
        // reaches no other target's circle. Without it a 23px nav link — one
        // pixel under, with room around it — would read as a failure.
        var r = el.getBoundingClientRect();
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        return targets.some(function (other) {
          if (other === el) return false;
          var o = other.getBoundingClientRect();
          var ox = o.left + o.width / 2, oy = o.top + o.height / 2;
          return Math.sqrt((cx - ox) * (cx - ox) + (cy - oy) * (cy - oy)) < min;
        });
      })
      .slice(0, 6)
      .map(function (el) {
        var r = el.getBoundingClientRect();
        return hit(el, Math.round(r.width) + 'x' + Math.round(r.height) +
          'px with a neighbour inside ' + min + 'px — below the minimum and not spaced clear of it');
      });
  };

  CHECKS['aria-hidden-focusable'] = function () {
    // A focusable element inside aria-hidden is reachable by tab and invisible
    // to the screen reader at the same time. Nothing announces, focus appears
    // to vanish.
    var out = [];
    Array.prototype.slice.call(document.querySelectorAll('[aria-hidden="true"]')).forEach(function (host) {
      if (out.length >= 5) return;
      var focusable = host.querySelectorAll('a[href], button, input, select, textarea, [tabindex]');
      for (var i = 0; i < focusable.length && out.length < 5; i++) {
        var el = focusable[i];
        if (el.hasAttribute('disabled')) continue;
        if (el.getAttribute('tabindex') === '-1') continue;
        out.push(hit(el, 'focusable inside aria-hidden — reachable by tab, invisible to a screen reader'));
      }
    });
    return out;
  };

  CHECKS['positive-tabindex'] = function () {
    // 2.4.3. Any positive tabindex takes the element out of document order and
    // ahead of everything that has none, so the whole page's focus order stops
    // matching what is on screen.
    return all('[tabindex]')
      .filter(function (el) { return parseInt(el.getAttribute('tabindex'), 10) > 0; })
      .slice(0, 5)
      .map(function (el) {
        return hit(el, 'tabindex="' + el.getAttribute('tabindex') + '" — jumps ahead of the whole document');
      });
  };

  CHECKS['duplicate-id'] = function () {
    // 4.1.1. A repeated id silently breaks every label, aria-labelledby and
    // aria-controls pointing at it: they all resolve to the first one.
    var seen = {};
    var dupes = {};
    Array.prototype.slice.call(document.querySelectorAll('[id]')).forEach(function (el) {
      var id = el.getAttribute('id');
      if (!id) return;
      if (seen[id]) dupes[id] = (dupes[id] || 1) + 1;
      seen[id] = true;
    });
    return Object.keys(dupes).slice(0, 6).map(function (id) {
      var el = document.getElementById(id);
      return hit(el || document.body, 'id "' + id + '" used ' + dupes[id] + ' times — every reference resolves to the first');
    });
  };

  CHECKS['new-window-no-warning'] = function () {
    // 3.2.5. A link that replaces the context without saying so. Announcing it
    // costs a word; not announcing it loses people who cannot see the new tab
    // appear.
    return all('a[target="_blank"]')
      .filter(function (el) {
        var name = accessibleName(el).toLowerCase();
        if (/new (tab|window)|opens in|external/.test(name)) return false;
        if (el.querySelector('[aria-label*="new tab" i], [aria-label*="new window" i]')) return false;
        return true;
      })
      .slice(0, 5)
      .map(function (el) {
        return hit(el, 'opens a new tab with no warning — "' + accessibleName(el).slice(0, 40) + '"');
      });
  };

  CHECKS['console-errors'] = function () {
    var errs = window.__redpenErrors || [];
    return errs.slice(0, 8).map(function (e) { return { selector: 'window', excerpt: e }; });
  };
`;
