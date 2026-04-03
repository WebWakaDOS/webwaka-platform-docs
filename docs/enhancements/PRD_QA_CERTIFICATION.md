# WebWaka Production (`webwaka-production`) QA Certification

**Prepared by:** Manus AI
**Date:** April 2026
**Target Repository:** `webwaka-production`

## 1. Audit Scope

This QA certification covers the implementation of IoT Sensor Integration, the Predictive Maintenance Engine, and the Overall Equipment Effectiveness (OEE) Dashboard in `webwaka-production`.

## 2. Acceptance Criteria

| ID | Feature | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- |
| QA-PRD-1 | IoT Ingestion | `POST /iot/telemetry` successfully receives, validates, and stores JSON payloads from external sensors in the `machine_telemetry` table. | PENDING |
| QA-PRD-2 | Predictive Maintenance | The hourly cron job successfully analyzes telemetry data using `getAICompletion()` and generates a work order if an anomaly is detected. | PENDING |
| QA-PRD-3 | OEE Dashboard | The dashboard API correctly calculates Availability, Performance, and Quality metrics based on production runs and downtime logs. | PENDING |
| QA-PRD-4 | Unit Tests | All new IoT and maintenance modules have passing unit tests in `src/**/*.test.ts`. | PENDING |

## 3. Offline Resilience Testing

- The production service is a backend API; offline resilience applies to its clients (e.g., shop floor tablets).
- However, the service must gracefully handle upstream provider outages (e.g., AI platform 503s) by queuing the telemetry data for later analysis and not dropping the payload.

## 4. Security & RBAC Validation

- Verify that the `POST /iot/telemetry` endpoint requires a valid API key or mutual TLS (mTLS) certificate from the IoT gateway.
- Ensure that users cannot view or modify telemetry data or work orders belonging to other tenants.
- Confirm that the predictive maintenance cron job is idempotent and does not generate duplicate work orders for the same anomaly.

## 5. Regression Guards

- Run `npm run test` to ensure 100% pass rate.
- Run `npm run build` to ensure no TypeScript compilation errors.
- Verify that the existing inventory and production order logic still functions correctly and integrates with the new maintenance workflows.
