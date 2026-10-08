# 12. Non-Functional Requirements, Testing & Observability

## 1. Non-Functional Requirements (NFR) Targets

| Area | Performance & Reliability Target | Measurement Method |
|---|---|---|
| **Mobile Capture Receipt** | $< 3$ seconds on 3G network from capture to "received" screen once online | Client-side navigation timing |
| **Floor Route Payload** | $< 200$ KB initial compressed JavaScript bundle | Automated CI bundle-size check script |
| **OCR Processing Speed** | $< 60$ seconds typical turnaround time per document | Hangfire job duration metrics |
| **Dashboard Page Load** | $< 2$ seconds for loading 12 consecutive months of aggregated activity | Server response time (p95) |
| **Availability (Pilot)** | $99.0\%$ uptime; graceful degradation to manual fallback if OCR is offline | Synthetic uptime checks |
| **Internationalization** | $100\%$ user-visible copy localized in Bangla and English | Zero hardcoded string CI lint rule |
| **Audit Traceability** | $100\%$ of calculated emission figures traceable to source document & factor | Automated audit integrity test suite |
| **Disaster Recovery** | RPO: 24 hours, RTO: 4 hours for pilot infrastructure | Restore drill verification log |

---

## 2. Comprehensive Testing Strategy

### 2.1 Golden OCR Test Set (150 Physical Bills)
- **Dataset Composition:** 150 real or realistically synthesized physical bills and challans reflecting operational conditions in Bangladesh:
  - 50 printed electricity bills (DPDC, DESCO, BPDB, REB).
  - 40 handwritten diesel fuel receipts (wet, crumpled, carbon-copy paper).
  - 30 gas utility invoices (Titas Gas).
  - 30 freight shipping delivery challans and gate passes.
- **Harness Execution (`tests/OcrGolden`):**
  - Runs the full OCR pipeline (Tesseract -> Azure DI -> Vision LLM) against ground-truth JSON files.
  - Outputs per-field accuracy percentages and the proportion of documents requiring human correction.
  - **Headline Product Metric:** Serves as the primary quality benchmark across releases.

### 2.2 Integration Testing with Testcontainers
- Integration tests execute against real PostgreSQL 16 instances spun up on-demand via Testcontainers.
- Verifies:
  - Multi-schema database migrations.
  - EF Core Global Query Filters.
  - PostgreSQL Row-Level Security (RLS) enforcement.
  - Atomic transaction rollback on confirmation failures.

### 2.3 Mandatory Tenant-Isolation Adversarial Tests
Every tenant entity must have an accompanying automated adversarial test:
- User authenticated under Tenant A attempts direct SQL and API queries against Tenant B's UUID.
- Test asserts that 0 rows are returned and HTTP 404/403 is received.

### 2.4 End-to-End Testing with Playwright
- Automated browser workflows executing the critical path:
  1. Floor staff QR join and login.
  2. Offline bill capture and background sync.
  3. Accountant side-by-side review and field correction.
  4. Calculation and Carbon Flag generation.
  5. Owner report approval and auditor share link generation.

### 2.5 Pilot Usability Testing
- Conducted with 5 representative users per persona.
- **Key Task Benchmark:** Floor staff persona (Jahid) must successfully capture and submit a fuel slip unaided in $< 20$ seconds.

---

## 3. Observability Architecture

- **Structured Logging (Serilog):**
  - Logs emitted in JSON format enriched with `TraceId`, `OrgId`, `UserId`, `DocumentId`, and `ExecutionTier`.
- **Distributed Tracing (OpenTelemetry):**
  - Traces span from HTTP request ingestion -> Hangfire queue scheduling -> OCR pipeline execution -> database commit.
  - Exported to Grafana Cloud free tier via OpenTelemetry Collector.
- **Error Tracking (Sentry):**
  - Sentry SDK integrated on both React PWA client and ASP.NET Core API server for real-time exception alerting.
- **Business Performance Metrics:**
  - Weekly document ingestion count per factory.
  - Average human review duration per document.
  - OCR tier distribution ratio (Tier 1 vs. Tier 2 vs. Tier 3).
  - Correction rate (% of fields edited during human review).
  - Carbon Flags raised, snoozed, and resolved.

---

## 4. Free-Tier Operational Budget & Quota Tracking

| Infrastructure Component | Free / Budget Tier | Quota & Operational Limits | Verification Status |
|---|---|---|---|
| **Frontend CDN** | Cloudflare Pages | Unlimited bandwidth, global edge CDN | Verified Free |
| **Backend & Worker** | Azure for Students Credits | Up to \$100 credit pool (App Service B1) | Active for Demo |
| **Pilot Production Host** | Single VPS (Singapore) | ~\$6–\$12/month (2 vCPU, 4GB RAM) | Budgeted |
| **Database** | Neon / Supabase (Free) | 0.5 GB storage, Singapore region | Verified Free |
| **Object File Storage** | Cloudflare R2 | 10 GB/month storage, 1M Class A ops | *(VERIFY quota)* |
| **OCR Tier 2** | Azure Document Intelligence | 500 pages/month (F0 Free Tier) | *(VERIFY limit)* |
| **Transactional Email** | Brevo / Resend | 300 emails/day | *(VERIFY quota)* |
| **Monitoring** | Grafana Cloud / Sentry | 50 GB logs, 10k errors/month | Verified Free |

---

## 5. Architectural Risk Management Matrix

| Risk Factor | Potential Impact | Mitigation Strategy |
|---|---|---|
| **Bangla Handwritten Slip OCR Failure** | Core trust gate fails; user review queue becomes backlogged. | Multi-tier fallback; Tier 3 Vision LLM (with consent); manual fallback entry mode on phone. |
| **Cloud Free-Tier Policy Changes** | Sudden service interruption or unexpected infrastructure costs. | Every paid external dependency sits behind a clean C# interface (`IOcrProvider`, `IFileStore`, `INotifier`); VPS self-hosting fallbacks defined. |
| **Outdated National Emission Factors** | Export buyers reject carbon reports due to methodology discrepancies. | Versioned `FactorSet` architecture; transparent citations on all PDF exports; formal recalculation proposal flow. |
| **Alert Fatigue from Carbon Flags** | Factory staff ignore system notifications and miss critical audit deadlines. | Top 5 dashboard card restriction; weekly consolidated email digest; 30-day snooze controls. |
| **Low Floor Staff Digital Adoption** | Missing data slips prevent monthly carbon report closure. | 2-tap Bangla interface with large icons; immediate visual receipt confirmation; supervisor nudge notifications. |
