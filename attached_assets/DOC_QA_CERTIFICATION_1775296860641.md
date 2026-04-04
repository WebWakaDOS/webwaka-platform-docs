# WebWaka Platform Docs (`webwaka-platform-docs`) QA Certification

**Prepared by:** Manus AI
**Date:** April 2026
**Target Repository:** `webwaka-platform-docs`

## 1. Audit Scope

This QA certification covers the implementation of Automated OpenAPI Generation, the Interactive API Explorer, and the AI Translation Pipeline in `webwaka-platform-docs`.

## 2. Acceptance Criteria

| ID | Feature | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- |
| QA-DOC-1 | OpenAPI Generation | The GitHub Action successfully clones all 15 repos, extracts routes/types, and merges them into a valid `openapi.json` file. | PENDING |
| QA-DOC-2 | API Explorer | The Swagger UI component successfully loads the `openapi.json` file and allows users to test endpoints against the staging environment. | PENDING |
| QA-DOC-3 | AI Translation | The translation pipeline successfully uses `getAICompletion()` to translate Markdown files into French, Swahili, and Arabic without breaking code blocks or links. | PENDING |
| QA-DOC-4 | Unit Tests | All custom AST parsing and translation scripts have passing unit tests in `scripts/**/*.test.ts`. | PENDING |

## 3. Offline Resilience Testing

- The documentation site is a static site (e.g., Docusaurus or Next.js static export).
- Verify that the site functions correctly as a Progressive Web App (PWA) and caches the `openapi.json` file for offline viewing.

## 4. Security & RBAC Validation

- Verify that the "Try it out" feature in the API Explorer does not expose production API keys or sensitive data.
- Ensure that the GitHub Action workflow uses a read-only PAT to clone the 15 repos and does not have write access to the source code.
- Confirm that the AI translation pipeline sanitizes Markdown files to prevent XSS attacks before rendering them in the browser.

## 5. Regression Guards

- Run `npm run build` to ensure the static site generates without errors.
- Run a link checker (e.g., `broken-link-checker`) to ensure no dead links exist across the documentation site.
- Verify that the existing architectural decision records (ADRs) and governance policies are still accessible and correctly formatted.
