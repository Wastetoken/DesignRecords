/**
 * design-scope-skill-generate.js
 * Browser-compatible port of generate-design-scope/generate-skill-md.mjs
 * Exposes window.__DS.generateSkill(context)
 */
(function () {
  "use strict";

  function generateSkillMarkdown(context) {
    var normalized = context.normalized;
    var metadata = context.metadata || {};
    var siteProfile = normalized.siteProfile || {};
    var systemName = metadata.systemName || inferSystemName(normalized.source ? normalized.source.title : null);
    var slug = slugify(metadata.scope || metadata.brand || systemName || "extracted");
    var brand = metadata.brand || systemName;
    var extractionUrl = (normalized.source && normalized.source.url) || "Unknown URL";
    var audience = metadata.audience || siteProfile.audience || "website visitors and product users";
    var productSurface = metadata.productSurface || siteProfile.productSurface || "web app";

    var mainFontStyle = formatMainFontStyle(normalized.mainFontStyle);
    var typographyScale = joinTokens(normalized.typographyScale, 8);
    var colors = joinTokens(normalized.colorPalette, 10);
    var spacing = joinTokens(normalized.spacingScale, 8);
    var radiusShadowMotion = joinTokenGroups([normalized.radiusTokens, normalized.shadowTokens, normalized.motionDurationTokens], 8);

    return "---\n" +
      "name: design-system-" + slug + "\n" +
      "description: Creates implementation-ready design-system guidance with tokens, component behavior, and accessibility standards. Use when creating or updating UI rules, component specifications, or design-system documentation.\n" +
      "---\n" +
      "\n<!-- TYPEUI_SH_MANAGED_START -->\n" +
      "\n# " + systemName + "\n" +
      "\n## Mission\n" +
      "Deliver implementation-ready design-system guidance for " + brand + " that can be applied consistently across " + productSurface + " interfaces.\n" +
      "\n## Brand\n" +
      "- Product/brand: " + brand + "\n" +
      "- URL: " + extractionUrl + "\n" +
      "- Audience: " + audience + "\n" +
      "- Product surface: " + productSurface + "\n" +
      "\n## Style Foundations\n" +
      "- Visual style: structured, accessible, implementation-first\n" +
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
      "concise, confident, implementation-focused\n" +
      "\n## Rules: Do\n" +
      "- Use semantic tokens, not raw hex values in component guidance.\n" +
      "- Every component must define required states: default, hover, focus-visible, active, disabled, loading, error.\n" +
      "- Responsive behavior and edge-case handling should be specified for every component family.\n" +
      "- Accessibility acceptance criteria must be testable in implementation.\n" +
      "\n## Rules: Don't\n" +
      "- Do not allow low-contrast text or hidden focus indicators.\n" +
      "- Do not introduce one-off spacing or typography exceptions.\n" +
      "- Do not use ambiguous labels or non-descriptive actions.\n" +
      "\n## Guideline Authoring Workflow\n" +
      "1. Restate design intent in one sentence.\n" +
      "2. Define foundations and tokens.\n" +
      "3. Define component anatomy, variants, and interactions.\n" +
      "4. Add accessibility acceptance criteria.\n" +
      "5. Add anti-patterns and migration notes.\n" +
      "6. End with QA checklist.\n" +
      "\n## Required Output Structure\n" +
      "- Context and goals\n" +
      "- Design tokens and foundations\n" +
      "- Component-level rules (anatomy, variants, states, responsive behavior)\n" +
      "- Accessibility requirements and testable acceptance criteria\n" +
      "- Content and tone standards with examples\n" +
      "- Anti-patterns and prohibited implementations\n" +
      "- QA checklist\n" +
      "\n## Component Rule Expectations\n" +
      "- Include keyboard, pointer, and touch behavior.\n" +
      "- Include spacing and typography token requirements.\n" +
      "- Include long-content, overflow, and empty-state handling.\n" +
      "\n## Quality Gates\n" +
      "- Every non-negotiable rule must use \"must\".\n" +
      "- Every recommendation should use \"should\".\n" +
      "- Every accessibility rule must be testable in implementation.\n" +
      "- Prefer system consistency over local visual exceptions.\n" +
      "\n<!-- TYPEUI_SH_MANAGED_END -->\n";
  }

  function inferSystemName(title) {
    if (!title) return "Extracted Design System";
    var clean = title.replace(/\s*\|\s*.*/g, "").replace(/\s*-\s*.*/g, "").trim();
    return clean || "Extracted Design System";
  }

  function slugify(value) {
    return String(value || "extracted")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);
  }

  function sampleAcrossRange(items, limit) {
    if (items.length <= limit) return items;
    return Array.from({ length: limit }, function (_, i) {
      return items[Math.round((i * (items.length - 1)) / (limit - 1))];
    });
  }

  function joinTokens(rows, limit) {
    if (!rows || rows.length === 0) {
      return "manual token definitions required";
    }
    return sampleAcrossRange(rows, limit).map(function (row) { return "`" + row.token + "=" + row.value + "`"; }).join(", ");
  }

  function joinTokenGroups(groups, limitPerGroup) {
    var lines = groups
      .filter(function (rows) { return rows && rows.length > 0; })
      .map(function (rows) { return sampleAcrossRange(rows, limitPerGroup).map(function (row) { return "`" + row.token + "=" + row.value + "`"; }).join(", "); });
    if (lines.length === 0) {
      return "manual token definitions required";
    }
    return lines.join(" | ");
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

  window.__DS = window.__DS || {};
  window.__DS.generateSkill = generateSkillMarkdown;
})();
