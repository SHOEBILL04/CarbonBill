# TRACK A: Platform and Data Backbone (Dev 1)

## 1. Track Overview & Scope

Dev 1 is responsible for the foundational infrastructure, security boundaries, multi-tenancy model, core reference registries, emissions calculation engine, platform administration, and deployment architecture. Dev 1 acts as the primary steward of `CarbonBill.Contracts`.

---

## 2. Owned Folders & Modules

### Backend Modules & Libraries
- `src/CarbonBill.Api` (Host application, DI wiring, middleware pipeline)
- `src/CarbonBill.SharedKernel` (Base entities, RLS helpers, outbox dispatcher, error handling)
- `src/CarbonBill.Contracts` (Frozen contract interfaces, events, DTOs, and Fakes - steward/owner)
- `src/Modules/CarbonBill.Modules.IdentityTenancy`
- `src/Modules/CarbonBill.Modules.Onboarding`
- `src/Modules/CarbonBill.Modules.ActivityUnits`
- `src/Modules/CarbonBill.Modules.FactorRegistry`
- `src/Modules/CarbonBill.Modules.Calculation`
- `src/Modules/CarbonBill.Modules.Audit`
- `src/Modules/CarbonBill.Modules.PlatformAdmin`

### Tests & Infrastructure
- `tests/CarbonBill.ArchitectureTests`
- `tests/CarbonBill.IntegrationTests`
- `infra/` (Docker Compose, Caddy configurations, CI/CD workflows)

### Frontend Feature Folders (`web/src/features/`)
- `web/src/features/auth`
- `web/src/features/onboarding`
- `web/src/features/admin`
- `web/src/features/consultant`

---

## 3. Deliverables Breakdown

### Phase 0: Scaffolding & Contracts
- **P0-1a:** Core context documentation, architectural baselines, and `AGENTS.md`. *(Current)*
- **P0-2:** ASP.NET Core solution scaffold, module projects, Docker setup, NetArchTest architecture guard.
- **P0-5:** Populate `CarbonBill.Contracts` with interfaces, DTOs, domain events, and in-memory Fakes (`CarbonBill.Contracts.Fakes`). Tag `contracts-v0.1` upon 3-dev approval.

### Phase 1: MVP Deliverables (A1 to A7)
- **A1 — Building Blocks:**
  - Multi-schema EF Core setup with PostgreSQL Npgsql.
  - Dual tenancy enforcement: EF Core global query filters and PostgreSQL Row-Level Security (RLS) helper.
  - Outbox pattern and in-process domain event dispatcher.
  - Append-only `AuditLog` table and `IAuditLogger` implementation.
  - RFC 7807 `problem+json` error middleware with bilingual user-safe messaging (`Accept-Language: bn/en`).
  - Cursor pagination, ETag support, idempotency key middleware, and rate-limiting policies.
- **A2 — Identity and Tenancy:**
  - ASP.NET Core Identity with JWT access tokens and secure HTTP-only refresh cookies.
  - Roles matrix implementation (`FloorStaff`, `Accountant`, `Compliance`, `Owner`, `Consultant`, `AuditorLink`, `PlatformAdmin`).
  - QR join flow with short PIN for floor staff (no email required).
  - Multi-organization membership switching for consultants.
  - Deliver handoff: `A-to-ALL-auth-ready.md`.
- **A3 — Onboarding & Expected-Document Calendar:**
  - Setup `Site`, `Asset` (meters, gensets, boilers, vehicles), and `ExpectedDocRule`.
  - Sector template ingestion (RMG priority).
  - 2-minute facility questionnaire profile storage.
  - Expected-document calendar expansion service (checklist generation for Gap Detection).
  - Implement `IExpectedDocRuleReader`.
  - Deliver handoff: `A-to-C-expected-docs.md`.
- **A4 — Units & Factor Registry:**
  - Canonical unit conversion tables (`UnitConversion`) with versioning.
  - Immutable emission factor sets (`FactorSet`, `EmissionFactor`) with GWP basis (AR5/AR6).
  - Factor selection precedence: Org Override -> National Grid -> Regional Default.
  - Implement `IUnitConverter` and `IFactorLookup`.
  - Seed data import loader raising `FactorSetPublished`.
- **A5 — Activity & Calculation Engine:**
  - `IActivityWriter` implementation: atomic transaction recording `ActivityRecord`, computing `EmissionResult` (`kg CO2e = quantity x factor`), and logging `AuditLog`.
  - Verified vs. estimated calculation separation; Data Quality Score rollups.
  - Implement `IActivityReadModel` and `IEmissionReadModel`.
  - Recalculation proposal generator for new factor releases.
  - Deliver handoffs: `A-to-B-activity-writer.md` and `A-to-C-emissions-read.md`.
- **A6 — Platform Admin & Isolation Testing:**
  - Dataset management endpoints (`POST /api/v1/admin/datasets`) with `DatasetVersion` tracking.
  - Automated integration test suite scanning 100% of tenant tables for `org_id`, query filters, and RLS policies.
- **A7 — Frontend (Auth, Onboarding, Admin):**
  - Screens for login, floor staff QR join with PIN, onboarding setup wizard, and admin dataset uploads.
  - Bilingual localization (`bn`/`en`) and route exports.

### Phase 2: Integration & Hardening
- **I1:** Host integration: replace all Contracts Fakes with real module registrations (`UseFakes=false`).
- **I4:** Security audit, OWASP ASVS verification, and cross-tenant penetration testing.
- **I7:** Consultant multi-organization workspace and factor override workflow.
- **I8:** Pilot VPS deployment automation with Caddy TLS and backup restore verification.

---

## 4. Track Risks & Mitigations

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| **Multi-Tenant Data Leakage** | Critical data privacy breach between competing factories. | Dual-layer isolation: EF Core query filters combined with database-level PostgreSQL Row-Level Security (RLS). Automated CI tests assert 100% coverage. |
| **Contract Bottleneck** | Dev 2 and Dev 3 blocked waiting on interface changes. | `CarbonBill.Contracts` frozen at G1 with rich in-memory Fakes. Contract change protocol ensures daily processing of additive-only requests. |
| **Calculation Drift & Rounding Errors** | Inaccurate carbon figures rejected by international apparel buyers. | Strict use of `decimal numeric(18,6)` for all quantities and emission factors. Rounding is strictly isolated to presentation layers. Immutable versioned factor sets prevent retroactive unapproved alterations. |
