# WebWaka UI Builder (`webwaka-ui-builder`) QA Certification

**Prepared by:** Manus AI
**Date:** April 2026
**Target Repository:** `webwaka-ui-builder`

## 1. Audit Scope

This QA certification covers the implementation of custom domain provisioning, PWA manifest generation, and CSS variable injection in `webwaka-ui-builder`.

## 2. Acceptance Criteria

| ID | Feature | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- |
| QA-UIB-1 | Custom Domains | `POST /deployments/:id/domain` successfully adds a custom domain to the Cloudflare Pages project. | PENDING |
| QA-UIB-2 | PWA Manifest | `generateManifest()` correctly maps `TenantBrandingSchema` colors to `theme_color` and `background_color`. | PENDING |
| QA-UIB-3 | CSS Variables | `TenantBrandingSchema` colors are correctly injected as CSS variables at build time. | PENDING |
| QA-UIB-4 | Unit Tests | All new services and endpoints have passing unit tests in `src/**/*.test.ts`. | PENDING |

## 3. Offline Resilience Testing

- Verify that the generated PWA manifest includes a valid `start_url` and `display` mode (`standalone` or `fullscreen`).
- Ensure that the generated templates include a service worker that caches the HTML shell and CSS variables for offline access.

## 4. Security & RBAC Validation

- Verify that the `POST /deployments/:id/domain` endpoint requires the `manage:deployments` permission.
- Ensure that tenants cannot provision domains that belong to other tenants or reserved system domains.

## 5. Regression Guards

- Run `npm run test` to ensure 100% pass rate.
- Run `npm run build` to ensure no TypeScript compilation errors.
- Verify that the existing Commerce templates (single-vendor, multi-vendor, restaurant) still deploy successfully with the new CSS variable injection.
