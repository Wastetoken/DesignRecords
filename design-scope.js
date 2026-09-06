/**
 * design-scope.js
 * Page-level style extractor + orchestrator.
 * Injected into the active tab; uses the normalize/generate/validate
 * modules loaded before this file to produce a DESIGN.md.
 *
 * Exposes window.__scrollCaptureExtractDesign()
 */
(function () {
  "use strict";

  var MAX_SAMPLE = 200;

  window.__scrollCaptureExtractDesign = function () {
    try {
      var payload = extractPageStyles();
      var normalized = window.__DS.normalize(payload);
      var markdown = window.__DS.generate({ normalized: normalized, metadata: {} });
      var validation = window.__DS.validate("design", markdown);
      return {
        markdown: markdown,
        validation: validation,
        sampledElements: payload.sampledElements,
        totalElements: payload.totalElements,
        source: payload.source
      };
    } catch (err) {
      return { error: String(err && err.message ? err.message : err) };
    }
  };

  window.__scrollCaptureExtractSkill = function () {
    try {
      var payload = extractPageStyles();
      var normalized = window.__DS.normalize(payload);
      var markdown = window.__DS.generateSkill({ normalized: normalized, metadata: {} });
      var validation = window.__DS.validate("skill", markdown);
      return {
        markdown: markdown,
        validation: validation,
        sampledElements: payload.sampledElements,
        totalElements: payload.totalElements,
        source: payload.source
      };
    } catch (err) {
      return { error: String(err && err.message ? err.message : err) };
    }
  };

  /* ── Extraction ─────────────────────────────────────────────── */

  function extractPageStyles() {
    var all = document.querySelectorAll("*");
    var total = all.length;
    var visible = [];

    for (var i = 0; i < all.length; i++) {
      if (visible.length >= MAX_SAMPLE * 2) break;
      var el = all[i];
      var rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      var cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) continue;
      visible.push(el);
    }

    var sampled = visible;
    if (visible.length > MAX_SAMPLE) {
      sampled = [];
      var step = Math.ceil(visible.length / MAX_SAMPLE);
      for (var j = 0; j < visible.length; j += step) sampled.push(visible[j]);
    }

    var typography = [];
    var colors = [];
    var spacing = [];
    var radius = [];
    var shadows = [];
    var motion = [];

    for (var k = 0; k < sampled.length; k++) {
      var cs = getComputedStyle(sampled[k]);

      typography.push({
        fontSize: cs.fontSize,
        fontFamily: cs.fontFamily,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight
      });

      colors.push({
        textColor: cs.color,
        backgroundColor: cs.backgroundColor,
        borderColor: cs.borderLeftWidth !== "0px" ? cs.borderLeftColor : cs.borderTopColor,
        outlineColor: cs.outlineColor
      });

      spacing.push({
        marginTop: cs.marginTop,
        marginRight: cs.marginRight,
        marginBottom: cs.marginBottom,
        marginLeft: cs.marginLeft,
        paddingTop: cs.paddingTop,
        paddingRight: cs.paddingRight,
        paddingBottom: cs.paddingBottom,
        paddingLeft: cs.paddingLeft
      });

      var br = parseFloat(cs.borderTopLeftRadius);
      if (br > 0) radius.push(cs.borderTopLeftRadius);

      if (cs.boxShadow && cs.boxShadow !== "none") shadows.push(cs.boxShadow);

      motion.push({
        transitionDuration: cs.transitionDuration,
        transitionTimingFunction: cs.transitionTimingFunction,
        animationDuration: cs.animationDuration,
        animationTimingFunction: cs.animationTimingFunction
      });
    }

    return {
      source: { url: location.href, title: document.title },
      sampledAt: new Date().toISOString(),
      sampledElements: sampled.length,
      totalElements: total,
      typography: typography,
      colors: colors,
      spacing: spacing,
      radius: radius,
      shadows: shadows,
      motion: motion,
      components: detectComponents(),
      siteSignals: extractSiteSignals()
    };
  }

  /* ── Site signals ───────────────────────────────────────────── */

  function extractSiteSignals() {
    function meta(name) {
      var el = document.querySelector('meta[name="' + name + '"], meta[property="' + name + '"]');
      return el ? el.content || "" : "";
    }

    var headings = [];
    var headingEls = document.querySelectorAll("h1,h2,h3,h4,h5,h6");
    for (var i = 0; i < headingEls.length && i < 20; i++) {
      var t = headingEls[i].textContent.trim();
      if (t) headings.push(t);
    }

    var navTexts = [];
    var navEls = document.querySelectorAll("nav a, nav button");
    for (var j = 0; j < navEls.length && j < 30; j++) {
      var nt = navEls[j].textContent.trim();
      if (nt) navTexts.push(nt);
    }

    var ctaEls = document.querySelectorAll('button, a[role="button"], a[href]');
    var ctaTexts = [];
    for (var k = 0; k < ctaEls.length && ctaTexts.length < 15; k++) {
      var ct = ctaEls[k].textContent.trim();
      if (ct && ct.length < 40 && /^(get|start|try|sign|buy|download|contact|subscribe|learn|book|order|create|register|join|explore)/i.test(ct)) {
        ctaTexts.push(ct);
      }
    }

    var textSample = document.body ? document.body.innerText.slice(0, 3000) : "";

    return {
      title: document.title,
      description: meta("description"),
      keywords: meta("keywords"),
      ogType: meta("og:type"),
      ogSiteName: meta("og:site_name"),
      appName: meta("application-name"),
      pathname: location.pathname,
      headings: headings,
      navTexts: navTexts,
      ctaTexts: ctaTexts,
      textSample: textSample,
      elementCounts: {
        codeBlocks: document.querySelectorAll("pre, code").length,
        forms: document.querySelectorAll("form").length,
        inputs: document.querySelectorAll("input, select, textarea").length,
        tables: document.querySelectorAll("table").length,
        articles: document.querySelectorAll("article").length,
        pricingSections: countByClass("pricing"),
        productMarkers: countByClass("product"),
        checkoutMarkers: countByClass("checkout") + countByClass("cart"),
        authMarkers: countByText(["login", "sign in", "sign up", "register", "log in"])
      }
    };
  }

  function countByClass(pattern) {
    var lower = pattern.toLowerCase();
    var count = 0;
    var els = document.querySelectorAll("[class]");
    for (var i = 0; i < els.length; i++) {
      if (typeof els[i].className === "string" && els[i].className.toLowerCase().indexOf(lower) !== -1) count++;
    }
    return count;
  }

  function countByText(words) {
    var text = (document.body ? document.body.innerText : "").toLowerCase();
    var count = 0;
    for (var i = 0; i < words.length; i++) {
      if (text.indexOf(words[i]) !== -1) count++;
    }
    return count;
  }

  /* ── Component detection ────────────────────────────────────── */

  function detectComponents() {
    return [
      { type: "button", count: document.querySelectorAll('button, [role="button"]').length },
      { type: "input", count: document.querySelectorAll("input, select, textarea").length },
      { type: "link", count: document.querySelectorAll("a[href]").length },
      { type: "image", count: document.querySelectorAll("img").length },
      { type: "heading", count: document.querySelectorAll("h1,h2,h3,h4,h5,h6").length },
      { type: "table", count: document.querySelectorAll("table").length },
      { type: "form", count: document.querySelectorAll("form").length },
      { type: "nav", count: document.querySelectorAll("nav").length },
      { type: "card", count: countByClass("card") },
      { type: "modal", count: countByClass("modal") + countByClass("dialog") }
    ];
  }
})();
