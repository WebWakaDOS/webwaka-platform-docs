# Phase 2: Agent Mobilization & Execution Schedule

**Document Type:** Remediation Execution Plan  
**Status:** ACTIVE - Ready for Implementation  
**Timeline:** 21 Days (Mar 18 - May 1, 2026)  
**Target:** Production Readiness with All 7 Core Invariants Compliant

---

## SECTION 1: SPECIALIST AGENTS MOBILIZATION

### Lead Orchestrator
**Agent:** webwaka-engineering-orchestrator  
**Role:** Overall plan ownership, sequencing, daily standups, blocker resolution  
**Responsibilities:**
- Coordinate all specialist agents
- Manage dependencies between tasks
- Escalate blockers to stakeholders
- Generate daily status reports
- Ensure 21-day timeline adherence

### QA & Governance Lead
**Agent:** webwaka-qa-governance  
**Role:** Issue prioritization, invariant compliance verification, weekly sign-off  
**Responsibilities:**
- Verify each fix complies with 7 Core Invariants
- Conduct Layer 2-5 QA validation on all changes
- Approve weekly deliverables before moving to next phase
- Generate governance compliance reports
- Maintain remediation tracking matrix

### Infrastructure & Deployment Lead
**Agent:** webwaka-cloudflare-orchestrator  
**Role:** D1/KV provisioning, environment separation, deployment hardening  
**Responsibilities:**
- Create 10 separate D1 databases (5 staging, 5 production)
- Create 8 separate KV namespaces (4 staging, 4 production)
- Update all wrangler.toml bindings
- Verify environment isolation
- Manage Cloudflare resource provisioning

### CI/CD & Repository Lead
**Agent:** webwaka-infra-deployer  
**Role:** CI/CD repair, repository creation, GitHub hygiene  
**Responsibilities:**
- Update all GitHub Actions workflows to v4
- Add CLOUDFLARE_API_TOKEN and ACCOUNT_ID secrets to all repos
- Create 5 missing repositories with standard structure
- Establish develop→staging, main→prod branching model
- Template CI/CD for all core repositories

### Backend Implementation Lead
**Agent:** Backend Architect  
**Role:** Replace mock data with real business logic  
**Responsibilities:**
- Replace hardcoded arrays in Super Admin v2 with real D1 queries
- Implement tRPC/Hono procedures for all 6 dashboard pages
- Connect to D1 databases (tenants, billing, RBAC, modules, health)
- Connect to KV namespaces (feature flags, sessions)
- Ensure proper error handling and data validation

### Security & Compliance Lead
**Agent:** Security Engineer  
**Role:** Environment separation verification, data integrity  
**Responsibilities:**
- Verify tenant isolation across staging/production
- Validate JWT token handling
- Ensure RBAC enforcement
- Audit sensitive data protection
- Verify HTTPS and security headers

### API Testing Lead
**Agent:** API Tester  
**Role:** Regression testing, E2E validation  
**Responsibilities:**
- Write Vitest suite for all API changes
- Execute E2E tests across all 5 QA layers
- Verify real data flows through API to frontend
- Test database roundtrip functionality
- Generate test coverage reports

### Data Architecture Lead
**Agent:** Data Engineer  
**Role:** D1 environment separation, migration strategy  
**Responsibilities:**
- Design D1 schema for environment separation
- Create migration strategy for production data preservation
- Verify data integrity across environments
- Optimize D1 queries for performance
- Document data architecture changes

---

## SECTION 2: WEEK 1 EXECUTION PLAN (Mar 18-24)

### CRITICAL PRIORITY 1: Super Admin v2 Real Logic Implementation

**Task C1.1: Replace Mock Data in Dashboard Page**
- **Assigned to:** Backend Architect
- **Duration:** 2 days (Mar 18-19)
- **Deliverables:**
  - Replace hardcoded tenant array with D1 query
  - Replace hardcoded KPI metrics with real calculations
  - Implement proper error handling
  - Add loading states and empty states
- **Acceptance Criteria:**
  - Real tenant data displayed from D1
  - KPI metrics calculated from actual data
  - No hardcoded arrays remain
  - All TypeScript types properly defined
- **QA Sign-off:** webwaka-qa-governance

**Task C1.2: Replace Mock Data in Tenants Page**
- **Assigned to:** Backend Architect
- **Duration:** 1 day (Mar 20)
- **Deliverables:**
  - Implement CRUD operations for tenants
  - Connect to D1 tenants table
  - Add form validation
  - Implement pagination
- **Acceptance Criteria:**
  - Create tenant → D1 row created
  - Read tenant → D1 query executed
  - Update tenant → D1 row updated
  - Delete tenant → D1 row deleted
- **QA Sign-off:** webwaka-qa-governance

**Task C1.3: Replace Mock Data in Billing Page**
- **Assigned to:** Backend Architect
- **Duration:** 1 day (Mar 20)
- **Deliverables:**
  - Implement ledger view from D1 billing table
  - Implement commission calculator
  - Add payment tracking
  - Implement proper currency formatting (Naira)
- **Acceptance Criteria:**
  - Ledger displays real D1 data
  - Commission calculations are accurate
  - Payment status tracked correctly
  - All monetary values in Kobo (no decimals)
- **QA Sign-off:** webwaka-qa-governance

**Task C1.4: Replace Mock Data in Remaining Pages (Modules, Health, Settings)**
- **Assigned to:** Backend Architect
- **Duration:** 1 day (Mar 21)
- **Deliverables:**
  - Implement modules page with real module registry
  - Implement health page with real service status
  - Implement settings page with API key management
  - Connect all pages to appropriate D1 tables
- **Acceptance Criteria:**
  - All 6 pages connected to real D1 data
  - No hardcoded mock data remains
  - All CRUD operations functional
  - Proper error handling implemented
- **QA Sign-off:** webwaka-qa-governance

**Task C1.5: Vitest Suite for Super Admin v2**
- **Assigned to:** API Tester
- **Duration:** 1 day (Mar 22)
- **Deliverables:**
  - Write 50+ Vitest cases for all API endpoints
  - Test database roundtrip functionality
  - Test error handling and edge cases
  - Achieve >90% code coverage
- **Acceptance Criteria:**
  - All tests passing
  - >90% code coverage
  - Real data flows through API to frontend
  - Database queries verified
- **QA Sign-off:** webwaka-qa-governance

### CRITICAL PRIORITY 2: Environment Separation (D1/KV)

**Task C2.1: Provision Separate D1 Databases**
- **Assigned to:** webwaka-cloudflare-orchestrator
- **Duration:** 2 days (Mar 18-19)
- **Deliverables:**
  - Create 5 staging D1 databases:
    - tenants_staging
    - billing_staging
    - rbac_staging
    - modules_staging
    - health_staging
  - Create 5 production D1 databases:
    - tenants_prod
    - billing_prod
    - rbac_prod
    - modules_prod
    - health_prod
  - Document all database IDs
  - Verify connectivity
- **Acceptance Criteria:**
  - 10 total D1 databases created
  - All databases accessible
  - Unique IDs for each environment
  - No shared IDs between staging/prod
- **QA Sign-off:** Security Engineer

**Task C2.2: Provision Separate KV Namespaces**
- **Assigned to:** webwaka-cloudflare-orchestrator
- **Duration:** 1 day (Mar 20)
- **Deliverables:**
  - Create 4 staging KV namespaces:
    - webwaka_sessions_staging
    - webwaka_flags_staging
    - webwaka_cache_staging
    - webwaka_notifications_staging
  - Create 4 production KV namespaces:
    - webwaka_sessions_prod
    - webwaka_flags_prod
    - webwaka_cache_prod
    - webwaka_notifications_prod
  - Configure TTLs for each namespace
  - Verify isolation
- **Acceptance Criteria:**
  - 8 total KV namespaces created
  - All namespaces isolated by environment
  - TTLs configured appropriately
  - No data leakage between environments
- **QA Sign-off:** Security Engineer

**Task C2.3: Update wrangler.toml Bindings**
- **Assigned to:** webwaka-cloudflare-orchestrator
- **Duration:** 1 day (Mar 21)
- **Deliverables:**
  - Update all wrangler.toml files with new D1 IDs
  - Update all KV namespace bindings
  - Separate [env.staging] and [env.production] sections
  - Add proper environment variables
- **Acceptance Criteria:**
  - All D1 bindings use correct staging IDs in staging section
  - All D1 bindings use correct production IDs in production section
  - All KV bindings properly separated
  - No placeholder IDs remain
- **QA Sign-off:** Security Engineer

**Task C2.4: Data Migration & Preservation**
- **Assigned to:** Data Engineer
- **Duration:** 2 days (Mar 22-23)
- **Deliverables:**
  - Create migration scripts for production data
  - Migrate existing production data to new prod databases
  - Verify data integrity post-migration
  - Create backup of original data
  - Document migration process
- **Acceptance Criteria:**
  - All production data migrated successfully
  - Data integrity verified
  - Zero data loss
  - Rollback plan documented
- **QA Sign-off:** Security Engineer

### CRITICAL PRIORITY 3: CI/CD Pipeline Repair

**Task C3.1: Update GitHub Actions Workflows**
- **Assigned to:** webwaka-infra-deployer
- **Duration:** 2 days (Mar 23-24)
- **Deliverables:**
  - Update all workflows from actions/setup-node@v3 to v4
  - Add CLOUDFLARE_API_TOKEN secret to all repos
  - Add CLOUDFLARE_ACCOUNT_ID secret to all repos
  - Fix deployment step configurations
  - Test all workflows
- **Repositories to Update:**
  - webwaka-super-admin-v2
  - webwaka-logistics
  - webwaka-professional
  - webwaka-civic
  - webwaka-core
  - webwaka-central-mgmt
  - webwaka-commerce
  - webwaka-transport
- **Acceptance Criteria:**
  - All workflows updated to v4
  - All secrets configured in GitHub
  - All workflows passing
  - Deployments successful to staging
- **QA Sign-off:** webwaka-qa-governance

**Task C3.2: Test Deployments**
- **Assigned to:** API Tester
- **Duration:** 1 day (Mar 24)
- **Deliverables:**
  - Deploy Super Admin v2 to staging
  - Deploy all vertical suites to staging
  - Verify all deployments successful
  - Test health check endpoints
  - Generate deployment report
- **Acceptance Criteria:**
  - All deployments successful
  - Health checks passing
  - No 404 errors on API endpoints
  - Staging environment fully operational
- **QA Sign-off:** webwaka-qa-governance

### WEEK 1 DELIVERABLES

**Code:**
- Super Admin v2 with real D1/KV integration (no mock data)
- Updated wrangler.toml with environment separation
- Updated GitHub Actions workflows (v4)
- Migration scripts for production data

**Infrastructure:**
- 10 separate D1 databases (5 staging, 5 production)
- 8 separate KV namespaces (4 staging, 4 production)
- All Cloudflare resources provisioned and verified
- Production data migrated and verified

**Testing:**
- 50+ Vitest cases for Super Admin v2
- All E2E tests passing
- Deployment tests successful
- >90% code coverage achieved

**Documentation:**
- Environment separation architecture document
- Migration process documentation
- Deployment verification report
- Week 1 completion summary

---

## SECTION 3: WEEK 2 EXECUTION PLAN (Mar 25-31)

### HIGH PRIORITY 1: Create Missing Repositories

**Task H1.1: Bootstrap webwaka-institutional Repository**
- **Assigned to:** webwaka-infra-deployer
- **Duration:** 1 day (Mar 25)
- **Deliverables:**
  - Create GitHub repository
  - Clone standard project structure
  - Copy shared src/core/ primitives
  - Set up wrangler.toml with D1/KV bindings
  - Configure GitHub Actions CI/CD
- **Epics Unblocked:** INS-1, INS-2, INS-3

**Task H1.2: Bootstrap webwaka-services Repository**
- **Assigned to:** webwaka-infra-deployer
- **Duration:** 1 day (Mar 25)
- **Deliverables:**
  - Create GitHub repository
  - Clone standard project structure
  - Copy shared src/core/ primitives
  - Set up wrangler.toml with D1/KV bindings
  - Configure GitHub Actions CI/CD
- **Epics Unblocked:** SRV-1, SRV-2, SRV-3

**Task H1.3: Bootstrap webwaka-fintech Repository**
- **Assigned to:** webwaka-infra-deployer
- **Duration:** 1 day (Mar 26)
- **Deliverables:**
  - Create GitHub repository
  - Clone standard project structure
  - Copy shared src/core/ primitives
  - Set up wrangler.toml with D1/KV bindings
  - Configure GitHub Actions CI/CD
- **Epics Unblocked:** FIN-1, FIN-2, FIN-3, FIN-4, FIN-5

**Task H1.4: Bootstrap webwaka-real-estate Repository**
- **Assigned to:** webwaka-infra-deployer
- **Duration:** 1 day (Mar 26)
- **Deliverables:**
  - Create GitHub repository
  - Clone standard project structure
  - Copy shared src/core/ primitives
  - Set up wrangler.toml with D1/KV bindings
  - Configure GitHub Actions CI/CD
- **Epics Unblocked:** RES-1, RES-2

**Task H1.5: Bootstrap webwaka-production Repository**
- **Assigned to:** webwaka-infra-deployer
- **Duration:** 1 day (Mar 27)
- **Deliverables:**
  - Create GitHub repository
  - Clone standard project structure
  - Copy shared src/core/ primitives
  - Set up wrangler.toml with D1/KV bindings
  - Configure GitHub Actions CI/CD
- **Epics Unblocked:** PRD-1, PRD-2, PRD-3

### HIGH PRIORITY 2: Merge Feature Branches

**Task H2.1: Merge webwaka-logistics Feature Branch**
- **Assigned to:** webwaka-infra-deployer
- **Duration:** 1 day (Mar 28)
- **Deliverables:**
  - Merge feature/log-2-parcel-delivery to develop
  - Merge develop to main
  - Verify all tests passing
  - Deploy to staging and production
- **Acceptance Criteria:**
  - Feature branch merged without conflicts
  - All tests passing
  - Deployments successful
  - No console.log violations

**Task H2.2: Merge webwaka-professional Feature Branch**
- **Assigned to:** webwaka-infra-deployer
- **Duration:** 1 day (Mar 29)
- **Deliverables:**
  - Merge feature/pro-1-legal to develop
  - Merge develop to main
  - Verify all tests passing
  - Deploy to staging and production
- **Acceptance Criteria:**
  - Feature branch merged without conflicts
  - All tests passing
  - Deployments successful
  - No console.log violations

**Task H2.3: Merge webwaka-civic Feature Branch**
- **Assigned to:** webwaka-infra-deployer
- **Duration:** 1 day (Mar 30)
- **Deliverables:**
  - Merge feature/civ-1-church-ngo to develop
  - Merge develop to main
  - Verify all tests passing
  - Deploy to staging and production
- **Acceptance Criteria:**
  - Feature branch merged without conflicts
  - All tests passing
  - Deployments successful
  - No console.log violations

### HIGH PRIORITY 3: Fix Placeholder D1 IDs

**Task H3.1: Create Real D1 Databases for webwaka-professional**
- **Assigned to:** webwaka-cloudflare-orchestrator
- **Duration:** 1 day (Mar 31)
- **Deliverables:**
  - Create staging and production D1 databases
  - Update wrangler.toml with real IDs
  - Verify connectivity
  - Deploy and test
- **Acceptance Criteria:**
  - Real D1 IDs configured
  - No placeholder IDs remain
  - Deployments successful

**Task H3.2: Create Real D1 Databases for webwaka-civic**
- **Assigned to:** webwaka-cloudflare-orchestrator
- **Duration:** 1 day (Mar 31)
- **Deliverables:**
  - Create staging and production D1 databases
  - Update wrangler.toml with real IDs
  - Verify connectivity
  - Deploy and test
- **Acceptance Criteria:**
  - Real D1 IDs configured
  - No placeholder IDs remain
  - Deployments successful

### WEEK 2 DELIVERABLES

**Infrastructure:**
- 5 new repositories created and bootstrapped
- All new repositories have working CI/CD
- All feature branches merged to main
- All placeholder D1 IDs replaced with real databases

**Code:**
- 13 epics now unblocked and ready for implementation
- All repositories have standard structure
- All repositories have shared primitives
- All repositories have proper D1/KV bindings

**Testing:**
- All feature branch merges verified with tests
- All new repositories passing initial tests
- All deployments successful

**Documentation:**
- Repository creation documentation
- Feature branch merge logs
- Week 2 completion summary

---

## SECTION 4: WEEK 3 EXECUTION PLAN (Apr 1-7)

### MEDIUM PRIORITY 1: Console.log Cleanup

**Task M1.1: Remove console.log from webwaka-logistics**
- **Assigned to:** Backend Architect
- **Duration:** 1 day (Apr 1)
- **Deliverables:**
  - Remove 12 console.log statements
  - Replace with platform logger (src/core/logger.ts)
  - Verify no debug output in production
  - Test logging functionality
- **Acceptance Criteria:**
  - Zero console.log statements
  - All logging via platform logger
  - No debug output in production builds

**Task M1.2: Remove console.log from webwaka-super-admin-v2**
- **Assigned to:** Backend Architect
- **Duration:** 1 day (Apr 2)
- **Deliverables:**
  - Remove 24 console.log statements
  - Replace with platform logger (src/core/logger.ts)
  - Verify no debug output in production
  - Test logging functionality
- **Acceptance Criteria:**
  - Zero console.log statements
  - All logging via platform logger
  - No debug output in production builds

**Task M1.3: Remove console.log from webwaka-civic**
- **Assigned to:** Backend Architect
- **Duration:** 1 day (Apr 3)
- **Deliverables:**
  - Remove 5 console.log statements
  - Replace with platform logger (src/core/logger.ts)
  - Verify no debug output in production
  - Test logging functionality
- **Acceptance Criteria:**
  - Zero console.log statements
  - All logging via platform logger
  - No debug output in production builds

**Task M1.4: Remove console.log from webwaka-professional**
- **Assigned to:** Backend Architect
- **Duration:** 1 day (Apr 3)
- **Deliverables:**
  - Remove 2 console.log statements
  - Replace with platform logger (src/core/logger.ts)
  - Verify no debug output in production
  - Test logging functionality
- **Acceptance Criteria:**
  - Zero console.log statements
  - All logging via platform logger
  - No debug output in production builds

### MEDIUM PRIORITY 2: webwaka-cross-cutting Repository

**Task M2.1: Create webwaka-cross-cutting Repository**
- **Assigned to:** webwaka-infra-deployer
- **Duration:** 1 day (Apr 4)
- **Deliverables:**
  - Create GitHub repository
  - Clone standard project structure
  - Set up wrangler.toml with D1/KV bindings
  - Configure GitHub Actions CI/CD
- **Epics Unblocked:** XCT-1, XCT-2, XCT-3, XCT-4, XCT-5

**Task M2.2: Port Phase 5 Tests to webwaka-cross-cutting**
- **Assigned to:** API Tester
- **Duration:** 2 days (Apr 4-5)
- **Deliverables:**
  - Port 153 tests from Phase 5 QA reports
  - Verify all tests passing
  - Achieve >90% code coverage
  - Document test suite
- **Acceptance Criteria:**
  - 153 tests ported and passing
  - >90% code coverage
  - All 5 QA layers verified

### MEDIUM PRIORITY 3: Full 5-Layer QA Re-verification

**Task M3.1: Layer 2 Integration Testing**
- **Assigned to:** API Tester
- **Duration:** 1 day (Apr 5)
- **Deliverables:**
  - Test frontend → API → database integration
  - Verify all endpoints working
  - Test error handling
  - Generate integration test report
- **Acceptance Criteria:**
  - All integration tests passing
  - No 404 errors
  - Proper error responses

**Task M3.2: Layer 3 End-to-End Testing**
- **Assigned to:** API Tester
- **Duration:** 1 day (Apr 6)
- **Deliverables:**
  - Test complete user workflows
  - Test multi-page navigation
  - Test data persistence
  - Generate E2E test report
- **Acceptance Criteria:**
  - All E2E tests passing
  - Complete workflows functional
  - Data properly persisted

**Task M3.3: Layer 4 Performance Testing**
- **Assigned to:** API Tester
- **Duration:** 1 day (Apr 6)
- **Deliverables:**
  - Run Lighthouse audits
  - Measure page load times
  - Verify bundle size targets
  - Generate performance report
- **Acceptance Criteria:**
  - Page load time < 3 seconds
  - Lighthouse scores > 90
  - Bundle size < 500KB gzipped

**Task M3.4: Layer 5 Security Testing**
- **Assigned to:** Security Engineer
- **Duration:** 1 day (Apr 7)
- **Deliverables:**
  - Verify HTTPS enforcement
  - Check security headers
  - Test XSS prevention
  - Test RBAC enforcement
  - Generate security report
- **Acceptance Criteria:**
  - HTTPS enforced
  - All security headers present
  - XSS prevention verified
  - RBAC working correctly

### WEEK 3 DELIVERABLES

**Code Quality:**
- Zero console.log violations across all repositories
- All logging via platform logger
- webwaka-cross-cutting repository created
- 153 tests ported and passing

**Testing:**
- Full 5-Layer QA re-verification complete
- All tests passing across all repositories
- >90% code coverage maintained
- Performance targets met

**Governance:**
- 7 Core Invariants 100% compliant
- All repositories following governance standards
- No architectural drift detected
- Production readiness verified

**Documentation:**
- Console.log cleanup summary
- webwaka-cross-cutting repository documentation
- Full 5-Layer QA verification report
- Week 3 completion summary

---

## SECTION 5: FINAL DELIVERABLES (May 1, 2026)

### 1. Fixed Super Admin v2
- Real D1/KV integration (no mock data)
- All 6 pages connected to actual databases
- Separate staging/production databases
- Live at admin.webwaka.com (custom domain)
- 50+ Vitest suite with >90% coverage

### 2. Infrastructure Ready
- 16 total repositories (11 existing + 5 new)
- CI/CD working on ALL repositories
- Develop→staging, main→prod branching model
- No placeholder D1 IDs anywhere
- 10 separate D1 databases (5 staging, 5 production)
- 8 separate KV namespaces (4 staging, 4 production)

### 3. Governance Restored
- 7 Invariants 100% compliant
- Zero console.log violations
- Phase 1-5 QA re-verified
- 19 pending epics UNBLOCKED
- Full 5-Layer QA passing on all repositories

### 4. Execution Report
Comprehensive tracking matrix showing:
- All critical issues fixed
- All high priority issues resolved
- All medium priority issues addressed
- Agent assignments and completion dates
- Evidence of each fix (commit hashes, test results)

### 5. Production Verification Suite
- curl health checks for all services
- Database query verification (tenant counts per env)
- E2E tests (login → create tenant → billing)
- Performance benchmarks verified
- Security audit passed

---

## SECTION 6: EXECUTION RULES

1. **NO NEW EPICS** until remediation complete
2. **Daily standups** via Manus status reports
3. **Weekly sign-offs** by webwaka-qa-governance
4. **Target:** May 1 → "Platform Production Ready"
5. **Budget:** 21 agent-days maximum
6. **Escalation:** Any blocker immediately escalated to webwaka-engineering-orchestrator

---

## SECTION 7: AGENT COMMUNICATION PROTOCOL

### Daily Status Format
```
AGENT: [Agent Name]
DATE: [YYYY-MM-DD]
TASK: [Current Task]
STATUS: [ON TRACK / AT RISK / BLOCKED]
COMPLETION: [X%]
BLOCKERS: [None / Description]
NEXT STEPS: [Tomorrow's plan]
```

### Weekly Completion Report
```
WEEK: [1/2/3]
COMPLETED TASKS: [List]
TESTS PASSING: [X/Y]
CODE COVERAGE: [X%]
BLOCKERS RESOLVED: [List]
QA SIGN-OFF: [YES/NO]
NEXT WEEK PLAN: [Summary]
```

### Issue Escalation
- **Blocker detected** → Immediate notification to webwaka-engineering-orchestrator
- **QA failure** → Halt and notify webwaka-qa-governance
- **Deployment failure** → Rollback and investigate with webwaka-cloudflare-orchestrator

---

**READY FOR EXECUTION**

All agents are mobilized and ready to execute the 21-day remediation plan. The platform will be production-ready by May 1, 2026, with all critical issues fixed, governance restored, and 19 pending epics unblocked.

**Launch remediation now.** 🚀
