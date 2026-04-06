# Contributing to WebWaka Platform Docs

**Repo:** `webwaka-platform-docs`  
**Last Updated:** 2026-04-06

Welcome — and thank you for helping keep WebWaka OS v4's documentation clear, accurate, and useful. This guide explains everything you need to know to contribute.

---

## Why Contribute?

WebWaka OS v4 powers businesses across Nigeria and Africa. Every engineer, QA lead, and architect who writes clear documentation directly reduces integration errors, speeds up onboarding, and strengthens architectural consistency across 17 repositories.

This repo is the canonical source of truth for:
- Architectural Decision Records (ADRs)
- Deployment guides
- API documentation
- QA report templates
- Implementation plans

---

## Scope of This Repository

> **Important:** Per the Anti-Drift Rule, **no executable code lives in this repo.** This is a documentation-only repository. If you have code to contribute, it belongs in the appropriate vertical or core repo.

Contributions accepted here:
- New or updated Markdown documentation (`.md`)
- OpenAPI spec updates (`openapi.json`)
- New ADRs (see `CONTRIBUTING-ADR.md` for the full ADR process)
- QA report templates and examples
- Deployment guide improvements

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/webwaka-os/webwaka-platform-docs.git
cd webwaka-platform-docs
npm install
```

### 2. Run the Documentation Server Locally

```bash
npm start
```

The docs site will be available at `http://localhost:5000`. It renders all Markdown files live from the `content/` directory.

### 3. Understand the Directory Structure

```
webwaka-platform-docs/
├── content/
│   ├── adrs/                  # Architectural Decision Records
│   ├── tutorials/             # Step-by-step integration guides
│   ├── deployment-guides/     # Deployment and configuration guides
│   ├── qa-reports/            # QA templates and examples
│   ├── api-docs/              # API reference documentation
│   ├── sdk-docs.md            # SDK and auth reference
│   ├── webhooks.md            # Webhook event reference
│   ├── error-codes.md         # Platform error code reference
│   ├── security-compliance.md # Security and compliance guide
│   ├── developer-portal.md    # Developer portal overview
│   └── contribution-guidelines.md
├── public/                    # Static assets (CSS, JS, icons)
├── src/                       # Documentation server source
├── server.js                  # Express docs server
├── openapi.json               # OpenAPI 3.1 specification
├── CONTRIBUTING.md            # This file
├── CONTRIBUTING-ADR.md        # ADR-specific contribution guide
└── README.md
```

---

## Style Guide

### Language & Tone

- Write in **clear, plain English** unless the content is translated (see Translations below).
- Use **active voice**: "The API returns a JWT" not "A JWT is returned by the API."
- Be **specific and precise**: name the exact service, endpoint, or field. Avoid "something like" or "etc."
- Address the reader as **"you"**: "You will need to set the `WEBWAKA_API_KEY` environment variable."
- Avoid jargon unless it is defined inline or linked to a glossary entry.

### Markdown Conventions

- Use ATX headings (`#`, `##`, `###`) — never underline-style headings.
- One blank line before and after headings, code blocks, tables, and lists.
- Use fenced code blocks (` ``` `) with a language identifier: `bash`, `typescript`, `json`, `sql`, etc.
- Use `**bold**` for UI labels, field names, and emphasis. Use `_italic_` sparingly for terminology introductions.
- Use backticks for inline code: variable names, file paths, endpoint URLs, environment variable names.
- Use descriptive link text: `[Webhooks Reference](/doc/content/webhooks.md)` not `[click here]`.

### Headings

- Top-level `#` heading = page title. One per document.
- Use `##` for major sections, `###` for subsections.
- Headings should be sentence-case: "Getting started" not "Getting Started" (except proper nouns and acronyms).

### Code Examples

All code examples must be:
- **Runnable** — do not include placeholder syntax that will not execute without modification. Clearly mark variables the reader must replace with `<VARIABLE_NAME>` or a comment.
- **Language-tagged** — always specify the language in the fenced code block.
- **Current** — verify examples against the current API or service behavior before publishing.

### Tables

Use Markdown tables for structured comparisons. Always include a header row separated by `|---|`.

### File Naming

| Content Type | Convention | Example |
|---|---|---|
| ADRs | `ADR-{NUMBER}-{kebab-case-title}.md` | `ADR-004-paystack-enforcement.md` |
| Deployment guides | `{service-name}.md` | `ai-platform.md` |
| QA reports | `{scope}-qa-report-{date}.md` | `commerce-qa-report-2026-04.md` |
| Tutorials | `{NN}-{kebab-case-title}.md` | `04-offline-sync.md` |

---

## How to Propose Changes

### Minor Changes (typos, broken links, small factual corrections)

1. Fork the repository.
2. Create a branch: `fix/description-of-change`.
3. Make the change.
4. Open a PR with a clear title and a one-sentence description.

Minor PRs may be merged by any Documentation Maintainer without a full review cycle.

### Significant Changes (new guides, updated API docs, restructuring)

1. **Open an issue first** to discuss the change before investing effort. This avoids duplicated work.
2. Fork the repository.
3. Create a branch: `docs/description-of-change`.
4. Write the content following the style guide above.
5. Preview locally with `npm start` and verify the page renders correctly.
6. Open a PR and fill out the PR template.
7. Request review from the relevant team (e.g., tag `@webwaka/platform-arch` for ADRs, `@webwaka/qa` for QA templates).

### New ADRs

ADRs have their own process. See [`CONTRIBUTING-ADR.md`](./CONTRIBUTING-ADR.md) for the complete ADR workflow.

---

## Review Process

All PRs require **at least one approving review** before merging. For architecture-critical documentation (ADRs, deployment guides, API docs), **two reviews** are required — one of which must be from a Platform Architecture Team member.

Reviewers will check:
- Accuracy and technical correctness
- Adherence to the style guide
- Correct directory placement and file naming
- No broken links (run `npm run check-links` before submitting)
- No executable code introduced

Expected review turnaround is **2 business days** for standard PRs.

---

## Translations

The platform supports documentation in English (primary), French, Swahili, and Arabic. Translated files live in `/translations/{lang}/` (mirroring the `content/` structure).

To add or update a translation:
1. Update the source English document first.
2. Create or update the translated file in the corresponding `/translations/{lang}/` path.
3. Do not machine-translate directly — use the translation pipeline (`npm run translate`) for initial drafts, then have a native speaker review.

---

## Linting & Link Checking

Before opening a PR, run:

```bash
npm run check-links
```

This checks for broken internal and external links. Fix all broken links before submitting.

---

## Questions & Contact

| Topic | Contact |
|---|---|
| General documentation | `#docs` on internal chat |
| ADR process | `#platform-architecture` |
| QA templates | `#qa-guild` |
| API documentation | The owning team's channel |
| Access & permissions | `devrel@webwaka.io` |

---

*This repository is maintained by the WebWaka Platform Documentation Guild. Contributions from all teams are welcome and encouraged.*
