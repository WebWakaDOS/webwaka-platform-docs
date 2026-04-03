# WEBWAKA UI BUILDER ARCHITECTURE

## Platform Purpose

The WebWaka UI Builder Platform (`webwaka-ui-builder`) is a new, bounded platform capability designed to orchestrate the composition, configuration, and deployment of tenant-aware front-end interfaces across the entire WebWaka ecosystem. It is not a basic static site generator or a monolithic CMS. Instead, it is a **tenant-aware UI composition system** that enables the automated deployment of branded websites, vertical-specific dashboards, and interconnected management portals. 

By centralizing template management and deployment orchestration, this platform enforces the "Build Once Use Infinitely" invariant, eliminating the current fragmentation where UI layouts and branding logic are hardcoded within individual vertical repositories (e.g., `webwaka-commerce`, `webwaka-super-admin-v2`).

## Capability Map

The UI Builder Platform provides the following core capabilities:

1.  **Template Registry & Taxonomy:** A centralized catalog of predefined, categorized UI templates (e.g., "E-commerce Storefront," "Legal Practice Booking Portal," "Transport Ticketing Site").
2.  **Tenant Branding & Theming Engine:** A unified system for managing tenant-specific branding (colors, typography, logos, assets) that dynamically applies to selected templates.
3.  **3-in-1 Interconnection Engine:** Automated wiring that connects a deployed website/dashboard to its corresponding vertical management system (e.g., `webwaka-commerce` POS) and optional marketplace presence.
4.  **Deployment Orchestration:** Integration with Cloudflare Pages (via Wrangler/API) to provision, build, and deploy tenant-specific front-end applications at the edge.
5.  **Builder Admin Interface:** A control plane (accessible via `webwaka-super-admin-v2`) for Super Admins to manage templates and for Tenant Admins to configure their deployed interfaces.

## Vertical Applicability Model

The platform is designed to support all 12 WebWaka vertical suites through a standardized categorization model. Templates are tagged with metadata defining their vertical applicability:

| Vertical Suite | Template Categories | Example Use Case |
| :--- | :--- | :--- |
| **Commerce** | Retail Storefront, Multi-Vendor Marketplace, POS Dashboard | Merchant uses POS + has own e-commerce website + is listed on multi-vendor marketplace. |
| **Professional** | Legal Practice Portal, Event Booking Site | Professional uses practice management system + has own website where clients can book services. |
| **Transport** | Operator Dashboard, Ticketing Website | Transport operator uses transport management system + has own ticket-booking website + is listed on transport marketplace. |
| **Institutional** | School Portal, Hospital Booking Site | Clinic uses health practice management system + has own website + can be listed in a healthcare marketplace. |

## 3-in-1 Architecture Model

The core value proposition of the UI Builder is the **3-in-1 interconnected platform use case**. When a tenant deploys a template, the system automatically establishes the following connections:

1.  **The Management System (Backend):** The deployed UI is automatically configured with the tenant's `tenant_id` and API endpoints for the relevant vertical repository (e.g., `webwaka-commerce` API).
2.  **The Tenant Website (Frontend):** The public-facing interface (e.g., a storefront or booking portal) is deployed to Cloudflare Pages, serving the tenant's customers.
3.  **The Marketplace Presence (Optional):** If the tenant opts in, their inventory/services are automatically syndicated to the vertical's aggregated marketplace (e.g., the WebWaka Multi-Vendor Marketplace) via the Platform Event Bus.

## Template Taxonomy and Composition Model

Templates are not monolithic codebases. They are composed of reusable, modular primitives defined in `@webwaka/core/ui` (to be created).

*   **Template Schema:** A JSON/TypeScript definition specifying the layout, required components, and configurable branding tokens.
*   **Component Library:** A shared library of React components (e.g., Product Grid, Booking Calendar, Hero Section) that templates assemble.
*   **Data Connectors:** Standardized hooks (e.g., `useInventory()`, `useAppointments()`) that fetch data from the respective vertical APIs based on the injected `tenant_id`.

## Deployment Model (Cloudflare-First)

The deployment model strictly adheres to the "Cloudflare-First Deployment" invariant:

1.  **Configuration:** Tenant Admin selects a template and configures branding via the Builder Admin Interface.
2.  **Event Emission:** The `webwaka-ui-builder` emits a `ui.deployment.requested` event containing the tenant configuration and template ID.
3.  **Orchestration Worker:** A dedicated Cloudflare Worker within `webwaka-ui-builder` consumes the event.
4.  **Edge Provisioning:** The worker interacts with the Cloudflare Pages API to create a new project (or update an existing one) for the tenant, injecting the necessary environment variables (`TENANT_ID`, `API_BASE_URL`).
5.  **Build & Deploy:** Cloudflare Pages executes the build process (using the shared component library and template schema) and deploys the static assets to the edge.
6.  **Completion:** The worker emits a `ui.deployment.success` event, updating the tenant's status in `webwaka-super-admin-v2`.

## Tenant Branding and Theming Model

The fragmented branding logic currently found in `webwaka-commerce` and `webwaka-super-admin-v2` will be replaced by a canonical `TenantBrandingSchema` managed by the UI Builder:

```typescript
// Proposed Schema (to be defined in @webwaka/core)
export interface TenantBrandingSchema {
  tenantId: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  assets: {
    logoUrl: string;
    faviconUrl: string;
    heroImageUrl?: string;
  };
  layout: {
    navigationStyle: 'top' | 'sidebar';
    footerStyle: 'simple' | 'complex';
  };
}
```

This configuration is stored in Cloudflare KV (e.g., `UI_CONFIG_KV`) for low-latency retrieval at the edge during the SSR/SSG build process or client-side hydration.

## Marketplace and Management System Linkage

Linkage is achieved entirely through configuration and the Platform Event Bus, adhering to the "Event-Driven (NO direct inter-DB access)" invariant.

*   **Management System Linkage:** The deployed UI is statically configured with the tenant's `tenant_id`. All API requests from the UI to the vertical backend (e.g., `webwaka-commerce`) include this ID, ensuring strict tenant isolation via the existing `@webwaka/core/auth` middleware.
*   **Marketplace Linkage:** When a tenant enables marketplace syndication, the UI Builder updates the tenant's configuration in KV. The vertical backend (e.g., Commerce) reads this flag and begins emitting syndication events (e.g., `commerce.inventory.syndicated`) to the Event Bus, which the Marketplace application consumes.

## Dashboard Builder vs. Website Builder

While sharing the same core primitives and deployment orchestration, the models differ in their target audience and component libraries:

*   **Website Builder:** Focuses on public-facing, SEO-optimized, high-conversion interfaces (Storefronts, Booking Portals). Utilizes components like Hero Sections, Product Grids, and Checkout Flows.
*   **Dashboard Builder:** Focuses on authenticated, data-dense, operational interfaces (Merchant POS, Practice Management). Utilizes components like Data Tables, Charts, Metric Cards, and complex forms.

## Page, Content, and Schema Model

The UI Builder will implement a structured content model to support dynamic pages (e.g., "About Us," "Terms of Service") without requiring a full CMS:

*   **Page Schema:** Defines the route, title, SEO metadata, and an array of content blocks.
*   **Content Blocks:** JSON representations of UI components (e.g., `{ type: 'RichText', content: '...' }`, `{ type: 'ImageGallery', images: [...] }`).
*   **Storage:** Page schemas and content blocks are stored in D1 (`webwaka-ui-builder-db`) and cached in KV for edge delivery.

## Offline, Mobile, and PWA Implications

Adhering to the "Mobile/PWA/Offline First" invariant:

*   **PWA Generation:** All deployed websites and dashboards are automatically configured as Progressive Web Apps, including a generated `manifest.json` and a standard Service Worker for asset caching.
*   **Offline Sync:** Dashboards (e.g., POS) will continue to utilize the Dexie/IndexedDB mutation queue pattern established in `webwaka-transport` and `webwaka-commerce`, ensuring operational resilience in low-connectivity environments (Nigeria-First).

## Event Model

The UI Builder introduces the following canonical events to the Platform Event Bus (`@webwaka/core/events`):

*   `ui.template.created` / `ui.template.updated`
*   `ui.deployment.requested` (Payload: tenantId, templateId, config)
*   `ui.deployment.started`
*   `ui.deployment.success` (Payload: deploymentUrl)
*   `ui.deployment.failed` (Payload: errorDetails)
*   `ui.branding.updated`

## Permissions and Admin Controls

Access to the UI Builder is governed by the existing RBAC system (`@webwaka/core/rbac`):

*   **Super Admin (`SUPER_ADMIN`):** Can create, update, and categorize templates; manage the global component library; and monitor all tenant deployments.
*   **Tenant Admin (`TENANT_ADMIN`):** Can select templates, configure branding, manage page content, and initiate deployments for their specific `tenant_id`.

## Suggested Repository and Package Structure

**Repository:** `webwaka-ui-builder`

```text
webwaka-ui-builder/
├── packages/
│   ├── ui-primitives/       # Shared React components (Buttons, Cards, Layouts)
│   ├── template-engine/     # Logic for parsing schemas and composing UIs
│   └── deployment-client/   # Wrapper for Cloudflare Pages API
├── apps/
│   ├── builder-admin/       # UI for Super Admins (integrated via iframe/link in super-admin-v2)
│   ├── tenant-portal/       # UI for Tenant Admins to configure their sites
│   └── edge-orchestrator/   # Cloudflare Worker handling deployment events
├── templates/               # Directory containing predefined template schemas
│   ├── commerce-retail/
│   ├── transport-ticketing/
│   └── professional-legal/
├── migrations/              # D1 schema migrations (Templates, Deployments, Pages)
├── package.json
└── wrangler.toml
```

## MVP vs. Later Phases

### MVP (Phase 1)

*   Establish the `webwaka-ui-builder` repository and D1/KV infrastructure.
*   Define the canonical `TenantBrandingSchema` in `@webwaka/core`.
*   Implement the core deployment orchestrator (Cloudflare Pages integration).
*   Create 2-3 foundational templates (e.g., Basic Storefront, Basic Booking Portal).
*   Enable basic branding configuration (colors, logo) via the Tenant Portal.
*   Implement the 3-in-1 linkage for the Commerce vertical (Storefront + POS + Marketplace).

### Later Phases (Phase 2+)

*   Expand the template library to cover all 12 vertical suites.
*   Implement the Dashboard Builder capabilities (customizable operational views).
*   Add the Page/Content schema model for dynamic content management.
*   Introduce advanced theming (custom CSS injection, typography selection).
*   Implement a visual drag-and-drop editor for template customization (replacing form-based configuration).
