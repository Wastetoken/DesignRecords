/**
 * design-scope-validate.js
 * Browser-compatible port of generate-design-scope/validate.mjs
 * Exposes window.__DS.validate(mode, markdown)
 */
(function () {
  "use strict";

  var REQUIRED_HEADINGS = [
    "## Mission",
    "## Brand",
    "## Style Foundations",
    "## Accessibility",
    "## Writing Tone",
    "## Rules: Do",
    "## Rules: Don't",
    "## Guideline Authoring Workflow",
    "## Required Output Structure",
    "## Component Rule Expectations",
    "## Quality Gates"
  ];

  var REQUIRED_STATES = [
    "default", "hover", "focus-visible", "active", "disabled", "loading", "error"
  ];

  function validateMarkdownOutput(mode, markdown) {
    var errors = [];
    var warnings = [];
    var checks = [];

    if (mode === "skill") {
      runCheck(markdown.startsWith("---"), "Frontmatter block exists", checks, errors);
      runCheck(markdown.indexOf("name: design-system-") !== -1, "Frontmatter includes design-system name", checks, errors);
      runCheck(markdown.indexOf("description:") !== -1, "Frontmatter includes description", checks, errors);
      runCheck(
        markdown.indexOf("<!-- TYPEUI_SH_MANAGED_START -->") !== -1 && markdown.indexOf("<!-- TYPEUI_SH_MANAGED_END -->") !== -1,
        "Managed block markers exist", checks, errors
      );
    }

    for (var i = 0; i < REQUIRED_HEADINGS.length; i++) {
      runCheck(markdown.indexOf(REQUIRED_HEADINGS[i]) !== -1, "Required section present: " + REQUIRED_HEADINGS[i], checks, errors);
    }

    for (var j = 0; j < REQUIRED_STATES.length; j++) {
      if (markdown.toLowerCase().indexOf(REQUIRED_STATES[j]) === -1) {
        warnings.push("Missing explicit state mention: " + REQUIRED_STATES[j]);
      }
    }

    if (markdown.indexOf("WCAG 2.2 AA") === -1) {
      errors.push("Accessibility target 'WCAG 2.2 AA' is missing.");
    } else {
      checks.push({ label: "Accessibility target included", ok: true });
    }

    if (markdown.indexOf("must") === -1) {
      warnings.push("No 'must' wording detected for non-negotiable rules.");
    } else {
      checks.push({ label: "Contains non-negotiable rule wording", ok: true });
    }

    if (markdown.indexOf("should") === -1) {
      warnings.push("No 'should' wording detected for recommendation rules.");
    } else {
      checks.push({ label: "Contains recommendation wording", ok: true });
    }

    return { isValid: errors.length === 0, errors: errors, warnings: warnings, checks: checks };
  }

  function runCheck(condition, label, checks, errors) {
    if (condition) {
      checks.push({ label: label, ok: true });
    } else {
      checks.push({ label: label, ok: false });
      errors.push(label);
    }
  }

  window.__DS = window.__DS || {};
  window.__DS.validate = validateMarkdownOutput;
})();
