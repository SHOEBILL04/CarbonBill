# CarbonBill (.NET Edition)

> **Bangla-first SME Carbon-Accounting Platform & Defensible Buyer Reporting**  
> Built with ASP.NET Core (LTS), EF Core with SQLite, Hangfire, and React + Vite PWA.

---

## 1. Design Principles

1. **One Job Per Persona**: Floor staff (Jahid) only captures; Accountants (Rahim) only review; Owners/Compliance (Kabir/Nusrat) decide.
2. **Trust Before Automation**: The original bill is always presented alongside extracted fields; numbers are confirmed before inclusion.
3. **Honest Numbers**: Estimates are explicitly marked as "Estimated" (with hatched charts); precision is never faked; benchmarks require sufficient peer data.
4. **Works on a Weak Phone & Network**: Lightweight floor-staff route (< 30 KB JS), IndexedDB offline queue, Bangla-first UI.
5. **Everything Traceable**: Every reported emission links directly to its source document, factor version, and confirming reviewer.

---

## 2. Module Map (Modular Monolith)

```
src/
  ├── CarbonBill.SharedKernel/             # Base entities, Result<T>, Tenancy, ValueConverters, Provider interfaces
  ├── CarbonBill.Api/                      # Minimal APIs (/api/v1), Serilog, Rate Limiter, Hangfire Dashboard
  ├── CarbonBill.Modules.IdentityTenancy/  # Orgs, Users, Memberships, Invitations (QR + PIN)
  ├── CarbonBill.Modules.Audit/            # Append-only AuditLog service
  ├── CarbonBill.Modules.Onboarding/       # Sites, Meters, Gensets, Expected Document Rules
  ├── CarbonBill.Modules.Documents/        # Upload, SHA-256 deduplication, Storage, Lifecycle
  ├── CarbonBill.Modules.Extraction/       # OCR pipeline orchestration, Tier 1/2/3 mapping
  ├── CarbonBill.Modules.Review/           # Side-by-side review, sampling audit
  ├── CarbonBill.Modules.ActivityUnits/    # Canonical units (kWh, litre, kg) and conversions
  ├── CarbonBill.Modules.FactorRegistry/   # Versioned emission factors and organization overrides
  ├── CarbonBill.Modules.Calculation/      # kg CO2e engine (Scope 1, 2, 3)
  ├── CarbonBill.Modules.GapDetection/     # Missing document alerts and checklists
  ├── CarbonBill.Modules.Flags/            # Deterministic rule engine for data quality & footprint spikes
  ├── CarbonBill.Modules.Recommendations/  # Measure library, BDT savings and payback modeling
  ├── CarbonBill.Modules.Reporting/        # Snapshots, GHG-aligned buyer reports, share links
  ├── CarbonBill.Modules.Notifications/    # In-app, email, and Web Push subscriptions
  └── CarbonBill.Modules.PlatformAdmin/    # Versioned dataset publishing and tenant support
tests/
  ├── CarbonBill.UnitTests/                # Fast mathematical, converter, and hashing tests
  ├── CarbonBill.IntegrationTests/         # Temp SQLite tests proving 100% tenant isolation
  └── CarbonBill.ArchitectureTests/        # NetArchTest rules enforcing strict module boundaries
web/                                       # React + Vite PWA (Bangla-first, Floor-staff chunk < 30KB)
docs/
  ├── adr/                                 # Architectural Decision Records (SQLite, Money/Quantities)
  └── verify.md                            # Verification checklist for third-party quotas & licenses
```

---

## 3. SQLite Architecture & Adaptations

- **Connection PRAGMAs**: Every SQLite connection automatically applies `PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA synchronous = NORMAL;`.
- **Tenant Isolation**: Since SQLite lacks RLS, isolation is strictly enforced via EF Core Global Query Filters on `org_id` and `TenantSaveChangesInterceptor` which rejects cross-tenant writes with `CrossTenantAccessException`.
- **Money & Quantities**: C# domain code uses `decimal`. Stored in SQLite as integer **Paisa** (1 BDT = 100 Paisa) and scaled micro-units ($10^6$) using `PaisaMoneyConverter` and `ScaledQuantityConverter`.
- **Concurrency & Resilience**: `SqliteLockRetryMiddleware` catches `SQLITE_BUSY` (code 5) and retries transient lock contentions with exponential backoff and jitter.
- **Atomic Backups**: Scheduled Hangfire job runs `VACUUM INTO` and uploads encrypted database snapshots to object storage via `IFileStore`.

---

## 4. Getting Started

### Prerequisites
- [.NET 8.0 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- Optional: [Docker](https://www.docker.com/)

### Running Backend API (.NET)
```bash
# Run API (Swagger available at http://localhost:5000/swagger)
dotnet run --project src/CarbonBill.Api
```

### Running Frontend PWA (React + Vite)
```bash
cd web
npm install
npm run dev
# Frontend runs at http://localhost:5173
```

### Running with Docker Compose
```bash
docker compose -f docker/docker-compose.yml up --build
```

---

## 5. Seed Credentials (Development)

| Role | Email | Password | PIN / Notes |
|---|---|---|---|
| **Factory Owner** | `owner@apex.local` | `Pass1234!` | Kabir Ahmed (Apex Textiles) |
| **Accountant** | `accountant@apex.local` | `Pass1234!` | Rahim Mia |
| **Compliance Officer** | `compliance@apex.local` | `Pass1234!` | Nusrat Jahan |
| **Floor Staff** | `floor@apex.local` | `Pass1234!` | Jahid Hasan (Token: `apex-floor-demo`, PIN: `1234`) |
| **Consultant** | `consultant@greenadvisory.local` | `Pass1234!` | Farhana Rahman (Multi-tenant) |
| **Platform Admin** | `admin@carbonbill.local` | `Admin1234!` | Full platform access |

---

## 6. Running Tests

```bash
# Run all Unit, Integration, and Architecture tests
dotnet test CarbonBill.sln
```

---

## 7. Delivery Roadmap (Phase 1 Checklist)

- [x] **Solution & Project Structure**: Modular monolith (.NET 8 LTS, strict nullability, treat warnings as errors).
- [x] **Provider Interfaces & Fakes**: `IOcrProvider`, `IFileStore`, `INotifier`, `IReportRenderer`.
- [x] **Identity & Tenancy Module**: Organizations, Users, Memberships, QR+PIN Invitations, JWT login, token refresh, and tenant resolution.
- [x] **Code-Level Tenant Isolation**: Global query filters, SaveChanges interceptor, and integration tests proving Org A cannot access Org B.
- [x] **Audit Module**: Append-only `AuditLog` service.
- [x] **SQLite Resilience & Backups**: WAL mode PRAGMAs, Polly busy lock retries, and `VACUUM INTO` backup job.
- [x] **Background Jobs**: Hangfire with SQLite storage and admin-secured dashboard (`/hangfire`).
- [x] **All 13 Module Shells**: Project structures, entity definitions, DI registrations, and architecture boundary tests.
- [x] **Web PWA Scaffold**: React + Vite + TypeScript, i18next (Bangla default), floor-staff route (< 30 KB bundle), IndexedDB offline queue, and login view.
- [x] **DevOps & Infra**: Multi-stage Dockerfile with Tesseract OCR, `docker-compose.yml`, and GitHub Actions CI.
- [x] **ADRs & Verification**: `docs/adr/0001-...`, `docs/adr/0002-...`, and `docs/verify.md`.
