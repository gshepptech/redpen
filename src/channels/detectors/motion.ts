/** Motion: entrance animations, transitions, timing functions and reduced-motion coverage. */
export const MOTION_CHECKS = `
  CHECKS['uniform-entrance-animation'] = function (p) {
    var sections = topLevelSections();
    var animated = sections.filter(function (s) {
      var cs = getComputedStyle(s);
      if (cs.animationName !== 'none') return true;
      var inner = s.querySelector('[style*="opacity"], [class*="fade"], [class*="animate"], [data-aos]');
      return !!inner;
    });
    if (animated.length < (p.minAnimatedSections || 4)) return [];
    return [hit(document.body, animated.length + ' of ' + sections.length + ' sections carry an entrance animation')];
  };

  CHECKS['transition-property-all'] = function () {
    return all('*').filter(function (el) {
      var s = getComputedStyle(el);
      // "all" is the CSS initial value, so every element on every page reports
      // it. Only an element that actually transitions has made the mistake.
      if (s.transitionProperty !== 'all') return false;
      return parseFloat(s.transitionDuration) > 0;
    }).slice(0, 10).map(function (el) {
      return hit(el, 'transition: all ' + getComputedStyle(el).transitionDuration);
    });
  };

  CHECKS['uniform-hover-transform'] = function (p) {
    // Hover styles are not in the computed cascade at rest, so read the
    // stylesheets instead. Same-origin only; cross-origin sheets throw.
    var rules = [];
    for (var i = 0; i < document.styleSheets.length; i++) {
      try {
        var cssRules = document.styleSheets[i].cssRules;
        for (var j = 0; j < cssRules.length; j++) {
          var r = cssRules[j];
          if (r.selectorText && /:hover/.test(r.selectorText) && /scale\\(/.test(r.style.transform || '')) {
            rules.push({ sel: r.selectorText, transform: r.style.transform });
          }
        }
      } catch (e) { /* cross-origin stylesheet */ }
    }
    var byTransform = {};
    rules.forEach(function (r) { (byTransform[r.transform] = byTransform[r.transform] || []).push(r.sel); });
    var out = [];
    Object.keys(byTransform).forEach(function (t) {
      var sels = byTransform[t];
      if (sels.length >= (p.minElements || 4)) {
        out.push({ selector: sels.slice(0, 3).join(', '), excerpt: t + ' on ' + sels.length + ' distinct selectors' });
      }
    });
    return out;
  };

  CHECKS['overshoot-timing-function'] = function () {
    return all('*').filter(function (el) {
      var tf = getComputedStyle(el).transitionTimingFunction + ' ' + getComputedStyle(el).animationTimingFunction;
      var m = /cubic-bezier\\(([^)]+)\\)/.exec(tf);
      if (!m) return false;
      var nums = m[1].split(',').map(parseFloat);
      return nums.length === 4 && (nums[1] > 1.05 || nums[3] > 1.05);
    }).slice(0, 8).map(function (el) { return hit(el, getComputedStyle(el).transitionTimingFunction); });
  };

  CHECKS['layout-affecting-transition'] = function () {
    var layoutProps = /\\b(width|height|top|left|right|bottom|margin|padding)\\b/;
    return all('*').filter(function (el) {
      var tp = getComputedStyle(el).transitionProperty;
      return tp !== 'none' && tp !== 'all' && layoutProps.test(tp);
    }).slice(0, 10).map(function (el) { return hit(el, 'transition-property: ' + getComputedStyle(el).transitionProperty); });
  };

  CHECKS['reduced-motion-coverage'] = function () {
    var hasMotion = all('*').some(function (el) {
      var s = getComputedStyle(el);
      return s.animationName !== 'none' || (s.transitionDuration !== '0s' && s.transitionProperty !== 'none');
    });
    if (!hasMotion) return [];
    var covered = false;
    for (var i = 0; i < document.styleSheets.length; i++) {
      try {
        var rules = document.styleSheets[i].cssRules;
        for (var j = 0; j < rules.length; j++) {
          if (rules[j].conditionText && /prefers-reduced-motion/.test(rules[j].conditionText)) covered = true;
        }
      } catch (e) { /* cross-origin */ }
    }
    return covered ? [] : [hit(document.body, 'page animates with no prefers-reduced-motion block')];
  };

  CHECKS['infinite-small-pulse'] = function (p) {
    return all('*').filter(function (el) {
      var s = getComputedStyle(el);
      if (s.animationIterationCount !== 'infinite') return false;
      var r = el.getBoundingClientRect();
      return r.width <= (p.maxElementPx || 16) && r.height <= (p.maxElementPx || 16);
    }).map(function (el) { return hit(el, 'infinite animation on a ' + Math.round(el.getBoundingClientRect().width) + 'px element'); });
  };

  CHECKS['continuous-translate-loop'] = function () {
    return all('*').filter(function (el) {
      var s = getComputedStyle(el);
      if (s.animationIterationCount !== 'infinite') return false;
      if (parseFloat(s.animationDuration) <= 3) return false;
      // A slow infinite fade is a pulse, not a marquee. Require travel.
      return /translate|marquee|scroll/i.test(s.animationName + ' ' + s.transform);
    }).slice(0, 5).map(function (el) {
      var s = getComputedStyle(el);
      return hit(el, s.animationName + ' ' + s.animationDuration + ' infinite');
    });
  };

  CHECKS['focus-ring-transition'] = function () {
    var out = [];
    for (var i = 0; i < document.styleSheets.length; i++) {
      try {
        var rules = document.styleSheets[i].cssRules;
        for (var j = 0; j < rules.length; j++) {
          var r = rules[j];
          if (!r.selectorText || !/:focus/.test(r.selectorText)) continue;
          var t = r.style.transition || r.style.transitionProperty || '';
          if (/outline|box-shadow|all/.test(t)) {
            out.push({ selector: r.selectorText, excerpt: 'focus ring transitions: ' + t });
          }
          // A keyframe animation moves the ring exactly as a transition does.
          var a = r.style.animation || r.style.animationName || '';
          if (a && a !== 'none') {
            out.push({ selector: r.selectorText, excerpt: 'focus ring animates: ' + a });
          }
        }
      } catch (e) { /* cross-origin */ }
    }
    return out;
  };
`;
