# 02. Modules and Ownership: CarbonBill

## 1. Module Ownership Matrix

Every backend module and subsystem is strictly assigned to one developer/agent. No developer may edit or modify code within a module owned by another developer.

| Module | Core Responsibility | Key Domain Entities | Backend Owner |
|---|---|---|---|
| **Identity & Tenancy** | Organizations, users, memberships, QR invitation tokens for floor staff, multi-organization consultant switching. | `Organization`, `User`, `Membership`, `Invitation` | **Dev 1** |
| **Onboarding** | Sector templates, sites, assets (meters, generators, boilers, vehicles), expected document calendar generation, facility questionnaires. | `Site`, `Asset`, `ExpectedDocRule` | **Dev 1** |
| **Documents** | File uploads, SHA-256 deduplication, magic-byte security validation, image re-encoding, EXIF stripping, pre-signed storage URLs. | `Document`, `DocumentPage` | **Dev 2** |
| **Extraction** | Background OCR orchestration (Tier 1 Tesseract, Tier 2 Azure DI, Tier 3 Vision LLM), normalization, bounding box extraction, penalty detection. | `ExtractionRun`, `ExtractedField` | **Dev 2** |
| **Review** | Side-by-side human review workspace, field corrections, manual-entry fallback, auto-confirm rules with 10% random sampling audit. | `ReviewDecision` | **Dev 2** |
| **Activity & Units** | Canonical unit conversion (kWh, litre, kg, m3, tonne-km), versioned conversion tables, normalized activity logging. | `ActivityRecord`, `Unit`, `UnitConversion` | **Dev 1** |
| **Factor Registry** | Versioned emission factor sets (AR5/AR6 GWP basis, grid factors, fuel factors), consultant overrides with mandatory justifications. | `FactorSet`, `EmissionFactor`, `FactorOverride` | **Dev 1** |
| **Calculation** | GHG Scope 1, 2, and 3 calculation (`kg CO2e = quantity x factor`), verified vs. estimated totals, Data Quality Score rollups. | `EmissionResult` | **Dev 1** |
| **Gap Detection** | Compares expected document rules against received documents; produces missing alerts with multi-tiered escalation (days -7, -3, 0). | `MissingAlert` | **Dev 3** |
| **Carbon Flags** | Deterministic rule engine monitoring data quality, footprint anomalies (spikes, hotspots, genset reliance), and buyer audit readiness. | `Flag`, `FlagRule` | **Dev 3** |
| **Insights & Benchmarks** | Monthly production metrics (`ProductionMetric`), emission intensity denominators (kg CO2e / unit), peer benchmark distributions. | `ProductionMetric`, `BenchmarkSet` | **Dev 3** |
| **Recommendations** | Measure Library dataset ingestion, 8-step reduction calculation pipeline, BDT savings and payback modeling, closed-loop outcome tracking. | `Measure`, `MeasureSource`, `Recommendation` | **Dev 3** |
| **Reporting** | Dashboard aggregations, QuestPDF GHG report generation, ClosedXML buyer Excel workbooks, expiring auditor share links. | `Report`, `ReportSnapshot`, `ShareLink` | **Dev 3** |
| **Notifications** | In-app alerts, Web Push (VAPID) prompts, transactional email (Brevo/Resend), weekly digest compilation, quiet-hours filtering. | `Notification`, `PushSubscription` | **Dev 3** |
| **Audit** | Append-only audit logging for confirmations, corrections, factor overrides, report approvals, and share-link creations. | `AuditLog` | **Dev 1** |
| **Platform Admin** | Platform-level management, loading versioned datasets (factors, measures, benchmarks, flag rules), tenant support overview. | `DatasetVersion` | **Dev 1** |
| **SharedKernel** | Cross-cutting infrastructure: EF base configurations, PostgreSQL RLS helpers, outbox dispatcher, problem+json error middleware, rate limiting. | Common building blocks | **Dev 1** |
| **Api Host** | ASP.NET Core host orchestration, dependency injection root, Swagger/OpenAPI setup, Serilog configuration, health endpoints. | Web Host | **Dev 1** |

---

## 2. Frontend Feature-Folder Ownership

The React + Vite PWA frontend is organized under `web/src/features/`. Each feature folder is strictly owned by one developer:

```text
web/src/
├── app/                  # Application shell, routing, role-based entry screens (Dev 2)
├── shared/               # Shared UI kit, design tokens, formatters, API client stub (Dev 2)
└── features/
    ├── auth/             # Login, QR join + PIN, token refresh (Dev 1)
    ├── onboarding/       # Onboarding wizard, facility questionnaire, calendar preview (Dev 1)
    ├── admin/            # Dataset upload, version inspection, tenant support view (Dev 1)
    ├── consultant/       # Multi-tenant switching workspace, factor override flows (Dev 1)
    ├── capture/          # 2-tap floor PWA capture, offline queue, manual entry fallback (Dev 2)
    ├── review/           # Side-by-side verification, field editor, bulk confirm queue (Dev 2)
    ├── dashboard/        # Role-based KPI views, footprint trends, intensity charts (Dev 3)
    ├── flags/            # Carbon flags feed, snooze, dismiss, action deep-links (Dev 3)
    ├── recommendations/  # Measure cards with ranges, BDT payback, financing notes (Dev 3)
    ├── reports/          # Report checklist, PDF preview, Excel export, share link modal (Dev 3)
    └── auditor/          # Read-only verification view, document/factor drill-down (Dev 3)
```

### Frontend Ownership Rules
- **Dev 1 owns:** `auth`, `onboarding`, `admin`, `consultant`.
- **Dev 2 owns:** `capture`, `review`, `web/src/app` (shell), and `web/src/shared` (UI kit & formatters).
- **Dev 3 owns:** `dashboard`, `flags`, `recommendations`, `reports`, `auditor`.
- **Route Registration:** Each feature folder exports its route configuration via an `index.ts` file. Developers register routes through feature exports without modifying other developers' code or the shell directly.

---

## 3. Strict Rules for Cross-Module Calls

To preserve modular monolith integrity and eliminate dependency spaghetti:

1. **No Project References Between Modules:**
   C# projects named `CarbonBill.Modules.<A>` must **never** add a `<ProjectReference>` to `CarbonBill.Modules.<B>`. Automated architecture tests (`CarbonBill.ArchitectureTests` using NetArchTest) run in CI and immediately fail if any module directly references another.

2. **Communication via `CarbonBill.Contracts` Only:**
   All inter-module interactions must go through one of two mechanisms defined in `src/CarbonBill.Contracts`:
   - **Read-Model / Command Interfaces:** A consuming module injects a contract interface (e.g. `IDocumentReadModel`, `IActivityWriter`, `IExpectedDocRuleReader`). The implementation is registered in DI by the owning module.
   - **Domain Events:** Modules publish in-process domain events (e.g. `DocumentUploaded`, `DocumentConfirmed`, `EmissionCalculated`, `FlagRaised`). Consuming modules implement event handlers without direct references.

3. **Isolated Database Schemas:**
   Modules do not join tables or execute raw queries across module schema boundaries. If Module B requires data originating in Module A, it queries Module A via its contract interface or maintains a localized projection populated by domain events.

4. **Testing Against Fakes:**
   During development, modules execute tests against mock implementations located in `CarbonBill.Contracts.Fakes`. Real implementations are wired only during Phase 2 Integration.
