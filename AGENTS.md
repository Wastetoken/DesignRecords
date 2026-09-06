# Scroll Capture — Base44 Dev Environment

## What this project is
A **Chrome Manifest V3 browser extension** ("Scroll Capture") that records
websites and automates scrolling/mouse actions for portfolio screen captures.
It is NOT a web application — it relies on Chrome extension APIs
(`chrome.tabs`, `chrome.scripting`, `chrome.tabCapture`, `chrome.offscreen`,
`chrome.storage`) that only exist inside the extension runtime.

## Running in Base44
The extension cannot function as a web app served over HTTP. Instead, an
`index.html` landing page is served via nginx on port 3000, showing the
extension's info, install instructions, and a static preview of its popup UI.

- `docker-compose.base44.yml` — nginx:alpine serving the repo root on port 3000
- `nginx.conf` — custom config running nginx as root (host dir is mode 700)
- `index.html` — landing page (not part of the extension itself)

## To actually use the extension
Load it as an unpacked extension in Chrome: `chrome://extensions` → Developer
mode → Load unpacked → select this folder.

## No secrets required
The extension has Google Analytics placeholders (`<measurement_id>`,
`<api_secret>`) in `background.js` but they are non-functional placeholders and
not required for the extension to load.
