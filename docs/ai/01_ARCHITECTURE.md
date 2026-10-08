# 01. System Architecture: CarbonBill

## 1. System Context

CarbonBill interfaces with distinct user roles across factory hierarchies and external verifying parties, connecting to storage, asynchronous pipelines, OCR engines, and external reference databases.

```text
 Floor Staff (PWA, Bangla)    Accountant (Web)    Compliance/Owner (Web/Mobile)
        \                          |                       /
         \                         |                      /
          +--------------  CarbonBill Platform  ---------+---- Consultant (Multi-Org)
                               |     \
                               |      +---- Buyer / Auditor (Expiring Share Link)
         +---------------------+-----------------------+
         |                     |                       |
    OCR / AI Pipeline    Object Storage          Email / Web Push
  (Tesseract, Azure DI,   (Cloudflare R2)       (Brevo/Resend, VAPID)
   Vision LLM fallback)
```

**External Reference Data Ingestion:**
Versioned reference tables are curated and loaded via Platform Admin scripts/endpoints:
- National grid emission factor (e.g. IGES / UNFCCC CDM dataset)
- Fuel emission factors (IPCC EFDB, UK DEFRA/DESNZ)
- Unit conversion tables (canonical standards: kWh, litre, kg, m3, tonne-km)
- Measure Library (energy efficiency case studies)
- Sector benchmark datasets (P25, P50, P75, P90 peer distributions)

---

## 2. Technology Stack & Fallbacks

| Layer | Primary Technology | Rationale & Trade-offs | Fallback Option |
|---|---|---|---|
| **Backend Framework** | **ASP.NET Core (current LTS), C#** | High throughput, type safety for calculations, minimal APIs + MediatR-style CQRS handlers. | None needed |
| **Architecture Pattern** | **Modular Monolith** | Single deployable unit with strict module boundaries; eliminates microservices operational overhead for small teams. | Extract heavy OCR worker process first |
| **ORM & Data Access** | **EF Core + Npgsql**; Dapper for high-volume reporting queries | High productivity for CRUD with query filter support; Dapper handles complex rollups. | Pure EF Core queries |
| **Database** | **PostgreSQL** (Neon or Supabase free tier in Singapore region; Docker in dev) | Relational integrity for audit trails, native JSONB support, Row-Level Security (RLS). | PostgreSQL on VPS |
| **Background Processing** | **Hangfire with PostgreSQL storage** | Free, robust dashboard included, supports retries and recurring cron jobs without Redis. | Redis + Hangfire |
| **Caching Layer** | **In-memory (`IMemoryCache`)** | Zero extra infrastructure components for MVP. | Redis (when scaling to 2+ API instances) |
| **Object File Storage** | **Cloudflare R2** (S3-compatible, free tier, zero egress fees) | Cost-effective image hosting with edge latency. *(VERIFY: monthly free operations quota)* | MinIO on self-hosted VPS |
| **Frontend Framework** | **React + Vite PWA** (TypeScript), Workbox, IndexedDB, i18next, Chart.js | Static SPA behind authentication; faster initial paint and smaller bundle than SSR; offline queue support. | Next.js static export |
| **Frontend Hosting** | **Cloudflare Pages** (Global CDN, free tier) | Ultra-low latency on Bangladeshi mobile data networks. | Azure Static Web Apps |
| **Real-Time Updates** | **SignalR** (WebSockets with polling fallback) | Built into ASP.NET Core; notifies UI when background OCR finishes. | Client HTTP polling |
| **Identity & Authentication** | **ASP.NET Core Identity + JWT** (short-lived access tokens + HTTP-only refresh cookies) | Self-contained, zero-cost IdP; QR-code + PIN join flow for floor staff; optional TOTP for owners. | Keycloak (future) |
| **OCR Tier 1 (Free / Local)** | **Tesseract (ben+eng)** with image preprocessing | Zero external cost, runs locally, total data privacy for standard printed utility bills. | Tier 2 escalation |
| **OCR Tier 2 (Printed Bills)** | **Azure Document Intelligence** (free F0 tier) | High accuracy on complex printed utility layouts. *(VERIFY: free tier 500 pages/month limit)* | Google Document AI |
| **OCR Tier 3 (Handwriting / Odd)** | **Vision LLM with JSON schema** (e.g. Gemini Flash API) | Handles messy Bangla handwriting and challans. Requires explicit customer consent. *(VERIFY: vendor data training terms)* | Local model / Manual review |
| **PDF Report Generation** | **QuestPDF** (C# code-based layout, community license) | Extremely fast vector PDF generation without headless browser overhead. *(VERIFY: annual revenue license cap)* | Playwright HTML-to-PDF |
| **Excel Export** | **ClosedXML** (MIT license) | Programmatic XLSX workbook creation for buyer data sheets. | CsvHelper |
| **Transactional Email** | **Brevo or Resend** (free tiers) | Automated weekly flag digests and missing document reminders. *(VERIFY: daily sending quota)* | SMTP server |
| **Web Push Notifications** | **Web Push (VAPID protocol, free)** | Direct native push alerts to floor staff mobile browsers. | Paid SMS gateway (future) |
| **Observability** | **Serilog, OpenTelemetry, Grafana Cloud, Sentry** | Centralized structured logs with tenant enrichment, tracing, and client/server exception monitoring. | Local file logs |
| **CI/CD Pipeline** | **GitHub Actions + GHCR** | Automated builds, architecture rule checks, unit/integration test suites. | Manual docker build |
| **Hosting (Dev / Demo)** | **Azure for Students credits** (App Service, Southeast Asia region) | Fast native .NET deployment with zero card charge. | Render / Fly.io |
| **Hosting (Pilot / Prod)** | **Single VPS (Singapore)** running Docker Compose behind Caddy (automatic TLS) | Predictable, low fixed monthly cost; ultra-low latency to Dhaka. | Azure App Service B1 |

---

## 3. Modular Monolith Architecture

CarbonBill is structured as a **Modular Monolith**:
- **Single Deployable Unit:** All modules run within the same host application process (`CarbonBill.Api`), sharing one database connection and process memory.
- **Strict Module Boundaries:**
  - Each module resides in `src/Modules/CarbonBill.Modules.<ModuleName>/`.
  - Modules maintain independent database schema isolation (e.g. `identity.`, `onboarding.`, `documents.`, `emissions.`).
  - **Zero Cross-Module References:** Modules reference only `CarbonBill.SharedKernel` and `CarbonBill.Contracts`. A module **must never** reference another module's project or internal classes. NetArchTest enforces this rule during CI.
  - **Inter-Module Communication:** Handled strictly through `CarbonBill.Contracts` (read-model interfaces, command interfaces, and in-process asynchronous domain events using an Outbox pattern).

---

## 4. Container & Process View

```text
+---------------------------------------------------------------------------------+
|                                 Client Layer                                    |
|  [Floor PWA (Bangla)]       [Accountant Web]       [Compliance/Owner Web]        |
|  (IndexedDB queue)          (Review workspace)     (Dashboard & Reports)         |
+---------------------------------------------------------------------------------+
                                        | HTTPS
                                        v
+---------------------------------------------------------------------------------+
|                       Edge & Reverse Proxy (Caddy / Cloudflare)                 |
+---------------------------------------------------------------------------------+
                                        | Reverse Proxy
                                        v
+---------------------------------------------------------------------------------+
|                        ASP.NET Core Host (CarbonBill.Api)                       |
|  +---------------------------------------------------------------------------+  |
|  | Modules: Identity, Onboarding, Documents, Extraction, Review, Activity,   |  |
|  |          Calculation, Gaps, Flags, Recommendations, Reporting, Admin       |  |
|  +---------------------------------------------------------------------------+  |
|  | Inter-Module Contracts | Outbox Event Dispatcher | In-Memory Cache         |  |
|  +---------------------------------------------------------------------------+  |
|                                       | Enqueue background jobs                 |
|                                       v                                         |
|  +---------------------------------------------------------------------------+  |
|  | Hangfire Worker Subsystem (Same Container or Dedicated Worker Host)       |  |
|  |  - OCR Pipeline (Tesseract / Azure DI / Vision LLM)                       |  |
|  |  - Missing Data Calendar Check (Nightly cron)                             |  |
|  |  - Carbon Flags & Recommendations Evaluator                               |  |
|  |  - QuestPDF & ClosedXML Report Exporters                                  |  |
|  +---------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------+
                         /                               \
                        v                                 v
+----------------------------------+            +---------------------------------+
|   PostgreSQL Database Instance   |            |   Cloudflare R2 Object Store    |
|   - Separate schema per module   |            |   - Original document images    |
|   - Row-Level Security (RLS)     |            |   - Generated PDF & XLSX files  |
|   - Hangfire job state tables    |            |   - Pre-signed expiring URLs    |
+----------------------------------+            +---------------------------------+
```

---

## 5. Deployment Environments

### Demo / Hackathon Setup
- **Frontend:** Hosted on Cloudflare Pages (built via Vite).
- **Backend API & Hangfire:** Deployed to Azure App Service (Southeast Asia / Singapore region) leveraging student credits.
- **Database:** Serverless PostgreSQL on Neon or Supabase (Singapore region).
- **Storage:** Cloudflare R2 bucket with S3 API compatibility.

### Pilot / Production Setup
- **Host Infrastructure:** One small VPS (2 to 4 vCPUs, 4 to 8 GB RAM) located in Singapore to guarantee <60ms round-trip latency to Dhaka.
- **Reverse Proxy:** Caddy running in a Docker container handling automated TLS certificate issuance and routing.
- **Application Services (Docker Compose):**
  - `api`: ASP.NET Core web host serving REST endpoints and SignalR connections.
  - `worker`: Same container image launched with worker entrypoint, pre-installed with Tesseract binaries and Bangla/English language packs (`tessdata`).
  - `postgres`: PostgreSQL 16 container with local persistent volume storage.
  - *(Optional)* `redis`: Added if job queue volume or distributed caching necessitates it.
- **Backups:** Nightly encrypted PostgreSQL dumps uploaded to a secondary, geographically isolated Cloudflare R2 bucket.

---

## 6. Scale Path

1. **Phase 1 (Monolith with Embedded Workers):** All modules and Hangfire background workers run in a single container.
2. **Phase 2 (Worker Separation):** Split Hangfire background jobs into a dedicated `worker` container image on the same VPS, isolating CPU-intensive OCR tasks from low-latency HTTP request handling.
3. **Phase 3 (External Services):** Move PostgreSQL from local Docker volume to a managed database cluster; introduce Redis for distributed caching and cross-instance SignalR backplanes.
4. **Phase 4 (Selective Extraction Extraction):** If document volume grows significantly, extract only the `Extraction` module into an independent worker service without altering other modules due to the frozen `Contracts` interface design.
