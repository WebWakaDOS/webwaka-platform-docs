# LOG-2 Epic: Parcel & Delivery - Implementation Plan

**Document Type:** Implementation Plan
**Epic ID:** LOG-2
**Title:** Parcel/Delivery (tracking, dispatch)
**Repository:** `webwaka-logistics`
**Blueprint Citation:** `[Part 10.4]`

---

## 1. Introduction & Scope

This document outlines the complete implementation plan for the **LOG-2** epic, which covers the development of the **Parcel & Delivery** module for the WebWaka OS v4 platform. The objective is to create a robust, offline-first system for managing parcel tracking, dispatch, and proof of delivery, adhering strictly to the 7-Layer AI-Native Architecture and the 7 Core Invariants defined in the `WebWakaDigitalOperatingSystem.md` Blueprint.

This implementation will be executed with 100% thoroughness, ensuring every line of code complies with the platform's governance and architectural standards. No shortcuts will be taken.

## 2. Blueprint Compliance & Core Invariants

This implementation will strictly adhere to the master architecture. The following table confirms compliance with the 7 Core Invariants as mandated by `[Part 9.1]` of the Blueprint.

| Invariant | Compliance Strategy |
| :--- | :--- |
| **Build Once Use Infinitely** | The module will be built with modularity in mind, exposing its functionalities through the platform's event bus (`CORE-2`) to be reused by other suites. No hardcoded dependencies will be introduced. |
| **Mobile First** | The UI will be designed and developed for mobile devices first, using a `min-width` responsive strategy. All components will be tested on standard mobile viewports before desktop. |
| **PWA First** | The application will be a full-fledged Progressive Web App, including a `manifest.json` and a service worker for installation, offline caching, and background sync. |
| **Offline First** | All critical operations (creating shipments, updating status, capturing proof of delivery) will be functional offline. This will be achieved by leveraging the `CORE-1` Universal Offline Sync Engine, using IndexedDB (via Dexie.js) and a mutation queue. |
| **Nigeria First** | The system will integrate with Nigerian services. Currency will be NGN by default. Timestamps will use WAT. SMS notifications for tracking updates will use Yournotify/Termii. |
| **Africa First** | The data model will support multi-currency for cross-border logistics. Internationalization (i18n) will be implemented for key UI elements to support English, Yoruba, Igbo, and Hausa. |
| **Vendor Neutral AI** | Any future AI features (e.g., route optimization, delivery time prediction) will be implemented using the `CORE-5` AI/BYOK Abstraction Engine, avoiding direct calls to specific AI providers. |

## 3. Architecture & Technology Stack

The LOG-2 module will be implemented following the 7-Layer Architecture `[Part 2]`:

*   **Layer 7 (Users & Devices):** Accessed via PWA on mobile and desktop.
*   **Layer 6 (PWA Experience):** React, Vite, TanStack Router, and Dexie.js for the frontend. The UI will be built with TailwindCSS.
*   **Layer 5 (SaaS Composition):** The module will be registered in the platform's module registry to be dynamically composed for tenants.
*   **Layer 4 (Platform Core Services):** Will utilize `CORE-1` (Offline Sync), `CORE-2` (Event Bus), Authentication, and Permissions services.
*   **Layer 3 (Edge-Native Data):**
    *   **Client Data:** IndexedDB for offline parcel data.
    *   **Edge Data:** Cloudflare KV for tenant-specific logistics settings.
    *   **Core Data:** Postgres (Cloudflare D1) for the main database schema.
*   **Layer 2 (Cloudflare Edge Infrastructure):** APIs will be deployed as Cloudflare Workers.
*   **Layer 1 (Autonomous AI Layer):** Not applicable for the initial implementation, but the architecture will be ready for future AI-driven enhancements.

## 4. Database Schema

The following tables will be created in the Postgres database. All models will include `tenantId` for multi-tenancy `[Part 9.2]` and use integer-based monetary values.

**`parcels`**
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key |
| `tenantId` | `UUID` | Foreign Key to `tenants` |
| `trackingNumber` | `TEXT` | Unique, human-readable tracking ID |
| `senderName` | `TEXT` | |
| `senderPhone` | `TEXT` | |
| `recipientName` | `TEXT` | |
| `recipientPhone` | `TEXT` | |
| `recipientAddress` | `TEXT` | |
| `description` | `TEXT` | |
| `weight_kg` | `DECIMAL` | |
| `deliveryFee` | `INTEGER` | Stored in kobo |
| `status` | `TEXT` | (e.g., PENDING, IN_TRANSIT, DELIVERED, FAILED) |
| `createdAt` | `TIMESTAMPTZ` | |
| `updatedAt` | `TIMESTAMPTZ` | |
| `deletedAt` | `TIMESTAMPTZ` | For soft deletes `[Part 9.2]` |

**`parcel_updates`**
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key |
| `parcelId` | `UUID` | Foreign Key to `parcels` |
| `status` | `TEXT` | The new status |
| `location` | `TEXT` | Location where the update occurred |
| `notes` | `TEXT` | Optional notes |
| `createdAt` | `TIMESTAMPTZ` | |

**`proof_of_delivery`**
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key |
| `parcelId` | `UUID` | Foreign Key to `parcels` |
| `imageUrl` | `TEXT` | URL to the image of the delivered parcel (stored in R2) |
| `signatureUrl` | `TEXT` | URL to the recipient's signature image (stored in R2) |
| `recipientName` | `TEXT` | Name of the person who received the parcel |
| `createdAt` | `TIMESTAMPTZ` | |

## 5. API Endpoints

The following RESTful API endpoints will be created as Cloudflare Workers. All endpoints will be protected by JWT authentication and RBAC `[Part 9.2]`.

*   `POST /api/parcels`: Create a new parcel shipment.
*   `GET /api/parcels`: List all parcels for the tenant.
*   `GET /api/parcels/:trackingNumber`: Get details for a specific parcel.
*   `POST /api/parcels/:trackingNumber/updates`: Add a tracking update to a parcel.
*   `POST /api/parcels/:trackingNumber/dispatch`: Dispatch a parcel to a delivery agent.
*   `POST /api/parcels/:trackingNumber/pod`: Upload proof of delivery (image and signature).

## 6. Implementation Phases

The implementation will be broken down into the following iterative steps. Each step will result in a separate commit pushed to the `webwaka-logistics` repository.

1.  **Project Scaffolding:** Initialize a new `web-db-user` project using `webdev_init_project`.
2.  **Database Schema:** Create the database migration files for the `parcels`, `parcel_updates`, and `proof_of_delivery` tables.
3.  **API Endpoints (CRUD):** Implement the basic CRUD API endpoints for creating and retrieving parcels.
4.  **Frontend Scaffolding:** Set up the basic React components and routing for the parcel management dashboard.
5.  **Offline Sync Integration:** Integrate the frontend with the `CORE-1` sync engine to enable offline creation of parcels.
6.  **Dispatch & Tracking API:** Implement the API logic for dispatching parcels and adding tracking updates.
7.  **Dispatch & Tracking UI:** Develop the UI for dispatchers to manage shipments and for customers to track their parcels.
8.  **Proof of Delivery:** Implement the API and UI for capturing and uploading proof of delivery (image and signature).
9.  **Notifications:** Integrate with the `CORE-7` notification service to send SMS updates to recipients.

## 7. QA Protocol

Upon completion of the implementation, the module will undergo the full 5-Layer QA Protocol as mandated by `[Part 9.4]`.

1.  **Static Analysis:** Run TypeScript compiler and ESLint to ensure zero errors.
2.  **Unit Tests:** Write unit tests for all API endpoints and critical UI components, aiming for >90% coverage.
3.  **Integration Tests:** Verify database migrations, event bus communication, and tenant data isolation.
4.  **E2E Tests:** Create Playwright tests for the entire user flow, from creating a parcel to final delivery.
5.  **Acceptance Tests:** Manually verify all acceptance criteria, including offline functionality and Nigerian-specific integrations. A final `LOG-2-QA-REPORT.md` will be generated.
