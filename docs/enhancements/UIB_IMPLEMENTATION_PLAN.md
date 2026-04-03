# WebWaka UI Builder (`webwaka-ui-builder`) Implementation Plan

**Prepared by:** Manus AI
**Date:** April 2026
**Target Repository:** `webwaka-ui-builder`

## 1. Executive Summary

`webwaka-ui-builder` is the centralized template management and deployment orchestration service for the WebWaka ecosystem. It manages the canonical `TenantBrandingSchema` and orchestrates Cloudflare Pages deployments for tenant storefronts and portals. This plan details the next phase of enhancements to support custom domains, advanced theming, and multi-vertical templates.

## 2. Current State vs. Target State

**Current State:**
- Basic Cloudflare Pages deployment orchestration.
- 3 Commerce templates (single-vendor, multi-vendor, restaurant).
- Centralized branding config via `UI_CONFIG_KV`.

**Target State:**
- Automated custom domain provisioning via Cloudflare API.
- 15+ templates covering all 12 vertical suites.
- Advanced theming engine with CSS variable injection.
- PWA manifest generation for offline-first capabilities.

## 3. Enhancement Backlog (Top 20)

1. **Custom Domain Provisioning:** Automate `CNAME` creation and SSL issuance via Cloudflare API.
2. **PWA Manifest Generator:** Dynamically generate `manifest.json` based on tenant branding.
3. **CSS Variable Injector:** Inject `TenantBrandingSchema` colors as CSS variables at build time.
4. **Fintech Templates:** Add templates for Neo-bank, Wallet, and Lending portals.
5. **Logistics Templates:** Add templates for Courier Tracking and Fleet Management.
6. **Civic Templates:** Add templates for Election Monitoring and Citizen Portals.
7. **Real Estate Templates:** Add templates for Property Listings and Facility Management.
8. **Professional Templates:** Add templates for Law Firm Portals and Consulting Booking.
9. **Institutional Templates:** Add templates for School ERP and Hospital Patient Portals.
10. **Services Templates:** Add templates for Salon Booking and Artisan Directories.
11. **Production Templates:** Add templates for Factory Dashboards and Farm Management.
12. **Transport Templates:** Add templates for Ride-Hailing and Bus Ticketing.
13. **SEO Metadata Generator:** Dynamically generate `<meta>` tags based on tenant config.
14. **Favicon Generator:** Automatically resize tenant logos into multiple favicon formats.
15. **Deployment Rollback:** Support rolling back to a previous Cloudflare Pages deployment.
16. **A/B Testing Support:** Deploy multiple templates simultaneously and route traffic via Workers.
17. **Custom CSS Overrides:** Allow advanced tenants to inject custom CSS snippets.
18. **Multi-Language Support:** Integrate i18n routing into the generated templates.
19. **Accessibility (a11y) Checker:** Run an automated Lighthouse a11y scan before deployment.
20. **Template Preview Environments:** Generate temporary preview URLs before publishing to production.

## 4. Execution Phases

### Phase 1: Core Infrastructure
- Implement Custom Domain Provisioning.
- Implement PWA Manifest Generator.
- Implement CSS Variable Injector.

### Phase 2: Template Expansion (Batch 1)
- Add Fintech Templates.
- Add Logistics Templates.
- Add Civic Templates.

### Phase 3: Advanced Features
- Implement Deployment Rollback.
- Implement SEO Metadata Generator.

## 5. Replit Execution Prompts

**Prompt 1: Custom Domain Provisioning**
```text
You are the Replit execution agent for `webwaka-ui-builder`.
Task: Implement Custom Domain Provisioning.
1. Open `src/routes/deployment.ts`.
2. Add a new endpoint `POST /deployments/:id/domain`.
3. Implement the Cloudflare API call to add a custom domain to the Pages project.
4. Ensure the endpoint requires `manage:deployments` permission.
```

**Prompt 2: PWA Manifest Generator**
```text
You are the Replit execution agent for `webwaka-ui-builder`.
Task: Implement PWA Manifest Generator.
1. Create `src/services/pwa.ts`.
2. Implement `generateManifest(branding: TenantBrandingSchema)` to return a valid JSON manifest.
3. Ensure `theme_color` and `background_color` are mapped correctly.
4. Add unit tests in `src/services/pwa.test.ts`.
```
