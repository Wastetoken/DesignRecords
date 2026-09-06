# Scroll Capture — Base44 Dev Environment

## What this is
A Chrome Manifest V3 browser extension ("Scroll Capture") that records website
video with automated scrolling and also extracts design tokens to generate a
`DESIGN.md` file. It is NOT a web app — it runs as an installed Chrome extension.

## Running in the preview
The extension itself can't run in a browser tab, so the preview serves a static
landing page via nginx on port 3000 that describes the extension and shows its
popup UI.

- `docker compose -f docker-compose.base44.yml up -d` starts nginx
- Health check: `curl -sf http://localhost:3000/`
- The landing page is `index.html` at the repo root

## Architecture
- `manifest.json` — MV3 manifest (permissions: activeTab, offscreen, scripting, storage, tabCapture, downloads)
- `background.js` — Service worker; handles messaging, tab capture, design extraction injection, and DESIGN.md download
- `content.js` — Main content script (bundled/minified); builds the in-page recording UI
- `noscript.html` / `noscript.js` — Extension popup; shows Record Video and Extract DESIGN.md options
- `offscreen.js` / `offscreen.html` — Offscreen document for media recording via ffmpeg.wasm

## DESIGN.md Extractor
Added to the extension alongside the existing video capture feature:
- `design-scope-normalize.js` — Port of `generate-design-scope/normalize.mjs`; normalizes extracted CSS into design tokens
- `design-scope-generate.js` — Port of `generate-design-scope/generate-design-md.mjs`; generates DESIGN.md markdown
- `design-scope-skill-generate.js` — Port of `generate-design-scope/generate-skill-md.mjs`; generates SKILL.md markdown
- `design-scope-validate.js` — Port of `generate-design-scope/validate.mjs`; validates the generated markdown (includes numeric sanity checks)
- `design-scope.js` — Page-level style extractor; samples visible elements, builds payload, calls normalize → generate → validate

### Flow
1. User clicks extension icon → popup (`noscript.html`) shows options
2. "Extract DESIGN.md" sends `scrollCaptureExtractDesign` message to background
3. "Extract SKILL.md" sends `scrollCaptureExtractSkill` message to background
4. Background injects the `design-scope-*.js` files into the active tab
5. `design-scope.js` samples visible elements, extracts computed styles + site signals
6. Normalize → Generate → Validate produces the DESIGN.md or SKILL.md markdown
7. Result returns to popup for preview and download
8. DESIGN/SKILL extraction is also available as icon tabs in the in-page panel (content.js)

## Secrets
None required. All logic runs locally in the browser.
