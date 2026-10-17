# CarbonBill: System Architecture & Design Diagrams

> **Platform Edition:** .NET 8 LTS (ASP.NET Core Minimal APIs) + SQLite WAL + Hangfire + React Vite PWA  
> **Target Sector:** Bangladesh RMG / Textile / Manufacturing SME Carbon Accounting & Buyer Verification

---

## 1. High-Level System Context (C4 Level 1)

This diagram illustrates how all user personas, client interfaces, core backend services, and external integrations communicate across trust boundaries.

```mermaid
flowchart TD
    subgraph Users["Platform Personas & Actors"]
        Floor["👷 Jahid Hasan<br/>(Floor Staff / Offline PWA)"]
        Acct["🧑‍💼 Rahim Mia<br/>(Accountant / Review Workspace)"]
        Owner["🏭 Kabir Ahmed & Nusrat Jahan<br/>(Owner / Compliance Officer)"]
        Consultant["🌱 Farhana Rahman<br/>(Multi-Tenant ESG Consultant)"]
        Auditor["🌍 International Brand Auditor<br/>(Buyer / H&M / Inditex)"]
    end

    subgraph Frontends["Presentation Layer"]
        PWA["📱 Mobile PWA (Bangla-first)<br/>- IndexedDB offline queue<br/>- Quick camera scan<br/>- <30KB lightweight bundle"]
        WebPortal["💻 CarbonBill Web Portal<br/>- Side-by-side bill reviewer<br/>- Executive analytics<br/>- Team role management"]
        SharePortal["🔗 Auditor Share Portal<br/>- Cryptographic expiring token<br/>- Price-redacted GHG views<br/>- Proof-of-bill inspector"]
    end

    subgraph CorePlatform["CarbonBill Platform (.NET 8 Core Engine)"]
        Gateway["Reverse Proxy & Rate Limiter<br/>(Caddy / ASP.NET RateLimiter)"]
        API["ASP.NET Core Modular Monolith API<br/>(/api/v1 - JWT Auth, Serilog, Outbox)"]
        Jobs["Hangfire Background Job Engine<br/>(OCR queue, Nightly checks, Vacuum backups)"]
        DB[(SQLite WAL Database<br/>carbonbill.db & hangfire.db)]
    end

    subgraph ExternalServices["External Cloud & AI Services"]
        TesseractLocal["⚙️ Local Tesseract OCR<br/>(ben + eng traineddata)"]
        AzureDI["☁️ Azure Document Intelligence<br/>(Structured utility bills)"]
        VisionLLM["🧠 Groq / Vision LLM<br/>(qwen/qwen3.8-27b & gpt-oss-120b)"]
        LangSmith["📊 LangSmith Observability<br/>(Run tracing & LLM telemetry)"]
        R2Store["🗄️ Cloudflare R2 / Local Storage<br/>(S3-compatible immutable document store)"]
        Notifier["📬 Brevo / Resend / WebPush<br/>(VAPID push alerts & weekly digests)"]
    end

    Floor -->|Captures bills offline/online| PWA
    Acct -->|Reviews extractions| WebPortal
    Owner -->|Views emissions & recommendations| WebPortal
    Consultant -->|Manages multiple tenant orgs| WebPortal
    Auditor -->|Verifies audit trail & factors| SharePortal

    PWA -->|HTTPS / REST / JWT| Gateway
    WebPortal -->|HTTPS / REST / JWT| Gateway
    SharePortal -->|HTTPS / Public Token| Gateway

    Gateway --> API
    API --> Jobs
    API --> DB
    Jobs --> DB

    Jobs -->|Tier 1 OCR| TesseractLocal
    Jobs -->|Tier 2 OCR| AzureDI
    Jobs -->|Tier 3 Fallback & Extraction| VisionLLM
    VisionLLM -.->|Emits Traces| LangSmith

    API -->|Store & Fetch original bills| R2Store
    Jobs -->|Vacuum backups & snapshots| R2Store
    Jobs -->|Push reminders & digests| Notifier
```

---

## 2. Modular Monolith Component Architecture (C4 Level 2)

CarbonBill is engineered as a **Modular Monolith** with zero circular dependencies, strict NetArchTest boundaries, and isolated EF Core DbContexts sharing a single SQLite connection pool.

```mermaid
flowchart TD
    subgraph Host["Host Application: CarbonBill.Api"]
        Program["Program.cs<br/>(Middleware, Serilog, RateLimiting, CORS)"]
        Seeder["DataSeeder.cs<br/>(Auto-migration, Default data, Factor sets)"]
        HangfireServer["Hangfire Server<br/>(SQLite storage provider)"]
    end

    subgraph CoreFoundation["Shared Kernel & Cross-Cutting Foundation"]
        SharedKernel["CarbonBill.SharedKernel<br/>- AggregateRoot, BaseEntity<br/>- ITenantScopedEntity<br/>- PaisaMoneyConverter & ScaledQuantityConverter<br/>- Result&lt;T&gt;, ValueObject<br/>- Provider Interfaces (IOcr, IFileStore, INotifier)"]
        AuditMod["CarbonBill.Modules.Audit<br/>- Append-only AuditLog<br/>- Tamper-evident logging"]
        AdminMod["CarbonBill.Modules.PlatformAdmin<br/>- Published dataset versions<br/>- Global emission factors"]
    end

    subgraph IngestionModules["Ingestion & Document Processing"]
        IdMod["CarbonBill.Modules.IdentityTenancy<br/>- Organizations, Users, Memberships<br/>- QR+PIN Invites, JWT & Refresh tokens"]
        OnboardMod["CarbonBill.Modules.Onboarding<br/>- Sites, Assets (Meters/Gensets)<br/>- ExpectedDocRules & FacilityProfiles"]
        DocsMod["CarbonBill.Modules.Documents<br/>- SHA-256 deduplication<br/>- Storage metadata & DocumentPages"]
        ExtractMod["CarbonBill.Modules.Extraction<br/>- 3-Tier OCR pipeline<br/>- Groq LLM JSON normalizer<br/>- ExtractedFields & Bounding boxes"]
        ReviewMod["CarbonBill.Modules.Review<br/>- Side-by-side review workspace<br/>- ReviewDecisions & Accountant sign-off"]
    end

    subgraph AccountingModules["Carbon Accounting & Factor Engine"]
        UnitsMod["CarbonBill.Modules.ActivityUnits<br/>- Canonical units (kWh, L, kg, m³)<br/>- Scaling & UnitConversions"]
        FactorMod["CarbonBill.Modules.FactorRegistry<br/>- FactorSets (National Grid, IPCC AR6)<br/>- Tenant FactorOverrides with justifications"]
        CalcMod["CarbonBill.Modules.Calculation<br/>- Scope 1, 2, 3 kg CO2e engine<br/>- Traceable EmissionResults<br/>- RecalculationProposals"]
    end

    subgraph IntelligenceModules["Intelligence, Quality & Compliance"]
        GapMod["CarbonBill.Modules.GapDetection<br/>- Missing doc rules evaluator<br/>- MissingAlerts & monthly calendars"]
        FlagMod["CarbonBill.Modules.Flags<br/>- Footprint spikes & duplicate flags<br/>- Data quality scoring"]
        InsightsMod["CarbonBill.Modules.Insights<br/>- Carbon intensity (kg CO2e per piece)<br/>- BenchmarkSets (P25/P50/P75 peers)"]
        RecMod["CarbonBill.Modules.Recommendations<br/>- Measure library (Energy efficiency)<br/>- BDT Capex, Savings & Payback model"]
        ReportMod["CarbonBill.Modules.Reporting<br/>- GHG-aligned buyer reports<br/>- Immutable ReportSnapshots<br/>- Cryptographic ShareLinks"]
        NotifMod["CarbonBill.Modules.Notifications<br/>- In-app alerts, WebPush, Email digests<br/>- NotificationPreferences & Snoozing"]
    end

    Host --> CoreFoundation
    Host --> IngestionModules
    Host --> AccountingModules
    Host --> IntelligenceModules

    IngestionModules --> SharedKernel
    AccountingModules --> SharedKernel
    IntelligenceModules --> SharedKernel

    ExtractMod -.->|Domain Event: DocumentExtracted| ReviewMod
    ReviewMod -.->|Domain Event: ReviewConfirmed| CalcMod
    CalcMod -.->|Domain Event: EmissionCalculated| FlagMod
    CalcMod -.->|Domain Event: EmissionCalculated| InsightsMod
    CalcMod -.->|Domain Event: EmissionCalculated| RecMod
```

---

## 3. End-to-End Bill Processing & Carbon Accounting Pipeline

The lifecycle of an energy bill: from mobile capture on the factory floor to international buyer verification.

```mermaid
sequenceDiagram
    autonumber
    actor Floor as 👷 Floor Staff (Jahid)
    actor Acct as 🧑‍💼 Accountant (Rahim)
    participant PWA as 📱 React PWA
    participant API as 🌐 CarbonBill.Api
    participant Store as 🗄️ FileStore (R2/Local)
    participant Queue as ⚡ Hangfire Job Queue
    participant OCR as 🧠 Extraction Engine (Groq / Vision)
    participant Calc as 🔢 Calculation Engine
    participant Flags as 🚩 Flag & Audit Engine
    actor Buyer as 🌍 Brand Auditor

    Floor->>PWA: Capture utility bill photo (Gas / DESCO / Diesel)
    Note over Floor,PWA: Stored in IndexedDB if offline; auto-syncs when online
    PWA->>API: POST /api/v1/documents (multipart/form-data)
    API->>API: Compute SHA-256 hash (deduplication check)
    API->>Store: Save original bill image
    API->>Queue: Enqueue ExtractionJob(documentId)
    API-->>PWA: 202 Accepted (DocumentId, Status: Uploaded)

    Queue->>OCR: Execute Multi-Tier OCR & LLM Parsing
    OCR->>OCR: Extract vendor, billing period, units, amount, meter no
    OCR-->>API: Store ExtractedFields & Confidence Scores
    API->>API: Update Status: PendingReview

    Acct->>PWA: Open Review Workspace (/review)
    PWA->>API: GET /api/v1/review/{documentId}
    API-->>PWA: Return original bill image URL + ExtractedFields side-by-side
    Acct->>PWA: Verify fields, correct meter reading, click "Confirm"
    PWA->>API: POST /api/v1/review/{documentId}/confirm
    API->>API: Store ReviewDecision & Append-Only AuditLog

    API->>Calc: Trigger ActivityRecord & Emission Calculation
    Calc->>Calc: Convert raw unit to Canonical Unit (kWh, L, kg)
    Calc->>Calc: Lookup Active Emission Factor (Grid 2024 / DEFRA)
    Calc->>Calc: Calculate kg CO2e = Quantity * FactorValue
    Calc-->>API: Save EmissionResult (Linked to Document & Reviewer)

    API->>Flags: Run Quality & Anomaly Checks
    Flags->>Flags: Check spikes vs rolling 3-month baseline & missing gaps
    Flags-->>API: Persist Flags & Recalculate Data Quality Score

    Acct->>API: POST /api/v1/reports/generate (Scope 1 & 2 Snapshot)
    API->>API: Create Immutable ReportSnapshot + Cryptographic ShareToken
    API-->>Acct: ShareLink generated

    Buyer->>API: GET /share/{token}
    API-->>Buyer: Interactive Buyer Audit Portal (Full provenance down to source bill)
```

---

## 4. Multi-Tier OCR Fallback & Extraction Strategy

CarbonBill balances cost, speed, local privacy, and handwriting capability through a 3-tier escalation strategy.

```mermaid
flowchart TD
    Start(["Document Uploaded"]) --> SHA{"SHA-256 Check<br/>Already Exists?"}
    SHA -- Yes --> RejectDuplicate["Reject as Duplicate<br/>(Point to existing record)"]
    SHA -- No --> Preprocess["Image Preprocessing<br/>(Deskew, Grayscale, Contrast normalization)"]

    Preprocess --> Tier1["Tier 1: Local Tesseract OCR<br/>(Bengali + English Trained Data)<br/>Cost: $0.00 | Local Privacy: 100%"]
    Tier1 --> QualityCheck{"Confidence >= 80%<br/>& Essential Fields Found?"}

    QualityCheck -- Yes --> Normalize["Extract & Format Fields<br/>(Dates, Quantities, Units, Currency)"]
    QualityCheck -- No --> CheckTier2{"Azure DI Configured<br/>& Printed Bill Layout?"}

    CheckTier2 -- Yes --> Tier2["Tier 2: Azure Document Intelligence<br/>(Prebuilt Invoice / Utility Model)<br/>Cost: Free Tier (500 pgs/mo)"]
    CheckTier2 -- No --> CheckConsent

    Tier2 --> Tier2Check{"Confidence >= 75%?"}
    Tier2Check -- Yes --> Normalize
    Tier2Check -- No --> CheckConsent{"Tenant Consented to<br/>Tier 3 AI Analysis?"}

    CheckConsent -- No --> ManualReview["Route to Manual Review<br/>(Accountant enters fields manually)"]
    CheckConsent -- Yes --> Tier3["Tier 3: Vision LLM via Groq<br/>(qwen/qwen3.8-27b or gpt-oss-120b)<br/>Handles handwritten challans & Bangla script"]

    Tier3 --> LangSmithEmit["Emit Telemetry Trace to LangSmith<br/>(Model, Token count, Latency)"]
    LangSmithEmit --> JsonValidate{"Strict JSON Schema<br/>Validated?"}
    JsonValidate -- Yes --> Normalize
    JsonValidate -- No --> ManualReview

    Normalize --> BBox["Generate Normalized ExtractedFields<br/>(with Confidence & Source Tier Tag)"]
    BBox --> ReviewQueue(["Ready for Accountant Side-by-Side Review"])
```

---

## 5. Document & Review State Machine

Tracks document states throughout ingestion, OCR, accountant verification, and recalculations.

```mermaid
stateDiagram-v2
    [*] --> Uploaded: Staff uploads photo / PDF
    Uploaded --> IngestionPending: SHA-256 deduplication passed
    Uploaded --> RejectedDuplicate: Hash match detected

    IngestionPending --> Extracting: Hangfire worker picks job
    Extracting --> Extracted: OCR pipeline succeeds (Tier 1/2/3)
    Extracting --> ExtractionFailed: Corrupt file / unreadable

    ExtractionFailed --> PendingReview: Fallback to manual entry
    Extracted --> PendingReview: ExtractedFields populated

    PendingReview --> Confirmed: Accountant signs off
    PendingReview --> Rejected: Accountant marks invalid / unreadable
    PendingReview --> NeedsClarification: Floor staff re-upload requested

    NeedsClarification --> Uploaded: New image provided

    Confirmed --> Calculated: EmissionResult generated
    Calculated --> Superseded: Bill edited or Recalculation approved
    Superseded --> PendingReview: Re-verification required

    Calculated --> [*]
    Rejected --> [*]
    RejectedDuplicate --> [*]
```

---

## 6. Multi-Tenant Security & Code-Level Isolation Architecture

SQLite lacks native PostgreSQL Row-Level Security (RLS). CarbonBill enforces multi-tenant defense-in-depth across the application and data layers.

```mermaid
flowchart TD
    subgraph RequestContext["Inbound HTTP Request"]
        Req["HTTP Request<br/>(Headers: Authorization Bearer JWT / X-Tenant-Id)"]
    end

    subgraph MiddlewarePipeline["ASP.NET Core Middleware Pipeline"]
        AuthMdl["Authentication Middleware<br/>(Validates JWT signature, expiration, issuer)"]
        TenantMdl["TenantResolutionMiddleware<br/>(Extracts org_id from JWT claims or membership)"]
        ScopedContext["ITenantContext (Scoped)<br/>- CurrentTenantId<br/>- CurrentUserId<br/>- CurrentRole"]
    end

    subgraph EFCoreLayer["Entity Framework Core Security Interceptors"]
        GlobalFilter["EF Core Global Query Filters<br/>modelBuilder.Entity&lt;T&gt;().HasQueryFilter(e =&gt; e.OrgId == _tenantContext.OrgId)"]
        SaveInterceptor["TenantSaveChangesInterceptor<br/>1. Verifies every written entity matches CurrentTenantId<br/>2. Prevents cross-tenant entity modifications<br/>3. Throws CrossTenantAccessException on violation"]
    end

    subgraph SqliteEngine["SQLite Storage & Concurrency Engine"]
        RetryMdl["SqliteLockRetryMiddleware<br/>(Polly exponential backoff on SQLITE_BUSY error code 5)"]
        Pragmas["Connection PRAGMAs:<br/>- PRAGMA journal_mode = WAL<br/>- PRAGMA foreign_keys = ON<br/>- PRAGMA busy_timeout = 5000<br/>- PRAGMA synchronous = NORMAL"]
        DbFile[(carbonbill.db)]
    end

    Req --> AuthMdl
    AuthMdl --> TenantMdl
    TenantMdl --> ScopedContext
    ScopedContext --> GlobalFilter
    ScopedContext --> SaveInterceptor

    GlobalFilter --> RetryMdl
    SaveInterceptor --> RetryMdl
    RetryMdl --> Pragmas
    Pragmas --> DbFile
```

---

## 7. Asynchronous Hangfire Job Orchestration

Diagram of scheduled cron routines and transactional background tasks.

```mermaid
flowchart LR
    subgraph Triggers["Job Triggers"]
        Cron2AM["⏰ Nightly 02:00 UTC<br/>(Off-peak backup)"]
        CronNightly["⏰ Nightly 00:00 UTC<br/>(Missing doc check)"]
        Cron3AM["⏰ Nightly 03:00 UTC<br/>(Flag evaluation)"]
        CronMonday["⏰ Monday 08:00 UTC<br/>(Weekly digest)"]
        EventTrigger["⚡ API Event Trigger<br/>(On Document Upload)"]
    end

    subgraph HangfireServer["Hangfire Worker Server"]
        BackupJob["DatabaseBackupJob<br/>- SQLite VACUUM INTO snapshot<br/>- Gzip compression & AES encryption<br/>- Cloudflare R2 upload"]
        GapJob["NightlyGapDetectionJob<br/>- Compares active rules vs uploaded bills<br/>- Emits MissingAlerts for missing months"]
        FlagJob["NightlyFlagEvaluationJob<br/>- Scans footprint spikes (&gt;25% variance)<br/>- Detects missing meter sequences<br/>- Expires snooze windows"]
        DigestJob["WeeklyDigestJob<br/>- Aggregates unresolved flags & missing bills<br/>- Dispatches email summary via Brevo/Resend"]
        OcrJob["ExtractionBackgroundJob<br/>- Executes Tier 1/2/3 OCR pipeline<br/>- Updates document extraction state"]
    end

    subgraph StorageOutputs["State & Storage Outputs"]
        R2Backup["Cloudflare R2 Encrypted Backup"]
        DbAlerts["MissingAlerts & Flags Tables"]
        EmailService["Transactional Email Service"]
        ReviewDb["ExtractedFields in SQLite"]
    end

    Cron2AM --> BackupJob --> R2Backup
    CronNightly --> GapJob --> DbAlerts
    Cron3AM --> FlagJob --> DbAlerts
    CronMonday --> DigestJob --> EmailService
    EventTrigger --> OcrJob --> ReviewDb
```

---

## 8. Production Infrastructure & Deployment Topology

Low-latency deployment configuration optimized for Bangladesh (<60ms roundtrip to Dhaka).

```mermaid
flowchart TB
    subgraph ClientNetwork["Client Edge Devices"]
        MobileClient["📱 Floor Mobile Devices<br/>(2G/3G/4G Mobile Data in Gazipur/Narayanganj)"]
        DesktopClient["💻 Factory Head Office / Buyer Portals<br/>(Chrome / Edge / Firefox)"]
    end

    subgraph EdgeCDN["Cloudflare Global Network"]
        CFPages["Cloudflare Pages CDN<br/>- Pre-compressed Brotli static assets<br/>- Floor Staff bundle: 66 KB<br/>- Service Worker offline cache"]
        CFProxy["Cloudflare Edge Proxy<br/>- DDoS protection<br/>- Automatic SSL/TLS termination"]
    end

    subgraph ProductionVPS["Single VPS Host (Singapore Data Center)"]
        Caddy["Caddy Reverse Proxy<br/>- Automatic Let's Encrypt TLS<br/>- HTTP/2 & WebSocket support<br/>- Rate limiting & Gzip"]

        subgraph DockerCompose["Docker Compose Engine"]
            WebAPI["Container 1: CarbonBill.Api<br/>- .NET 8 LTS Runtime<br/>- Minimal API endpoints<br/>- SignalR Hubs"]
            Worker["Container 2: CarbonBill.Worker (Hangfire)<br/>- Native Tesseract OCR binaries<br/>- Bangla tessdata packs<br/>- QuestPDF vector engine"]
            SqliteVol[("Persistent Volume Storage<br/>- /app/data/carbonbill.db<br/>- /app/data/hangfire.db<br/>- Local staging folder")]
        end
    end

    subgraph ObjectStorage["Cloudflare R2 Object Store"]
        R2Docs["Document Store Bucket<br/>- Original bill photos & PDFs<br/>- Pre-signed expiring URLs (15m)"]
        R2Backups["Encrypted Database Backups<br/>- Nightly VACUUM INTO snapshots"]
    end

    MobileClient -->|Brotli cached SPA| CFPages
    DesktopClient -->|Brotli cached SPA| CFPages
    MobileClient -->|API calls & image uploads| CFProxy
    DesktopClient -->|API calls & report downloads| CFProxy

    CFProxy -->|HTTPS :443| Caddy
    Caddy -->|Reverse Proxy :5120| WebAPI
    WebAPI <-->|Hangfire Job State| SqliteVol
    Worker <-->|Process OCR & Backups| SqliteVol
    WebAPI -->|Read / Write original bills| R2Docs
    Worker -->|Upload encrypted snapshot| R2Backups
```
