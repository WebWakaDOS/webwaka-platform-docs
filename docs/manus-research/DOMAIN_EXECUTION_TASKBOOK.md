# WEBWAKA DOMAIN EXECUTION TASKBOOK

**Prepared by:** Manus AI (Implementation Orchestrator)
**Scope:** Complete expansion of domain-specific execution tasks for Commerce, Transport, Logistics, and remaining verticals, recovering all omitted enhancements from the deep-research phase.

---

## OVERVIEW

This taskbook explicitly recovers the domain-specific implementation work that was omitted during the initial platform synthesis. It is designed to be executed *after* the foundational phases (Phases 1-4).

### Execution Phases Defined Herein:
- **Phase 5:** Commerce Domain Execution (POS, Single-Vendor, Multi-Vendor)
- **Phase 6:** Transport Domain Execution (Seat Sync, Manifests, Fleet, Logistics Handoff)
- **Phase 7:** Logistics Domain Execution (Dispatch, Warehousing, POD)
- **Phase 8:** Financial & Professional Domain Execution (Fintech, Pro, Services)
- **Phase 9:** Civic & Institutional Domain Execution (Civic, Real Estate, Institutional)

---

## PHASE 5: COMMERCE DOMAIN EXECUTION

### TASK T-COM-01 — Implement POS Micro-Hub Fulfillment Routing
- **Domain / repo:** Commerce (`webwaka-commerce`)
- **Task class:** Repo-specific implementation / Cross-repo integration
- **Objective:** Transform physical stores into e-commerce micro-fulfillment centers by routing online orders to the nearest POS terminal for "Pick and Pack."
- **Why this task exists:** Blurs the boundary between physical retail and e-commerce, reducing last-mile delivery times and costs by leveraging existing store inventory.
- **Dependencies:** T-FND-04 (Event Bus Configuration)
- **Can run in parallel with:** T-COM-02, T-COM-03
- **Execution target:** Replit (`webwaka-commerce`)
- **Primary affected repos:** `webwaka-commerce`
- **Shared/core prerequisites:** `@webwaka/core` event publisher
- **Required governance/docs to consult:** `webwaka_commerce_research_report.md` (Enhancement 9)
- **Expected outputs/artifacts:** POS UI updates for "Pick and Pack" workflow; backend logic to route orders based on location; event emission `order.ready_for_delivery`.
- **Acceptance criteria:** When a single-vendor online order is placed, the nearest POS terminal receives a notification. Cashier can accept, pick, pack, and mark ready, emitting the correct event to Logistics.
- **Risks / drift warnings:** Do not build dispatch logic here; emit the event and let Logistics handle the rider assignment.
- **Notes on build-once reuse:** Rely on Core geolocation utilities if available.
- **Notes on Super Admin enablement/configurability:** Tenant admins must be able to toggle "Enable Micro-Hub Fulfillment" per POS location.
- **Notes on AI / offline / event bus / tenancy / Cloudflare implications:** Strictly enforce `tenant_id` on all routing queries. Must publish to Event Bus.

### TASK T-COM-02 — Implement POS WhatsApp Digital Receipts
- **Domain / repo:** Commerce (`webwaka-commerce`)
- **Task class:** Repo-specific implementation / Core integration
- **Objective:** Replace thermal paper receipts with automated WhatsApp digital receipts using the Core Termii integration.
- **Why this task exists:** Saves operational costs, provides durable records for customers, and captures phone numbers for CRM.
- **Dependencies:** T-FND-05 (Termii Voice/SMS Fallback)
- **Can run in parallel with:** T-COM-01, T-COM-03
- **Execution target:** Replit (`webwaka-commerce`)
- **Primary affected repos:** `webwaka-commerce`
- **Shared/core prerequisites:** `@webwaka/core` Termii provider
- **Required governance/docs to consult:** `webwaka_commerce_research_report.md` (Enhancement 13)
- **Expected outputs/artifacts:** POS checkout UI update to capture phone number; backend integration with Core notification service to dispatch the receipt payload.
- **Acceptance criteria:** Cashier can enter customer phone number. System successfully sends a formatted WhatsApp message containing the receipt details via the Core Termii provider.
- **Risks / drift warnings:** Do not implement a new Termii client. You MUST use the existing `@webwaka/core` abstraction.
- **Notes on build-once reuse:** Uses shared Core notification primitive.
- **Notes on Super Admin enablement/configurability:** Tenant must configure their WhatsApp Sender ID in the Super Admin panel.
- **Notes on AI / offline / event bus / tenancy / Cloudflare implications:** Requires background sync if the POS is currently offline (queue the receipt sending until network is restored).

### TASK T-COM-03 — Implement Single-Vendor Dynamic Promo Engine
- **Domain / repo:** Commerce (`webwaka-commerce`)
- **Task class:** Repo-specific implementation
- **Objective:** Build a robust promotional engine supporting Percentage, Fixed, Free Shipping, and BOGO discounts with usage limits and expiry dates.
- **Why this task exists:** Essential for merchant marketing campaigns and customer acquisition in the competitive Nigerian e-commerce space.
- **Dependencies:** None
- **Can run in parallel with:** T-COM-01, T-COM-02
- **Execution target:** Replit (`webwaka-commerce`)
- **Primary affected repos:** `webwaka-commerce`
- **Shared/core prerequisites:** None
- **Required governance/docs to consult:** `webwaka_commerce_research_report.md`
- **Expected outputs/artifacts:** Drizzle schema updates for `promotions` and `promotion_usage`; Admin UI to create promos; Storefront checkout logic to apply and validate promos.
- **Acceptance criteria:** Admin can create a "10% off, max 50 uses, expires Friday" code. Customer can apply it at checkout. System correctly calculates discount and prevents use after limits are hit.
- **Risks / drift warnings:** Ensure transactional safety when updating usage counts to prevent race conditions during flash sales.
- **Notes on build-once reuse:** Design the schema so it can be easily ported to the Multi-Vendor module later (T-COM-06).
- **Notes on Super Admin enablement/configurability:** None.
- **Notes on AI / offline / event bus / tenancy / Cloudflare implications:** Strict `tenant_id` isolation required for all promo codes.

### TASK T-COM-04 — Implement Multi-Vendor Cart Splitting & Consolidated Shipping
- **Domain / repo:** Commerce (`webwaka-commerce`)
- **Task class:** Repo-specific implementation
- **Objective:** Intelligently split a single customer order containing items from multiple vendors into distinct fulfillment requests, while calculating combined shipping.
- **Why this task exists:** Core marketplace functionality. Customers expect one checkout, but vendors ship from different locations.
- **Dependencies:** T-LOG-06 (Unified Delivery Zone Service)
- **Can run in parallel with:** T-COM-05
- **Execution target:** Replit (`webwaka-commerce`)
- **Primary affected repos:** `webwaka-commerce`
- **Shared/core prerequisites:** None
- **Required governance/docs to consult:** `webwaka_commerce_research_report.md` (Enhancement 32)
- **Expected outputs/artifacts:** Checkout calculation logic updates; Order creation logic updates (creating sub-orders per vendor); UI updates explaining split shipments to the customer.
- **Acceptance criteria:** Customer buys Item A (Vendor 1) and Item B (Vendor 2). Checkout queries Delivery Zone Service twice, sums shipping. Order is split into two distinct fulfillment events.
- **Risks / drift warnings:** Do not calculate shipping distances internally. You MUST query the Logistics Delivery Zone service.
- **Notes on build-once reuse:** Relies on Logistics as the source of truth for shipping costs.
- **Notes on Super Admin enablement/configurability:** None.
- **Notes on AI / offline / event bus / tenancy / Cloudflare implications:** Emits multiple `order.ready_for_delivery` events to the Event Bus (one per vendor sub-order).

### TASK T-COM-05 — Implement Multi-Vendor Automated RMA Workflow
- **Domain / repo:** Commerce (`webwaka-commerce`)
- **Task class:** Repo-specific implementation / Cross-repo integration
- **Objective:** Build a standardized Return Merchandise Authorization workflow handling disputes, return shipping labels, and escrow holds.
- **Why this task exists:** Trust is the biggest barrier in Nigerian marketplaces. A transparent, automated return process protects both buyers and sellers.
- **Dependencies:** T-FND-04 (Event Bus)
- **Can run in parallel with:** T-COM-04
- **Execution target:** Replit (`webwaka-commerce`)
- **Primary affected repos:** `webwaka-commerce`
- **Shared/core prerequisites:** None
- **Required governance/docs to consult:** `webwaka_commerce_research_report.md` (Enhancement 35)
- **Expected outputs/artifacts:** Customer return request UI; Vendor approval/dispute UI; Integration with Logistics to generate return labels; Event emission to Fintech to hold escrow funds.
- **Acceptance criteria:** Customer requests return. Vendor approves. System emits event to Logistics for reverse-pickup. System emits event to Fintech to freeze the vendor payout until the item is received.
- **Risks / drift warnings:** Do not build the escrow ledger here. Emit events to the Fintech/Central Management repo.
- **Notes on build-once reuse:** None.
- **Notes on Super Admin enablement/configurability:** Super Admins need a dispute resolution dashboard to override vendor decisions.
- **Notes on AI / offline / event bus / tenancy / Cloudflare implications:** Heavy reliance on Event Bus for cross-repo coordination.

---

## PHASE 6: TRANSPORT DOMAIN EXECUTION

### TASK T-TRN-01 — Implement Multi-Seat Atomic Reservation Engine
- **Domain / repo:** Transport (`webwaka-transport`)
- **Task class:** Repo-specific implementation / Architecture
- **Objective:** Rebuild the core seat reservation engine to use Cloudflare Durable Objects for optimistic locking and concurrent booking conflict resolution.
- **Why this task exists:** High-traffic bus routes sell out fast. Multiple agents and online customers trying to book the same seat simultaneously will cause double-booking without atomic, serialized reservation holds.
- **Dependencies:** T-FND-01 (D1 DB Setup)
- **Can run in parallel with:** T-TRN-02
- **Execution target:** Replit (`webwaka-transport`)
- **Primary affected repos:** `webwaka-transport`
- **Shared/core prerequisites:** None
- **Required governance/docs to consult:** `webwaka_transport_research_report.md` (Enhancement S-01)
- **Expected outputs/artifacts:** `TripSeatDO` Durable Object implementation; Drizzle schema updates for `seat_holds`; API endpoint updates to route reservation requests through the DO before hitting D1.
- **Acceptance criteria:** Two concurrent requests for Seat 4 on Trip 100 hit the API. The DO serializes them. The first request gets a 15-minute hold; the second gets a "Seat Unavailable" error.
- **Risks / drift warnings:** Do not use D1 transactions for this; D1 is eventually consistent globally. You MUST use Durable Objects for the in-memory serialization lock.
- **Notes on build-once reuse:** This pattern will be reused for Civic (Event Seating) later.
- **Notes on Super Admin enablement/configurability:** None.
- **Notes on AI / offline / event bus / tenancy / Cloudflare implications:** Core Cloudflare architecture pattern. Strict `tenant_id` enforcement required within the DO state.

### TASK T-TRN-02 — Implement Digital Passenger Manifest Export
- **Domain / repo:** Transport (`webwaka-transport`)
- **Task class:** Repo-specific implementation / Compliance
- **Objective:** Generate a fully compliant PDF passenger manifest including names, next of kin, and hashed NINs, ready for printing or digital submission to FRSC/Lagos State.
- **Why this task exists:** Lagos State and FRSC mandate digital manifests for all interstate travel. Non-compliance results in heavy fines and terminal closures.
- **Dependencies:** T-TRN-01 (Reservations)
- **Can run in parallel with:** T-TRN-01, T-TRN-03
- **Execution target:** Replit (`webwaka-transport`)
- **Primary affected repos:** `webwaka-transport`
- **Shared/core prerequisites:** None
- **Required governance/docs to consult:** `webwaka_transport_research_report.md` (Enhancement D-02)
- **Expected outputs/artifacts:** PDF generation utility (using `pdfmake` or similar); Admin/Dispatcher UI button to "Generate Manifest"; API endpoint to serve the PDF.
- **Acceptance criteria:** Dispatcher clicks "Generate Manifest" for a departed trip. System returns a formatted PDF containing all boarded passengers, excluding canceled/no-show tickets, with a signature line for the driver.
- **Risks / drift warnings:** Ensure PII (like full NINs) is partially masked on the printed copy to comply with NDPR.
- **Notes on build-once reuse:** The PDF generation utility should be built modularly so it can be moved to Core later for invoice generation.
- **Notes on Super Admin enablement/configurability:** Tenant can upload their logo to appear on the manifest header.
- **Notes on AI / offline / event bus / tenancy / Cloudflare implications:** None.

### TASK T-TRN-03 — Implement Dynamic Fare Matrix Engine
- **Domain / repo:** Transport (`webwaka-transport`)
- **Task class:** Repo-specific implementation
- **Objective:** Build a pricing engine that supports base fares, seasonal surge multipliers, weekend pricing, and multi-leg (e.g., Lagos -> Ibadan -> Abuja) fare calculations.
- **Why this task exists:** Transport operators maximize yield by adjusting prices based on demand and seasonality. A static `price` column on the route is insufficient.
- **Dependencies:** None
- **Can run in parallel with:** T-TRN-02, T-TRN-04
- **Execution target:** Replit (`webwaka-transport`)
- **Primary affected repos:** `webwaka-transport`
- **Shared/core prerequisites:** None
- **Required governance/docs to consult:** `webwaka_transport_research_report.md` (Enhancement O-08)
- **Expected outputs/artifacts:** Drizzle schema updates for `fare_rules` and `route_segments`; Admin UI to configure surge periods; Booking API updates to calculate the final price dynamically.
- **Acceptance criteria:** Admin sets a 1.5x surge for Dec 20-25. Customer booking a trip on Dec 22 sees the base fare multiplied by 1.5. The checkout total reflects the correct dynamic price.
- **Risks / drift warnings:** The calculated price must be locked in the `seat_holds` table (T-TRN-01) to prevent the price changing between reservation and payment.
- **Notes on build-once reuse:** None.
- **Notes on Super Admin enablement/configurability:** None.
- **Notes on AI / offline / event bus / tenancy / Cloudflare implications:** Strict `tenant_id` isolation required for all pricing rules.

### TASK T-TRN-04 — Implement Paystack Inline Payment Integration
- **Domain / repo:** Transport (`webwaka-transport`)
- **Task class:** Repo-specific implementation / Core integration
- **Objective:** Remove redirect friction from the customer booking portal by integrating the Paystack Inline popup directly into the PWA checkout flow.
- **Why this task exists:** Redirecting to external payment pages causes massive drop-off on slow Nigerian mobile networks. Inline payments keep the user in the app.
- **Dependencies:** T-TRN-01 (Reservations)
- **Can run in parallel with:** T-TRN-03, T-TRN-05
- **Execution target:** Replit (`webwaka-transport`)
- **Primary affected repos:** `webwaka-transport`
- **Shared/core prerequisites:** `@webwaka/core` payment abstraction
- **Required governance/docs to consult:** `webwaka_transport_research_report.md` (Enhancement B-01)
- **Expected outputs/artifacts:** Frontend React component loading Paystack script; Backend webhook handler to verify payment and convert `seat_hold` to `ticket`.
- **Acceptance criteria:** Customer clicks "Pay". Paystack modal opens over the app. Customer pays via USSD. Modal closes, app polls backend, confirms payment, and shows the e-ticket QR code.
- **Risks / drift warnings:** You MUST implement the backend webhook verification. Never trust the frontend success callback alone.
- **Notes on build-once reuse:** The React component should wrap the Core payment provider.
- **Notes on Super Admin enablement/configurability:** Tenant must configure their Paystack Public/Secret keys in the Super Admin panel.
- **Notes on AI / offline / event bus / tenancy / Cloudflare implications:** Must publish `payment.successful` to the Event Bus for the Central Ledger.

### TASK T-TRN-05 — Implement Digital Parcel Waybill Recording
- **Domain / repo:** Transport (`webwaka-transport`)
- **Task class:** Repo-specific implementation / Cross-repo integration
- **Objective:** Build the Logistics handoff endpoint. Allow dispatchers to record cargo loaded onto a passenger bus and emit events to the Logistics repository.
- **Why this task exists:** Intercity buses carry significant cargo (waybills). This connects the Transport physical asset to the Logistics tracking system.
- **Dependencies:** T-FND-04 (Event Bus)
- **Can run in parallel with:** T-TRN-04
- **Execution target:** Replit (`webwaka-transport`)
- **Primary affected repos:** `webwaka-transport`
- **Shared/core prerequisites:** `@webwaka/core` event publisher
- **Required governance/docs to consult:** `webwaka_transport_research_report.md` (Enhancement D-14)
- **Expected outputs/artifacts:** Dispatcher UI to scan/enter parcel tracking numbers; Backend logic to link parcels to a `trip_id`; Event emission `trip.cargo_loaded` and `trip.cargo_unloaded`.
- **Acceptance criteria:** Dispatcher scans Parcel 123 onto Trip 456. System emits `trip.cargo_loaded`. When the trip arrives, dispatcher marks unloaded, emitting `trip.cargo_unloaded`. Logistics repo consumes these to update the customer tracking portal.
- **Risks / drift warnings:** Do not build the parcel tracking portal here. Transport only records the physical movement of the asset.
- **Notes on build-once reuse:** None.
- **Notes on Super Admin enablement/configurability:** None.
- **Notes on AI / offline / event bus / tenancy / Cloudflare implications:** Heavy reliance on Event Bus for cross-repo coordination.

---

## PHASE 7: LOGISTICS DOMAIN EXECUTION

### TASK T-LOG-01 — Implement Secure OTP Verification for Proof of Delivery
- **Domain / repo:** Logistics (`webwaka-logistics`)
- **Task class:** Repo-specific implementation / Security
- **Objective:** Eliminate "ghost deliveries" by requiring the customer to provide a system-generated OTP to the rider before the parcel state can transition to `DELIVERED`.
- **Why this task exists:** Trust deficit is the primary barrier in Nigerian e-commerce. Fraudulent delivery marking is a massive cost center.
- **Dependencies:** T-FND-05 (Termii SMS)
- **Can run in parallel with:** T-LOG-02, T-LOG-03
- **Execution target:** Replit (`webwaka-logistics`)
- **Primary affected repos:** `webwaka-logistics`
- **Shared/core prerequisites:** `@webwaka/core` Termii provider
- **Required governance/docs to consult:** `webwaka_logistics_research_report.md` (Enhancement L-06)
- **Expected outputs/artifacts:** Drizzle schema update for `delivery_otp`; Backend logic to generate and send OTP via Termii when state hits `OUT_FOR_DELIVERY`; Rider App UI to input OTP; API to verify OTP and complete delivery.
- **Acceptance criteria:** When a parcel is marked out for delivery, the customer receives an SMS with a 4-digit code. The rider cannot mark the item delivered in the app without entering this exact code.
- **Risks / drift warnings:** Must support an offline verification mode (e.g., using a time-based hashed secret) if the rider loses network at the customer's door.
- **Notes on build-once reuse:** OTP generation logic should use the Core auth utility.
- **Notes on Super Admin enablement/configurability:** Tenant can toggle OTP requirement based on parcel value (e.g., only for orders > ₦50,000).
- **Notes on AI / offline / event bus / tenancy / Cloudflare implications:** Offline-first requirement is critical here.

### TASK T-LOG-02 — Implement Tamper-Evident Photo Capture for POD
- **Domain / repo:** Logistics (`webwaka-logistics`)
- **Task class:** Repo-specific implementation / Offline Mobile
- **Objective:** Provide a secure alternative Proof of Delivery (POD) method when the customer is unavailable, requiring the rider to take a geo-tagged, timestamped photo of the delivered item.
- **Why this task exists:** OTPs fail if the customer's phone is dead. A verifiable photo prevents disputes over "where" the package was left.
- **Dependencies:** T-FND-02 (R2 Storage Setup)
- **Can run in parallel with:** T-LOG-01, T-LOG-03
- **Execution target:** Replit (`webwaka-logistics`)
- **Primary affected repos:** `webwaka-logistics`
- **Shared/core prerequisites:** None
- **Required governance/docs to consult:** `webwaka_logistics_research_report.md` (Enhancement L-08)
- **Expected outputs/artifacts:** Rider App camera integration; Image watermarking utility (timestamp + GPS coordinates); Background sync upload to Cloudflare R2; Drizzle schema update for `pod_image_url`.
- **Acceptance criteria:** Rider selects "Photo POD". App opens camera (blocking gallery uploads). Photo is taken, watermarked with current GPS/Time, saved to Dexie, and uploaded to R2 when network allows.
- **Risks / drift warnings:** You MUST block gallery uploads. The photo must be taken live within the app to prevent fraud.
- **Notes on build-once reuse:** The watermarking utility should be modular.
- **Notes on Super Admin enablement/configurability:** None.
- **Notes on AI / offline / event bus / tenancy / Cloudflare implications:** Heavy reliance on Dexie for offline photo caching and R2 for storage.

### TASK T-LOG-03 — Implement Geospatial Order Clustering for Dispatch
- **Domain / repo:** Logistics (`webwaka-logistics`)
- **Task class:** Repo-specific implementation / Architecture
- **Objective:** Stop manual dispatcher assignment by building an algorithm that groups unassigned parcels by geographic proximity (e.g., "Lekki Phase 1 Cluster") and suggests rider assignments.
- **Why this task exists:** Manual dispatch does not scale past 50 orders a day. Intelligent clustering maximizes rider density and reduces fuel costs.
- **Dependencies:** None
- **Can run in parallel with:** T-LOG-01, T-LOG-02
- **Execution target:** Replit (`webwaka-logistics`)
- **Primary affected repos:** `webwaka-logistics`
- **Shared/core prerequisites:** None
- **Required governance/docs to consult:** `webwaka_logistics_research_report.md` (Enhancement D-01)
- **Expected outputs/artifacts:** Geospatial querying logic (using PostGIS/D1 equivalents); Dispatcher UI showing map-based clusters; Automated assignment suggestion engine.
- **Acceptance criteria:** Dispatcher opens dashboard. 100 pending orders are automatically grouped into 5 clusters based on delivery address coordinates. Dispatcher can assign a cluster to a rider with one click.
- **Risks / drift warnings:** D1 does not have native PostGIS. You must implement a lightweight bounding box or geohash (e.g., H3) logic for clustering within SQLite.
- **Notes on build-once reuse:** Geohashing utility should be placed in Core for use by Real Estate later.
- **Notes on Super Admin enablement/configurability:** None.
- **Notes on AI / offline / event bus / tenancy / Cloudflare implications:** Strict `tenant_id` isolation required for all clustering queries.

### TASK T-LOG-04 — Implement Offline-First Receiving Scanner
- **Domain / repo:** Logistics (`webwaka-logistics`)
- **Task class:** Repo-specific implementation / Offline Mobile
- **Objective:** Speed up inbound warehouse processing by building a PWA barcode scanner that works completely offline and syncs bulk updates when network is restored.
- **Why this task exists:** Nigerian warehouse internet is notoriously unstable. Receiving cannot stop when the network drops.
- **Dependencies:** T-FND-03 (Dexie Base Setup)
- **Can run in parallel with:** T-LOG-05
- **Execution target:** Replit (`webwaka-logistics`)
- **Primary affected repos:** `webwaka-logistics`
- **Shared/core prerequisites:** None
- **Required governance/docs to consult:** `webwaka_logistics_research_report.md` (Enhancement W-01)
- **Expected outputs/artifacts:** PWA camera barcode scanner (using HTML5 QuaggaJS or similar); Dexie table for `pending_inbound_scans`; Background sync manager to flush scans to the server.
- **Acceptance criteria:** Warehouse worker turns off Wi-Fi. Scans 50 incoming parcels. UI shows "50 pending sync". Worker turns on Wi-Fi. System syncs all 50 to the server, updating parcel states to `IN_WAREHOUSE`.
- **Risks / drift warnings:** Ensure the scanner handles rapid, continuous scanning without requiring UI clicks between scans.
- **Notes on build-once reuse:** The barcode scanning React hook should be reusable.
- **Notes on Super Admin enablement/configurability:** None.
- **Notes on AI / offline / event bus / tenancy / Cloudflare implications:** Core offline-first capability demonstration.

### TASK T-LOG-05 — Implement Automated KYC Verification for Gig Riders
- **Domain / repo:** Logistics (`webwaka-logistics`)
- **Task class:** Repo-specific implementation / Cross-repo integration
- **Objective:** Speed up the onboarding of new gig riders by automating the verification of their Driver's License and Guarantor details.
- **Why this task exists:** Scaling a gig fleet requires frictionless onboarding. Manual KYC is a massive bottleneck.
- **Dependencies:** T-FND-04 (Event Bus)
- **Can run in parallel with:** T-LOG-04
- **Execution target:** Replit (`webwaka-logistics`)
- **Primary affected repos:** `webwaka-logistics`
- **Shared/core prerequisites:** None
- **Required governance/docs to consult:** `webwaka_logistics_research_report.md` (Enhancement F-01)
- **Expected outputs/artifacts:** Rider onboarding UI; Integration with a 3rd-party identity provider (e.g., Dojah or Smile ID) or emission of an event to the Fintech repo to handle the KYC check; Automated state transition from `PENDING_KYC` to `ACTIVE`.
- **Acceptance criteria:** Rider uploads license and enters BVN. System automatically verifies the details. If valid, rider status changes to `ACTIVE` and they can accept dispatch requests.
- **Risks / drift warnings:** Do not build a custom KYC engine. You must either integrate an external API or delegate to the Fintech repo via the Event Bus.
- **Notes on build-once reuse:** KYC verification should be centralized in Fintech or Core eventually.
- **Notes on Super Admin enablement/configurability:** None.
- **Notes on AI / offline / event bus / tenancy / Cloudflare implications:** Must handle PII securely according to NDPR.

## PHASE 8: FINANCIAL & PROFESSIONAL DOMAIN EXECUTION

### TASK T-FIN-01 — Implement NIBSS NIP Instant Transfer Integration
- **Domain / repo:** Fintech (`webwaka-fintech`)
- **Task class:** Cross-repo integration / Compliance
- **Objective:** Integrate the NIBSS NIP (Nigeria Inter-Bank Settlement System) to enable real-time bank transfers from the platform wallet to any Nigerian bank account.
- **Why this task exists:** Vendor payouts and rider commissions must reach any Nigerian bank account instantly. NIBSS NIP is the only way to achieve this at scale.
- **Dependencies:** T-FND-01 (D1 DB Setup)
- **Can run in parallel with:** T-FIN-02
- **Execution target:** Replit (`webwaka-fintech`)
- **Primary affected repos:** `webwaka-fintech`
- **Shared/core prerequisites:** `@webwaka/core` event bus
- **Required governance/docs to consult:** `webwaka_11_repos_research_report.md` (Fintech enhancements)
- **Expected outputs/artifacts:** NIBSS NIP API integration; Payout request workflow; Webhook handler for transfer confirmations; Drizzle schema for `payout_requests`.
- **Acceptance criteria:** A vendor with ₦50,000 in their wallet can initiate a payout to their GTBank account. The system submits the NIP request, receives confirmation, and updates the wallet ledger accordingly.
- **Risks / drift warnings:** NIBSS NIP requires a licensed bank partner. Ensure the integration uses the correct sandbox/production endpoints.
- **Notes on build-once reuse:** This payout mechanism will be reused by Logistics (rider commissions) and Transport (driver settlements).
- **Notes on Super Admin enablement/configurability:** Super Admin must configure the NIBSS bank partner credentials.
- **Notes on AI / offline / event bus / tenancy / Cloudflare implications:** Must publish `payout.completed` to the Event Bus.

### TASK T-PRO-01 — Implement NBA Trust Account Ledger
- **Domain / repo:** Professional (`webwaka-professional`)
- **Task class:** Repo-specific implementation / Compliance
- **Objective:** Build a dedicated, double-entry ledger for law firm client trust accounts, ensuring strict separation from operating funds and full audit trail compliance with NBA requirements.
- **Why this task exists:** Commingling client funds with operating funds is a serious NBA violation. Lawyers need a compliant, auditable trust account system.
- **Dependencies:** None
- **Can run in parallel with:** T-PRO-02
- **Execution target:** Replit (`webwaka-professional`)
- **Primary affected repos:** `webwaka-professional`
- **Shared/core prerequisites:** None
- **Required governance/docs to consult:** `webwaka_11_repos_research_report.md` (Professional enhancements)
- **Expected outputs/artifacts:** Drizzle schema for `trust_accounts` and `trust_transactions`; Admin UI for deposits, disbursements, and balance checks; Immutable audit log.
- **Acceptance criteria:** Lawyer creates a trust account for Client X. Deposits ₦500,000. Disburses ₦200,000 to a third party. System shows a clear, immutable ledger with running balance. Trust account balance is never mixed with the firm's operating account.
- **Risks / drift warnings:** All trust account transactions must be immutable. Never allow updates or deletes on trust transaction records.
- **Notes on build-once reuse:** The double-entry ledger pattern should be extracted to Core for use by Civic (donation tracking) and Institutional (fee management).
- **Notes on Super Admin enablement/configurability:** None.
- **Notes on AI / offline / event bus / tenancy / Cloudflare implications:** Strict `tenant_id` isolation required.

---

## PHASE 9: CIVIC & INSTITUTIONAL DOMAIN EXECUTION

### TASK T-CIV-01 — Implement Offline Tithe & Offering Logging
- **Domain / repo:** Civic (`webwaka-civic`)
- **Task class:** Repo-specific implementation / Offline Mobile
- **Objective:** Allow church ushers to record cash donations offline during the service, with automatic sync to the server when the service ends and network is restored.
- **Why this task exists:** Church halls often have poor Wi-Fi. Ushers cannot stop collecting during the service.
- **Dependencies:** T-FND-03 (Dexie Base Setup)
- **Can run in parallel with:** T-CIV-02
- **Execution target:** Replit (`webwaka-civic`)
- **Primary affected repos:** `webwaka-civic`
- **Shared/core prerequisites:** None
- **Required governance/docs to consult:** `webwaka_11_repos_research_report.md` (Civic enhancements)
- **Expected outputs/artifacts:** Dexie schema for `pending_donations`; Usher PWA UI for quick denomination entry; Background sync manager.
- **Acceptance criteria:** Usher turns off Wi-Fi. Records 30 cash donations. App shows "30 pending sync". Usher turns on Wi-Fi. System syncs all 30 to the server, updating the church's donation ledger.
- **Risks / drift warnings:** None.
- **Notes on build-once reuse:** The offline cash logging pattern is reusable for NGO beneficiary distribution tracking.
- **Notes on Super Admin enablement/configurability:** None.
- **Notes on AI / offline / event bus / tenancy / Cloudflare implications:** Core offline-first pattern.

### TASK T-RES-01 — Implement ESVARBON Agent Verification
- **Domain / repo:** Real Estate (`webwaka-real-estate`)
- **Task class:** Repo-specific implementation / Integration
- **Objective:** Automatically verify real estate agent registration numbers against the official ESVARBON (Estate Surveyors and Valuers Registration Board of Nigeria) database during onboarding.
- **Why this task exists:** Fake agents are a massive problem in Nigerian real estate. Verifying ESVARBON registration builds trust and protects buyers.
- **Dependencies:** None
- **Can run in parallel with:** T-RES-02
- **Execution target:** Replit (`webwaka-real-estate`)
- **Primary affected repos:** `webwaka-real-estate`
- **Shared/core prerequisites:** None
- **Required governance/docs to consult:** `webwaka_11_repos_research_report.md` (Real Estate enhancements)
- **Expected outputs/artifacts:** Agent onboarding UI with ESVARBON number field; Backend integration with the ESVARBON API (or manual upload flow if API is unavailable); Drizzle schema for `agent_verification_status`.
- **Acceptance criteria:** Agent enters their ESVARBON number during registration. System verifies it against the database. Verified agents get a "Verified Agent" badge on their listings. Unverified agents cannot publish listings.
- **Risks / drift warnings:** The ESVARBON API may not be publicly available. Implement a fallback where the admin manually verifies uploaded documents.
- **Notes on build-once reuse:** The verification badge pattern is reusable for other professional verticals.
- **Notes on Super Admin enablement/configurability:** Super Admin can manually override verification status.
- **Notes on AI / offline / event bus / tenancy / Cloudflare implications:** None.

### TASK T-INS-01 — Implement JAMB/WAEC Result Verification
- **Domain / repo:** Institutional (`webwaka-institutional`)
- **Task class:** Repo-specific implementation / Integration
- **Objective:** Allow institutions to verify student entry qualifications by integrating with JAMB and WAEC result verification APIs.
- **Why this task exists:** Manual verification of certificates is slow and prone to fraud. Automated verification speeds up admissions and ensures integrity.
- **Dependencies:** None
- **Can run in parallel with:** T-INS-02
- **Execution target:** Replit (`webwaka-institutional`)
- **Primary affected repos:** `webwaka-institutional`
- **Shared/core prerequisites:** None
- **Required governance/docs to consult:** `webwaka_11_repos_research_report.md` (Institutional enhancements)
- **Expected outputs/artifacts:** Student application UI with JAMB/WAEC entry fields; Backend integration with verification APIs; Drizzle schema for `qualification_verifications`.
- **Acceptance criteria:** Admissions officer enters a student's JAMB registration number. System queries the JAMB API and returns the verified score. The result is saved to the student's application record.
- **Risks / drift warnings:** JAMB and WAEC APIs may require institutional partnerships. Implement a fallback for manual document upload.
- **Notes on build-once reuse:** None.
- **Notes on Super Admin enablement/configurability:** None.
- **Notes on AI / offline / event bus / tenancy / Cloudflare implications:** Strict `tenant_id` isolation required.
