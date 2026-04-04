# WebWaka OS v4 - Platform Documentation

## Overview
This is the centralized documentation repository for the WebWaka OS v4 platform — an AI-native, multi-tenant SaaS operating system designed for Nigeria, Africa, and emerging markets.

This Repl serves a static Markdown documentation viewer over HTTP.

## Architecture
- **Runtime:** Node.js 20
- **Server:** `server.js` — a lightweight HTTP server that renders all `.md` files as HTML pages
- **Port:** 5000 (webview)
- **Host:** 0.0.0.0

## Running
The app starts via the "Start application" workflow which runs:
```
node server.js
```

## Documentation Structure
- Root `.md` files — core governance, architecture, roadmaps, QA reports, and bootstrap guides
- `docs/enhancements/` — per-vertical enhancement plans and QA certifications
- `docs/manus-research/` — research reports and synthesis documents
- `qa-reports/` — QA reports and production clearance certificates

## Key Documents
- `WebWakaDigitalOperatingSystem.md` — Master architecture blueprint
- `PLATFORM_ROADMAP.md` — Epic execution roadmap
- `FACTORY-STATE-REPORT.md` — Current factory status
- `WEBWAKA-MANUS-BOOTSTRAP.md` — Bootstrap prompt for new worker nodes
