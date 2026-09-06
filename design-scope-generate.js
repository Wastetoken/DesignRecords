/**
 * design-scope-generate.js
 * Browser-compatible port of generate-design-scope/generate-design-md.mjs
 * Exposes window.__DS.generate(context)
 */
(function () {
  "use strict";

  function generateDesignMarkdown(context) {
    var normalized = context.normalized;
    var metadata = context.metadata || {};
    var siteProfile = normalized.siteProfile || {};
    var systemName = metadata.systemName || inferSystemName(normalized.source ? normalized.source.title : null);
    var brand = metadata.brand || systemName;
    var extractionUrl = (normalized.source && normalized.source.url) || "Unknown URL";
    var audience = metadata.audience || siteProfile.audience || "website visitors and product users";
    var productSurface = metadata.productSurface || siteProfile.productSurface || "web app";

    var visualStyle = inferVisualStyle(normalized);
    var mainFontStyle = formatMainFontStyle(normalized.mainFontStyle);
    var typographyScale = joinTokens(normalized.typographyScale, 8);
    var colors = joinTokens(normalized.colorPalette, 10);
    var spacing = joinTokens(normalized.spacingScale, 8);
    var radiusShadowMotion = joinTokenGroups([normalized.radiusTokens, normalized.shadowTokens, normalized.motionDurationTokens], 8);
    var componentNotes = normalized.componentHints.map(function (item) { return item.type + " (" + item.count + ")"; }).join(", ");
    var diagnosticsNote = normalized.diagnostics.length ? "\n- Extraction diagnostics: " + normalized.diagnostics.join(" ") : "";

    return "# " + systemName + "\n" +
      "\n## Mission\n" +
      "Create implementation-ready, token-driven UI guidance for " + brand + " that is optimized for consistency, accessibility, and fast delivery across " + productSurface + ".\n" +
      "\n## Brand\n" +
      "- Product/brand: " + brand + "\n" +
      "- URL: " + extractionUrl + "\n" +
      "- Audience: " + audience + "\n" +
      "- Product surface: " + productSurface + "\n" +
      "\n## Style Foundations\n" +
      "- Visual style: " + visualStyle + "\n" +
      "- Main font style: " + mainFontStyle + "\n" +
      "- Typography scale: " + typographyScale + "\n" +
      "- Color palette: " + colors + "\n" +
      "- Spacing scale: " + spacing + "\n" +
      "- Radius/shadow/motion tokens: " + radiusShadowMotion + "\n" +
      "\n## Accessibility\n" +
      "- Target: WCAG 2.2 AA\n" +
      "- Keyboard-first interactions required.\n" +
      "- Focus-visible rules required.\n" +
      "- Contrast constraints required.\n" +
      "\n## Writing Tone\n" +
      "Concise, confident, implementation-focused.\n" +
      "\n## Rules: Do\n" +
      "- Use semantic tokens, not raw hex values, in component guidance.\n" +
      "- Every component must define states for default, hover, focus-visible, active, disabled, loading, and error.\n" +
      "- Component behavior should specify responsive and edge-case handling.\n" +
      "- Interactive components must document keyboard, pointer, and touch behavior.\n" +
      "- Accessibility acceptance criteria must be testable in implementation.\n" +
      "\n## Rules: Don't\n" +
      "- Do not allow low-contrast text or hidden focus indicators.\n" +
      "- Do not introduce one-off spacing or typography exceptions.\n" +
      "- Do not use ambiguous labels or non-descriptive actions.\n" +
      "- Do not ship component guidance without explicit state rules.\n" +
      "\n## Guideline Authoring Workflow\n" +
      "1. Restate design intent in one sentence.\n" +
      "2. Define foundations and semantic tokens.\n" +
      "3. Define component anatomy, variants, interactions, and state behavior.\n" +
      "4. Add accessibility acceptance criteria with pass/fail checks.\n" +
      "5. Add anti-patterns, migration notes, and edge-case handling.\n" +
      "6. End with a QA checklist.\n" +
      "\n## Required Output Structure\n" +
      "- Context and goals.\n" +
      "- Design tokens and foundations.\n" +
      "- Component-level rules (anatomy, variants, states, responsive behavior).\n" +
      "- Accessibility requirements and testable acceptance criteria.\n" +
      "- Content and tone standards with examples.\n" +
      "- Anti-patterns and prohibited implementation.\n" +
      "- QA checklist.\n" +
      "\n## Component Rule Expectations\n" +
      "- Include keyboard, pointer, and touch behavior.\n" +
      "- Include spacing and typography token requirements.\n" +
      "- Include long-content, overflow, and empty-state handling.\n" +
      "- Include known page component density: " + (componentNotes || "not enough evidence from extraction") + ".\n" +
      diagnosticsNote + "\n" +
      "\n## Quality Gates\n" +
      "- Every non-negotiable rule must use \"must\".\n" +
      "- Every recommendation should use \"should\".\n" +
      "- Every accessibility rule must be testable in implementation.\n" +
      "- Teams should prefer system consistency over local visual exceptions.\n";
  }

  function inferSystemName(title) {
    if (!title) return "Extracted Design System";
    var clean = title.replace(/\s*\|\s*.*/g, "").replace(/\s*-\s*.*/g, "").trim();
    return clean || "Extracted Design System";
  }

  function inferVisualStyle(normalized) {
    var colorCount = normalized.colorPalette.length;
    var spacingCount = normalized.spacingScale.length;
    if (colorCount >= 8 && spacingCount >= 6) return "structured, tokenized, content-first";
    if (colorCount >= 5) return "clean, functional, implementation-oriented";
    return "minimal, utility-first, accessibility-prioritized";
  }

  function formatMainFontStyle(mainFontStyle) {
    if (!mainFontStyle || !mainFontStyle.familyStack) {
      return "No reliable primary font family detected from computed styles.";
    }
    var family = "`font.family.primary=" + (mainFontStyle.primaryFamily || mainFontStyle.familyStack) + "`";
    var stack = mainFontStyle.familyStack ? "`font.family.stack=" + mainFontStyle.familyStack + "`" : "";
    var size = mainFontStyle.size ? "`font.size.base=" + mainFontStyle.size + "`" : "";
    var weight = mainFontStyle.weight ? "`font.weight.base=" + mainFontStyle.weight + "`" : "";
    var lineHeight = mainFontStyle.lineHeight ? "`font.lineHeight.base=" + mainFontStyle.lineHeight + "`" : "";
    return [family, stack, size, weight, lineHeight].filter(Boolean).join(", ");
  }

  function joinTokens(rows, limit) {
    if (!rows || rows.length === 0) {
      return "No reliable extraction yet; teams should define explicit semantic tokens manually.";
    }
    return rows.slice(0, limit).map(function (row) { return "`" + row.token + "=" + row.value + "`"; }).join(", ");
  }

  function joinTokenGroups(groups, limitPerGroup) {
    var lines = groups
      .filter(function (rows) { return rows && rows.length > 0; })
      .map(function (rows) { return rows.slice(0, limitPerGroup).map(function (row) { return "`" + row.token + "=" + row.value + "`"; }).join(", "); });
    if (lines.length === 0) {
      return "No reliable extraction yet; motion and shape tokens should be defined manually.";
    }
    return lines.join(" | ");
  }

  window.__DS = window.__DS || {};
  window.__DS.generate = generateDesignMarkdown;
})();
