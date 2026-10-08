# CarbonBill: Parallel AI-Agent Prompt Pack (3 Developers)

Source: *CarbonBill System Architecture and Solution Design (.NET Edition) v1.0*.
Goal: three people, each with their own AI agent, build CarbonBill at the same time with minimal merge conflicts and no lost context.

---

## 0. How this pack works (read first)

1. **Contract-first parallelism.** Phase 0 creates (a) all context `.md` files and (b) a frozen `Contracts` project (interfaces, events, DTOs, fakes). After that, each dev builds their own modules against contracts and fakes, so nobody waits for anybody.
2. **One owner per folder.** Each dev owns specific modules and frontend feature folders. Nobody edits another owner's folder. Cross-boundary needs go through a *contract request* file.
3. **Every prompt is small and self-contained.** Each one lists: what to read, what to build, what NOT to touch, definition of done, handoff.
4. **Agents keep memory in files**, not in chat. Every session starts with the same "session start" line (section 3) and ends by updating the progress and handoff files.

### Team split

| Dev | Track | Owns (backend) | Owns (frontend `web/src/features/`) |
|---|---|---|---|
| **Dev 1** | **A: Platform and Data Backbone** | SharedKernel, Api host, Identity and Tenancy, Onboarding, Units and Factor Registry, Activity, Calculation, Audit, Platform Admin, infra | `auth`, `onboarding`, `admin`, `consultant` |
| **Dev 2** | **B: Capture and Extraction** | Documents, Extraction, Review | `capture` (floor PWA), `review`, app shell and shared UI kit |
| **Dev 3** | **C: Insights and Output** | Gap Detection, Notifications, Flags, Insights and Benchmarks, Recommendations, Reporting | `dashboard`, `flags`, `recommendations`, `reports`, `auditor` |

> Swap names freely. The split balances backend-heavy (A), pipeline plus offline-PWA-heavy (B), and rules plus reporting-heavy (C).

### Repo layout the agents will create

```text
carbonbill/
  AGENTS.md                      # entry point for every agent (CLAUDE.md points to it)
  docs/
    source/                      # original PDF goes here
    ai/
      00_PROJECT_CONTEXT.md ... 16_ROADMAP_STATUS.md
      tracks/TRACK_A.md TRACK_B.md TRACK_C.md
      progress/PROGRESS_A.md PROGRESS_B.md PROGRESS_C.md
      handoffs/                  # one file per handoff, named FROM-to-TO-topic.md
      contract-requests/         # one file per request
  src/
    CarbonBill.Api/              # host (Dev 1)
    CarbonBill.SharedKernel/     # building blocks (Dev 1)
    CarbonBill.Contracts/        # interfaces, events, DTOs, fakes (frozen, see rules)
    Modules/CarbonBill.Modules.<Name>/
  tests/                         # mirrors src, plus CarbonBill.IntegrationTests, E2E
  web/                           # React + Vite PWA, src/features/<feature>
  seeds/                         # factors, units, measures, flag rules, benchmarks (CSV/JSON)
  infra/                         # docker-compose, Caddy, CI
```

---

## 1. Workflow tree (which prompt after which)

Legend: `[A]` Dev 1, `[B]` Dev 2, `[C]` Dev 3, `[ALL]` everyone. `||` means run in parallel. `GATE` = stop, merge, verify, then continue.

```text
PHASE 0: CONTEXT AND SCAFFOLD (about 1 to 2 days)
│
├── P0-1a [A] core context docs + AGENTS.md ─┐
├── P0-1b [B] domain/data/API/flow docs ─────┼── (run in parallel, different files)
├── P0-1c [C] rules/reporting/security docs ─┘
│        │
│        └── GATE G0: merge docs, each dev reads AGENTS.md + their TRACK file
│
├── P0-2 [A] .NET solution scaffold + infra ──┐
├── P0-3 [B] React PWA scaffold + shell ──────┼── (parallel)
├── P0-4 [C] seeds + fixtures + dev data ─────┘
│        │
│        └── P0-5 [A] Contracts + fakes (with B and C reviewing)
│                 │
│                 └── GATE G1: tag contracts-v0.1, everyone rebases
│
PHASE 1: MVP TRACKS (all three run at the same time)
│
├── TRACK A (Dev 1)
│     A1 building blocks ─► A2 identity/tenancy ─► A3 onboarding + expected docs
│     A4 units + factor registry (can start after A1, parallel with A2/A3)
│     A5 activity + calculation (needs A4) ─► A6 admin datasets + isolation tests
│     A7 frontend: auth, onboarding, admin (needs A2, A3)
│
├── TRACK B (Dev 2)
│     B1 documents backend ─► B2 extraction tier 1 ─► B3 tiers 2+3 + golden harness
│     B4 review backend (needs B1; uses fake IActivityWriter until A5 lands)
│     B5 floor PWA capture (needs B1 contract; parallel with B2)
│     B6 review UI (needs B4)
│
├── TRACK C (Dev 3)
│     C1 gap detection ─► C2 notifications
│     C3 flags engine + data-quality rules (parallel with C1/C2, uses fakes)
│     C4 footprint/readiness flags + intensity + benchmarks (needs C3)
│     C5 measure library + recommendations engine (parallel, seed-driven)
│     C6 reporting backend: dashboards, PDF, Excel, share link
│     C7 frontend: dashboard, flags, recommendations, reports, auditor (needs C3, C5, C6)
│
├── SYNC S1 [ALL] at the end of every working day (merge + contract check)
│
└── GATE G2: each track reports "MVP track complete" in its PROGRESS file

PHASE 2: INTEGRATION (replace fakes with real modules)
│
├── I1 [A] swap fakes for real implementations, wire the host
├── I2 [B] end-to-end: upload ─► OCR ─► review ─► calculation ─► flag ─► report
├── I3 [C] role dashboards on real data + buyer PDF with real figures
│        │
│        └── GATE G3: full E2E green
│
├── I4 [A] security hardening + tenant isolation audit        ┐
├── I5 [B] golden OCR set, accuracy metrics, offline torture   ├── parallel
├── I6 [C] observability + flag/recommendation tuning          ┘
│        │
│        └── I7 [A] consultant workspace + factor override flow (needs A5, C6)
│
PHASE 3: PILOT
└── I8 [A] pilot deployment (VPS, Caddy, CI/CD, backups)  ||  I9 [B] usability tests  ||  I10 [C] pilot data review
```

### Dependency table (quick lookup)

| Prompt | Needs | Unlocks |
|---|---|---|
| P0-1a/b/c | PDF in `docs/source/` | G0 |
| P0-2 / P0-3 / P0-4 | G0 | P0-5 |
| P0-5 | P0-2 | G1 |
| A1 | G1 | A2, A4 |
| A2 | A1 | A3, A7, real auth for all |
| A3 | A2 | A7, real ExpectedDocRules for C1 |
| A4 | A1 | A5 |
| A5 | A4 | real activity and emissions for B4, C-track |
| A6 | A4 | G2 |
| A7 | A2, A3 | G2 |
| B1 | G1 | B2, B4, B5 |
| B2 | B1 | B3 |
| B3 | B2 | G2 |
| B4 | B1 | B6 |
| B5 | B1 | G2 |
| B6 | B4 | G2 |
| C1 | G1 | C2 |
| C2 | C1 | C7 |
| C3 | G1 | C4, C7 |
| C4 | C3 | C7 |
| C5 | G1 | C7 |
| C6 | G1 | C7 |
| C7 | C3, C5, C6 | G2 |

---

## 2. Rules every agent must follow (copy into AGENTS.md, done by P0-1a)

```text
CARBONBILL AGENT RULES
1. Read docs/ai/00_PROJECT_CONTEXT.md and your TRACK file before working.
2. Only edit folders you own (docs/ai/02_MODULES_AND_OWNERSHIP.md). Never edit another dev's module.
3. src/CarbonBill.Contracts is frozen after tag contracts-v0.1. To change it, create docs/ai/contract-requests/<date>-<from>-<topic>.md and stop; do not edit it yourself unless you are the Contracts owner (Dev 1) and the request is approved.
4. Build against Contracts interfaces. If a real implementation does not exist yet, use the fake from CarbonBill.Contracts.Fakes.
5. Money = decimal numeric(18,2) BDT. Quantities and factors = decimal numeric(18,6). Never float or double.
6. Every tenant table has org_id. Enforce with EF Core global query filter AND PostgreSQL row-level security.
7. Never hard-code emission factors, savings %, capex, thresholds. They live in seeds/ and DB tables, each with a source row.
8. Honest numbers: label estimated vs verified, show ranges, say "no benchmark yet" when data is thin.
9. Every user-visible string exists in Bangla and English (i18n keys, no inline strings). Bangla digits and BDT in UI.
10. Every figure must be traceable: document, factor version, confirmer.
11. Every paid-capable dependency sits behind an interface (IOcrProvider, IFileStore, INotifier, IReportRenderer).
12. Tests: unit tests for logic, Testcontainers for DB, tenant-isolation test for every new tenant table.
13. Small commits, branch name feat/<track>-<prompt-id>-<slug>, PR into main, squash merge.
14. Finish every task by: updating docs/ai/progress/PROGRESS_<track>.md, and writing a handoff file if another dev depends on your work.
15. If something is unclear or conflicts with the docs, write the question in docs/ai/15_DECISIONS.md under "Open questions" and continue with the safest assumption. Do not invent numbers.
16. Outputs are estimates aligned with GHG Protocol methodology, not audited or certified. Reports must say so.
```

## 3. Session start line (paste at the start of every new agent session)

```text
Read AGENTS.md, docs/ai/00_PROJECT_CONTEXT.md, docs/ai/tracks/TRACK_<A|B|C>.md and docs/ai/progress/PROGRESS_<A|B|C>.md. Check docs/ai/handoffs/ and docs/ai/contract-requests/ for items addressed to me. Summarise in 5 lines where we are and what the next prompt is. Do not start coding until I confirm.
```

---

# PHASE 0: CONTEXT AND SCAFFOLD

> Put the PDF in `docs/source/` (rename to `CarbonBill_Architecture.pdf`) before running P0-1a/b/c. All three can run at the same time because they write different files.

## P0-1a: Core context and agent rules  `[Dev 1]`

**Needs:** PDF in repo. **Unlocks:** G0.

```text
You are a senior solution architect and technical writer. Read docs/source/CarbonBill_Architecture.pdf fully.
Create the repo skeleton folders (docs/ai, docs/ai/tracks, docs/ai/progress, docs/ai/handoffs, docs/ai/contract-requests, src, tests, web, seeds, infra) with .gitkeep where empty.
Write these files, concise and factual, no invented numbers (mark anything the PDF marks "verify" as VERIFY):
1. AGENTS.md at repo root: purpose, how to navigate docs/ai, the 16 rules from section 2 of the prompt pack (I will paste them), session-start routine, and a pointer file CLAUDE.md that says "see AGENTS.md".
2. docs/ai/00_PROJECT_CONTEXT.md: what CarbonBill is, the 4 user pains (never lose a slip, trust the OCR, no consultant needed, buyer's format), personas (Jahid floor, Rahim accounts, Nusrat/Kabir compliance/owner, Farhana consultant, Anna auditor), the 3 changes vs the earlier pack, design principles table, scope (Scope 1, 2, 3 transport only), non-goals (no ML in MVP, no market-based Scope 2).
3. docs/ai/01_ARCHITECTURE.md: system context, tech stack table with fallbacks, modular monolith explanation, container view, deployment (demo vs pilot), scale path.
4. docs/ai/02_MODULES_AND_OWNERSHIP.md: the module table (responsibility, entities), owner dev per module per the team split I give you, frontend feature-folder ownership, and the rule for cross-module calls (Contracts interfaces and domain events only).
5. docs/ai/13_CONVENTIONS.md: C# conventions, folder layout per module, naming, error handling (problem+json, user-safe message in requested language), cursor pagination, ETags, i18n key rules, testing conventions.
6. docs/ai/14_WORKFLOW_GIT.md: branching, PR rules, contract-change protocol, daily sync S1 routine, gates G0 to G4.
7. docs/ai/15_DECISIONS.md: the 6 "Decisions to confirm" from the PDF as open questions with the PDF's recommendation, plus an empty ADR log.
8. docs/ai/16_ROADMAP_STATUS.md: phases 0 to 3 from the PDF with checkboxes.
Team split to use: Dev1 = Platform and Data Backbone, Dev2 = Capture and Extraction, Dev3 = Insights and Output (modules and features as in the pack).
Also create docs/ai/tracks/TRACK_A.md (Dev 1 scope, owned folders, deliverables A1..A7, risks) and docs/ai/progress/PROGRESS_A.md (empty checklist for A1..A7).
Do not write any code. Commit on branch docs/p0-1a.
Done when: all files exist, link to each other correctly, and AGENTS.md alone is enough for a new agent to find everything.
```

## P0-1b: Domain, data model, API and flows  `[Dev 2]`

**Needs:** PDF in repo. **Unlocks:** G0.

```text
You are a senior systems analyst. Read docs/source/CarbonBill_Architecture.pdf fully (sections 3, 6, 7, 12, 13, 14, 15).
Write these files only (do not touch AGENTS.md or other docs):
1. docs/ai/03_DOMAIN_GLOSSARY.md: every domain term (Expected-document calendar, Estimated vs Verified, Data Quality Score, Tier 1/2/3, ExpectedDocRule, FactorSet, Recommendation lifecycle, etc.) in Bangla-friendly plain English, one line each.
2. docs/ai/04_DATA_MODEL.md: every table with columns, types, keys, notes, grouped by module, including the additions table in the PDF. State: all tenant tables carry org_id, money numeric(18,2), quantities numeric(18,6). Add a Mermaid ER diagram per module group and the owning module for each table.
3. docs/ai/05_API_CONTRACT.md: REST endpoints under /api/v1 grouped by module with method, path, auth role required (use the roles matrix), request and response shape sketches, idempotency header rules, error format. Mark which module owns each endpoint.
4. docs/ai/06_CORE_FLOWS.md: capture and extraction flow (steps 1 to 5), review and confirm, missing-data detection with escalation timings, as numbered steps plus Mermaid sequence diagrams, and all four state machines (Document, Report, Flag, Recommendation).
5. docs/ai/tracks/TRACK_B.md: Dev 2 scope (Documents, Extraction, Review, capture PWA, review UI, app shell), owned folders, deliverables B1..B6, performance targets (3 s receipt on 3G, 200 KB JS, 60 s OCR), risks.
6. docs/ai/progress/PROGRESS_B.md: checklist for B1..B6.
Only use facts from the PDF. If the PDF is silent on a detail, add it under a heading "Assumptions" in the same file.
Commit on branch docs/p0-1b.
Done when: a developer could implement any endpoint or table from these files without opening the PDF.
```

## P0-1c: Rules, recommendations, reporting, security, NFR  `[Dev 3]`

**Needs:** PDF in repo. **Unlocks:** G0.

```text
You are a senior domain analyst for carbon accounting software. Read docs/source/CarbonBill_Architecture.pdf fully (sections 8 to 11, 16 to 22).
Write these files only:
1. docs/ai/07_CALCULATION_RULES.md: units and canonical units, formula, decimal rules, immutability and versioning, factor selection order, factor sources to load, scope coverage table, boundary and limitations statement.
2. docs/ai/08_FLAGS_SPEC.md: all flag families and flags in a table (trigger default, severity, suggested action), flag record fields, lifecycle (dismiss requires reason, expires in 30 days), flag-fatigue controls, intensity and benchmark rules ("no benchmark yet"). State clearly that thresholds are tunable defaults stored in FlagRule, not research findings.
3. docs/ai/09_RECOMMENDATIONS_SPEC.md: Measure Library fields, evidence grades A/B/C, candidate sources (with VERIFY), starter measure list, the 8-step pipeline with the exact formulas, honesty rules, closed-loop learning.
4. docs/ai/10_REPORTING_SPEC.md: dashboards by role, buyer PDF sections, templates and buyer mapping, ReportSnapshot freezing and hash, auditor link behaviour, Bangla font spike requirement.
5. docs/ai/11_SECURITY_PRIVACY.md: roles and permissions matrix, transport, upload hardening, audit, privacy promises, AI tier-3 consent rules and the free-LLM-tier warning, backups.
6. docs/ai/12_NFR_TESTING_OBSERVABILITY.md: NFR targets table, testing strategy (golden OCR set of 150 bills, Testcontainers, Playwright, usability), observability metrics, free-tier budget notes, risk table.
7. docs/ai/tracks/TRACK_C.md: Dev 3 scope (Gap Detection, Notifications, Flags, Insights, Recommendations, Reporting, dashboard/flags/recommendations/reports/auditor UI), owned folders, deliverables C1..C7, risks.
8. docs/ai/progress/PROGRESS_C.md: checklist for C1..C7.
Mark every external number or quota as VERIFY. Do not invent figures.
Commit on branch docs/p0-1c.
Done when: someone can implement the flag engine and recommendation engine from these files alone.
```

### GATE G0
All three merge their docs PRs into `main`. Each dev opens `AGENTS.md`, reads their TRACK file, and runs the **session start line**. Resolve any contradictions between docs now (check `15_DECISIONS.md`).

---

## P0-2: .NET solution scaffold and infra  `[Dev 1]`

**Needs:** G0. **Runs in parallel with:** P0-3, P0-4.

```text
Read AGENTS.md, docs/ai/01_ARCHITECTURE.md, 02_MODULES_AND_OWNERSHIP.md, 13_CONVENTIONS.md.
Create the .NET (current LTS) solution:
- src/CarbonBill.Api (minimal APIs host, MediatR-style handlers, OpenAPI, Serilog, built-in rate limiter, health checks)
- src/CarbonBill.SharedKernel (empty for now)
- src/CarbonBill.Contracts (empty for now, P0-5 fills it)
- One class library per module under src/Modules/ named CarbonBill.Modules.<Name> for: Identity, Onboarding, Documents, Extraction, Review, ActivityUnits, FactorRegistry, Calculation, GapDetection, Flags, Insights, Recommendations, Reporting, Notifications, Audit, PlatformAdmin. Each has folders Domain, Application, Infrastructure, Endpoints and a ModuleRegistration class (AddXModule, MapXEndpoints). Modules reference only SharedKernel and Contracts, never each other. Add an architecture test (NetArchTest) that fails if a module references another module.
- tests/ projects mirroring modules plus CarbonBill.IntegrationTests (Testcontainers PostgreSQL) and CarbonBill.ArchitectureTests.
- infra/docker-compose.dev.yml (postgres, optional MinIO as local R2 stand-in), .env.example, GitHub Actions workflow (build, test, format check), Dependabot config, .editorconfig, Directory.Build.props (nullable, warnings as errors).
Do not implement business logic. Do not create a web/ folder.
Done when: dotnet build and dotnet test pass on a clean clone, docker compose up starts postgres, GET /health returns 200, and the architecture test passes.
Update PROGRESS_A.md.
```

## P0-3: React PWA scaffold and app shell  `[Dev 2]`

**Needs:** G0. **Parallel with:** P0-2, P0-4.

```text
Read AGENTS.md, docs/ai/01_ARCHITECTURE.md (frontend rows), 02_MODULES_AND_OWNERSHIP.md, 11_SECURITY_PRIVACY.md (roles), docs/ai/12_NFR_TESTING_OBSERVABILITY.md.
Create web/ with React + Vite + TypeScript PWA: Workbox service worker, IndexedDB wrapper, i18next (bn default for the floor route, en/bn elsewhere), Chart.js installed, React Router with route-based code splitting so the floor-staff route is a separate chunk under 200 KB JS, Tailwind or CSS modules (pick one, record in 15_DECISIONS.md).
Structure: web/src/app (shell, routing, role-based home screens: floor, accountant, compliance/owner, consultant), web/src/shared (api client generated from OpenAPI with a hand-written fallback, auth context stub, design tokens, Bangla digit and BDT formatters, date formatter with Bangla months, error boundary, toast), web/src/features/<feature> empty folders for: auth, onboarding, admin, consultant, capture, review, dashboard, flags, recommendations, reports, auditor. Each feature folder gets an index.ts exporting its routes so other devs add routes without editing the shell.
Add a bundle-size check script in CI for the floor route. Add Playwright skeleton.
Do not build feature screens. Do not edit backend.
Done when: npm run build passes, floor route chunk is under 200 KB gzipped, language switch works, each role sees a placeholder home, formatters have unit tests (১২৩ digits, BDT, Bangla month names).
Update PROGRESS_B.md.
```

## P0-4: Seeds, fixtures and dev data  `[Dev 3]`

**Needs:** G0. **Parallel with:** P0-2, P0-3.

```text
Read AGENTS.md, docs/ai/07_CALCULATION_RULES.md, 08_FLAGS_SPEC.md, 09_RECOMMENDATIONS_SPEC.md, 04_DATA_MODEL.md.
Create seed files in seeds/ with schemas and README (JSON Schema for each):
1. seeds/units/unit_conversions.csv: canonical units kWh, litre, kg, m3, tonne-km and the conversions the PDF mentions (gallon, MWh, MJ, ton). Conversions that are exact definitions may be filled; anything else left with source_needed=true.
2. seeds/factors/factor_set_TEMPLATE.csv: columns per FactorSet/EmissionFactor (gwp_basis, source, year, region, version, valid_from/to). Do NOT fill numeric factor values from memory; create rows with value empty and a source_needed column. Add a clearly labelled SAMPLE file with obviously fake values (prefix FAKE_) for tests only.
3. seeds/flags/flag_rules.json: every flag with the PDF default thresholds (these defaults are given in the PDF) and tunable parameters.
4. seeds/measures/measure_library_TEMPLATE.json and measure_sources_TEMPLATE.json: the schema fields and the starter measure list names with all numeric fields null and evidence_grade null. Add FAKE_ sample measures for tests only.
5. seeds/benchmarks/benchmark_TEMPLATE.json.
6. seeds/dev/: a believable fake dataset for development: 1 RMG organisation, 1 site, 2 meters, 1 genset, 1 boiler, 12 months of ActivityRecords and EmissionResults (using FAKE_ factors), 1 spike month, 1 missing month, production metrics, a few documents metadata. Provide as JSON plus a C# friendly loader spec in seeds/README.md.
7. docs/ai/seed-data-todo.md: list of real data an expert must supply before pilot (factors, measure numbers with sources, benchmark sets) and which candidate sources to use per the PDF (all marked VERIFY).
Never invent real emission factors or measure savings. 
Done when: schemas validate the sample files and the fake dev dataset covers every flag trigger at least once.
Update PROGRESS_C.md.
```

## P0-5: Contracts and fakes (the parallelism enabler)  `[Dev 1, Dev 2 and Dev 3 review]`

**Needs:** P0-2 (and P0-4 for fake data shapes). **Unlocks:** G1.

```text
Read AGENTS.md, docs/ai/02_MODULES_AND_OWNERSHIP.md, 04_DATA_MODEL.md, 05_API_CONTRACT.md, 06_CORE_FLOWS.md, 08_FLAGS_SPEC.md, and seeds/dev.
Fill src/CarbonBill.Contracts with:
A. Cross-cutting: ITenantContext (OrgId, UserId, Roles, Language), ICurrentUser, Result<T>/Error types, IAuditLogger, IClock, IUnitOfWork marker, IDomainEventPublisher + IDomainEvent.
B. Read-model interfaces (read-only, DTO returned): IExpectedDocRuleReader, IDocumentReadModel, IActivityReadModel, IEmissionReadModel (by org/site/period/scope/category, includes is_estimated and document ids), IFactorLookup, IUnitConverter, IProductionMetricReader, IFlagReader, IMeasureReader, IReportReader.
C. Command-style interfaces: IActivityWriter (RecordConfirmedActivity: creates ActivityRecord, applies factor, writes EmissionResult), IDocumentStateCommands (mark Confirmed/Calculated/InReport/Locked), IFlagRaiser, INotifier, IFileStore, IOcrProvider (with tier, returns fields with value, confidence, bbox), IReportRenderer.
D. Domain events (records): DocumentUploaded, DocumentExtracted, DocumentNeedsReview, DocumentConfirmed, EmissionCalculated, MissingAlertRaised, FlagRaised, FlagResolved, ReportApproved, FactorSetPublished, MeasureMarkedDone.
E. DTOs for all of the above with decimal types and explicit units.
F. CarbonBill.Contracts.Fakes: in-memory fake implementations of every interface backed by seeds/dev data, plus a FakeTenantContext. A host flag UseFakes=true registers them.
G. docs/ai/contracts-overview.md: a table of interface, owner module (who implements), consumers, and fake availability.
No business logic beyond fakes. Version with tag contracts-v0.1 after all three devs approve the PR.
Done when: solution builds, each interface has XML docs stating expected behaviour and error cases, fakes pass a basic contract test suite that real implementations must also pass (create the reusable abstract test classes).
```

### GATE G1
Tag `contracts-v0.1`. Everyone rebases on `main`. From now on contract changes go through `docs/ai/contract-requests/`. Start Phase 1: all three tracks run at the same time.

---

# PHASE 1: TRACK A (Dev 1): Platform and Data Backbone

## A1: Building blocks  `[Dev 1]`  *Needs: G1*

```text
Read AGENTS.md, TRACK_A.md, 11_SECURITY_PRIVACY.md, 13_CONVENTIONS.md, 04_DATA_MODEL.md.
Implement in SharedKernel and Api:
- EF Core + Npgsql setup with one DbContext per module sharing one connection, per-module schema, snake_case naming, migrations per module.
- Tenancy: base entity with org_id, EF global query filter driven by ITenantContext, and a PostgreSQL row-level security helper that sets app.current_org per connection/transaction; a migration helper that enables RLS policy on any table with org_id.
- Outbox pattern + in-process domain event dispatcher (Hangfire PostgreSQL storage for async handlers).
- Audit: append-only AuditLog table, IAuditLogger implementation, optional hash chain (config flag), DB role without UPDATE/DELETE on it.
- Problem+json error middleware with user-safe message in the requested language (Accept-Language bn/en), correlation id, Serilog enrichers (org id, user id).
- ETag helper, cursor pagination helper, idempotency-key middleware (store key + response hash per user).
- Rate limiter policies per user and per IP.
Tests: tenant filter and RLS integration test (org A never reads org B, even with raw SQL when RLS role used), idempotency test, audit append-only test.
Done when: a sample test entity proves tenant isolation twice (EF filter and RLS) and all tests pass.
Update PROGRESS_A.md.
```

## A2: Identity and Tenancy  `[Dev 1]`  *Needs: A1*

```text
Read AGENTS.md, TRACK_A.md, 11_SECURITY_PRIVACY.md (roles matrix), 05_API_CONTRACT.md (Auth).
Implement the Identity module: ASP.NET Core Identity, JWT short-lived access token + refresh cookie (secure settings), lockout, optional TOTP for owners.
Entities: Organization, User, Membership (user_id, org_id, role), Invitation (org_id, role, token, expires_at, pin_hash).
Roles: FloorStaff, Accountant, Compliance, Owner, Consultant, AuditorLink, PlatformAdmin with the permissions matrix as authorization policies (one policy per capability, not per role).
Endpoints: POST /auth/login, /auth/refresh, /auth/join (QR token + PIN for floor staff, no email needed), org and user management per matrix, invitation create/revoke, org switch for consultants (token carries active org).
Implement ITenantContext/ICurrentUser using claims. Floor staff must be able to join in under 3 taps with a QR code and a short PIN.
Tests: policy matrix test (every role x capability), join flow, expired invite, consultant multi-org switching, refresh rotation.
Do not build UI. Done when the full matrix test passes and Swagger shows all endpoints.
Update PROGRESS_A.md and write handoff docs/ai/handoffs/A-to-ALL-auth-ready.md (how to get a token in dev, seeded dev users per role).
```

## A3: Onboarding and expected-document calendar  `[Dev 1]`  *Needs: A2*

```text
Read AGENTS.md, TRACK_A.md, 06_CORE_FLOWS.md (missing data), 04_DATA_MODEL.md (Site, Asset, ExpectedDocRule).
Implement Onboarding module: Site, Asset (meter, genset, boiler, vehicle), ExpectedDocRule (asset_id, doc_type, frequency, due_day, responsible_user_id), sector template (RMG first, template as seed JSON so other sectors are data not code), and the 2-minute facility questionnaire profile (boiler yes/no, genset yes/no, roof area, owned/rented, budget band) stored on the org/site.
Generation: on onboarding completion create the expected-document calendar (one electricity bill per meter, diesel slips per genset, gas bill, shipping invoices) as rules; an expansion service that returns the expected documents for a period.
Implement IExpectedDocRuleReader and IProductionMetricReader inputs (monthly "units produced/shipped" question endpoint, ProductionMetric table lives in Insights but the endpoint to capture it is owned by Onboarding via the contract; coordinate through contract request if needed).
Endpoints: sites/assets CRUD, rules CRUD, GET expected documents for period, POST facility profile.
Tests: expansion edge cases (monthly due_day 31, leap February), multi-meter orgs.
Done when: after onboarding a seeded org, GET expected docs for a month returns the right checklist and C1 can consume IExpectedDocRuleReader (replace its fake by this).
Update PROGRESS_A.md; handoff A-to-C-expected-docs.md.
```

## A4: Units and Factor Registry  `[Dev 1]`  *Needs: A1 (parallel with A2/A3)*

```text
Read AGENTS.md, TRACK_A.md, 07_CALCULATION_RULES.md, seeds/units, seeds/factors.
Implement ActivityUnits (Unit, UnitConversion with version) and FactorRegistry (FactorSet, EmissionFactor, FactorOverride).
Rules: factor sets are immutable once published; new version creates new set; selection order = org override (needs justification + approver) then national/grid-specific then regional; store gwp_basis (AR5/AR6) as a field; every lookup returns factor_id, version, source, year.
Implement IUnitConverter and IFactorLookup. Loader that imports CSV/JSON seed into a draft FactorSet, validates (no empty value without source, no duplicates), then publishes. Publishing raises FactorSetPublished.
Endpoints: GET /factors, POST /factor-overrides (request/approve flow per matrix), admin dataset load is done in A6.
Tests: unit conversion round-trips (property tests), selection order, immutability, override without justification rejected. Use decimal everywhere.
Do not hard-code real factor values.
Update PROGRESS_A.md.
```

## A5: Activity and Calculation  `[Dev 1]`  *Needs: A4*

```text
Read AGENTS.md, TRACK_A.md, 07_CALCULATION_RULES.md, 06_CORE_FLOWS.md (confirm), 05_API_CONTRACT.md (Dashboard-free parts).
Implement Activity (ActivityRecord) and Calculation (EmissionResult) modules, plus IActivityWriter, IActivityReadModel, IEmissionReadModel.
RecordConfirmedActivity: in ONE transaction create ActivityRecord in canonical units, look up factor, compute kg CO2e = quantity_standard x factor, write EmissionResult (factor_id, factor_version, conversion_version, is_estimated, document ids), write AuditLog, raise EmissionCalculated. Results are immutable; a corrected activity creates a new version and supersedes the old.
Estimates: support is_estimated records (missing month estimated from history) excluded from the "verified" total; expose both totals.
Rollups by scope/category/site/period with verified vs estimated split and Data Quality Score (percent of kg CO2e backed by confirmed documents).
Recalculation proposal when a new FactorSet is published (never silently change approved reports).
Tests: decimal precision, rollups, immutability, recalculation proposal, quantity zero/negative rejected.
Done when: contract tests for IActivityWriter and the read models pass against real implementations.
Update PROGRESS_A.md; handoff A-to-B-activity-writer.md and A-to-C-emissions-read.md.
```

## A6: Platform Admin, datasets and isolation tests  `[Dev 1]`  *Needs: A4*

```text
Read AGENTS.md, TRACK_A.md, 04_DATA_MODEL.md (DatasetVersion), 11_SECURITY_PRIVACY.md.
Implement PlatformAdmin module: POST /admin/datasets (factors, measures, benchmarks, flag rules) with DatasetVersion (kind, version, loaded_by, checksum), dry-run validation endpoint, rollback to previous version for non-immutable datasets, GET /admin/tenants (support only, no document access).
The measures and benchmarks loaders delegate to Recommendations/Insights via a contract interface IDatasetLoader<T> (create the contract request; Dev 3 implements the receivers). 
Add CarbonBill.IntegrationTests suite that scans all tenant tables via EF metadata and asserts every one has org_id, a query filter and an RLS policy.
Done when: loading seeds/dev data via admin endpoint works and the isolation scan test passes.
Update PROGRESS_A.md.
```

## A7: Frontend for auth, onboarding, admin  `[Dev 1]`  *Needs: A2, A3*

```text
Read AGENTS.md, TRACK_A.md, web/README and the shell structure, 11_SECURITY_PRIVACY.md, 00_PROJECT_CONTEXT.md (personas).
Build in web/src/features/auth, onboarding, admin only:
- Login, QR join with PIN (Bangla, big touch targets), token refresh, role-based redirect to the right home screen, organisation switcher for consultants.
- Onboarding wizard: sector template pick, sites, meters, gensets, vehicles, facility questionnaire, preview of the generated expected-document checklist, privacy card (where data lives, who sees it, no AI training on your documents, delete on request).
- Admin: dataset upload and validation result view, tenants list.
All strings via i18n keys (bn and en). Register routes via each feature's index.ts, do not edit the shell besides the auth provider hook that P0-3 left as a stub (agree with Dev 2 if more is needed).
Tests: component tests, Playwright login and onboarding happy path.
Update PROGRESS_A.md.
```

---

# PHASE 1: TRACK B (Dev 2): Capture and Extraction

## B1: Documents backend  `[Dev 2]`  *Needs: G1*

```text
Read AGENTS.md, TRACK_B.md, 06_CORE_FLOWS.md (capture), 05_API_CONTRACT.md (Documents), 11_SECURITY_PRIVACY.md (upload hardening).
Implement the Documents module: Document, DocumentPage entities (sha256, source phone/web/manual, captured_at, tier_used, is_estimated), state machine Uploaded..Locked plus Failed/ReuploadRequested/Duplicate with transition guards.
Endpoints: POST /documents (requires Idempotency-Key header = client GUID, resumable/chunked upload support), GET /documents?status=, GET /documents/{id}, POST /documents/manual-entry (litres + slip number now, photo later), GET "my submissions" for floor staff.
Upload hardening: validate type by magic bytes, size limit, SHA-256, image re-encode, EXIF GPS stripped, optional ClamAV behind an interface. Duplicate detection: hash first, then (vendor, bill number, period) after extraction. Return a receipt immediately.
Storage: implement IFileStore with a local-disk/MinIO implementation and an S3-compatible (Cloudflare R2) implementation; short-lived pre-signed URLs only.
Implement IDocumentReadModel and IDocumentStateCommands. Raise DocumentUploaded.
Use Contracts fakes for ITenantContext until A2 lands.
Tests: idempotent re-upload, duplicate by hash, disguised file (wrong magic bytes) rejected, state machine invalid transitions, tenant isolation.
Update PROGRESS_B.md; handoff B-to-C-documents-read.md.
```

## B2: Extraction pipeline, tier 1  `[Dev 2]`  *Needs: B1*

```text
Read AGENTS.md, TRACK_B.md, 06_CORE_FLOWS.md (extraction pipeline), 12_NFR_TESTING_OBSERVABILITY.md (OCR targets).
Implement Extraction module (ExtractionRun, ExtractedField with value, confidence, source_tier, bbox, corrected_value) as a Hangfire job triggered by DocumentUploaded.
Steps: (1) Normalise: Bangla digits to Latin, date formats incl. Bangla month names, unit spellings (e.g. litre variants in Bangla and English). (2) Classify doc type (electricity, diesel slip, gas, shipping invoice) by keywords and layout. (3) Tier 1: Tesseract (ben+eng) via IOcrProvider with image preprocessing (deskew, contrast), plus vendor templates for known utilities as JSON template files. (4) Validation rules: numeric ranges, totals reconcile, date plausible, required fields per doc type; accept tier 1 only if all required fields pass. (5) Else escalate (Tier 2 is B3) or set NeedsReview with low-confidence fields marked. Failure sets Failed with a plain-language reason in bn/en and triggers a "retake photo" notification via INotifier.
Publish SignalR event "OCR done". Raise DocumentExtracted / DocumentNeedsReview.
Detect penalty lines (power factor or demand charge) as extracted fields for the Flags module.
Tests: normaliser (property tests on digits/dates), validators, classifier on fixtures in tests/fixtures (create 10 synthetic sample bills with obviously fake data), end-to-end job test with a fake IOcrProvider.
Update PROGRESS_B.md.
```

## B3: OCR tiers 2 and 3, golden-set harness  `[Dev 2]`  *Needs: B2*

```text
Read AGENTS.md, TRACK_B.md, 11_SECURITY_PRIVACY.md (AI use, consent), 12_NFR_TESTING_OBSERVABILITY.md (golden set).
1. Implement IOcrProvider for Azure Document Intelligence (tier 2, free F0 tier; page limits VERIFY) with config-driven quotas and graceful degradation (if down, fall back to manual-entry NeedsReview).
2. Implement tier 3: vision LLM provider with strict JSON schema output (e.g. Gemini Flash), CONSENT-GATED per organisation (a consent flag in org settings; ask Dev 1 via contract request for the setting if absent). Send the minimum image, log which tier processed each field. Default OFF. Put a warning in code and docs about free-tier training terms: use only with no-training/paid tiers for real customer bills.
3. Orchestrator policy: tier1 then tier2 on low confidence then tier3 only if consent. Cost and quota guard.
4. Golden-set harness (tests/OcrGolden): a CLI/test runner that takes a folder of images + expected JSON, runs the pipeline, and reports per-field accuracy and percent of documents needing correction, per tier. Create the folder structure and README for adding the 150 real/realistic bills. This is the headline product metric.
Tests: provider contract tests with fakes, consent gating test (tier 3 never called without consent).
Update PROGRESS_B.md.
```

## B4: Review backend  `[Dev 2]`  *Needs: B1 (uses fake IActivityWriter until A5)*

```text
Read AGENTS.md, TRACK_B.md, 06_CORE_FLOWS.md (review and confirm), 05_API_CONTRACT.md (Review), 11_SECURITY_PRIVACY.md (matrix).
Implement Review module: ReviewDecision (document_id, reviewer, mode manual/auto, at).
Endpoints: GET /review/queue (sorted lowest confidence first, filter by site/type), PUT /documents/{id}/fields (store corrected_value, keep original), POST /documents/{id}/confirm, POST /documents/bulk-confirm.
Confirm: validate required fields, call IActivityWriter.RecordConfirmedActivity (one transaction semantic: if it fails nothing is confirmed), mark document Confirmed then Calculated via IDocumentStateCommands, audit. Duplicates handled: "Keep one".
Auto-confirm (per-organisation setting, off by default): after the first 20 manual confirmations, documents with all fields at/above a high threshold may auto-confirm; 10% random sample goes to human review; auto items labelled in the audit log. Threshold in config.
Estimated-data support: a path to enter an estimate (is_estimated) for a missing month.
Tests: confirm transaction failure rollback, sampling rate test with seeded randomness, permission matrix (floor staff cannot confirm), auto-confirm gating.
Update PROGRESS_B.md; handoff B-to-ALL-review-ready.md.
```

## B5: Floor-staff capture PWA  `[Dev 2]`  *Needs: B1 (parallel with B2)*

```text
Read AGENTS.md, TRACK_B.md, 00_PROJECT_CONTEXT.md (Jahid persona), 12_NFR_TESTING_OBSERVABILITY.md (capture targets), web shell docs.
Build web/src/features/capture:
- Floor home: 4 big icons (diesel, gas, electricity, shipment), Bangla only, 2-tap flow, high contrast, large targets, icon-first.
- Camera capture with client-side crop, resize to about 1600 px, WebP/JPEG under about 400 KB, EXIF GPS stripped. Client GUID idempotency key per item.
- Offline queue in IndexedDB that survives restarts; Background Sync (Android) and app-open retry (iOS); resumable upload; clear states: queued, uploading, received, needs retake.
- Receipt confirmation ("received") immediately after upload, "My submissions" list with status and retake requests from push.
- Manual fallback entry (litres + slip number now, photo later) when camera/light is bad.
- Batch capture mode for accounts (scan 20 challans in a row).
- Web Push subscription (VAPID) for "please send diesel slip for Generator 2" prompts.
Constraints: floor route under 200 KB initial JS (CI size check), works on low-end Android, 3 s receipt target on 3G once online.
Tests: unit tests for compression and queue, Playwright offline test (go offline, capture 3, restart, go online, all uploaded once).
Use the Contracts fake/mock server (MSW) until B1 endpoints are deployed locally.
Update PROGRESS_B.md.
```

## B6: Review UI  `[Dev 2]`  *Needs: B4*

```text
Read AGENTS.md, TRACK_B.md, 06_CORE_FLOWS.md (review), 10_REPORTING_SPEC.md only for labelling rules (estimated vs verified).
Build web/src/features/review for Rahim (accountant): left = original image (zoom, rotate), right = fields. Clicking a field highlights its bbox on the bill. Low-confidence fields amber and focused first. Keyboard: Tab, Enter = confirm, N = next document. Queue sorted lowest confidence first. Bulk confirm UI (visible only when organisation enabled it). Duplicate resolution ("keep one"). Failed/retake request button. Show Bangla digits, BDT and local dates. Real-time updates via SignalR with polling fallback.
Tests: keyboard-flow component test, Playwright review of 5 documents under a time budget.
Update PROGRESS_B.md.
```

---

# PHASE 1: TRACK C (Dev 3): Insights and Output

## C1: Gap detection  `[Dev 3]`  *Needs: G1*

```text
Read AGENTS.md, TRACK_C.md, 06_CORE_FLOWS.md (missing-data detection), 08_FLAGS_SPEC.md (Missing document).
Implement GapDetection module: MissingAlert (due date, owner, escalation state). Nightly Hangfire job AND event-driven on DocumentUploaded: compare IExpectedDocRuleReader expansion with IDocumentReadModel for each org/site/asset/period.
Escalation: day -7 reminder, day -3 push to responsible user, day 0 to compliance officer; amber until deadline then red. Floor staff only see a plain request: "please send diesel slip for Generator 2" (bn/en strings as i18n keys).
Endpoints: GET /gaps?period=, POST /gaps/{id}/nudge. Raise MissingAlertRaised; resolve automatically when the document arrives.
Use fakes until A3 and B1 land. Tests: escalation timeline with fake clock, auto-resolve, multi-asset orgs, tenant isolation.
Update PROGRESS_C.md.
```

## C2: Notifications  `[Dev 3]`  *Needs: C1*

```text
Read AGENTS.md, TRACK_C.md, 11_SECURITY_PRIVACY.md, 08_FLAGS_SPEC.md (flag fatigue).
Implement Notifications module: Notification, PushSubscription, INotifier implementations: in-app, Web Push (VAPID), email via Brevo or Resend behind an interface (config chooses), weekly digest job. Preferences per user (channel, quiet hours). Language per user. Templates with bn/en.
Flag fatigue: respect "top 5 on dashboard" via digest content, collapse repeated alerts, snooze with reason.
Subscribe to MissingAlertRaised, FlagRaised, document Failed/retake events.
Tests: template rendering bn/en, digest content, snooze, provider failure does not break the caller (retry with backoff).
Update PROGRESS_C.md; handoff C-to-B-notifier.md (so B can send retake pushes).
```

## C3: Flags engine and data-quality rules  `[Dev 3]`  *Needs: G1 (parallel with C1/C2)*

```text
Read AGENTS.md, TRACK_C.md, 08_FLAGS_SPEC.md, seeds/flags/flag_rules.json, 04_DATA_MODEL.md.
Implement Flags module: FlagRule table (parameters editable by Platform Admin without deployment, loaded from seed), Flag record {id, org, site, rule, severity, period, evidence (document and record ids), plain-language explanation bn+en, suggested action, state}, lifecycle Open, Acknowledged, Resolved (auto when condition clears), Dismissed (reason required, expires in 30 days).
Rule engine: IFlagRuleEvaluator per rule, deterministic, evaluated after each DocumentConfirmed/EmissionCalculated and nightly. Evidence must be stored.
Data-quality rules first: missing document, low OCR confidence, duplicate suspected, implausible value (3 x IQR of the asset's history or unit mismatch), estimated share above 10%.
Endpoints: GET /flags?state=open, POST /flags/{id}/acknowledge, /dismiss. Dashboard query returns top 5 by severity then recency.
Implement IFlagRaiser and IFlagReader. Use fakes for read models until A5/B1 land.
Tests: each rule with boundary cases, auto-resolve, dismissal expiry with fake clock, explanation strings in both languages.
Update PROGRESS_C.md.
```

## C4: Footprint, buyer-readiness flags, intensity and benchmarks  `[Dev 3]`  *Needs: C3*

```text
Read AGENTS.md, TRACK_C.md, 08_FLAGS_SPEC.md (footprint, readiness, bill-based savings, intensity), 06_CORE_FLOWS.md.
1. Insights module: ProductionMetric (org, site, period, unit, quantity), intensity = kg CO2e per unit of output (verified-only variant and incl-estimate variant), trends, BenchmarkSet (sector, size_band, metric, p25/p50/p75/p90, n, source, year). Benchmark is returned only when n is sufficient (config), otherwise the API returns "no benchmark yet".
2. Add evaluators: month-on-month spike (1.3x amber, 1.6x red vs trailing 3-month median), hotspot (one source above 50%), generator reliance (diesel-generated electricity above 20%), intensity above peers (P75/P90, only with enough peers), target drift, report not ready, factor outdated, override unapproved, power-factor or demand-charge penalty (read from extracted fields).
3. Endpoints: GET /dashboard/intensity and production metric capture endpoint implementation owned here (coordinate with A3 handoff).
Thresholds from FlagRule, never constants.
Tests: spike with fewer than 3 months of history (no flag), benchmark gating, each evaluator boundary.
Update PROGRESS_C.md.
```

## C5: Measure Library and Recommendations engine  `[Dev 3]`  *Needs: G1 (parallel)*

```text
Read AGENTS.md, TRACK_C.md, 09_RECOMMENDATIONS_SPEC.md, seeds/measures, 04_DATA_MODEL.md.
Implement Recommendations module: Measure, MeasureSource (every number needs a source row; evidence_grade A/B/C), Recommendation (org, measure, saving_range, capex_range, payback_range, status, realised_saving), versioned dataset loader (IDatasetLoader<Measure>, validation fails if any numeric field lacks a source).
Pipeline (each step a separately testable class): 1 profile (confirmed data + facility questionnaire + tariff BDT/kWh and BDT/litre derived from the factory's own bills) 2 eligibility (applicability_rules machine-readable) 3 impact tCO2e = baseline x saving% x factor for low/typical/high 4 money: BDT saved/year = avoided energy x own tariff, payback = capex / annual saving, cost per tCO2e = (annualised capex - annual saving) / tCO2e avoided 5 realism filters (budget band, lead time, "needs an energy audit" above a spend threshold from config) 6 rank (composite of payback, tCO2e avoided, evidence grade, effort; weights in config) top 5 plus full list for abatement chart 7 explain ("Why this?", range not single value, grade, source, assumptions, next step, financing note) 8 close the loop: PUT /recommendations/{id}/status (Planned/Done/NotFeasible with reason), on Done compare before/after bills and store realised saving, upgrade measure evidence over time (record only, do not auto-edit the library).
Endpoints: GET /recommendations, PUT /recommendations/{id}/status, POST /profile/facility (shared with Onboarding, agree via handoff).
No ML. Never hard-code savings figures; tests use FAKE_ measures only.
Tests: each step unit-tested, range ordering (low <= typical <= high), no solar when roof area unknown, negative cost-per-tonne handling.
Update PROGRESS_C.md.
```

## C6: Reporting backend  `[Dev 3]`  *Needs: G1 (uses fakes until A5)*

```text
Read AGENTS.md, TRACK_C.md, 10_REPORTING_SPEC.md, 07_CALCULATION_RULES.md (boundary, limitations), 06_CORE_FLOWS.md.
FIRST do the Day-1 spike: confirm Bangla text renders correctly in QuestPDF with Noto Sans Bengali (record result and licence check for QuestPDF as VERIFY in 15_DECISIONS.md). If it fails, switch IReportRenderer to Playwright HTML-to-PDF.
Implement Reporting module: Report (state machine Draft, ReadyForReview, Approved, Locked, Superseded), ReportSnapshot (freezes data, factors and a content hash; Locked prevents edits; later change creates new version), ShareLink (expiring, read-only, optional redact_prices, trace-to-source).
Dashboard summary endpoints: GET /dashboard/summary?period=, /dashboard/trend (verified vs estimated split, hatch flag for estimated).
Buyer PDF via IReportRenderer (QuestPDF): cover, boundary and method statement, totals by scope/category/month, intensity metrics, factor table with source and year, data-quality statement + Data Quality Score, per-figure document references, limitations ("estimate aligned with GHG Protocol methodology, not audited or certified"), quarterly/half-year comparison pages, Bangla and English versions.
Excel data sheet via ClosedXML; buyer-template mapping as a field-mapping JSON file so one dataset serves several buyer formats.
Endpoints: POST /reports, /reports/{id}/approve, GET /reports/{id}/pdf, POST /reports/{id}/share, auditor read endpoint with figure -> source document + factor.
Tests: snapshot hash stability, locked report immutability, share link expiry with fake clock, redaction removes prices from every output, golden PDF text tests in both languages.
Update PROGRESS_C.md.
```

## C7: Frontend: dashboard, flags, recommendations, reports, auditor  `[Dev 3]`  *Needs: C3, C5, C6*

```text
Read AGENTS.md, TRACK_C.md, 00_PROJECT_CONTEXT.md (personas), 10_REPORTING_SPEC.md, 08_FLAGS_SPEC.md, 09_RECOMMENDATIONS_SPEC.md, web shell docs.
Build in web/src/features/dashboard, flags, recommendations, reports, auditor:
- Role dashboards: Owner = total, trend, top 3 flags, top 3 actions in BDT; Accountant = review queue count and missing documents; Compliance = report readiness checklist and Data Quality Score; Consultant = all client orgs with flags.
- Charts (Chart.js): trend with hatched estimated segments, scope breakdown, intensity vs benchmark ("no benchmark yet" state), abatement-cost chart.
- Flags: top 5 cards, severity, "what to do" button deep-linking to evidence documents, acknowledge, dismiss with reason, snooze.
- Recommendations: top 5 cards with range (never single value), evidence grade badge, source link, assumptions, "Why this?", Planned/Done/Not feasible with reason, financing note.
- Reports: readiness checklist, preview, approve, share-link dialog (expiry, redact prices), download PDF/Excel.
- Auditor read-only view: click any figure to see the source document and factor.
Everything bn/en, Bangla digits, BDT. Use MSW mocks based on Contracts DTOs until the backends are running.
Tests: component tests for range display and empty states, Playwright report approval flow.
Update PROGRESS_C.md.
```

---

# SYNC AND GATES

## S1: Daily sync (end of every day, all three devs; 10 minutes)

```text
Daily sync routine for <A|B|C>. 
1) git fetch and rebase my branch on main; resolve conflicts only inside my owned folders. If a conflict touches someone else's folder, stop and create a contract request or message the owner.
2) Run dotnet build, dotnet test, architecture tests, and npm run build in web/ (if I touched it).
3) Update docs/ai/progress/PROGRESS_<track>.md: done, in progress, blocked, next prompt.
4) List in docs/ai/handoffs/ anything another dev is waiting for. List in docs/ai/contract-requests/ any contract change I need.
5) Check items addressed to me. Report a 5-line summary. Do not change code outside my track.
```

## S2: Contract change review (Dev 1 acts on requests)

```text
Read all files in docs/ai/contract-requests/ with status "open". For each: check it is truly cross-module (not solvable inside one module), propose the smallest additive change (prefer adding members/new DTO fields as optional over breaking changes), update Contracts + Fakes + contracts-overview.md + abstract contract tests, bump tag to contracts-v0.<n+1>, and mark the request "approved with note" or "rejected with reason". Notify affected devs in docs/ai/handoffs/A-to-ALL-contracts-vX.md. Never break existing consumers without a migration note.
```

## Gate checklist

| Gate | Pass condition |
|---|---|
| **G0** | All context docs merged, no contradictions, TRACK files read by each dev |
| **G1** | Solution builds, `contracts-v0.1` tagged, fakes pass contract tests, PWA shell builds under size budget |
| **G2** | Every Phase 1 prompt checked off in PROGRESS files, each module's tests green with fakes |
| **G3** | Full E2E (upload, OCR, review, calculation, flag, report) green on real implementations |
| **G4** | Isolation audit clean, golden-set accuracy reported, backups restored once, pilot deploy rehearsed |

---

# PHASE 2: INTEGRATION

## I1: Replace fakes with real implementations  `[Dev 1]`  *Needs: G2*

```text
Read AGENTS.md, contracts-overview.md, all handoffs/.
Wire the host: UseFakes=false registers real implementations; list every interface and confirm its real owner is registered. Run every abstract contract test suite against the real implementations and fix owner-side gaps (only in my modules; file requests for others). Build a "dev seed" command that loads seeds/dev into real tables via real modules. Document startup in README.
Done when: the app runs end-to-end with zero fakes and all contract tests pass on real implementations.
```

## I2: End-to-end pipeline test  `[Dev 2]`  *Needs: I1*

```text
Read AGENTS.md, TRACK_B.md, 06_CORE_FLOWS.md.
Write Playwright + integration E2E: floor staff joins by QR, captures a diesel slip offline, comes online, receipt shown, OCR job runs (use fixture + fake provider for determinism), accountant reviews and confirms, EmissionResult created with factor version, dashboard figure changes, a data-quality flag raised for a planted bad document, report generated and approved. Add a variant for manual fallback entry and one for duplicate upload. Fix defects in my modules, file issues/requests for others.
Done when: E2E runs in CI in under 10 minutes and is green.
```

## I3: Role dashboards and buyer PDF on real data  `[Dev 3]`  *Needs: I1*

```text
Read AGENTS.md, TRACK_C.md, 10_REPORTING_SPEC.md.
Replace MSW mocks with real API, verify every dashboard number equals the underlying EmissionResult sums (add reconciliation tests), verify the PDF per-figure document references resolve, verify estimated vs verified labelling in UI, PDF and Excel, verify flags and recommendations render with real seeds. Fix defects in my modules.
Done when: reconciliation tests and PDF golden tests pass on real data in both languages.
```

### GATE G3 (full E2E green), then the next three run in parallel

## I4: Security hardening and isolation audit  `[Dev 1]`

```text
Read AGENTS.md, 11_SECURITY_PRIVACY.md. Run an OWASP ASVS checklist pass, document gaps, fix: secure cookies, lockout, rate limits, secrets handling, least-privilege DB user, dependency scan results. Write adversarial tests: org A user tries org B IDs on every endpoint (IDOR sweep generated from the OpenAPI), expired/forged share links, floor-staff hitting accountant endpoints. Verify audit log coverage for confirm, correct, override, approve, share, export.
Done when: sweep test covers 100% of endpoints and passes, report saved in docs/ai/security-review.md.
```

## I5: Golden OCR set and offline torture  `[Dev 2]`

```text
Read AGENTS.md, TRACK_B.md, 12_NFR_TESTING_OBSERVABILITY.md. Help the team assemble at least 150 real or realistic bills (mixed Bangla/English, wet, crumpled, handwritten) with expected JSON using the harness. Report per-field accuracy and percent needing correction per tier into docs/ai/golden-set-report.md, identify the top 5 failure patterns, and improve preprocessing/templates/validators accordingly. Test offline queue under airplane-mode toggling, app kill, low storage, and 3G throttling.
Done when: baseline report committed and a regression threshold added to CI.
```

## I6: Observability and rule tuning  `[Dev 3]`

```text
Read AGENTS.md, TRACK_C.md, 12_NFR_TESTING_OBSERVABILITY.md. Add business metrics (documents per org per week, review time per document, OCR tier mix, percent corrected, flags raised/resolved, recommendations marked done) through OpenTelemetry; dashboards-as-code for Grafana Cloud; Sentry wiring for client and server. Review flag volumes on the dev dataset to check flag fatigue (top-5 view, digest). Document threshold tuning procedure for pilot in docs/ai/flag-tuning.md.
Done when: metrics visible locally via OTEL collector and the tuning doc exists.
```

## I7: Consultant workspace and factor override flow  `[Dev 1]`  *Needs: A5, C6*

```text
Read AGENTS.md, TRACK_A.md, 00_PROJECT_CONTEXT.md (Farhana), 11_SECURITY_PRIVACY.md (matrix).
Build the consultant workspace (backend support in Identity plus web/src/features/consultant): one login many client organisations, client list with flags summary (via IFlagReader), switch org, factor override request with mandatory justification, approval by Owner/Compliance, "Override unapproved" flag integration. Respect tenant isolation: consultant sees only orgs they have a Membership in.
Tests: multi-org isolation, override approval flow.
```

---

# PHASE 3: PILOT

## I8: Pilot deployment  `[Dev 1]`

```text
Read AGENTS.md, 01_ARCHITECTURE.md (deployment), 12_NFR_TESTING_OBSERVABILITY.md.
Create infra for pilot: docker-compose (api, worker with Tesseract installed, postgres with volume, optional redis), Caddy for auto TLS, environment files outside repo, GitHub Actions build -> GHCR -> deploy over SSH, environments dev/staging/prod, nightly encrypted Postgres dump to a separate R2 bucket, a restore-drill script and runbook (RPO 24 h, RTO 4 h). Frontend on Cloudflare Pages config.
Done when: staging deploy is one command, restore drill completed once and documented.
```

## I9: Usability tests  `[Dev 2]`

```text
Read AGENTS.md, TRACK_B.md, 12_NFR_TESTING_OBSERVABILITY.md (usability). Prepare a usability test kit in docs/ai/usability/: tasks per persona, success criteria (floor staff submits a slip unaided under 20 s), observation sheet, 5 users per persona. After sessions, convert findings into prioritised issues for each track.
```

## I10: Pilot data and expert review  `[Dev 3]`

```text
Read AGENTS.md, TRACK_C.md, docs/ai/seed-data-todo.md. Prepare the expert review pack: factor sets, measure library rows with sources and evidence grades, benchmark sets, flag thresholds. Produce a checklist for expert sign-off per dataset release, a source register (VERIFY each), and a plan to validate flag thresholds against pilot interviews (n = 17 survey is small; do not over-trust it).
```

---

## Appendix A: Handoff file template

```text
# Handoff: <FROM> -> <TO>: <topic>
Date:
What is ready: (endpoints / interfaces / events, with paths)
How to use it: (example request/response or code snippet)
Seeded dev data / credentials:
Known gaps and workarounds:
What I need back (if anything):
```

## Appendix B: Contract request template

```text
# Contract request: <date>-<FROM>-<topic>
Status: open | approved | rejected
Why (what I cannot do today):
Proposed change (smallest additive change):
Affected modules/devs:
Workaround until approved:
```

## Appendix C: Progress file template

```text
# PROGRESS_<track>
| Prompt | Status (todo/doing/done/blocked) | Branch/PR | Notes |
Blocked on:
Next prompt:
Open questions logged in 15_DECISIONS.md:
```

## Appendix D: Recommended calendar (3 people, about 4 to 5 weeks, adjust to reality)

| Week | Dev 1 (A) | Dev 2 (B) | Dev 3 (C) |
|---|---|---|---|
| 0 (days 1 to 2) | P0-1a, P0-2, P0-5 | P0-1b, P0-3, review P0-5 | P0-1c, P0-4, review P0-5 |
| 1 | A1, A2, A4 | B1, B2, B5 | C1, C3, C6 spike |
| 2 | A3, A5 | B3, B4 | C2, C4, C5 |
| 3 | A6, A7 | B6, polish B5 | C6, C7 |
| 4 | I1, I4 | I2, I5 | I3, I6 |
| 5 | I7, I8 | I9 | I10 |

## Appendix E: Tips for working with the agents

1. Always start a session with the **session start line**. Agents forget; files do not.
2. Give one prompt at a time. If an agent proposes something outside its owned folders, tell it to write a contract request instead.
3. When a prompt is too big for one session, tell the agent: "Do the first third, update PROGRESS file with exactly what remains, stop."
4. After each prompt, ask the agent: "List assumptions you made that are not in docs/ai and append them to 15_DECISIONS.md."
5. Never let an agent fill in emission factors, savings percentages, or benchmark numbers from memory. Real values come from the sources named in the PDF, checked by your domain expert.
