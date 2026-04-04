# WEBWAKA-PLATFORM-DOCS: Deep Research + Enhancement Taskbook + QA Prompt Factory

**Repository:** `WebWakaDOS/webwaka-platform-docs`  
**Prepared:** April 2026  
**Analyst Role:** Expert Researcher, Platform Analyst, Enhancement Architect, QA Planner  
**Ecosystem Context:** This repo is one component in the 17-repository WebWaka OS v4 multi-repo platform. It must not be treated as standalone. All implementations must respect shared contracts, cross-repo dependencies, and the 7 Core Invariants.

---

## PART 1: REPO DEEP UNDERSTANDING

### 1.1 Repository Purpose

`webwaka-platform-docs` is the **official documentation platform** for WebWaka OS v4 — a multi-tenant, offline-first, AI-native SaaS operating system built for Nigerian SMEs and the broader African market. It serves as the developer-facing knowledge hub for the entire 17-repository ecosystem, including API references, architecture decisions, onboarding guides, SDK documentation, webhooks, security policies, and governance records.

### 1.2 Repository Structure

```
webwaka-platform-docs/
├── server.js                        # Express.js 5 app (698 lines, 20+ routes)
├── openapi.json                     # OpenAPI 3.1 spec (11 paths, 21 schemas)
├── package.json                     # Dependencies + npm scripts
├── tsconfig.json                    # TypeScript config for scripts/
├── jest.config.js                   # Jest configuration (80% coverage thresholds)
│
├── src/
│   ├── utils/
│   │   ├── nav-builder.js           # Navigation tree builder
│   │   ├── markdown.js              # Marked + sanitize-html renderer
│   │   └── search-index.js         # lunr-based full-text search
│   ├── changelog.js                 # simple-git changelog generator
│   └── feedback-store.js           # JSON-file feedback storage
│
├── scripts/                         # TypeScript CI/build scripts
│   ├── generate-openapi.ts          # AST-based OpenAPI merge/validation
│   ├── translate.ts                 # AI translation pipeline (CORE-5)
│   ├── check-links.ts               # Broken link detector
│   ├── build-validate.ts            # 27-point build validation
│   └── *.test.ts                    # Unit tests (150 tests, 97.3% coverage)
│
├── content/                         # Extended documentation content
│   ├── adrs/                        # Architecture Decision Records (3 ADRs)
│   ├── tutorials/                   # Step-by-step tutorials (3 tutorials)
│   ├── error-codes.md
│   ├── webhooks.md
│   ├── security-compliance.md
│   ├── sdk-docs.md
│   ├── developer-portal.md
│   └── contribution-guidelines.md
│
├── translations/                    # AI-translated docs
│   ├── fr/README.md                 # French
│   ├── sw/README.md                 # Swahili
│   └── ar/README.md                 # Arabic
│
├── versions/
│   └── v1.x/README.md              # Legacy v1 docs with migration guide
│
├── public/
│   ├── css/main.css                 # Full dark/light design system
│   ├── js/main.js                   # Frontend: search, TOC, feedback, copy
│   ├── manifest.json                # PWA Web App Manifest
│   └── sw.js                        # Service Worker (cache-first + offline fallback)
│
├── .github/workflows/
│   └── generate-openapi.yml         # CI: validate, generate Postman, auto-translate
│
├── feedback/
│   └── feedback.json                # Feedback storage (JSON file — no DB)
│
└── docs/                            # Governance docs (implementation plans, QA certs)
```

### 1.3 Implemented Features

| Feature | Route/Endpoint | Implementation |
|---------|---------------|----------------|
| Markdown doc viewer | `/doc/*` | Express + marked + sanitize-html |
| Full-text search | `/api/search?q=` | lunr.js in-memory index |
| Interactive API Explorer | `/api-explorer` | Swagger UI CDN (v5) |
| Platform status | `/status`, `/api/status` | Hardcoded service list |
| Git changelog | `/changelog` | simple-git log parser |
| Postman collection | `/postman`, `/api/postman/download` | Generated from openapi.json |
| Versioned docs | `/versions/:version` | Static Markdown files |
| AI translations | `/translations/fr|sw|ar` | Pre-generated Markdown files |
| Feedback widget | `/api/feedback` GET+POST | JSON file storage |
| Dark/light mode | All pages | CSS custom properties + localStorage |
| PWA support | `/manifest.json` + `/sw.js` | Service Worker with cache strategies |
| Security headers | All routes | helmet + CSP + X-Content-Type-Options |
| OpenAPI spec | `/openapi.json` | Manually maintained (11 paths) |
| ADRs | `/doc/content/adrs/*` | 3 Markdown ADRs |
| Tutorials | `/doc/content/tutorials/*` | 3 step-by-step guides |
| SDK docs | `/doc/content/sdk-docs.md` | Node.js, Python, PHP |
| Webhooks reference | `/doc/content/webhooks.md` | Event catalog + schemas |
| Error code glossary | `/doc/content/error-codes.md` | Comprehensive table |
| Security hub | `/doc/content/security-compliance.md` | NDPR, PCI-DSS, ISO 27001 |
| Developer portal | `/doc/content/developer-portal.md` | OAuth, marketplace, sandbox |
| Contribution guidelines | `/doc/content/contribution-guidelines.md` | PR workflow, commit format |

### 1.4 Known Bugs and Gaps

**Bug 1 — `sanitizeContent()` Defined But Not Used in Routes**
`server.js` defines a `sanitizeContent()` function at the module level but never calls it in route handlers. Rendered HTML is passed through `renderMarkdown()` (which does sanitize internally via `src/utils/markdown.js`), but the module-level function is dead code. This creates a false sense of security if someone modifies `markdown.js` to remove sanitization.

**Bug 2 — Feedback Storage Has No Rate Limiting or Validation**
The `POST /api/feedback` endpoint accepts any JSON payload and appends to `feedback/feedback.json` without request rate limiting, no IP-based throttling, no content length cap beyond the global `50kb` body limit. Malicious actors can flood the feedback store to fill disk space.

**Bug 3 — Search Index Rebuilt on Every Request**
`src/utils/search-index.js` builds the lunr index on every `GET /api/search` call by reading all Markdown files from disk. With a large doc set this causes latency spikes. The index should be built once at startup and cached in memory.

**Bug 4 — Platform Status is Hardcoded**
`SERVICES` in `server.js` is a static array with all services hardcoded as `operational`. There is no live polling of the actual `webwaka-platform-status` repository's API. The status badge in the header is therefore always green, even if services are degraded.

**Bug 5 — `lunr` Imported in `package.json` But Search Uses Manual Implementation**
`lunr` is listed as a dependency but `src/utils/search-index.js` contains a hand-rolled search using `toLowerCase().includes()` scoring. The `lunr` package is not actually used. This results in weaker relevance ranking and wasted bundle weight.

**Bug 6 — openapi.json Has Only 11 Paths**
The actual WebWaka platform exposes hundreds of API endpoints across `webwaka-core`, `webwaka-commerce`, `webwaka-transport`, `webwaka-logistics`, `webwaka-professional`, and `webwaka-civic`. The current spec covers only 11 paths across 7 tag groups — a fraction of the real API surface.

**Bug 7 — Service Worker Cache Name is Hardcoded**
`public/sw.js` uses `const CACHE_NAME = 'webwaka-docs-v4-1'` with a hardcoded version. Cache busting requires a manual edit to this constant. It should be derived from a build hash or `package.json` version automatically.

**Bug 8 — PWA Icons Are Referenced But Not Generated**
`public/manifest.json` references `/icons/icon-192.png` and `/icons/icon-512.png`, but neither the `public/icons/` directory nor these files exist. This causes PWA installation to fail silently in browsers that check for icons.

**Bug 9 — Changelog Fails Gracefully But Without Notification**
`src/changelog.js` catches all `simple-git` errors and returns a fallback single entry. If git history is unavailable (shallow clone in CI, or on a fresh deploy), the page silently shows a stub. Users cannot distinguish between "no commits" and "git error."

**Bug 10 — `feedback.json` Grows Without Archiving**
`feedback/feedback.json` is never trimmed, archived, or rotated. Over time in production it will grow unbounded. There is no TTL, max-entry limit, or archival job.

**Bug 11 — No `sitemap.xml` or Robots.txt**
There is no dynamic `sitemap.xml` generated from the Markdown file list, and no `robots.txt`. Both are required for effective SEO indexing of the documentation site.

**Bug 12 — No Rate Limiting on `/api/search`**
The search endpoint reads all Markdown files on every call (Bug 3) and has no throttling. A trivial loop can cause sustained disk I/O and CPU spikes.

**Bug 13 — Translations Are Pre-Generated Stubs, Not Real AI Output**
The `translations/fr/README.md`, `translations/sw/README.md`, and `translations/ar/README.md` contain hand-written placeholder translations, not the output of the `scripts/translate.ts` CORE-5 pipeline. The pipeline exists in CI but has never actually been run against the full doc corpus.

**Bug 14 — `package.json` `main` Field Points to `index.js` (Non-Existent)**
`package.json` has `"main": "index.js"` but no `index.js` exists. The entry point is `server.js`.

### 1.5 Cross-Repo Dependencies

| Dependency | Source Repo | How Used |
|-----------|-------------|----------|
| OpenAPI route definitions | `webwaka-commerce`, `webwaka-transport`, `webwaka-core`, etc. | Should be cloned and merged by CI workflow |
| Platform status feed | `webwaka-platform-status` | `/api/status` should poll this service |
| CORE-5 AI completions | `webwaka-core` (CORE-5 module) | `scripts/translate.ts` calls `getAICompletion` |
| `@webwaka/core` npm package | `webwaka-core` | SDK docs reference it; not installed locally |
| Event Bus Schema | `EVENT_BUS_SCHEMA.md` in this repo | Documents the canonical schema used cross-repo |
| JWT signing keys | `webwaka-core` auth module | API Explorer "Try it out" needs staging keys |
| Tenant sandbox | `webwaka-core` tenant provisioner | Developer portal references sandbox creation |

---

## PART 2: EXTERNAL BEST-PRACTICE RESEARCH

### 2.1 World-Class Documentation Platforms (Benchmarks)

| Platform | Key Best Practices Observed |
|---------|----------------------------|
| **Stripe Docs** | Version switcher, per-endpoint code examples in 8 languages, live "Try it" with real sandbox, instant search (Algolia DocSearch), changelogs per endpoint, dark mode, reading time estimates |
| **Twilio Docs** | AI-powered search suggestions, community discussion threads per page, per-language SDK tabs, automated broken-link CI, deploy preview per PR |
| **Mintlify** | MDX components for interactive examples, analytics per page (views, time-on-page), "Was this helpful?" with follow-up prompts, OpenAPI auto-sync |
| **ReadMe.io** | API Explorer with real API calls, per-developer custom API keys injected into code snippets, metrics on API call success rates from docs |
| **Cloudflare Docs** | Mermaid.js diagrams, inline video, per-page last-edited date from Git, Algolia search, GitHub PRs for community edits |
| **Vercel Docs** | Next.js static generation for sub-second loads, ISR for changelogs, breadcrumb SEO structured data, sitemap.xml auto-generation |
| **Kong Dev Portal** | Tenant-scoped API keys embedded in docs, per-tenant sandbox environment, SDK download per tenant, webhook testing console |

### 2.2 Nigerian/African Developer Experience Standards

- **Nigeria-First Language**: English with Pidgin glossary support, Swahili for East Africa, French for Francophone West Africa
- **Low-Bandwidth Optimization**: Static export + Cloudflare CDN, offline-first PWA for unreliable connectivity
- **Local Payment Integration Examples**: Paystack, Flutterwave, Barter code examples in all SDK tabs
- **Local SMS/OTP Examples**: Termii, Yournotify integration examples
- **NGN/KES/GHS Currency Handling**: Currency formatting examples with Intl.NumberFormat for African currencies
- **NDPR Compliance**: Nigerian Data Protection Regulation compliance section in security docs
- **Mobile-First**: 80%+ of African developers access docs on mobile; responsive design is non-negotiable

### 2.3 OpenAPI and API Documentation Best Practices

- **Spectral linting**: Custom ruleset extending OWASP OpenAPI ruleset (already in CI)
- **Automated extraction**: Parse TypeScript decorators from source repos (partially implemented)
- **Overlay support**: OpenAPI Overlays (OpenAPI 3.2 feature) for environment-specific overrides
- **AsyncAPI**: WebSocket and event-driven API documentation should use AsyncAPI 3.x alongside OpenAPI
- **Examples in schemas**: Every schema should have `example` values, especially for African-specific fields (phone: "+2348012345678")
- **Deprecation markers**: `deprecated: true` with `x-deprecation-date` and migration guide link
- **Operation IDs**: Every operation needs a stable `operationId` for SDK code generation

### 2.4 PWA/Offline Documentation Standards

- **Workbox**: Industry standard for PWA service worker management (stale-while-revalidate, background sync)
- **IndexedDB for search**: Cache the search index in IndexedDB for offline full-text search
- **Precaching strategy**: Precache all HTML shells; lazily cache content on first visit
- **Periodic background sync**: Refresh cached content every 24 hours in background
- **Web Share API**: "Share this page" integration for mobile doc sharing

### 2.5 Security Standards for Developer Portals

- **PKCE OAuth flow**: For the API Explorer "Try it out" — never redirect with `client_secret` exposed
- **API key scoping**: Developer sandbox keys should be read-only and rate-limited
- **CSP reporting**: `Content-Security-Policy-Report-Only` with a report-to endpoint for monitoring violations
- **SRI hashes**: Subresource Integrity hashes on all CDN-loaded scripts and styles (Swagger UI CDN)
- **CORS per-origin**: API endpoints should enforce per-origin CORS, not wildcard

### 2.6 Search and Discoverability Standards

- **Algolia DocSearch**: Free for open-source documentation; indexes automatically on crawl
- **Vector search**: AI-powered semantic search (beyond keyword matching) using embeddings
- **Search analytics**: Track top queries with no results to identify doc gaps
- **TypeSense**: Self-hosted alternative to Algolia — runs on Cloudflare Workers
- **OpenSearch**: Full-text search with faceted filtering by tag/version/language

### 2.7 CI/CD Standards for Documentation Repos

- **Deploy previews**: Cloudflare Pages preview URLs on every PR
- **Link checking**: Automated broken-link checks on every PR (not just weekly)
- **Visual regression**: Playwright screenshots to detect layout changes
- **Lighthouse CI**: Automated performance, accessibility, and SEO scoring
- **Spell checking**: cspell or Vale for technical writing quality
- **Doc coverage**: Check that every API path in openapi.json has at least one code example

---

## PART 3: SYNTHESIS AND GAP ANALYSIS

### 3.1 Critical Gaps

| Gap | Severity | Impact |
|-----|----------|--------|
| openapi.json covers only 11/100+ real platform paths | CRITICAL | Developers cannot discover most of the API |
| No live status polling from webwaka-platform-status | HIGH | Status page always shows green — misleads developers |
| Search index rebuilt on every request (no cache) | HIGH | Performance degrades with >100 docs |
| No sitemap.xml or robots.txt | HIGH | Documentation is not indexed by search engines |
| PWA icons referenced but missing | HIGH | PWA installation silently fails |
| Feedback storage grows unbounded | MEDIUM | Production disk exhaustion risk |
| Translations are stubs, not real AI output | MEDIUM | French/Swahili/Arabic developers cannot use docs |
| No rate limiting on API endpoints | MEDIUM | DoS vulnerability |
| No Mermaid.js diagram support | MEDIUM | Architecture docs lack visual context |
| No per-page analytics | MEDIUM | Cannot improve docs without usage data |

### 3.2 Enhancement Opportunities (Top 20)

See Part 4 for full detail on all 20 enhancements.

---

## PART 4: TOP 20 ENHANCEMENTS

### Enhancement 1 — Full OpenAPI Coverage (Automated Cross-Repo Extraction)
**Priority:** CRITICAL  
The current `openapi.json` covers 11 paths. The real platform has 100+ endpoints across 17 repos. The CI `generate-openapi.yml` already has the scaffolding to clone repos — it must be completed.

### Enhancement 2 — Live Platform Status Integration
**Priority:** HIGH  
Poll the `webwaka-platform-status` API on a schedule and update the status displayed in the header and `/status` page with real data.

### Enhancement 3 — Search Index Caching and lunr Integration
**Priority:** HIGH  
Replace the hand-rolled search with a proper lunr.js index, built once at startup and cached in memory. Add search analytics to track top queries.

### Enhancement 4 — Real AI Translation Pipeline Execution
**Priority:** HIGH  
Execute `scripts/translate.ts` against the full doc corpus in CI, replacing the 3 stub files with genuine CORE-5 translations of all 15+ Markdown files per language.

### Enhancement 5 — Sitemap.xml + Robots.txt Generation
**Priority:** HIGH  
Generate `sitemap.xml` dynamically from the Markdown file list and serve `robots.txt`. This is required for search engine discoverability.

### Enhancement 6 — PWA Icons Generation and Manifest Completion
**Priority:** HIGH  
Generate actual 192×192 and 512×512 PNG icons for the PWA manifest and add a `favicon.ico`. Register them in the manifest and the HTML shell.

### Enhancement 7 — Mermaid.js Diagram Rendering
**Priority:** HIGH  
Integrate the Mermaid.js CDN library into the Markdown renderer so that ` ```mermaid ` code blocks are rendered as interactive SVG diagrams. This is essential for architecture ADRs and flow documentation.

### Enhancement 8 — Rate Limiting on All API Endpoints
**Priority:** HIGH  
Add express-rate-limit middleware to all `/api/*` routes. Different limits per endpoint: search (60/min), feedback (10/min), status (120/min). Add proper 429 responses with Retry-After headers.

### Enhancement 9 — Cloudflare Pages Static Export + Deploy Previews
**Priority:** HIGH  
Migrate the server to produce a static export for Cloudflare Pages deployment (or use Cloudflare Pages Functions for dynamic routes). Add PR preview URLs in GitHub Actions.

### Enhancement 10 — Per-Page Last-Edited Metadata from Git
**Priority:** MEDIUM  
Show "Last edited: N days ago by Author" on every doc page, extracted from `git log --follow` for that specific file. Enhances trustworthiness and helps developers know if content is stale.

### Enhancement 11 — Algolia DocSearch Integration
**Priority:** MEDIUM  
Apply for Algolia DocSearch (free for open-source projects) and integrate the `docsearch.js` widget. Provides instant, multi-language, faceted search with relevance ranking far superior to the current implementation.

### Enhancement 12 — Subresource Integrity (SRI) for CDN Resources
**Priority:** MEDIUM  
Add `integrity` and `crossorigin` attributes to all CDN-loaded `<script>` and `<link>` tags (Swagger UI, Mermaid.js). This closes the supply-chain attack vector currently open in the CSP.

### Enhancement 13 — AsyncAPI Specification for Event Bus
**Priority:** MEDIUM  
Create an `asyncapi.yaml` documenting all WebWaka event bus events (from `EVENT_BUS_SCHEMA.md`) using AsyncAPI 3.x. Add an event explorer page powered by `@asyncapi/react-component`.

### Enhancement 14 — Automated Link Checking in PR CI
**Priority:** MEDIUM  
Move broken-link checking from a manual CLI script to an automated GitHub Actions job that runs on every pull request. Fail the PR if any internal links are broken.

### Enhancement 15 — SDK Code Playground (StackBlitz/CodeSandbox Embed)
**Priority:** MEDIUM  
Add embeddable code playgrounds to tutorial pages using StackBlitz WebContainers API. Developers can run code directly in the browser without installing anything.

### Enhancement 16 — Per-Page Analytics (Privacy-First)
**Priority:** MEDIUM  
Integrate Plausible Analytics or Cloudflare Web Analytics (privacy-preserving, no cookies) to track page views, search queries, and feedback votes. Use this data to prioritize doc improvements.

### Enhancement 17 — Nigeria-First Developer Resources Section
**Priority:** MEDIUM  
Add a dedicated "Nigeria & Africa Resources" section with: Paystack integration guide, Flutterwave guide, Termii SMS guide, NDPR compliance checklist, NGN/KES/GHS currency formatting, local phone number validation (libphonenumber), and a "Known Issues in Nigeria" troubleshooting guide.

### Enhancement 18 — Deprecation Timeline and Breaking Change Registry
**Priority:** MEDIUM  
Create a dedicated `/breaking-changes` page and `breaking-changes.md` file that documents all breaking API changes by version, with migration guides, deprecation dates, and sunset dates.

### Enhancement 19 — Feedback Analytics Dashboard
**Priority:** LOW  
Create an authenticated admin page at `/admin/feedback` that shows feedback vote aggregation per page, trending low-rated pages, and the most common feedback comments — without exposing raw user data.

### Enhancement 20 — Lighthouse CI and Accessibility Automation
**Priority:** LOW  
Add a Lighthouse CI GitHub Actions job that measures Performance, Accessibility, Best Practices, and SEO scores on every push. Fail if scores drop below 90 on critical pages.

---

## PART 5: BUG FIX RECOMMENDATIONS

| ID | Bug | Fix |
|----|-----|-----|
| BUG-01 | `sanitizeContent()` is dead code in server.js | Remove from module scope; confirm `markdown.js` sanitizes all paths |
| BUG-02 | No rate limiting on feedback and search APIs | Add `express-rate-limit` middleware |
| BUG-03 | Search index rebuilt per request | Cache lunr index at server startup |
| BUG-04 | Status is hardcoded, never live | Poll `webwaka-platform-status` API with retry logic |
| BUG-05 | `lunr` installed but unused | Wire lunr into search-index.js or remove from dependencies |
| BUG-06 | openapi.json covers <15% of real API | Complete CI cross-repo extraction |
| BUG-07 | SW cache name hardcoded | Derive from `package.json` version or build timestamp |
| BUG-08 | PWA icons missing from disk | Generate and commit actual PNG icons |
| BUG-09 | Changelog error silently hidden | Show error state to user, log to observability |
| BUG-10 | feedback.json grows unbounded | Add max-entries cap and archival cron |
| BUG-11 | No sitemap.xml / robots.txt | Generate dynamically on each request |
| BUG-12 | No rate limit on /api/search | Add rate limit middleware |
| BUG-13 | Translations are stubs | Run translate.ts pipeline in CI for all docs |
| BUG-14 | package.json main → index.js (missing) | Fix to server.js |

---

## PART 6: DETAILED TASK BREAKDOWN

---

### TASK-01: Complete Automated Cross-Repo OpenAPI Extraction

**Objective:** Complete the `generate-from-repos` CI job to clone all 17 platform repos, extract route definitions and TypeScript interfaces, merge them into a single `openapi.json` with full coverage.

**Why it matters:** Developers cannot find or use 85%+ of the platform API because it is not documented. This is the single most critical gap.

**Repo Scope:** `webwaka-platform-docs` (primary); reads from `webwaka-core`, `webwaka-commerce`, `webwaka-transport`, `webwaka-logistics`, `webwaka-professional`, `webwaka-civic`, `webwaka-central-mgmt`, `webwaka-cross-cutting`

**Dependencies:** `WEBWAKA_BOT_TOKEN` secret (read-only PAT for cloning private repos); TypeScript compiler for AST parsing

**Prerequisites:** All source repos must have stable `main` branches; `scripts/generate-openapi.ts` must support multi-repo merge

**Impacted Modules:** `scripts/generate-openapi.ts`, `.github/workflows/generate-openapi.yml`, `openapi.json`

**Likely Files to Change:**
- `.github/workflows/generate-openapi.yml` — complete the `generate-from-repos` job steps
- `scripts/generate-openapi.ts` — add TypeScript Compiler API-based AST extraction
- `openapi.json` — output of the pipeline (auto-generated)

**Expected Output:** `openapi.json` with 80+ documented paths across all platform modules

**Acceptance Criteria:**
- CI runs without error on `main` push
- `openapi.json` validates against Spectral OWASP ruleset
- All Commerce endpoints documented (GET /products, POST /orders, etc.)
- All Core auth endpoints documented
- All tenant endpoints documented
- Every operation has `operationId`, `summary`, `tags`, and at least one `200` response
- Every schema has an `example` with Nigeria-realistic data (NGN amounts, +234 phone numbers)

**Tests Required:**
- Unit tests for `extractRoutesFromTSFile()` with TSOA and NestJS decorator styles
- Integration test: merge 3 partial specs → validate result
- CI test: validate final spec with `@stoplight/spectral-cli`

**Risks:** Private repo cloning requires `WEBWAKA_BOT_TOKEN` secret to be configured in GitHub; TypeScript decorator parsing may fail on non-standard decorator usages

**Governance Documents:** `WebWakaDigitalOperatingSystem.md` Part 8.1, `PLATFORM_ROADMAP.md`

**Important Reminders:**
- Every schema must enforce `tenant_id` presence
- Nigerian phone number format: `+234XXXXXXXXXX`
- All monetary amounts: `NGN` as default currency code
- This repo is NOT standalone — it depends on the output of all other repos

---

### TASK-02: Live Platform Status Integration

**Objective:** Replace the hardcoded `SERVICES` array in `server.js` with a live polling mechanism that fetches real status data from the `webwaka-platform-status` API on a configurable interval (default: 60 seconds).

**Why it matters:** A status page that always shows green destroys developer trust when a real outage occurs.

**Repo Scope:** `webwaka-platform-docs` only (consumer of `webwaka-platform-status` API)

**Dependencies:** `webwaka-platform-status` must expose a `/status` JSON endpoint; `PLATFORM_STATUS_API_URL` environment variable

**Prerequisites:** `webwaka-platform-status` API must be deployed and reachable from the docs server

**Impacted Modules:** `server.js` (status route), `public/js/main.js` (status badge update)

**Likely Files to Change:**
- `server.js` — replace static SERVICES with cached fetch + TTL
- `public/js/main.js` — add WebSocket or SSE subscription for real-time badge updates
- `.env.example` — add `PLATFORM_STATUS_API_URL`

**Expected Output:** Status page shows real-time degraded/operational/maintenance state per service

**Acceptance Criteria:**
- Status page reflects actual service health within 60 seconds of a change
- If the status API is unreachable, a "Status unavailable" message is shown (not a false green)
- The header badge correctly shows green/yellow/red
- Graceful fallback to last known status when API is down

**Tests Required:**
- Unit test: mock fetch → verify status parsing
- Unit test: API unreachable → verify fallback behavior
- Integration test: end-to-end status polling with mock API

**Risks:** Status API may not be publicly accessible without authentication; may require API key

**Governance Documents:** `PLATFORM_ROADMAP.md`, `PLATFORM_REVIEW_AND_ENHANCEMENTS.md`

**Important Reminders:**
- Status data may contain tenant-specific information — strip tenant data before serving publicly
- Cache status with a short TTL (60s) to avoid hammering the upstream API
- Rate-limit the `/api/status` endpoint to prevent scraping

---

### TASK-03: Search Index Caching + lunr Integration + Analytics

**Objective:** Replace the hand-rolled `includes()` search with a proper lunr.js full-text index. Build the index once at server startup, cache it in memory, and add a search analytics collector.

**Why it matters:** Rebuilding the search index on every request causes O(n) disk reads per search. With 100+ doc files this becomes a bottleneck.

**Repo Scope:** `webwaka-platform-docs`

**Dependencies:** `lunr` (already installed but unused)

**Impacted Modules:** `src/utils/search-index.js`, `server.js`

**Likely Files to Change:**
- `src/utils/search-index.js` — rewrite to use lunr.js properly
- `server.js` — build index at startup; wire analytics logger
- `feedback/` or new `analytics/` directory — store search query logs

**Expected Output:** Sub-10ms search response times for 100+ docs; top-queries report available

**Acceptance Criteria:**
- lunr index built once at server startup (not per request)
- Search results include relevance scores
- Stemming works for English (lunr built-in)
- Top 50 search queries per day logged (with no PII)
- `/api/search/analytics` endpoint returns top queries (protected by admin key)

**Tests Required:**
- Unit test: `buildIndex()` called once, not per search call
- Unit test: lunr results ranked by relevance score
- Unit test: search analytics logger appends entries correctly

**Risks:** lunr.js does not support Arabic stemming natively — Swahili and Arabic results may rank poorly

---

### TASK-04: Real AI Translation Pipeline Execution

**Objective:** Execute `scripts/translate.ts` via GitHub Actions against all 15+ Markdown files in the docs corpus (content/, root-level .md files) for French, Swahili, and Arabic. Replace the 3 placeholder stubs with genuine AI translations.

**Why it matters:** French and Swahili are the primary languages of Francophone West Africa and East Africa — two major WebWaka market regions. Stub translations actively mislead developers.

**Repo Scope:** `webwaka-platform-docs`

**Dependencies:** `WEBWAKA_AI_KEY` secret (CORE-5 API access); `scripts/translate.ts`

**Impacted Modules:** `translations/fr/`, `translations/sw/`, `translations/ar/`, `.github/workflows/generate-openapi.yml`

**Likely Files to Change:**
- `.github/workflows/generate-openapi.yml` — add `translate-docs` job
- `translations/fr/*.md` — regenerated by CI
- `translations/sw/*.md` — regenerated by CI
- `translations/ar/*.md` — regenerated by CI (RTL direction metadata needed)
- `server.js` — update language switcher to show all translated files

**Expected Output:** All content/*.md files available in FR, SW, AR with code blocks and links preserved

**Acceptance Criteria:**
- CI job runs on every `main` push
- All 15+ docs translated per language
- Code blocks preserved exactly (no translation of code)
- URLs not translated
- Arabic output has correct RTL direction metadata comment
- "Verified by AI, not professional translator" disclaimer added to each file

**Tests Required:**
- Unit tests for `extractCodeBlocks()` and `restoreCodeBlocks()` (already exist in `scripts/translate.test.ts`)
- CI integration test: translate a test fixture file and verify round-trip
- Manual spot-check: native French/Swahili speaker reviews sample output

**Risks:** CORE-5 API may not be available in CI without proper secrets configuration; Arabic RTL rendering may require additional CSS

---

### TASK-05: Sitemap.xml + Robots.txt Dynamic Generation

**Objective:** Add a `GET /sitemap.xml` route that dynamically generates a sitemap listing all accessible doc pages, API routes, and content files. Add `GET /robots.txt` that allows all crawlers.

**Why it matters:** Without a sitemap, search engines cannot efficiently index the documentation. This directly impacts organic developer discovery.

**Repo Scope:** `webwaka-platform-docs`

**Impacted Modules:** `server.js`

**Likely Files to Change:**
- `server.js` — add `/sitemap.xml` and `/robots.txt` routes
- `src/utils/nav-builder.js` — expose file list for sitemap generation

**Expected Output:** Valid XML sitemap served at `/sitemap.xml`; `robots.txt` at `/robots.txt`

**Acceptance Criteria:**
- `sitemap.xml` passes W3C validation
- All 20+ doc pages appear in sitemap
- `lastmod` set to each file's git last-modified date
- `robots.txt` allows all crawlers and references the sitemap
- Sitemap is auto-submitted to Google Search Console in CI (optional)

**Tests Required:**
- Unit test: sitemap XML is valid and contains expected URLs
- Unit test: `robots.txt` content is correct
- Integration test: GET /sitemap.xml returns 200 with correct content-type

---

### TASK-06: PWA Icons Generation

**Objective:** Generate the missing PWA icons (192×192 and 512×512 PNG) and commit them to `public/icons/`. Update the manifest to reference all required sizes including a maskable version.

**Why it matters:** PWA installation silently fails in Chrome, Edge, and Safari when the declared icons don't exist. This breaks the "install as app" functionality.

**Repo Scope:** `webwaka-platform-docs`

**Impacted Modules:** `public/manifest.json`, `public/icons/`

**Likely Files to Change:**
- `public/icons/icon-192.png` — new file
- `public/icons/icon-512.png` — new file
- `public/icons/icon-192-maskable.png` — new file
- `public/manifest.json` — update icons array

**Expected Output:** PWA passes all installability criteria in Chrome DevTools > Application

**Acceptance Criteria:**
- Lighthouse PWA audit passes with installable score
- `maskable` purpose icon passes Maskable.app test (safe zone respected)
- icons serve with correct `Content-Type: image/png`

**Tests Required:**
- Build validation check for icon file existence (add to `scripts/build-validate.ts`)
- Lighthouse CI PWA audit score ≥ 90

---

### TASK-07: Mermaid.js Diagram Rendering

**Objective:** Integrate the Mermaid.js CDN library so that Markdown code blocks fenced with ` ```mermaid ` are rendered as interactive SVG diagrams inline in the page.

**Why it matters:** Architecture ADRs, flow diagrams, and multi-repo dependency maps cannot be effectively communicated with text alone.

**Repo Scope:** `webwaka-platform-docs`

**Dependencies:** `mermaid` CDN or `npm install mermaid`; `src/utils/markdown.js`

**Impacted Modules:** `src/utils/markdown.js`, `public/js/main.js`, `public/css/main.css`

**Likely Files to Change:**
- `src/utils/markdown.js` — detect and tag mermaid code blocks before sanitization
- `public/js/main.js` — initialize `mermaid.run()` on page load
- `server.js` shell() function — add mermaid CDN script tag
- `public/css/main.css` — add mermaid diagram dark mode styles
- `content/adrs/*.md` — add example Mermaid diagrams to ADRs

**Expected Output:** ADR-001 renders a Mermaid sequence diagram of the multi-tenant auth flow

**Acceptance Criteria:**
- ` ```mermaid ` blocks render as SVG, not as plain text
- Dark mode renders diagrams with dark background
- Large diagrams are scrollable horizontally
- Sanitization whitelist updated to allow `<svg>` output from mermaid

**Tests Required:**
- Unit test: `renderMarkdown()` with mermaid block produces a `<div class="mermaid">` tag
- Visual test: screenshot comparison (before/after diagram rendering)

---

### TASK-08: Rate Limiting on All API Endpoints

**Objective:** Add `express-rate-limit` middleware with per-endpoint limits to prevent DoS, feedback flooding, and search abuse.

**Why it matters:** All three API endpoints (`/api/search`, `/api/feedback`, `/api/status`) are completely unthrottled. A trivial loop can abuse the feedback store or saturate disk I/O.

**Repo Scope:** `webwaka-platform-docs`

**Impacted Modules:** `server.js`

**Likely Files to Change:**
- `server.js` — add rate limit middleware per route group
- `package.json` — add `express-rate-limit` dependency

**Endpoint Limits:**
```
/api/search          60 req/min per IP
/api/feedback POST   10 req/min per IP
/api/feedback GET    120 req/min per IP
/api/status          120 req/min per IP
/api/postman/*       30 req/min per IP
```

**Expected Output:** 429 responses with `Retry-After` header when limits exceeded

**Acceptance Criteria:**
- Rate limits applied correctly per endpoint
- 429 returned with JSON `{"error":"Too many requests","retryAfter":60}`
- Limits configurable via environment variables
- Rate limiter does not break CI health checks (CI hits `/api/status` frequently)

**Tests Required:**
- Unit test: exceeding rate limit returns 429
- Unit test: Retry-After header present in 429 response
- Integration test: burst 70 search requests → 61st gets 429

---

### TASK-09: Cloudflare Pages Deployment Configuration

**Objective:** Configure the docs server to support deployment on Cloudflare Pages (with Pages Functions for dynamic routes), add a `wrangler.toml`, and add Cloudflare Pages deploy preview URLs to PR CI.

**Why it matters:** The docs site is currently only deployable as a Node.js server. Cloudflare Pages would give it global CDN, zero cold starts, automatic HTTPS, and deploy previews per PR.

**Repo Scope:** `webwaka-platform-docs`

**Dependencies:** Cloudflare Pages account; `wrangler` CLI; `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets

**Impacted Modules:** `server.js` (split into static + function handlers), `.github/workflows/`

**Likely Files to Change:**
- `wrangler.toml` — new file for Cloudflare Pages config
- `functions/` — Pages Functions directory for dynamic API routes
- `.github/workflows/deploy-pages.yml` — new CI job
- `package.json` — add `wrangler` devDependency, build script

**Expected Output:** `https://docs.webwaka.io` served from Cloudflare Pages with global edge caching

**Acceptance Criteria:**
- Static content served with Cache-Control: max-age=31536000
- Dynamic routes (`/api/*`) served via Pages Functions
- Deploy preview URL on every PR
- Production deploy triggered on `main` merge
- CNAME configured for `docs.webwaka.io`

---

### TASK-10: Per-Page Git Last-Edited Metadata

**Objective:** Display "Last edited N days ago · Author Name" on every doc page by running `git log --follow` on the rendered file path. Cache results for 5 minutes.

**Why it matters:** Stale documentation is a major pain point for developers. Showing recency builds trust and helps developers prioritize which sections to re-read.

**Repo Scope:** `webwaka-platform-docs`

**Impacted Modules:** `src/utils/nav-builder.js`, `server.js`, `src/utils/markdown.js`

**Likely Files to Change:**
- `src/changelog.js` — add `getFileLastEdited(filePath)` function
- `server.js` doc route — inject last-edited metadata into page
- `public/css/main.css` — style the last-edited indicator

**Expected Output:** Each doc page shows "Last edited 3 days ago by Sarah A." below the page title

**Acceptance Criteria:**
- Git metadata fetched for each file path
- Cached in a Map with 5-minute TTL
- Falls back to "Recently updated" if git is unavailable
- Author name is shown but email is NOT shown (privacy)

**Tests Required:**
- Unit test: `getFileLastEdited()` returns `{ date, author }` object
- Unit test: TTL cache invalidation works correctly
- Integration test: doc page HTML includes last-edited element

---

### TASK-11: Algolia DocSearch Integration (Phase 1) + TypeSense Self-Hosted (Phase 2)

**Phase 1 — Algolia DocSearch:**

**Objective:** Apply for and integrate Algolia DocSearch crawler on the docs site. Replace the current lunr-based search with the `docsearch.js` widget.

**Why it matters:** Algolia DocSearch provides multi-language, faceted, sub-100ms search with zero server load. It is industry standard for developer documentation.

**Impacted Modules:** `server.js` shell function, `public/js/main.js`, `public/css/main.css`

**Likely Files to Change:**
- `server.js` — add DocSearch CDN scripts/styles to shell()
- `public/js/main.js` — replace custom search logic with DocSearch widget initialization
- `public/css/main.css` — DocSearch dark mode overrides

**Acceptance Criteria:**
- Algolia crawler configured and crawling docs site
- DocSearch widget replaces the current search input
- Results appear in <100ms
- Dark mode styles applied to DocSearch modal

**Phase 2 — TypeSense Self-Hosted (for offline/air-gapped environments):**

**Objective:** Deploy TypeSense on Cloudflare Workers as a fallback for environments where Algolia is blocked. Wire the search widget to try Algolia first, fall back to TypeSense.

---

### TASK-12: Subresource Integrity for CDN Resources

**Objective:** Add `integrity` and `crossorigin="anonymous"` attributes to all CDN-loaded scripts and stylesheets (Swagger UI, Mermaid.js). Generate SRI hashes in CI.

**Why it matters:** Without SRI, a compromised CDN (jsdelivr.net) could inject malicious JavaScript into the API Explorer page. SRI closes this supply-chain attack vector.

**Repo Scope:** `webwaka-platform-docs`

**Impacted Modules:** `server.js` (API Explorer HTML), shell() function

**Likely Files to Change:**
- `server.js` — add `integrity` and `crossorigin` to CDN tags
- `.github/workflows/generate-openapi.yml` — add SRI hash generation step
- `scripts/build-validate.ts` — add SRI presence check

**Acceptance Criteria:**
- `<script integrity="sha384-..." crossorigin="anonymous">` on Swagger UI bundle
- `<link integrity="sha384-..." crossorigin="anonymous">` on Swagger UI CSS
- Build fails if SRI hashes are missing or invalid
- Browser rejects tampered CDN resources (manually verified with DevTools)

**Tests Required:**
- Build validation checks for `integrity` attribute on CDN resources
- CI step that verifies SRI hashes match actual CDN content

---

### TASK-13: AsyncAPI Spec for Event Bus Documentation

**Objective:** Create an `asyncapi.yaml` documenting all WebWaka event bus events from `EVENT_BUS_SCHEMA.md`. Add an `/events` page powered by the AsyncAPI React component.

**Why it matters:** WebWaka is event-driven at its core. Developers building integrations need to understand which events are emitted, their payload schemas, and their ordering guarantees.

**Repo Scope:** `webwaka-platform-docs`

**Impacted Modules:** `asyncapi.yaml` (new), `server.js`, `content/events/` (new)

**Likely Files to Change:**
- `asyncapi.yaml` — new file documenting all platform events
- `server.js` — add `/events` route
- `.github/workflows/generate-openapi.yml` — validate asyncapi.yaml in CI

**Expected Output:** `/events` page renders a browsable event catalog with payload schemas

**Acceptance Criteria:**
- `asyncapi.yaml` validates against AsyncAPI 3.0 schema
- All events from `EVENT_BUS_SCHEMA.md` are documented
- Each event has: channel, payload schema, example, emitter repo, consumer repos
- `tenant_id` required in all event payloads (per Core Invariants)

**Tests Required:**
- CI validation: `npx @asyncapi/cli validate asyncapi.yaml`
- Unit test: event catalog page renders without error
- Cross-repo check: verify event names match those emitted by source repos

---

### TASK-14: Automated Broken Link Detection in PR CI

**Objective:** Move the broken-link check from a manual CLI script to an automated GitHub Actions job that runs on every pull request and fails the PR if any internal links are broken.

**Why it matters:** Broken internal links in documentation silently direct developers to 404 pages. These must be caught before merge, not after.

**Repo Scope:** `webwaka-platform-docs`

**Impacted Modules:** `.github/workflows/`, `scripts/check-links.ts`

**Likely Files to Change:**
- `.github/workflows/check-links.yml` — new workflow file
- `scripts/check-links.ts` — add `--fail-on-broken` flag
- `.github/workflows/generate-openapi.yml` — merge or reference from new workflow

**Expected Output:** PR checks show a "Link Check" status with a report of any broken links

**Acceptance Criteria:**
- Internal links checked on every PR to `main`
- External links checked weekly (not on every PR — too slow)
- PR fails with a comment listing broken links + their source files
- Relative links, absolute links, and `[text](url)` links all checked

**Tests Required:**
- Unit tests for `checkInternalLink()` (already exist in `scripts/check-links.test.ts`)
- Integration test: introduce a broken link → CI catches it

---

### TASK-15: SDK Code Playground (StackBlitz Embed)

**Objective:** Add embeddable StackBlitz WebContainers playground iframes to Tutorial 1 (Getting Started) and the SDK docs page. Developers can run code in the browser without a local setup.

**Why it matters:** Documentation friction is highest when developers must install tools before trying a single API call. A browser-based sandbox reduces time-to-first-success dramatically.

**Repo Scope:** `webwaka-platform-docs`

**Dependencies:** StackBlitz WebContainers API (free for open-source); `@webwaka/sdk` published to npm

**Impacted Modules:** `content/tutorials/01-getting-started.md`, `content/sdk-docs.md`, `server.js` (CSP must allow stackblitz.com)

**Likely Files to Change:**
- `content/tutorials/01-getting-started.md` — add StackBlitz embed shortcode
- `content/sdk-docs.md` — add SDK playground embed
- `server.js` — extend CSP to allow `stackblitz.com` iframe
- `src/utils/markdown.js` — handle `:::playground` custom Markdown syntax

**Expected Output:** Tutorials show a live, runnable code editor below each code snippet

**Acceptance Criteria:**
- Playground loads in <3 seconds on a 4G Nigerian mobile connection
- Code edits persist through tab navigation (localStorage)
- Playground works without a login
- Graceful degradation: if StackBlitz unavailable, show code snippet only

---

### TASK-16: Per-Page Analytics (Plausible/Cloudflare)

**Objective:** Integrate Plausible Analytics or Cloudflare Web Analytics (privacy-first, no cookies, GDPR/NDPR-compliant) to track page views, search queries (without search terms), and feedback votes.

**Why it matters:** Without analytics, the docs team cannot know which pages are most visited, which have the worst bounce rates, or which tutorials developers never finish.

**Repo Scope:** `webwaka-platform-docs`

**Dependencies:** Cloudflare Web Analytics account (free); or Plausible account

**Impacted Modules:** `server.js` shell() function, `public/js/main.js`

**Likely Files to Change:**
- `server.js` — add analytics script tag to shell()
- `public/js/main.js` — fire `plausible()` events for search and feedback
- `server.js` CSP — add analytics domain to `connect-src`

**Expected Output:** Cloudflare Analytics dashboard shows doc page views, top pages, and search engagement

**Acceptance Criteria:**
- No cookies set by analytics (NDPR/GDPR compliant)
- No PII collected
- Search events tracked (with query string hashed, not stored raw)
- Feedback "thumbs up/down" events tracked per page
- Analytics respects "Do Not Track" browser header

---

### TASK-17: Nigeria-First Developer Resources Section

**Objective:** Create a comprehensive "Nigeria & Africa Dev Resources" content section with integration guides for local services (Paystack, Flutterwave, Termii, Yournotify), NDPR compliance, and African currency handling.

**Why it matters:** Nigeria-first is one of the 7 Core Invariants. The docs currently have no Nigeria-specific content other than platform architecture mentions.

**Repo Scope:** `webwaka-platform-docs`

**Impacted Modules:** `content/` (new files), `server.js` nav (new section)

**Files to Create:**
- `content/nigeria-africa/paystack-integration.md`
- `content/nigeria-africa/flutterwave-integration.md`
- `content/nigeria-africa/termii-sms-guide.md`
- `content/nigeria-africa/ndpr-compliance-checklist.md`
- `content/nigeria-africa/african-currencies.md`
- `content/nigeria-africa/nigerian-phone-validation.md`
- `content/nigeria-africa/known-issues.md`

**Expected Output:** A "Nigeria & Africa" nav section with 7 guides

**Acceptance Criteria:**
- Paystack guide covers: initialization, webhooks, split payments, transfer
- Flutterwave guide covers: checkout, mobile money, split accounts
- Termii guide covers: OTP flow, bulk SMS, delivery reports
- NDPR checklist is actionable (checkbox format)
- All code examples use NGN currency and +234 phone format

---

### TASK-18: Breaking Changes Registry and Deprecation Timeline

**Objective:** Create a `/breaking-changes` page and supporting Markdown file that documents all breaking API changes by version, with migration guides, `x-deprecation-date` metadata, and sunset dates.

**Why it matters:** Developers integrating with a multi-version API need a single source of truth for breaking changes. Currently no such document exists.

**Repo Scope:** `webwaka-platform-docs`

**Impacted Modules:** `content/breaking-changes.md` (new), `server.js` (new route), `openapi.json` (add `deprecated: true` markers)

**Files to Create:**
- `content/breaking-changes.md` — breaking change registry
- `content/migration/v1-to-v4.md` — detailed migration guide

**Files to Update:**
- `openapi.json` — add `deprecated: true` and `x-deprecation-date` to v1 endpoints
- `server.js` — add `/breaking-changes` route

**Expected Output:** Structured page showing version timeline with breaking changes highlighted

**Acceptance Criteria:**
- All v1→v4 breaking changes documented
- Each breaking change has: affected endpoint, change description, migration guide, sunset date
- RSS feed for breaking changes (developers can subscribe)
- `deprecated: true` fields in openapi.json for all v1-era paths

---

### TASK-19: Feedback Analytics Admin Dashboard

**Objective:** Create a protected `/admin/feedback` page that shows aggregated feedback statistics per page: thumbs up/down ratio, trending low-rated pages, and common comments — without exposing raw user data.

**Why it matters:** Feedback data currently accumulates with no way to act on it. Without a dashboard, the feedback widget is useless.

**Repo Scope:** `webwaka-platform-docs`

**Impacted Modules:** `server.js`, `src/feedback-store.js`, `public/css/main.css`

**Likely Files to Change:**
- `server.js` — add `/admin/feedback` route with basic auth (env var key)
- `src/feedback-store.js` — add `getAggregatedStats()` function
- `public/css/main.css` — admin dashboard styles

**Expected Output:** Admin page shows a table of pages ranked by feedback score

**Acceptance Criteria:**
- Route protected by `ADMIN_API_KEY` environment variable (Bearer token)
- Returns JSON or HTML with: page path, up votes, down votes, score, comment count
- Top 10 worst-rated pages highlighted
- No raw user IP or session data exposed
- Rate limited to 10 req/min

**Tests Required:**
- Unit test: `getAggregatedStats()` returns correct aggregation
- Unit test: unauthorized request returns 401
- Integration test: admin dashboard returns correct stats

---

### TASK-20: Lighthouse CI + Accessibility Automation

**Objective:** Add a Lighthouse CI GitHub Actions job that runs on every push to `main` and measures Performance, Accessibility, Best Practices, and SEO scores. Fail if any score drops below 90.

**Why it matters:** Developer docs must be accessible (WCAG 2.1 AA) and fast (mobile users on 4G). Without automated measurement, regressions go undetected.

**Repo Scope:** `webwaka-platform-docs`

**Dependencies:** `lighthouse-ci` npm package; `LHCI_GITHUB_APP_TOKEN` GitHub Apps token

**Impacted Modules:** `.github/workflows/lighthouse.yml` (new)

**Likely Files to Change:**
- `.github/workflows/lighthouse.yml` — new CI workflow
- `lighthouserc.json` — Lighthouse CI configuration
- `public/css/main.css` — fix any discovered accessibility issues
- `server.js` shell() — add proper `lang` attribute, skip-to-content link

**Expected Output:** Lighthouse CI comment on every PR with scores; block merge if <90

**Acceptance Criteria:**
- Performance ≥ 90 on mobile (3G throttled)
- Accessibility ≥ 95
- Best Practices ≥ 90
- SEO ≥ 95
- All images have `alt` text
- All form elements have labels
- Color contrast ratios pass WCAG AA

**Tests Required:**
- Lighthouse CI runs on main push
- PR comment with score breakdown
- Fail CI if any threshold breached

---

## PART 7: QA PLANS

---

### QA-01: OpenAPI Coverage Quality Assurance

**What to verify:**
- `openapi.json` contains paths for all major API modules: Auth, Tenants, Commerce, Transport, Logistics, Professional, Civic, Webhooks
- Every path has at minimum: `operationId`, `summary`, `tags`, `security`, `responses` with at least one 2xx and one 4xx
- Every schema property that represents a Nigerian phone number has pattern `^\+234[0-9]{10}$`
- Every schema property that represents a monetary amount has a companion `currency` enum field
- Every path that is tenant-scoped has `tenant_id` in the path or request body

**Bugs to look for:**
- Paths with empty `responses` objects
- Schemas with no `example` values
- Operations with `operationId` values that conflict across tags
- Missing `401`, `403`, `422` error responses on auth-protected endpoints

**Edge cases:**
- Webhook callbacks (Paystack IPN, Flutterwave callback) — must appear as `callbacks` in the spec
- Pagination: all list endpoints must have `page`, `limit`, `total_count` in responses
- File upload endpoints: must use `multipart/form-data` content type

**Regression detection:**
- Diff `openapi.json` against the previous commit — any path removed should trigger a manual review flag
- Path count must only increase (never decrease without a deprecation notice)

**Cross-repo verification:**
- Verify that paths extracted from `webwaka-commerce` match the routes defined in that repo's Express router files
- Verify that `@webwaka/core` authentication middleware is referenced in all security schemes

**Done means:** Spectral OWASP validation passes; path count ≥ 80; all schemas have examples; all paths have Nigerian-realistic example data

---

### QA-02: Live Status Integration Quality Assurance

**What to verify:**
- Status endpoint returns JSON matching the schema: `{ overall: string, services: Array<{name, status, latencyMs?}>, updatedAt: ISO8601 }`
- Status badge in header matches the `overall` field
- Polling interval is configurable without a code change

**Bugs to look for:**
- Status always showing "operational" (hardcoded fallback activated)
- Memory leak from uncleaned `setInterval` polling
- Status API timeout not handled (causing hanging requests)

**Edge cases:**
- Status API returns `503` — verify docs site still loads
- Status API returns malformed JSON — verify fallback
- Status API is slow (>5s) — verify timeout and fallback

**Regression detection:**
- Previous behavior: static array always green
- New behavior: must differ from static when a service is degraded

**Done means:** Mock a degraded service in status API → docs header badge turns yellow within 60 seconds

---

### QA-03: Search Performance and Quality Assurance

**What to verify:**
- lunr index is built exactly once at startup (not per request)
- Search response time <10ms for 100 documents
- Relevance: searching "webhook" returns webhook docs before error code docs
- Search returns `[]` for empty query, not an error

**Bugs to look for:**
- Index rebuilt on every restart without caching
- lunr index not rebuilt when new docs are added at runtime
- Search returns HTML tags in result snippets (XSS risk)

**Edge cases:**
- Query with special characters (`*`, `+`, `:`) — lunr parses these as operators
- Very long query (>500 chars) — should be truncated and not crash
- Non-Latin queries (Arabic script) — results may be empty but should not error

**Cross-module:**
- Verify search results link to correct doc paths (not stale paths from a previous build)

**Done means:** 60 concurrent search requests complete in <1 second total; lunr relevance scores present in API response

---

### QA-04: Translation Pipeline Completeness Assurance

**What to verify:**
- All 15+ Markdown files under `content/` have corresponding files under `translations/fr/`, `translations/sw/`, `translations/ar/`
- No code block content is translated (verify by diff with original)
- No URL strings are translated
- Arabic output has correct `dir: rtl` metadata comment

**Bugs to look for:**
- `{{CODE_BLOCK_N}}` placeholder leaked into final output (restore failed)
- `{{LINK_N_TEXT}}` placeholder leaked into final output (restore failed)
- XSS injection in AI output (e.g., `<script>` in translated text)
- File encoding issues (Arabic must be UTF-8)

**Edge cases:**
- Markdown file with only code blocks (no translatable text) — should complete without error
- Markdown file with nested code blocks — ` ```lang ``` ` inside another ` ``` `
- Very long document (>10,000 words) — verify the AI doesn't truncate output

**Cross-module:**
- Verify translated nav-builder.js correctly handles non-Latin filenames
- Verify the language selector in the header correctly navigates to translated files

**Done means:** All files in `translations/` are non-stub AI output; `scripts/translate.test.ts` all pass; a native French/Swahili speaker can read the output

---

### QA-05: Sitemap and SEO Assurance

**What to verify:**
- `GET /sitemap.xml` returns valid XML with `Content-Type: application/xml`
- All public doc pages appear in the sitemap
- `<lastmod>` dates are valid ISO 8601
- `<changefreq>` is present (weekly for most docs)
- `robots.txt` references the sitemap URL

**Bugs to look for:**
- Private/admin routes leaking into the sitemap
- `feedback.json` or internal API routes appearing in sitemap
- Duplicate URLs (trailing slash vs no slash)

**Edge cases:**
- Sitemap with >50,000 URLs — must use sitemap index format
- New doc file added — must appear in sitemap within one request

**Done means:** W3C sitemap validator passes; Google Search Console accepts the sitemap

---

### QA-06: PWA Installability Assurance

**What to verify:**
- Chrome DevTools > Application > Manifest shows all icons loaded
- Chrome DevTools > Application > Service Workers shows active service worker
- Lighthouse PWA audit passes with "Installable" status
- Offline access works for previously visited pages
- `openapi.json` accessible offline (stale-while-revalidate works)

**Bugs to look for:**
- Icon files missing (Bug 8 from Section 1.4)
- Service worker not registering due to HTTPS requirement (only issue on localhost, not production)
- Cache name conflict across deployments (old cached content not purged)
- Background sync not firing on reconnect (iOS Safari limitation)

**Edge cases:**
- Install on Android Chrome — icon should appear in home screen
- Install on iOS Safari — `apple-touch-icon` meta tag must be present
- Offline access to a page not previously visited — show offline fallback

**Done means:** Lighthouse PWA score ≥ 90; app installs from Chrome on Android without errors

---

### QA-07: Security Headers and SRI Assurance

**What to verify:**
- `Content-Security-Policy` header present on all responses
- `X-Content-Type-Options: nosniff` present
- `X-Frame-Options: DENY` present
- `integrity` attribute present on Swagger UI CDN tags
- `javascript:` URIs rejected by CSP
- Inline `onclick` handlers are blocked (they shouldn't exist — verify)

**Bugs to look for:**
- `'unsafe-eval'` accidentally added to CSP (breaks some third-party scripts but is a security win)
- SRI hash mismatch when CDN updates (site breaks — must be caught in CI)
- Missing CSP on `/admin/*` routes

**Edge cases:**
- API Explorer with "Try it out": verify no production API keys are sent
- `persistAuthorization: false` actually prevents Swagger UI from storing tokens
- CSP Report-Only mode — verify no violations are being generated silently

**Done means:** Mozilla Observatory score ≥ A; CSP evaluator shows no warnings; SRI hashes present on all CDN resources

---

### QA-08: Rate Limiting Assurance

**What to verify:**
- 61st request to `/api/search` within a minute returns 429
- 429 response has `Retry-After` header
- 429 response has `Content-Type: application/json`
- Rate limit resets after 60 seconds
- Different IP addresses have independent rate limits

**Bugs to look for:**
- Rate limiter using session instead of IP (can be trivially bypassed)
- Rate limiter not applied to `/api/feedback POST` (most critical abuse vector)
- CI health checks being rate-limited (causing false CI failures)

**Edge cases:**
- Requests from Cloudflare CDN with shared IPs — rate limiter must use `X-Forwarded-For` correctly
- Admin routes — must be exempt from rate limits when using ADMIN_API_KEY

**Done means:** Automated abuse test (100 rapid requests to each endpoint) confirms 429s at correct threshold

---

### QA-09: Mermaid.js Rendering Assurance

**What to verify:**
- ` ```mermaid ` block renders as SVG, not raw text
- Dark mode renders with appropriate background
- Invalid mermaid syntax shows an error block, not a crash
- sanitize-html does not strip the SVG output

**Bugs to look for:**
- `<svg>` tags stripped by sanitize-html (must whitelist)
- Mermaid CDN blocked by CSP (must whitelist in `script-src`)
- Diagram overflow (very wide diagrams cut off)

**Edge cases:**
- Mermaid block inside a blockquote or list
- Multiple mermaid blocks on one page
- Page with 10+ mermaid blocks (performance)

**Done means:** ADR-001 renders a complete sequence diagram visible in dark mode

---

### QA-10: Per-Page Analytics Assurance (Plausible/Cloudflare)

**What to verify:**
- Analytics script loaded on every page
- No cookies set by analytics (DevTools > Application > Cookies)
- Page view tracked on every navigation
- Feedback events tracked when thumbs up/down clicked
- No PII in analytics events (no email, no IP, no user ID)

**Bugs to look for:**
- Analytics script blocked by CSP
- Double-counting from service worker fetch intercepting analytics pings
- Analytics firing on 404 pages (may skew data)

**Done means:** Cloudflare Analytics dashboard shows data after 1 hour of normal usage; no cookies in browser storage

---

## PART 8: IMPLEMENTATION PROMPTS (COPY-PASTE READY)

---

### PROMPT-IMPL-01: Complete Cross-Repo OpenAPI Extraction

```
REPOSITORY: WebWakaDOS/webwaka-platform-docs
TASK: TASK-01 — Complete Automated Cross-Repo OpenAPI Extraction

CONTEXT:
You are implementing in the webwaka-platform-docs repository, which is the official documentation platform for WebWaka OS v4 — a multi-tenant, offline-first, AI-native SaaS OS for Nigeria/Africa. This repo is NOT standalone. It depends on 16 other repositories in the WebWakaDOS GitHub organization. The primary mission of this task is to complete the automated OpenAPI extraction pipeline so that openapi.json covers the full platform API surface (80+ paths across all modules), not just the current 11 paths.

ECOSYSTEM CAVEAT:
The repo cannot import code from other repos at runtime. All cross-repo work happens in CI (GitHub Actions). The generate-from-repos job in .github/workflows/generate-openapi.yml already has partial scaffolding — you must complete it.

READ BEFORE ACTING:
- openapi.json (current state: 11 paths, 21 schemas)
- .github/workflows/generate-openapi.yml (the generate-from-repos job — incomplete)
- scripts/generate-openapi.ts (existing AST extraction logic)
- WebWakaDigitalOperatingSystem.md (Part 8.1 — API Documentation)
- PLATFORM_ROADMAP.md (repo dependency map)

IMPORTANT REMINDERS:
- Build Once Use Infinitely: the OpenAPI spec is the single source of truth for ALL SDK generation, Postman collections, and documentation
- Multi-Tenant: every schema must include tenant_id; every path that is tenant-scoped must document this
- Nigeria-First: all examples must use NGN currency, +234 phone numbers, and Nigerian locality names
- CI/CD Native: all extraction must run in GitHub Actions, not as a manual step
- DO NOT use placeholders or mock data in the final openapi.json

DELIVERABLES:
1. Updated .github/workflows/generate-openapi.yml with a working generate-from-repos job that:
   a. Clones all 8 source repos using WEBWAKA_BOT_TOKEN
   b. Runs scripts/generate-openapi.ts for each repo
   c. Merges the extracted specs using mergeOpenAPISpecs()
   d. Validates the final spec with @stoplight/spectral-cli
   e. Commits the updated openapi.json to main

2. Updated scripts/generate-openapi.ts with:
   a. TypeScript Compiler API-based route extraction (ts.createProgram)
   b. Support for TSOA, NestJS, and plain Express router patterns
   c. Schema extraction from TypeScript interfaces and Zod schemas
   d. Nigerian-realistic example data injected into every schema

3. Updated openapi.json with:
   a. ≥80 documented paths
   b. All Commerce endpoints (products, orders, POS, storefront, wishlist)
   c. All Core endpoints (auth, tenants, RBAC, events)
   d. All Transport endpoints (fleet, routes, bookings)
   e. All Webhook endpoints
   f. Every operation with operationId, summary, tags, security, responses

ACCEPTANCE CRITERIA:
- npx @stoplight/spectral-cli lint openapi.json passes with 0 errors
- openapi.json has ≥80 paths
- Every schema has at least one example
- CI generate-from-repos job runs without error on main push
- Swagger UI at /api-explorer renders all endpoints grouped by tag

TESTS:
- All tests in scripts/generate-openapi.test.ts must pass
- Coverage must remain ≥80% on all metrics
- Add 5+ new unit tests for the TypeScript Compiler API extraction

AVOID:
- Do not hardcode any API paths in the workflow — all paths must be extracted from source
- Do not modify the openapi.json manually — it must be 100% auto-generated
- Do not remove existing paths from the spec without a deprecation notice
- Do not skip the OWASP Spectral ruleset validation

CONSULT: WebWakaDigitalOperatingSystem.md, PLATFORM_ROADMAP.md, ADR-001, scripts/generate-openapi.ts
```

---

### PROMPT-IMPL-02: Live Platform Status Integration

```
REPOSITORY: WebWakaDOS/webwaka-platform-docs
TASK: TASK-02 — Live Platform Status Integration

CONTEXT:
You are implementing in the webwaka-platform-docs repository. The current /status page and /api/status endpoint serve a hardcoded static array of services, all showing "operational". This must be replaced with a live polling mechanism that fetches real status from the webwaka-platform-status service.

ECOSYSTEM CAVEAT:
This repo does not run the status service — it consumes it. The status API URL must be configurable via environment variable (PLATFORM_STATUS_API_URL). If the env var is not set, fall back to the static hardcoded list with a clear "Status unavailable" warning.

READ BEFORE ACTING:
- server.js (lines 87-115: SERVICES array and status routes)
- PLATFORM_REVIEW_AND_ENHANCEMENTS.md (Pillar 1: Super Admin Integration)
- public/js/main.js (status badge update logic)
- public/css/main.css (status badge styles)

IMPORTANT REMINDERS:
- Nigeria-First: Nigerian network conditions mean the status API may be slow or unreliable — implement aggressive timeout (3s) and retry logic
- Offline First: cache last known status in memory; serve cached status if API is unreachable
- Event-Driven: status updates should be pushed via SSE (Server-Sent Events) to the browser, not require page refresh
- Do NOT expose internal service URLs or IPs in the status API response before serving to clients

DELIVERABLES:
1. New src/status-poller.js module:
   - Polls PLATFORM_STATUS_API_URL every 60 seconds
   - Returns cached status on polling failure
   - Emits an EventEmitter event when status changes
   - Configurable timeout (PLATFORM_STATUS_TIMEOUT_MS, default 3000)

2. Updated server.js:
   - /api/status uses status-poller.js instead of hardcoded array
   - /api/status/stream — Server-Sent Events endpoint for real-time updates
   - Rate limited: 120 req/min for /api/status, 10 concurrent SSE connections for /api/status/stream

3. Updated public/js/main.js:
   - Subscribe to /api/status/stream via EventSource API
   - Update header badge color in real-time without page reload
   - Show "Last updated: N seconds ago" in the status page

4. Updated /status page HTML:
   - Show "Status data may be delayed up to 60 seconds"
   - Show timestamp of last successful poll
   - Show "Status unavailable — showing last known status" when API is down

ACCEPTANCE CRITERIA:
- Mocking the status API to return degraded → docs header badge shows yellow within 60 seconds
- Mocking the status API as unreachable → docs shows "Status unavailable" (NOT false green)
- SSE connection established without errors in browser DevTools
- Status polling does not cause memory leaks (use clearInterval on server shutdown)

TESTS:
- Unit test: status-poller with mocked fetch → returns correct status
- Unit test: status-poller with fetch failure → returns cached status
- Unit test: SSE endpoint sends correct event format
- Add tests to scripts/build-validate.ts for status-poller module existence

AVOID:
- Do not hardcode any service names — read them from the status API response
- Do not expose raw internal API errors to the browser
- Do not use WebSocket (SSE is sufficient and simpler for unidirectional updates)
```

---

### PROMPT-IMPL-03: Search Index Caching + lunr Integration

```
REPOSITORY: WebWakaDOS/webwaka-platform-docs
TASK: TASK-03 — Search Index Caching + lunr.js Integration + Analytics

CONTEXT:
You are implementing in the webwaka-platform-docs repository. The current search implementation in src/utils/search-index.js rebuilds the index on every request using a hand-rolled toLowerCase().includes() scorer. The lunr package is installed but not used. This must be replaced with a proper lunr.js full-text index built once at startup and cached in memory.

READ BEFORE ACTING:
- src/utils/search-index.js (current hand-rolled implementation)
- server.js (GET /api/search route)
- package.json (lunr is listed as dependency)
- All files in content/, translations/, versions/ (the doc corpus)

DELIVERABLES:
1. Rewritten src/utils/search-index.js:
   - Exports buildIndex(rootDir) and search(index, query, limit) functions
   - Uses lunr.js for indexing and querying
   - Fields indexed: title (boost 10), headings (boost 5), body (boost 1), tags (boost 3)
   - Supports wildcard queries (lunr wildcard: trailing)
   - Returns: { results: [{ path, title, excerpt, score }], query, total, timeTaken }
   - excerpt: first 150 chars of content surrounding the match

2. Updated server.js:
   - Call buildIndex(ROOT_DIR) once at startup, store in module-scope variable
   - Expose GET /api/search/analytics endpoint (protected by ADMIN_API_KEY)
   - Log each search query (query string only, no IP) to analytics/search-queries.jsonl

3. New analytics/search-queries.jsonl tracking:
   - Append-only JSONL file
   - Each line: { query, results: count, timestamp }
   - Rotate when file exceeds 10MB

ACCEPTANCE CRITERIA:
- lunr.js is used for all search queries
- buildIndex() called once at startup, not per request
- GET /api/search returns results in <10ms for 100 doc files
- GET /api/search?q= returns { results: [], query: "", total: 0 }
- GET /api/search?q=<script>alert(1)</script> returns empty results, not XSS
- Score field present in all results

TESTS:
- All existing tests pass
- New unit tests: buildIndex() called once; lunr results ranked by score
- New unit test: XSS query returns empty results (no script execution)
- New integration test: search "webhook" returns webhooks.md in top 3 results

IMPORTANT REMINDERS:
- lunr does not support Arabic stemming — Arabic queries return results but may not rank perfectly
- The search index must be rebuilt when docs are updated (add a cache invalidation mechanism)
- Do not log full search queries that contain PII (email addresses, phone numbers) — strip before logging
```

---

### PROMPT-IMPL-07: Mermaid.js Diagram Rendering

```
REPOSITORY: WebWakaDOS/webwaka-platform-docs
TASK: TASK-07 — Mermaid.js Diagram Rendering in Markdown

CONTEXT:
You are implementing in the webwaka-platform-docs repository. Architecture Decision Records (ADRs) and platform documentation require visual diagrams to be effective. Markdown code blocks fenced with ```mermaid must be rendered as interactive SVG diagrams using the Mermaid.js library.

READ BEFORE ACTING:
- src/utils/markdown.js (renderMarkdown function)
- server.js (shell() function — where CDN scripts are added)
- public/js/main.js (page initialization)
- public/css/main.css (dark mode styles)
- content/adrs/ADR-001-multi-tenant-architecture.md (add example diagram here)

DELIVERABLES:
1. Updated src/utils/markdown.js:
   - Before sanitization, detect ```mermaid blocks
   - Replace them with <div class="mermaid-source" data-diagram="BASE64_ENCODED_CONTENT"></div>
   - After sanitization (which strips the raw mermaid text), re-inject as mermaid divs
   - Whitelist <svg>, <g>, <path>, <rect>, <text>, <tspan>, <marker>, <defs> in sanitize-html config

2. Updated server.js shell() function:
   - Add Mermaid.js CDN script tag: https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js
   - Add SRI integrity hash for the CDN script
   - Add mermaid to script-src CSP directive

3. Updated public/js/main.js:
   - Call mermaid.initialize({ startOnLoad: false, theme: 'dark' }) on page load
   - Read data-theme attribute to set mermaid theme (dark/default)
   - Call mermaid.run({ nodes: document.querySelectorAll('.mermaid') }) after DOM ready
   - On theme toggle, re-render mermaid diagrams with new theme

4. Updated public/css/main.css:
   - .mermaid-diagram { overflow-x: auto; margin: 24px 0; }
   - Dark mode mermaid SVG color overrides
   - Loading skeleton while diagram renders

5. Updated content/adrs/ADR-001-multi-tenant-architecture.md:
   - Add a sequenceDiagram showing the multi-tenant auth flow
   - Add a graph LR showing the Cloudflare KV isolation layers

ACCEPTANCE CRITERIA:
- ADR-001 renders its sequence diagram as SVG in the browser
- Dark mode: diagram background is dark, text is light
- Invalid mermaid syntax: renders error message, does not crash page
- sanitize-html does not strip rendered SVG output
- Mermaid CDN has SRI hash

TESTS:
- Unit test: renderMarkdown('```mermaid\ngraph LR\nA-->B\n```') does not output raw mermaid text
- Unit test: sanitizeContent does not strip <svg> tags
- Build validation: check mermaid CDN script has integrity attribute
```

---

### PROMPT-IMPL-08: Rate Limiting

```
REPOSITORY: WebWakaDOS/webwaka-platform-docs
TASK: TASK-08 — Rate Limiting on All API Endpoints

CONTEXT:
You are implementing in the webwaka-platform-docs repository. The /api/search, /api/feedback POST, /api/status, and /api/postman/download endpoints have no rate limiting. This creates a DoS vulnerability where a simple loop can abuse feedback storage, saturate disk I/O from search, or exhaust API response bandwidth.

READ BEFORE ACTING:
- server.js (all /api/* route definitions)
- package.json (add express-rate-limit dependency)

DELIVERABLES:
1. Install express-rate-limit:
   npm install express-rate-limit

2. Updated server.js:
   Add per-endpoint rate limiters with the following limits:
   - searchLimiter: 60 req/min per IP → /api/search
   - feedbackWriteLimiter: 10 req/min per IP → POST /api/feedback
   - feedbackReadLimiter: 120 req/min per IP → GET /api/feedback
   - statusLimiter: 120 req/min per IP → /api/status
   - postmanLimiter: 30 req/min per IP → /api/postman/*
   - adminLimiter: 10 req/min per IP → /admin/*

   All limiters must:
   - Return JSON: {"error":"Too many requests","retryAfter":60}
   - Set Retry-After header
   - Respect X-Forwarded-For (behind Cloudflare proxy)
   - Be configurable via environment variables

3. Add environment variables:
   - RATE_LIMIT_SEARCH_PER_MIN (default: 60)
   - RATE_LIMIT_FEEDBACK_PER_MIN (default: 10)
   - RATE_LIMIT_STATUS_PER_MIN (default: 120)

4. Skip rate limiting for internal health check requests:
   - When X-Internal-Health: true header is present (verified against INTERNAL_HEALTH_KEY env var)

ACCEPTANCE CRITERIA:
- 61st search request in a minute returns 429 with Retry-After header
- Rate limiter resets after the window expires
- All 429 responses have Content-Type: application/json
- Environment variable overrides work correctly
- CI health checks are not blocked by rate limiting

TESTS:
- Unit test: 61st request returns 429
- Unit test: Retry-After header present in 429
- Unit test: Internal health check header bypasses rate limit
- Integration test: 10 rapid feedback POST requests → 11th gets 429
```

---

## PART 9: QA PROMPTS (COPY-PASTE READY)

---

### PROMPT-QA-01: OpenAPI Coverage QA

```
REPOSITORY: WebWakaDOS/webwaka-platform-docs
QA TASK: QA-01 — Validate Full OpenAPI Coverage

CONTEXT:
You are performing QA on the completed TASK-01 (Cross-Repo OpenAPI Extraction) in the webwaka-platform-docs repository. The openapi.json should now cover 80+ API paths across all platform modules. Your mission is to validate coverage, schema quality, Nigerian data compliance, and CI pipeline integrity.

ECOSYSTEM CAVEAT:
You must cross-reference the extracted paths against the actual route definitions in webwaka-commerce, webwaka-core, and webwaka-transport to verify completeness. The QA must not be performed on the docs repo in isolation.

READ BEFORE ACTING:
- openapi.json (current state after TASK-01)
- .github/workflows/generate-openapi.yml (CI pipeline)
- WebWakaDigitalOperatingSystem.md (Part 8.1)
- scripts/generate-openapi.test.ts (unit tests)

WHAT TO VERIFY:
1. Path count ≥ 80 (node -e "console.log(Object.keys(require('./openapi.json').paths).length)")
2. All major modules documented: Auth, Tenants, Commerce Products, Commerce Orders, POS, Transport Fleet, Transport Bookings, Webhooks
3. Every path has: operationId (unique), summary (non-empty), tags (≥1), security (unless explicitly public)
4. Every 4xx response is documented: 400, 401, 403, 422
5. Every schema has ≥1 example
6. All monetary examples use NGN as currency code
7. All phone number examples match pattern ^\+234[0-9]{10}$
8. All tenant-scoped paths document tenant_id (path param or request body)
9. Deprecated paths have deprecated: true and x-deprecation-date

SPECTRAL VALIDATION:
npx @stoplight/spectral-cli lint openapi.json --ruleset https://unpkg.com/@stoplight/spectral-owasp-ruleset@1.x/dist/ruleset.mjs --format pretty

This must pass with 0 errors (warnings acceptable).

BUGS TO LOOK FOR:
- Paths with empty responses: {}
- OperationIds that duplicate across different paths
- Missing 401 on auth-required endpoints
- Missing tenant_id documentation on tenant-scoped paths
- Examples with USD instead of NGN amounts
- Examples with +1 (US) instead of +234 (Nigeria) phone numbers

EDGE CASES:
- Webhook callback paths (should use callbacks: block, not paths:)
- File upload endpoints (should use multipart/form-data, not application/json)
- Pagination params (page, limit) on all list endpoints

REGRESSION DETECTION:
- Compare path count to previous openapi.json commit — must not decrease
- Run: git diff HEAD~1 openapi.json | grep "^-" | grep -E '^\-\s+"/' | wc -l
- Any positive count here must trigger a manual review

WHAT DONE MEANS:
- Spectral OWASP lint: 0 errors
- Path count: ≥80
- All schemas have examples
- All Nigerian data fields have correct format
- CI generate-from-repos job last run: success
- Swagger UI at /api-explorer renders all endpoints without errors
```

---

### PROMPT-QA-02: Rate Limiting QA

```
REPOSITORY: WebWakaDOS/webwaka-platform-docs
QA TASK: QA-08 — Rate Limiting Verification

CONTEXT:
You are performing QA on the completed TASK-08 (Rate Limiting) in the webwaka-platform-docs repository. Rate limits have been applied to all /api/* endpoints. Your mission is to verify that the limits are enforced correctly, that 429 responses are properly formatted, and that legitimate use cases (CI health checks, admin operations) are not blocked.

READ BEFORE ACTING:
- server.js (rate limiter middleware definitions)
- package.json (express-rate-limit installed)

VERIFICATION STEPS:

1. Search Rate Limit (60/min):
   for i in $(seq 1 62); do curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:5000/api/search?q=test"; done
   Expected: First 60 return 200, request 61+ return 429

2. Feedback POST Rate Limit (10/min):
   for i in $(seq 1 12); do curl -s -X POST http://localhost:5000/api/feedback -H "Content-Type: application/json" -d '{"path":"README.md","vote":"up"}' -o /dev/null -w "%{http_code}\n"; done
   Expected: First 10 return 200, request 11+ return 429

3. Retry-After Header:
   curl -v -X POST http://localhost:5000/api/feedback -H "Content-Type: application/json" -d '{}' [after limit]
   Expected: Retry-After header present in response

4. 429 Response Format:
   Response body must be: {"error":"Too many requests","retryAfter":60}
   Content-Type must be: application/json

5. Rate Limit Reset:
   Hit the limit → wait 60 seconds → verify requests succeed again

6. IP Isolation:
   Rate limits must be per-IP, not global. If one IP hits the limit, other IPs must still succeed.

7. Internal Health Check Bypass:
   curl -H "X-Internal-Health: <INTERNAL_HEALTH_KEY>" http://localhost:5000/api/status
   Expected: 200 even if rate limit would otherwise apply

BUGS TO LOOK FOR:
- Rate limiter counting GET and POST as the same quota (they should be separate for /api/feedback)
- Rate limiter using session instead of IP (trivially bypassable)
- Memory leak from rate limiter store growing unbounded (use Redis or in-memory with TTL)
- 429 response body is HTML instead of JSON (breaks API clients)

WHAT DONE MEANS:
- All rate limit thresholds enforced correctly
- 429 responses are JSON with Retry-After
- CI health checks not blocked
- Manual abuse test (100 rapid requests) confirms protection is active
```

---

### PROMPT-QA-03: PWA and Offline QA

```
REPOSITORY: WebWakaDOS/webwaka-platform-docs
QA TASK: QA-06 — PWA Installability and Offline Access Verification

CONTEXT:
You are performing QA on the PWA implementation in the webwaka-platform-docs repository. The manifest.json, service worker (sw.js), and PWA icons must all be correctly configured for the app to be installable and function offline.

READ BEFORE ACTING:
- public/manifest.json
- public/sw.js
- public/icons/ (check icons exist)
- server.js shell() function (manifest link, SW registration script)

VERIFICATION STEPS:

1. Manifest Validation:
   - Open http://localhost:5000 in Chrome
   - DevTools > Application > Manifest
   - Verify: name, short_name, start_url, display, icons (all 3 sizes load)
   - No manifest errors in DevTools console

2. Service Worker Registration:
   - DevTools > Application > Service Workers
   - Status: "Activated and is running"
   - No errors in SW console

3. Icon Files Present:
   curl -I http://localhost:5000/icons/icon-192.png → 200
   curl -I http://localhost:5000/icons/icon-512.png → 200

4. Offline Access:
   - Visit http://localhost:5000 (fully loaded)
   - DevTools > Network > Offline (check the checkbox)
   - Refresh the page
   - Expected: Page loads from cache (not blank screen or browser error)

5. openapi.json Offline Access:
   - Visit /api-explorer (triggers openapi.json cache)
   - Go offline
   - Visit /api-explorer again
   - Expected: Swagger UI loads with cached openapi.json

6. Lighthouse PWA Audit:
   npx lighthouse http://localhost:5000 --only-categories=pwa --output=json
   Expected: score ≥ 0.9 (90)

7. iOS Safari Apple Touch Icon:
   - Verify <link rel="apple-touch-icon" href="/icons/icon-192.png"> in page source

BUGS TO LOOK FOR:
- Icons referenced in manifest but returning 404 (Bug 8 from bug list)
- SW registered but status "Redundant" (previous SW still active)
- HTTPS required for SW (localhost exception — but production needs HTTPS)
- Cache strategy causing stale docs to be served without updates

WHAT DONE MEANS:
- Lighthouse PWA score ≥ 90
- App installable from Chrome on Android (test with real device or DevTools mobile emulation)
- Offline fallback page shown for unvisited pages
- openapi.json accessible offline after first visit to /api-explorer
```

---

## PART 10: PRIORITY ORDER

| Priority | Task | Effort | Business Impact |
|----------|------|--------|-----------------|
| P0 CRITICAL | TASK-01: Full OpenAPI Coverage | 2 days | Developers discover the full API |
| P0 CRITICAL | BUG-08: PWA Icons | 1 hour | PWA installation broken |
| P0 CRITICAL | BUG-14: package.json main field | 5 min | Correctness |
| P1 HIGH | TASK-02: Live Status Integration | 1 day | Developer trust |
| P1 HIGH | TASK-03: Search Caching + lunr | 4 hours | Performance |
| P1 HIGH | TASK-05: Sitemap + Robots.txt | 2 hours | SEO discoverability |
| P1 HIGH | TASK-08: Rate Limiting | 4 hours | Security |
| P1 HIGH | TASK-07: Mermaid.js | 4 hours | Architecture clarity |
| P2 MEDIUM | TASK-04: Real AI Translations | 1 day | Africa market |
| P2 MEDIUM | TASK-12: SRI Hashes | 2 hours | Supply-chain security |
| P2 MEDIUM | TASK-13: AsyncAPI Event Bus | 2 days | Event-driven docs |
| P2 MEDIUM | TASK-14: PR Link Checking | 4 hours | Doc quality |
| P2 MEDIUM | TASK-17: Nigeria Dev Resources | 2 days | Nigeria-first |
| P2 MEDIUM | TASK-10: Per-Page Git Metadata | 4 hours | Developer trust |
| P2 MEDIUM | TASK-18: Breaking Changes | 1 day | API lifecycle |
| P3 LOW | TASK-09: Cloudflare Pages Deploy | 2 days | Performance + global CDN |
| P3 LOW | TASK-11: Algolia DocSearch | 4 hours | Search quality |
| P3 LOW | TASK-15: SDK Playground | 1 day | DX improvement |
| P3 LOW | TASK-16: Analytics | 2 hours | Data-driven improvement |
| P3 LOW | TASK-19: Feedback Dashboard | 4 hours | Feedback actionability |
| P3 LOW | TASK-20: Lighthouse CI | 2 hours | Quality automation |

---

## PART 11: DEPENDENCIES

```
TASK-01 (OpenAPI) ────────────────────────────────────────┐
                                                           ├─► TASK-13 (AsyncAPI) depends on TASK-01 event schema
TASK-02 (Live Status) ──────────────────────────────────  │
                                                           │
TASK-03 (Search) ──────────────────────────────────────── ├─► TASK-11 (Algolia) replaces TASK-03 output
                                                           │
TASK-04 (Translations) ─── depends on CORE-5 AI key ─── ─┤
                                                           │
TASK-05 (Sitemap) ── depends on nav-builder.js ────────── ┤
                                                           │
TASK-06 (PWA Icons) ─── must complete before TASK-09 ──── ┤
                                                           │
TASK-07 (Mermaid) ── adds to TASK-01 diagrams ─────────── ┤
                                                           │
TASK-08 (Rate Limit) ── must complete before TASK-09 ──── ┤
                                                           │
TASK-09 (CF Pages) ── depends on TASK-06, 08 ─────────── ─┘

TASK-17 (Nigeria Resources) ── can run in parallel with all other tasks
TASK-20 (Lighthouse CI) ── depends on TASK-09 (needs public URL)
```

---

## PART 12: PHASE SPLIT

### Phase 1 (Immediate — Next 2 Weeks)

**Goal:** Fix all critical bugs and implement the highest-impact enhancements

1. BUG-08 — Generate PWA icons (1 hour)
2. BUG-14 — Fix package.json main field (5 minutes)
3. BUG-01 — Remove dead sanitizeContent() from server.js module scope (30 minutes)
4. TASK-01 — Complete OpenAPI extraction CI (2 days)
5. TASK-03 — Search caching with lunr (4 hours)
6. TASK-05 — Sitemap.xml + robots.txt (2 hours)
7. TASK-08 — Rate limiting (4 hours)
8. TASK-07 — Mermaid.js (4 hours)
9. TASK-02 — Live status polling (1 day)
10. TASK-12 — SRI hashes (2 hours)

**Deliverables:** Fully functional, secure docs site with complete API coverage

### Phase 2 (Following Sprint — Weeks 3-6)

**Goal:** Content completeness, Africa-first features, advanced integrations

11. TASK-04 — Real AI translations (1 day)
12. TASK-13 — AsyncAPI event catalog (2 days)
13. TASK-17 — Nigeria developer resources (2 days)
14. TASK-10 — Per-page git metadata (4 hours)
15. TASK-14 — PR broken link CI (4 hours)
16. TASK-18 — Breaking changes registry (1 day)
17. TASK-09 — Cloudflare Pages deployment (2 days)
18. TASK-16 — Analytics (2 hours)
19. TASK-19 — Feedback dashboard (4 hours)
20. TASK-11 — Algolia DocSearch (4 hours)
21. TASK-15 — SDK Playground (1 day)
22. TASK-20 — Lighthouse CI (2 hours)

---

## PART 13: REPO CONTEXT AND ECOSYSTEM NOTES

### Cross-Repo Contract Stability Requirements

The `webwaka-platform-docs` repo consumes output from 16 other repos. Before implementing TASK-01:

1. **`webwaka-core`** must have stable route definitions (TSOA or Express) with consistent `operationId` naming
2. **`webwaka-commerce`** routes must be tagged with `@Tag('Commerce')` in TSOA annotations
3. **`webwaka-transport`** must expose a stable route registry file that can be parsed by AST
4. **Event Bus Schema** in `EVENT_BUS_SCHEMA.md` must be kept in sync with actual events emitted

### Environment Variables Required

```env
# Status Integration
PLATFORM_STATUS_API_URL=https://status.webwaka.io/api

# AI Translation
WEBWAKA_AI_KEY=<CORE-5 API key>

# GitHub Bot for Cross-Repo Cloning
WEBWAKA_BOT_TOKEN=<read-only PAT>

# Admin Protection
ADMIN_API_KEY=<random 32-char hex>

# Rate Limiting Configuration
RATE_LIMIT_SEARCH_PER_MIN=60
RATE_LIMIT_FEEDBACK_PER_MIN=10

# Internal Health Bypass
INTERNAL_HEALTH_KEY=<random 32-char hex>

# Cloudflare Pages (Phase 2)
CLOUDFLARE_API_TOKEN=<Cloudflare API token>
CLOUDFLARE_ACCOUNT_ID=<account ID>
```

### Shared Primitives from `webwaka-core`

The docs site does NOT run `@webwaka/core` code — it only documents it. However:
- All API path examples must match the request/response shapes defined in `@webwaka/core/types`
- Authentication flows documented in the API Explorer must match `@webwaka/core` auth middleware behavior
- Webhook payload schemas must match the `EventBus` schemas in `webwaka-core`

---

## PART 14: GOVERNANCE AND REMINDER BLOCK

### 7 Core Invariants — Application to this Repo

| Invariant | Application |
|-----------|-------------|
| Build Once Use Infinitely | openapi.json is the single source for SDK gen, Postman, and docs — never manually maintained |
| Mobile First | All doc pages must be usable on a 375px mobile screen with one hand |
| PWA First | The site must install as a PWA and cache critical content offline |
| Offline First | /api-explorer must work with cached openapi.json when offline |
| Nigeria First | All examples: NGN currency, +234 phones, Paystack/Flutterwave payment examples |
| Africa First | French and Swahili translations must be production-quality, not stubs |
| AI Native | CORE-5 AI is used for translations — this must be tested in CI with a real key |

### AI Governance Restrictions

The Replit agent implementing these tasks must NOT:
- Modify financial ledger logic (not in scope for this repo)
- Deploy to production without passing all CI checks
- Bypass the 27-point build validation script
- Remove existing ADRs or architectural decision records
- Commit openapi.json manually — it must always be auto-generated

### Conventional Commit Format for this Repo

```
feat(openapi): add Commerce and Transport paths from cross-repo extraction [Part 8.1]
fix(search): cache lunr index at startup to prevent per-request rebuilds
docs(nigeria): add Paystack integration guide
chore(ci): add broken-link check to PR workflow
perf(status): replace polling with SSE for real-time updates
```

Blueprint citations are mandatory: `[Part X.Y]` where X.Y matches the WebWakaDigitalOperatingSystem.md section.

---

## PART 15: EXECUTION READINESS NOTES

### Immediate Actions (Before Starting Any Task)

1. **Verify `WEBWAKA_BOT_TOKEN`** secret is configured in GitHub repo settings → Secrets
2. **Verify `WEBWAKA_AI_KEY`** secret is available (needed for TASK-04)
3. **Run existing test suite** to confirm baseline: `npm test` → all 150 tests pass
4. **Run build validation**: `npm run build` → all 27 checks pass
5. **Confirm openapi.json baseline**: `node -e "console.log(Object.keys(require('./openapi.json').paths).length)"` → currently 11

### Definition of Done for This Repo

A task is DONE when:
- [ ] All acceptance criteria are met
- [ ] All new and existing unit tests pass (`npm test`)
- [ ] Coverage remains ≥80% on all metrics (`npm run test:coverage`)
- [ ] Build validation passes (`npm run build`) — all 27 checks green
- [ ] No broken internal links (`npm run check-links`)
- [ ] OpenAPI spec validates: `npx @stoplight/spectral-cli lint openapi.json`
- [ ] Server starts without errors (`npm start`)
- [ ] Main routes respond correctly (curl tests on /, /doc, /api/search, /api/status)
- [ ] Git commit follows Conventional Commits format with Blueprint citation
- [ ] PR review passed

### Known Technical Debt to Track

| Debt Item | Impact | Target Sprint |
|-----------|--------|---------------|
| `lunr` installed but unused | Wasted dependency | Phase 1 (TASK-03) |
| `sanitizeContent()` dead code in server.js | Confusion risk | Phase 1 immediately |
| `package.json` main → wrong file | npm publish would fail | Immediately |
| Translations are stubs | Africa market cannot use docs | Phase 2 (TASK-04) |
| Status always hardcoded green | Developer trust loss | Phase 1 (TASK-02) |
| openapi.json manually maintained | Docs drift from code | Phase 1 (TASK-01) |

---

*Document created: April 2026 | Repo: WebWakaDOS/webwaka-platform-docs | Version: 1.0.0*
*This document must be updated after each Phase 1 and Phase 2 sprint completion.*
