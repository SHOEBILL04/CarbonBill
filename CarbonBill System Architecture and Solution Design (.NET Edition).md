# CarbonBill: System Architecture and Solution Design (.NET Edition)

*Version 1.0. Builds on the HMW report, the Personas and System Design Pack, and the Concept Document. Numbers marked "verify" must be checked against the live source before you commit to them.*

## 1. Executive summary

CarbonBill turns the paper a small exporter already has (electricity bills, fuel slips, challans, shipping invoices) into a defensible, buyer-ready carbon report, and then tells the owner what to do about it in plain language and in taka.

This document changes three things from the earlier pack:

1. **Stack:** backend moves from Laravel to **ASP.NET Core** as a modular monolith.
2. **New capability, Carbon Flags:** a rule-based flag engine that watches data quality, footprint behaviour and buyer-readiness.
3. **New capability, Evidence-based Recommendations:** a reduction engine built on a curated research dataset (ranges, evidence grades, payback in BDT) instead of generic advice.

It also makes several user-focused redesigns (section 3), because the research says the product wins or loses on four things: never losing a slip, trusting the OCR, not needing a consultant, and producing the buyer's format.

## 2. Design principles

| Principle | What it means in the build |
| --- | --- |
| One job per persona | Jahid (floor) only captures. Rahim (accounts) only reviews. Nusrat/Kabir only decide. Each gets a different home screen. |
| Trust before automation | Original bill always beside extracted values. Nothing counts until a human confirms (or a sampling-audited auto-confirm rule says so). |
| Honest numbers | Estimates are labelled "estimated". Ranges, not fake precision. No benchmark shown when there is too little data. |
| Works on a weak phone and weak network | Offline queue, image compression, under 200 KB first load for the floor-staff route, Bangla first. |
| Free and fast first | Free tiers and open-source tools, hosted in the Singapore region (closest to Dhaka). Every paid dependency sits behind an interface so it can be swapped. |
| Everything traceable | Every figure links to its document, factor version and the person who confirmed it. |

## 3. What I changed to make it more user-focused

| # | Change | Why (evidence) |
| --- | --- | --- |
| 1 | **Expected-document calendar.** At onboarding the system generates what should arrive each month (one electricity bill per meter, diesel slips per generator, gas bill, shipping invoices). Missing-data detection becomes a checklist, not a guess. | Lost documents = 32% of pain; "flag missing data" = 8 votes. Deterministic rules beat anomaly guessing. |
| 2 | **Floor-staff app is a separate 2-tap flow** with big icons (diesel, gas, electricity, shipment), Bangla only, receipt confirmation, "My submissions" list. | Jahid persona; 10 of 17 would use a phone. |
| 3 | **Manual fallback entry** (litres + slip number now, photo later) when the camera or light is bad. | Wet or damaged slips, patchy signal. |
| 4 | **Batch capture mode** (scan 20 challans in a row) and a keyboard-friendly review queue sorted by lowest confidence first. | Rahim: "hundreds of challans every day". |
| 5 | **Estimated vs Verified labelling.** A missing month can be estimated from history but is excluded from the "verified" figure and shown with a hatch in charts. | Anna (auditor) distrusts unsourced numbers. |
| 6 | **Data Quality Score per report** (percent of kg CO2e backed by confirmed documents). | Makes the audit risk visible before the buyer sees it. |
| 7 | **Auditor share link**: expiring, read-only, trace-to-source, optional redaction of prices. | Anna: "show me where this came from". |
| 8 | **Consultant workspace**: one login, many client organisations, factor override with mandatory justification. | Farhana serves 8 SMEs. |
| 9 | **Taka-first insights.** Recommendations use the factory's own tariff (BDT/kWh, BDT/litre) extracted from its own bills. | Owners decide in money, not tonnes. |
| 10 | **Bangla digits and dates** (১২৩, Bangla month names) normalised in the OCR pipeline and shown in the UI. | Most local bills mix Bangla and English. |
| 11 | **Privacy card at upload** (where data lives, who can see it, no AI training on your documents, delete on request). | 6 of 17 fear leaks; one factory stopped cloud use. |
| 12 | **Flag fatigue control**: top 5 flags on the dashboard, weekly digest, snooze with reason. | Prevents the product becoming noise. |

## 4. System context

```
 Floor staff (PWA, Bangla)   Accountant (web)   Compliance/Owner (web+mobile)
        \                         |                      /
         \                        |                     /
          +--------------  CarbonBill  ---------------+---- Consultant (multi-org)
                              |    \
                              |     +---- Auditor / Buyer (read-only share link)
        +---------------------+-----------------------+
        |                     |                       |
   OCR / AI extraction   Object storage         Email / Web Push
   (Tesseract, Azure DI,  (Cloudflare R2)       (Brevo/Resend)
    Gemini fallback)
```

External data feeding the platform (curated, versioned, loaded by Platform Admin): emission factors, grid factors, unit tables, the measure library, benchmark sets.

## 5. Technology stack (free and fast)

| Layer | Choice | Why it fits | Fallback |
| --- | --- | --- | --- |
| Backend | **ASP.NET Core (current LTS), C#**, minimal APIs + MediatR-style handlers | Fast, strongly typed, great for calculation logic | none needed |
| Architecture style | **Modular monolith**, one deployable, clear module boundaries | A student team cannot operate microservices; modules can be split later | Extract OCR worker first |
| ORM / DB access | EF Core + Npgsql, Dapper for heavy reports | Productive, fast enough |  |
| Database | **PostgreSQL** (Neon or Supabase free tier, Singapore region; Docker Postgres in dev) | Relational integrity for audit; row-level security | Postgres on the VPS |
| Background jobs | **Hangfire with PostgreSQL storage** | Free, dashboard included, no Redis needed for MVP | Redis + Hangfire later |
| Cache | In-memory (IMemoryCache); Redis only when you scale to 2+ instances | One fewer moving part |  |
| File storage | **Cloudflare R2** (S3-compatible, free tier, no egress fee; verify quota) | Cheap images, fast edge | MinIO on VPS |
| Frontend | **React + Vite PWA** (TypeScript), Workbox, IndexedDB, i18next (bn/en), Chart.js | Behind a login there is no SEO need, so a static PWA is smaller and faster than SSR. Next.js static export also works if you prefer it. |  |
| Frontend hosting | **Cloudflare Pages** (free, global CDN) | Fast on Bangladeshi networks | Azure Static Web Apps |
| Realtime | SignalR (polling fallback) for "OCR done" events | Built into ASP.NET Core |  |
| Auth | **ASP.NET Core Identity** + JWT (short-lived) + refresh cookie; TOTP optional for owners | No paid IdP needed | Keycloak later |
| OCR tier 1 | **Tesseract (ben+eng)** + image preprocessing | Free, local, private |  |
| OCR tier 2 | **Azure Document Intelligence** (free F0 tier; verify page limits) | Strong on printed bills | Google Document AI |
| OCR tier 3 | **Vision LLM with JSON schema** (e.g. Gemini Flash API) for handwriting and odd layouts | Best on Bangla handwriting and messy slips | Local model later |
| PDF reports | **QuestPDF** (verify licence terms for your revenue; free community licence) | Fast, code-defined layouts | Playwright HTML-to-PDF |
| Excel export | ClosedXML (MIT) | Higg-style and buyer data sheets |  |
| Email | Brevo or Resend free tier | Weekly digests, alerts | SMTP |
| Push | Web Push (VAPID, free) | Missing-document alerts to phones | SMS gateway later (paid) |
| Logging/monitoring | Serilog, OpenTelemetry to Grafana Cloud free, Sentry free | Error visibility at zero cost |  |
| CI/CD | GitHub Actions + GHCR | Free |  |
| Hosting (dev/demo) | **Azure for Students credits** (App Service, Southeast Asia) | No card, .NET native | Render/Fly free |
| Hosting (pilot/prod) | One small VPS (Singapore) running Docker Compose behind Caddy (auto TLS) | Predictable low cost, fast | Azure App Service B1 |

**Privacy warning on the free LLM tier:** free API tiers of some AI vendors may use submitted content to improve their products. For real customer bills, either use a paid or no-training tier, or restrict tier 3 to documents where the owner has consented. Tier 1 and 2 stay the default. Check the vendor's current terms before pilot.

## 6. Logical architecture (modules)

One solution, one process, strict module boundaries (each module owns its tables, exposes an interface, publishes domain events).

| Module | Responsibility | Key entities |
| --- | --- | --- |
| Identity & Tenancy | Orgs, users, roles, invitations, QR join for floor staff, consultant multi-org | Organization, User, Membership, Invitation |
| Onboarding | Sector template, sites, meters, generators, vehicles, expected-document rules | Site, Asset, ExpectedDocRule |
| Documents | Upload, compression check, hashing, duplicate detection, storage, lifecycle | Document, DocumentPage |
| Extraction | OCR pipeline orchestration, field mapping, confidence | ExtractionRun, ExtractedField |
| Review | Side-by-side review, corrections, bulk confirm, audit | ReviewDecision |
| Activity & Units | Normalised activity records, unit conversion | ActivityRecord, Unit, UnitConversion |
| Factor Registry | Versioned emission factors, grid factors, overrides | EmissionFactor, FactorSet, FactorOverride |
| Calculation | kg CO2e per activity, rollups by scope/category/period | EmissionResult |
| Gap Detection | Compare expected vs received documents | MissingAlert |
| Flags | Rule engine for data-quality, footprint, buyer-readiness flags | Flag, FlagRule |
| Insights & Benchmarks | Intensity metrics, trends, peer comparison | ProductionMetric, BenchmarkSet |
| Recommendations | Measure library, applicability, savings and payback model | Measure, MeasureSource, Recommendation |
| Reporting | Dashboards, GHG-aligned PDF, Excel export, auditor links | Report, ReportSnapshot, ShareLink |
| Notifications | In-app, push, email, digest | Notification, Subscription |
| Audit | Append-only log | AuditLog |
| Platform Admin | Load factor/measure/benchmark datasets, tenant support | DatasetVersion |

### 6.1 Container view

```
[React PWA]  --HTTPS-->  [Caddy/Cloudflare]  -->  [ASP.NET Core API (modules)]
  IndexedDB queue                                    |        |         |
  Service worker                                     |        |         +--> Hangfire workers (same app or 2nd container)
                                                     |        |                |-> OCR pipeline -> Tesseract / Azure DI / LLM
                                                     |        |                |-> Flag + Recommendation jobs
                                                     |        |                |-> PDF/Excel rendering
                                                     v        v
                                              [PostgreSQL]  [Cloudflare R2]
```

## 7. Core flows

### 7.1 Capture and extraction (the heart of the product)

1. **Phone:** photo taken; client-side crop, deskew hint, resize to about 1600 px, convert to WebP or JPEG under about 400 KB. Strip EXIF GPS.
2. **Offline:** item stored in IndexedDB with a client-generated GUID (idempotency key). Background Sync (Android) or app-open retry (iOS) uploads when online. Resumable upload for bad networks.
3. **API:** validates type by magic bytes, size limit, SHA-256 hash. Duplicate check by hash, then by (vendor, bill number, period) after extraction. Writes Document (Uploaded), returns receipt immediately so Jahid sees "received".
4. **Extraction pipeline** (Hangfire job):
   - Normalise: Bangla digits to Latin, date formats, units spelling ("লিটার", "ltr", "L").
   - Classify document type (electricity, diesel slip, gas, shipping invoice) by keywords and layout.
   - **Tier 1** Tesseract + vendor templates for known utilities. Accept if all required fields pass validation (numeric ranges, totals reconcile, date plausible).
   - **Tier 2** Azure Document Intelligence on low confidence.
   - **Tier 3** vision LLM with strict JSON schema for handwriting or unknown layouts (consent-gated).
   - Every field stores value, confidence, source tier and bounding box (so the review screen can highlight the region).
5. Status moves to NeedsReview (or Failed with a plain-language reason and "retake photo" push to the sender).

### 7.2 Review and confirm

- Left: original (zoom, rotate). Right: fields. Clicking a field highlights its region on the bill.
- Low-confidence fields are amber and focused first. Keyboard: Tab, Enter confirm, N next document.
- **Bulk confirm** is optional per organisation: after the first 20 manual confirmations, documents with all fields at or above a high threshold may be auto-confirmed, with 10% random sampling sent back for human review. Auto-confirmed items are labelled in the audit log.
- Confirm creates ActivityRecord (standard units), applies the factor, writes EmissionResult and AuditLog in one transaction.

### 7.3 Missing-data detection

Nightly job and on every upload: compare ExpectedDocRules (per site/asset/period) to received Documents. Output MissingAlerts with a due date, owner (who should supply it) and escalation (day -7 reminder, day -3 push to the responsible user, day 0 to compliance officer). Floor staff see only "please send diesel slip for Generator 2".

## 8. Calculation engine

**Units:** canonical units are kWh, litre, kg, m3, tonne-km. Conversions live in a versioned table (UnitConversion) so "gallon", "MWh", "MJ", "ton" never reach the user.

**Formula:** `kg CO2e = quantity_standard x emission_factor` where the factor already includes CO2, CH4 and N2O as CO2e (store GWP set, e.g. AR5 or AR6, as a field).

| Scope | Included in MVP | Method |
| --- | --- | --- |
| Scope 1 | Diesel/petrol in generators and vehicles, natural gas and LPG in boilers, fugitive refrigerants only if entered | Fuel quantity x fuel factor |
| Scope 2 | Grid electricity | **Location-based** with the national grid factor and its year; market-based out of scope |
| Scope 3 | Transport of goods (shipping invoices) | tonne-km x mode factor; other categories listed as "not yet covered" in the report |

**Rules that protect credibility**

- Use `decimal` (never float) for quantities and factors; round only at presentation.
- Results are immutable and versioned: each EmissionResult stores factor\_id, factor version and unit-conversion version. A new factor version never silently changes an approved report; it produces a recalculation proposal.
- Factor selection order: organisation override (with justification and approver) then national or grid-specific factor then regional (IPCC EFDB, DEFRA-type) factor. The report prints factor source and year beside each line.
- Every report prints its boundary, method and limitations: "estimate aligned with GHG Protocol methodology, not audited or certified".

**Factor sources to load and version:** IPCC Emission Factor Database, UK DEFRA/DESNZ conversion factors, GHG Protocol tools, and a Bangladesh grid factor from a published dataset (for example the IGES grid emission factor list or the UNFCCC harmonised grid factor dataset; verify the latest year and cite it).

## 9. Carbon Flags engine (new)

Flags answer the question "what needs my attention right now, and what do I do?". They are deterministic rules (explainable to a finance clerk and to an auditor), evaluated after each confirmation and nightly.

### 9.1 Flag families

| Family | Flag | Default trigger (configurable, tune in pilot) | Severity | Suggested action shown to user |
| --- | --- | --- | --- | --- |
| Data quality | Missing document | Expected doc not received by due date | Amber, Red after deadline | Send or upload document X |
| Data quality | Low OCR confidence | Any required field under threshold | Amber | Review now |
| Data quality | Duplicate suspected | Same hash or same vendor + bill number | Amber | Keep one |
| Data quality | Implausible value | Quantity outside 3 x IQR of the same asset's history, or unit mismatch | Amber | Check the figure on the bill |
| Data quality | Estimated data in period | Estimated share above 10% of period | Amber | Replace with real documents |
| Footprint | Month-on-month spike | Category total above 1.3 x trailing-3-month median (Amber), 1.6 x (Red) | Amber/Red | Open the contributing documents |
| Footprint | Hotspot | One source above 50% of total | Info | See reduction options |
| Footprint | Generator reliance | Diesel-generated electricity above 20% of total electricity use | Amber | See grid vs genset options |
| Footprint | Intensity above peers | kg CO2e per unit of output above peer P75 (Amber) or P90 (Red); shown only with at least N comparable peers | Amber/Red | See ranked actions |
| Footprint | Target drift | Year-to-date trajectory exceeds the organisation's own target | Amber | Review actions |
| Buyer-readiness | Report not ready | Missing scope or period, unconfirmed documents, Data Quality Score under threshold | Red | Checklist to fix |
| Buyer-readiness | Factor outdated | Factor set older than the reporting year | Amber | Approve recalculation |
| Buyer-readiness | Override unapproved | Factor override without justification or approver | Red | Add justification |
| Bill-based savings | Power factor or demand-charge penalty on bill | Penalty line detected in extracted fields | Info | See power-factor correction |

The thresholds above are **starting defaults, not research findings**. Keep them in a FlagRule table so Platform Admin can tune them from pilot data without a deployment.

### 9.2 Flag record and lifecycle

Flag = {id, org, site, rule, severity, period, evidence (document and record ids), plain-language explanation in Bangla and English, suggested action, state}. States: Open, Acknowledged, Resolved (auto when the condition clears), Dismissed (requires reason, expires in 30 days so it does not hide forever).

### 9.3 Intensity metrics and benchmarks

Onboarding asks one question per month: "how many units did you produce / ship?" (pieces, kg of fabric, tonnes). That becomes the denominator for kg CO2e per unit. Benchmark sets are built from published sector datasets (see section 10) and, as pilot users join, from anonymised, opt-in peer data in size bands. **When there is not enough peer data the UI says "no benchmark yet" instead of inventing one.**

## 10. Evidence-based Recommendations engine (new)

### 10.1 Goal

Show a small factory a short list of actions that are realistic for it, with honest ranges for saving, cost and payback in taka, ranked cheapest-and-fastest first, and linked to the research behind them.

### 10.2 The research dataset (Measure Library)

A curated, versioned dataset loaded from a CSV/JSON seed in the repository and reviewed by a domain expert (for example a sustainability consultant like the Farhana persona or a faculty energy specialist) before each release.

| Field | Meaning |
| --- | --- |
| measure\_id, name (bn/en), category | e.g. Lighting, Motors, Compressed air, Steam and boilers, Power factor, Renewable energy, Generators, Transport |
| applicable\_sectors | RMG, textile dyeing, food, light engineering, general |
| applicability\_rules | Machine-readable conditions, e.g. has\_boiler, has\_genset, grid\_kwh\_per\_month above X, roof\_area known |
| saving\_low / typical / high | Percent of the relevant activity (e.g. percent of lighting electricity), as a range |
| capex\_low / high, unit | BDT per kW, per unit or per kWp, plus fixed part |
| opex\_change | Maintenance change |
| lifetime\_years | For levelised cost per tonne |
| implementation\_time | Weeks |
| evidence\_grade | **A** measured results from Bangladeshi factories; **B** regional or international case studies; **C** engineering estimate |
| source\_id(s), year, page/table | Citation, always shown to the user |
| local\_notes | Constraints (rented building, roof strength, utility approval) |

**Candidate sources to extract numbers from (verify access, version and licence; cite each):** IFC Partnership for Cleaner Textile (PaCT) resource-efficiency case data for Bangladesh textile and garment factories, Cascale (Higg) Facility Environmental Module guidance, SREDA rooftop solar and net-metering guidelines, IDCOL and Bangladesh Bank green-finance schemes (for financing notes), Global Solar Atlas (free) for PV yield by location, and published DEFRA/IPCC factors for the carbon side. Do not hard-code figures from memory: every number in the library must carry a source row.

**Starter measure list (relevance to small factories):** power-factor correction; LED and daylight lighting; variable-frequency drives on motors and compressors; compressed-air leak repair and pressure reduction; steam-trap repair, pipe insulation and condensate recovery; boiler tuning or fuel switching; rooftop solar PV; generator right-sizing, maintenance and grid-first scheduling; servo motors on sewing machines (garments); heat recovery; shipment consolidation and mode choice; fleet maintenance and driving practice.

### 10.3 Recommendation pipeline

1. **Profile:** from confirmed data (monthly kWh by source, fuel litres, boiler fuel, tariff in BDT/kWh and BDT/litre derived from bills) plus a 2-minute facility questionnaire (boiler yes/no, genset yes/no, roof area, owned or rented building, budget band).
2. **Eligibility:** apply applicability\_rules; drop measures that cannot work (no roof area means no solar).
3. **Impact:** `tCO2e avoided = baseline_activity x saving% x emission_factor`, computed for low / typical / high.
4. **Money:** `BDT saved per year = avoided energy x the factory's own tariff`; `payback = capex / annual saving`; `cost per tCO2e = (annualised capex - annual saving) / tCO2e avoided` (negative means it pays for itself).
5. **Realism filters:** hide options outside the stated budget band or needing more than the stated lead time; show "needs an energy audit" above a spend threshold.
6. **Rank:** composite of payback, tCO2e avoided, evidence grade and effort. Show the top 5 as cards; the full list as the abatement-cost chart.
7. **Explain:** each card shows "Why this?" (your numbers), the range (not a single value), evidence grade, source, assumptions, and next step. Financing note links to current green-finance options (verify terms).
8. **Close the loop:** user marks Planned, Done or Not feasible (with reason). After a measure is marked done, the engine compares before and after bills and records the realised saving. This is how CarbonBill earns its own Bangladeshi evidence and upgrades measures from grade B or C toward A.

**Honesty rules:** always ranges; always source; never present an estimate as a guarantee; "get a site audit" is the default for large capex. Machine learning is deliberately not used in the MVP (no data, and rules are easier to defend); revisit once there are hundreds of before-and-after records.

## 11. Reporting

- **Dashboard (by role):** Owner sees total, trend, top 3 flags, top 3 actions in BDT. Accountant sees review queue and missing documents. Compliance sees report readiness and Data Quality Score. Consultant sees all client organisations with their flags.
- **Buyer report (PDF, QuestPDF):** cover, boundary and method statement, totals by scope/category/month, intensity metrics, factor table with source and year, data-quality statement, per-figure document references, limitations. Quarterly and half-year comparison pages are automatic. Bangla and English versions.
- **Templates:** a base GHG Protocol template plus a buyer-template mapping (field mapping file) so one dataset serves several buyer formats; Excel data sheet export for buyer portals.
- **ReportSnapshot:** approving a report freezes data, factors and a content hash; the Locked state prevents edits. A later change creates a new version.
- **Auditor link:** expiring read-only URL; click any figure to see the source document and the factor.
- **Day-1 spike:** confirm Bangla text renders correctly in QuestPDF with a Noto Sans Bengali font before committing to it.

## 12. Data model (additions and key tables)

Existing tables from the earlier ERD stay (Organization, User, Site, Document, ExtractedField, ActivityRecord, EmissionFactor, EmissionResult, MissingAlert, Report, AuditLog). Changes and additions:

| Table | Key columns | Notes |
| --- | --- | --- |
| Membership | user\_id, org\_id, role | Replaces single org\_id on User so consultants can span organisations |
| Invitation | org\_id, role, token, expires\_at, pin\_hash | QR join for floor staff |
| Asset | site\_id, type (meter, genset, boiler, vehicle), name | Anchors expected documents |
| ExpectedDocRule | asset\_id, doc\_type, frequency, due\_day, responsible\_user\_id | Drives gap detection |
| Document | + sha256, source (phone/web/manual), captured\_at, tier\_used, is\_estimated | Duplicate and provenance |
| ExtractedField | + bbox, source\_tier, corrected\_value | Highlight and learning |
| ReviewDecision | document\_id, reviewer, mode (manual/auto), at | Sampling audit |
| UnitConversion | from\_unit, to\_unit, factor, version | Versioned |
| FactorSet / EmissionFactor | set\_id, gwp\_basis, source, year, region, version, valid\_from/to | Immutable once published |
| FactorOverride | org\_id, factor\_id, value, justification, approved\_by | Required justification |
| EmissionResult | + factor\_version, conversion\_version, is\_estimated | Reproducible |
| ProductionMetric | org\_id, site\_id, period, unit, quantity | Intensity denominator |
| BenchmarkSet | sector, size\_band, metric, p25/p50/p75/p90, n, source, year | Shown only if n is sufficient |
| FlagRule / Flag | see section 9 | Rule parameters editable by admin |
| Measure / MeasureSource | see section 10.2 | Versioned dataset |
| Recommendation | org\_id, measure\_id, saving\_range, capex\_range, payback\_range, status, realised\_saving | Closed loop |
| ReportSnapshot / ShareLink | report\_id, hash, expires\_at, redact\_prices | Audit and sharing |
| Notification / PushSubscription | user\_id, channel, state |  |
| DatasetVersion | kind, version, loaded\_by, checksum | Traceability of data releases |

All tenant tables carry `org_id`. Enforce it twice: EF Core global query filters in code and PostgreSQL row-level security as a second defence. Money is `numeric(18,2)` in BDT; quantities `numeric(18,6)`.

## 13. API design (REST, versioned `/api/v1`, OpenAPI)

| Area | Representative endpoints |
| --- | --- |
| Auth | `POST /auth/login`, `/auth/refresh`, `/auth/join` (QR + PIN) |
| Documents | `POST /documents` (idempotency key header), `GET /documents?status=NeedsReview`, `GET /documents/{id}`, `POST /documents/manual-entry` |
| Review | `GET /review/queue`, `PUT /documents/{id}/fields`, `POST /documents/{id}/confirm`, `POST /documents/bulk-confirm` |
| Gaps | `GET /gaps?period=`, `POST /gaps/{id}/nudge` |
| Flags | `GET /flags?state=open`, `POST /flags/{id}/acknowledge`, `/dismiss` |
| Dashboard | `GET /dashboard/summary?period=`, `/dashboard/trend`, `/dashboard/intensity` |
| Recommendations | `GET /recommendations`, `PUT /recommendations/{id}/status`, `POST /profile/facility` |
| Factors | `GET /factors`, `POST /factor-overrides` |
| Reports | `POST /reports`, `POST /reports/{id}/approve`, `GET /reports/{id}/pdf`, `POST /reports/{id}/share` |
| Admin | `POST /admin/datasets` (factors, measures, benchmarks), `GET /admin/tenants` |

Conventions: problem+json errors with a user-safe message in the requested language, cursor pagination, ETags on documents, rate limiting per user and per IP using the built-in ASP.NET rate limiter.

## 14. State machines

**Document:** Uploaded, Queued, Extracting, NeedsReview, Confirmed, Calculated, InReport, Locked. Side states: Failed (unreadable, triggers retake request), ReuploadRequested, Duplicate.

**Report:** Draft, ReadyForReview, Approved, Locked, Superseded.

**Flag:** Open, Acknowledged, Resolved, Dismissed.

**Recommendation:** Suggested, Planned, Done (with realised saving), NotFeasible.

## 15. Roles and permissions

| Capability | Floor staff | Accountant | Compliance | Owner | Consultant | Auditor link | Platform admin |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Capture and see own submissions | Yes | Yes | Yes | Yes | Yes | No | No |
| Review and confirm | No | Yes | Yes | No | Yes | No | No |
| See dashboard and flags | No | Yes | Yes | Yes | Yes | Read only | No |
| Override factor | No | Request | Approve | Approve | Request with note | No | No |
| Approve report | No | No | Yes | Yes | No | No | No |
| Manage users | No | No | No | Yes | Within client | No | Support only |
| Load datasets | No | No | No | No | No | No | Yes |

## 16. Security and privacy

- **Transport and storage:** TLS everywhere; R2 encryption at rest; optional app-level envelope encryption for documents; short-lived pre-signed URLs only.
- **Upload hardening:** magic-byte type check, size limit, image re-encode, EXIF stripped, optional ClamAV scan.
- **Access:** role-based plus tenant isolation (section 12); least-privilege database user; secrets from environment or a secret manager, never in the repo.
- **Audit:** append-only AuditLog for confirm, correct, override, approve, share and export events; optional hash chaining for tamper evidence.
- **Privacy promises (shown in-product):** data location, who can see it, no use of customer documents to train AI, export and delete on request. Check the current Bangladeshi data-protection requirements and align with them.
- **AI use:** tier 3 extraction only with consent; send the minimum image; log which tier processed each field.
- **Backups:** nightly encrypted database dump to a separate R2 bucket, monthly restore drill.
- **Application security:** OWASP ASVS checklist, dependency scanning (Dependabot), rate limiting, lockout, secure cookie settings.

## 17. Non-functional requirements

| Area | Target |
| --- | --- |
| Capture | Photo to "received" confirmation in under 3 s on 3G once online; offline queue survives app restarts |
| Floor-staff route | Under 200 KB initial JS, works on low-end Android |
| OCR | Document processed in under 60 s typical; tier-1 field accuracy tracked against a golden set |
| Dashboard | Loads in under 2 s for 12 months of data |
| Availability | 99% pilot target; graceful degradation if OCR tier 2 or 3 is down (fall back to manual entry) |
| Localisation | Bangla and English everywhere, Bangla digits, BDT currency, local dates |
| Accessibility | Large touch targets, high contrast, icon-first floor UI |
| Auditability | 100% of figures traceable to document, factor version, and confirmer |
| Recovery | RPO 24 h, RTO 4 h for pilot |

## 18. Deployment

**Demo/hackathon:** Cloudflare Pages (frontend), Azure App Service on student credits (API + Hangfire), Neon or Supabase Postgres (Singapore), Cloudflare R2.

**Pilot:** one VPS in Singapore running Docker Compose behind Caddy: `api` (ASP.NET Core), `worker` (same image, jobs only, with Tesseract installed), `postgres` (volume), optional `redis`. Frontend remains on Cloudflare Pages. GitHub Actions builds the image, pushes to GHCR, and deploys over SSH. Environments: dev (local Docker), staging, production. Secrets via environment files outside the repo.

**Scale path:** split the worker onto its own host, add Redis, move to managed Postgres, then extract Extraction into a separate service only if it becomes the bottleneck.

## 19. Quality and testing strategy

- **Unit and property tests:** calculation engine (unit conversion round-trips, factor selection order), flag rules, recommendation maths.
- **Integration tests:** Testcontainers with PostgreSQL, tenant-isolation tests (user from org A can never read org B).
- **Golden OCR set:** at least 150 real or realistic bills (mixed Bangla/English, wet, crumpled, handwritten). Track per-field accuracy and the percent of documents needing correction, per tier. This number is your headline product metric.
- **End-to-end:** Playwright for upload to review to report.
- **Usability tests:** 5 users per persona in the pilot; floor-staff task "submit a slip" must be done unaided in under 20 s.
- **Dataset review:** expert sign-off before each factor, measure or benchmark release.

## 20. Observability

Structured logs (Serilog) with tenant and document IDs, OpenTelemetry traces across upload, OCR and calculation, Sentry for client and server errors, Hangfire dashboard (admin only), business metrics: documents per org per week, review time per document, OCR tier mix, percent corrected, flags raised and resolved, recommendations marked done.

## 21. Free-tier budget view

| Item | Demo | Pilot (about 5 to 10 organisations) |
| --- | --- | --- |
| Frontend hosting | Free | Free |
| API and worker | Student credits | Small VPS (low monthly cost) |
| Database | Free tier | On the VPS |
| Storage | Free tier | Free tier, then pay-as-you-go |
| OCR | Tesseract + free tiers | Same; paid tier 3 only if consent and need |
| Email and push | Free tiers | Free tiers |
| Monitoring | Free tiers | Free tiers |

Quotas change often; verify each free tier before relying on it, and keep every paid-capable dependency behind an interface (IOcrProvider, IFileStore, INotifier, IReportRenderer).

## 22. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Bangla handwriting OCR accuracy | Core trust gate fails | Tiered pipeline, manual-entry fallback, golden set, review UI |
| Free-tier limits or terms change | Service interruption, privacy exposure | Interfaces for every provider, VPS fallback, no-training tiers for real data |
| Weak or outdated emission factors | Buyer rejects report | Versioned factors, source and year printed, expert review, override with justification |
| Recommendation numbers seen as promises | Reputational and legal risk | Ranges, evidence grades, "estimate" labelling, audit advice for large spend |
| Flag fatigue | Users ignore alerts | Top-5 view, digest, thresholds tuned in pilot |
| Floor staff adoption | No documents arrive | Two-tap UI, instant receipt, supervisor nudges, manual fallback |
| Small survey (n = 17) | Misread priorities | Validate personas and flag thresholds in pilot interviews |
| Scope creep | MVP never ships | Phase plan below |

## 23. Delivery roadmap

**Phase 0, spikes (about 2 weeks):** Bangla OCR accuracy on 50 sample bills; QuestPDF Bangla rendering; load a first factor set and a draft measure library; confirm free-tier quotas and terms.

**Phase 1, MVP:** tenancy and roles, onboarding with expected documents, PWA capture with offline queue, OCR tiers 1 and 2, review screen, unit conversion, factor registry, Scope 1 and 2, missing-data alerts, data-quality flags, dashboard, GHG-style PDF, audit log, Bangla and English.

**Phase 2, differentiators:** footprint flags and intensity metrics, Recommendations engine with the Measure Library, tier 3 extraction (consented), scope 3 transport, auditor share link, consultant workspace, Excel export and buyer template mapping, weekly digest.

**Phase 3, growth:** peer benchmarks from opt-in pilot data, realised-savings loop calibrating the measure library, utility and accounting integrations, SMS and WhatsApp intake, fuller Scope 3, association and bank bundles.

## 24. Decisions to confirm

1. Frontend: React + Vite PWA (recommended) or Next.js static export.
2. Whether tier 3 (vision LLM) is allowed for real customer bills, and under which terms.
3. Which sector to template first (RMG is the strongest fit with your survey).
4. Who will expert-review the Measure Library and factor sets.
5. Pilot hosting: student credits for demo, VPS for pilot.
6. Which output unit your first pilot buyers use for intensity (per piece, per kg of fabric, per tonne shipped).

Outputs of CarbonBill are estimates aligned with GHG Protocol methodology and are not audited or certified reports.
