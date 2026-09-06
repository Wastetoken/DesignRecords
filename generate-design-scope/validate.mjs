const REQUIRED_HEADINGS = [
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

const REQUIRED_STATES = [
  "default",
  "hover",
  "focus-visible",
  "active",
  "disabled",
  "loading",
  "error"
];

export function validateMarkdownOutput(mode, markdown) {
  const errors = [];
  const warnings = [];
  const checks = [];

  if (mode === "skill") {
    runCheck(markdown.startsWith("---"), "Frontmatter block exists", checks, errors);
    runCheck(markdown.includes("name: design-system-"), "Frontmatter includes design-system name", checks, errors);
    runCheck(markdown.includes("description:"), "Frontmatter includes description", checks, errors);
    runCheck(
      markdown.includes("<!-- TYPEUI_SH_MANAGED_START -->") &&
        markdown.includes("<!-- TYPEUI_SH_MANAGED_END -->"),
      "Managed block markers exist",
      checks,
      errors
    );
  }

  for (const heading of REQUIRED_HEADINGS) {
    runCheck(markdown.includes(heading), `Required section present: ${heading}`, checks, errors);
  }

  for (const state of REQUIRED_STATES) {
    if (!markdown.toLowerCase().includes(state)) {
      warnings.push(`Missing explicit state mention: ${state}`);
    }
  }

  if (!markdown.includes("WCAG 2.2 AA")) {
    errors.push("Accessibility target 'WCAG 2.2 AA' is missing.");
  } else {
    checks.push({ label: "Accessibility target included", ok: true });
  }

  if (!markdown.includes("must")) {
    warnings.push("No 'must' wording detected for non-negotiable rules.");
  } else {
    checks.push({ label: "Contains non-negotiable rule wording", ok: true });
  }

  if (!markdown.includes("should")) {
    warnings.push("No 'should' wording detected for recommendation rules.");
  } else {
    checks.push({ label: "Contains recommendation wording", ok: true });
  }

  runNumericSanityChecks(markdown, checks, errors, warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    checks
  };
}

function runNumericSanityChecks(markdown, checks, errors, warnings) {
  const tokens = extractTokenValues(markdown);

  if (tokens.length === 0) {
    warnings.push("No token values found in markdown for numeric sanity checks.");
    return;
  }

  const zeroTokens = tokens.filter((t) => t.numericValue === 0);
  runCheck(
    zeroTokens.length === 0,
    `No token value equals 0 (${zeroTokens.length} found)`,
    checks,
    errors
  );

  const fontSizes = tokens.filter((t) => t.token.startsWith("font.size.") && t.token !== "font.size.base");
  const baseFontMatch = markdown.match(/`font\.size\.base=(\d+(?:\.\d+)?)px`/);
  if (fontSizes.length > 0 && baseFontMatch) {
    const maxSize = Math.max(...fontSizes.map((t) => t.numericValue));
    const baseSize = parseFloat(baseFontMatch[1]);
    runCheck(
      maxSize >= baseSize,
      `Largest typography value (${maxSize}px) >= base font size (${baseSize}px)`,
      checks,
      errors
    );
  }

  const spacingTokens = tokens.filter((t) => t.token.startsWith("space."));
  if (spacingTokens.length >= 2) {
    const minSpace = Math.min(...spacingTokens.map((t) => t.numericValue));
    const maxSpace = Math.max(...spacingTokens.map((t) => t.numericValue));
    const span = maxSpace - minSpace;
    runCheck(
      span >= 24,
      `Spacing scale spans at least 24px (actual: ${span}px)`,
      checks,
      errors
    );
  }
}

function extractTokenValues(markdown) {
  const tokens = [];
  const pattern = /`([^`]+)=([^`]+)`/g;
  let match;
  while ((match = pattern.exec(markdown)) !== null) {
    const numericMatch = match[2].match(/^(\d+(?:\.\d+)?)/);
    tokens.push({
      token: match[1],
      rawValue: match[2],
      numericValue: numericMatch ? parseFloat(numericMatch[1]) : NaN
    });
  }
  return tokens;
}

function runCheck(condition, label, checks, errors) {
  if (condition) {
    checks.push({ label, ok: true });
    return;
  }
  checks.push({ label, ok: false });
  errors.push(label);
}
