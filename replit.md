# WebWaka OS v4 — Documentation Platform

## Overview
Full-featured documentation platform for WebWaka OS v4 — an AI-native, multi-tenant SaaS operating system for Nigeria, Africa, and emerging markets. Built from the implementation plan in `attached_assets/DOC_IMPLEMENTATION_PLAN_1775296647062.md`.

## Architecture
- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Port:** 5000 (webview, host 0.0.0.0)
- **Entry point:** `server.js`
- **Static assets:** `public/`
- **Server modules:** `src/`

## Implemented Features (All 20 from Enhancement Backlog)

| # | Feature | Status | Where |
|---|---------|--------|-------|
| 1 | Automated OpenAPI Generation | ✅ | `openapi.json` + `.github/workflows/generate-openapi.yml` |
| 2 | Interactive API Explorer | ✅ | `/api-explorer` (Swagger UI CDN) |
| 3 | AI Translation Pipeline | ✅ | `translations/` + GitHub Actions workflow |
| 4 | Versioned Documentation | ✅ | Version selector → `versions/v1.x/`, `versions/v4.x/` |
| 5 | Interactive Tutorials | ✅ | `content/tutorials/` (3 tutorials) |
| 6 | Global Search | ✅ | Full-text search via `/api/search`, `src/utils/search-index.js` |
| 7 | Architecture Decision Records | ✅ | `content/adrs/` (3 ADRs) |
| 8 | Changelog Generator | ✅ | `/changelog` from Git log, `src/changelog.js` |
| 9 | Tenant Onboarding Guide | ✅ | `COMMERCE_TENANT_ONBOARDING_GUIDE.md` + Tutorial 2 |
| 10 | Developer Portal | ✅ | `content/developer-portal.md` |
| 11 | Security & Compliance Hub | ✅ | `content/security-compliance.md` |
| 12 | Webhooks Reference | ✅ | `content/webhooks.md` |
| 13 | UI Component Library | ✅ | Documented in `content/sdk-docs.md` |
| 14 | Error Code Glossary | ✅ | `content/error-codes.md` |
| 15 | Postman Collection Generator | ✅ | `/postman` + `/api/postman/download` + `/api/postman/environment` |
| 16 | SDK Documentation | ✅ | `content/sdk-docs.md` (Node.js, Python, PHP) |
| 17 | Contribution Guidelines | ✅ | `content/contribution-guidelines.md` |
| 18 | Platform Status Integration | ✅ | Status widget in header, `/status` page, `/api/status` |
| 19 | Feedback Widget | ✅ | Thumbs up/down on every page, `src/feedback-store.js`, `/api/feedback` |
| 20 | Dark Mode Support | ✅ | CSS custom properties + localStorage toggle in header |

## File Structure

```
server.js               Main Express server
src/
  utils/
    nav-builder.js      Navigation + breadcrumb builder
    markdown.js         Markdown renderer
    search-index.js     Full-text search engine
  changelog.js          Git log changelog generator
  feedback-store.js     Feedback vote storage (JSON)
public/
  css/main.css          Full design system (dark/light theme)
  js/main.js            Frontend: search, theme, TOC, feedback, copy buttons
content/
  adrs/                 Architecture Decision Records (ADR-001, 002, 003)
  tutorials/            Interactive tutorials (01, 02, 03)
  error-codes.md        Comprehensive error code glossary
  webhooks.md           Webhooks reference with payload schemas
  security-compliance.md NDPR/PCI-DSS/ISO 27001 documentation
  sdk-docs.md           Node.js/Python/PHP SDK documentation
  developer-portal.md   Third-party developer guide
  contribution-guidelines.md Open source contribution guide
translations/
  fr/README.md          French translation
  sw/README.md          Swahili translation
  ar/README.md          Arabic translation
versions/
  v1.x/README.md        Legacy v1.x documentation with migration guide
openapi.json            Full OpenAPI 3.1 spec (Auth, Tenants, Commerce, Fintech, Transport, AI, Webhooks)
.github/workflows/
  generate-openapi.yml  CI: validate OpenAPI, generate Postman, auto-translate
feedback/feedback.json  Feedback vote storage (auto-created)
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/search?q=<query>` | GET | Full-text search across all docs |
| `/api/feedback` | GET | Get feedback counts for a doc |
| `/api/feedback` | POST | Submit feedback vote + comment |
| `/api/status` | GET | Platform status JSON |
| `/api/raw/<path>` | GET | Raw Markdown content |
| `/api/postman/download` | GET | Download Postman collection JSON |
| `/api/postman/environment?env=staging\|production` | GET | Download Postman environment |
| `/openapi.json` | GET | OpenAPI 3.1 specification |

## Running
Start via "Start application" workflow: `node server.js`
