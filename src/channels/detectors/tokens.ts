export const TOKEN_CHECKS = `
  /* ---- token drift ------------------------------------------------------
   * the prior art checks literal values against a declared DESIGN.md. redpen
   * reads the declaration the project already has: the custom properties on
   * :root. A project that defines --color-* and then hard-codes hex values
   * elsewhere has drifted from its own system, and no external file is needed
   * to prove it.
   * ------------------------------------------------------------------- */

  /**
   * Tokens declared for one role, found by NAME not by value.
   *
   * Matching on value shape alone is noise: a --space-2xs of 4px looks exactly
   * like a font-size token. A design system names its roles; read the names.
   */
  function declaredTokens(namePattern) {
    var out = {};
    var found = 0;
    eachRule(function (r) {
      if (!r.style || !r.selectorText || !/(^|,)\s*(:root|html)\s*($|,)/.test(r.selectorText)) return;
      for (var i = 0; i < r.style.length; i++) {
        var name = r.style[i];
        if (name.indexOf('--') !== 0 || !namePattern.test(name)) continue;
        var value = r.style.getPropertyValue(name).trim().toLowerCase();
        if (!value) continue;
        out[value] = name;
        found++;
        // A stack is a declaration of every face in it, not just the first.
        if (value.indexOf(',') !== -1) {
          value.split(',').forEach(function (part) {
            var f = part.replace(/["']/g, '').trim();
            if (f) out[f] = name;
          });
        }
      }
    });
    out.__count = found;
    return out;
  }

  function usedLiterals(props, valuePattern) {
    var seen = {};
    eachRule(function (r) {
      if (!r.style || !r.selectorText) return;
      if (/(^|,)\s*(:root|html)\s*($|,)/.test(r.selectorText)) return;
      props.forEach(function (prop) {
        var v = r.style.getPropertyValue(prop);
        // A value routed through a token is by definition not drift.
        if (!v || v.indexOf('var(') !== -1) return;
        var m = String(v).match(valuePattern);
        if (m) m.forEach(function (x) { seen[x.toLowerCase()] = 1; });
      });
    });
    return Object.keys(seen);
  }

  function driftCheck(opts) {
    var tokens = declaredTokens(opts.namePattern);
    var declared = tokens.__count;
    // No tokens for this role means there is no system to drift from. That is
    // a different (and weaker) finding, and stating it here would state it
    // badly — so stay silent.
    if (declared < opts.minTokens) return [];
    var off = usedLiterals(opts.props, opts.valuePattern).filter(function (v) {
      return !(v in tokens);
    });
    if (off.length < opts.minDrift) return [];
    return [hit(document.body,
      off.length + ' ' + opts.label + ' outside the ' + declared +
      ' declared token(s): ' + off.slice(0, 6).join(', '))];
  }

  CHECKS['color-token-drift'] = function (p) {
    return driftCheck({
      namePattern: /color|colour|bg|background|surface|ink|paper|accent|brand|fg|foreground|border/i,
      props: ['color', 'background-color', 'border-color', 'fill', 'stroke'],
      valuePattern: /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|oklch\([^)]*\)|hsla?\([^)]*\)/gi,
      label: 'literal colour(s)',
      minTokens: p.minTokens || 4,
      minDrift: p.minDrift || 4,
    });
  };

  CHECKS['radius-token-drift'] = function (p) {
    return driftCheck({
      namePattern: /radius|rounded|corner/i,
      props: ['border-radius'],
      valuePattern: /\b\d+(?:\.\d+)?(?:px|rem|em)\b/gi,
      label: 'literal radius value(s)',
      minTokens: p.minTokens || 2,
      minDrift: p.minDrift || 3,
    });
  };

  CHECKS['font-size-token-drift'] = function (p) {
    return driftCheck({
      // Type-scale names only. A --space-* of 4px is not a font size, and
      // treating it as one told projects with a spacing scale that their
      // (nonexistent) type scale was broken.
      namePattern: /font-size|fontsize|text-(xs|sm|base|md|lg|xl|\d)|type-(scale|step)|step-\d/i,
      props: ['font-size'],
      valuePattern: /\b\d+(?:\.\d+)?(?:px|rem)\b/gi,
      label: 'literal font-size(s)',
      minTokens: p.minTokens || 3,
      minDrift: p.minDrift || 4,
    });
  };

  CHECKS['font-family-drift'] = function (p) {
    var tokens = declaredTokens(/font(?!-size)|typeface|family/i);
    if (tokens.__count < 1) return [];
    var used = {};
    all('*').forEach(function (el) {
      if (!isTextBearing(el)) return;
      var f = getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
      if (f) used[f] = 1;
    });
    // A face the page actually loads is part of the type system, however it was
    // declared. next/font emits @font-face and a hashed family name and sets no
    // font custom property at all, so the framework's own recommended setup
    // would read as drift. Reading the loaded set instead of only the
    // token block makes the check framework-agnostic: shipping a webfont is as
    // explicit a declaration as naming it in a root custom property.
    var loaded = {};
    try {
      document.fonts.forEach(function (face) {
        loaded[String(face.family).replace(/["']/g, '').trim().toLowerCase()] = 1;
      });
    } catch (e) { /* FontFaceSet is unavailable; fall back to tokens alone. */ }

    var off = Object.keys(used).filter(function (f) {
      // Generic and platform families are never "declared" and never drift.
      if (/^(ui-|system-|-apple-)/.test(f)) return false;
      if (/^(serif|sans-serif|monospace|cursive|fantasy|system-ui)$/.test(f)) return false;
      if (f in loaded) return false;
      return !(f in tokens);
    });
    if (off.length < (p.minDrift || 1)) return [];
    return [hit(document.body,
      'face(s) not in the declared type system: ' + off.slice(0, 4).join(', '))];
  };
`;
