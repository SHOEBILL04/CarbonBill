# CarbonBill AI Agent Guide (AGENTS.md)

Welcome to the **CarbonBill** project. This file is the primary entry point and authoritative operating manual for all AI agents working on this codebase.

---

## 1. Purpose of this Document

CarbonBill is built concurrently by three developers/AI-agent pairs:
- **Dev 1 (Track A):** Platform and Data Backbone
- **Dev 2 (Track B):** Capture and Extraction
- **Dev 3 (Track C):** Insights and Output

To avoid merge conflicts, broken context, and architectural drift, all development is **contract-first**, **strictly partitioned by folder ownership**, and documented in `docs/ai/`. Agents communicate and maintain state via files, not conversational memory.

---

## 2. Navigating `docs/ai/`

Before taking any action, locate your required documentation in `docs/ai/`:

### Foundation & Context
- [00_PROJECT_CONTEXT.md](file:///home/rakibul/Projects/CarbonBill/docs/ai/00_PROJECT_CONTEXT.md): Product vision, user pains, personas, design principles, scope, and non-goals.
- [01_ARCHITECTURE.md](file:///home/rakibul/Projects/CarbonBill/docs/ai/01_ARCHITECTURE.md): System context, tech stack, modular monolith structure, containers, and deployment.
- [02_MODULES_AND_OWNERSHIP.md](file:///home/rakibul/Projects/CarbonBill/docs/ai/02_MODULES_AND_OWNERSHIP.md): Strict module ownership table, frontend folder split, and boundary rules.

### Detailed Specifications
- [03_DOMAIN_GLOSSARY.md](file:///home/rakibul/Projects/CarbonBill/docs/ai/03_DOMAIN_GLOSSARY.md): Plain-language domain terms in English and Bangla context *(owned by Dev 2 / P0-1b)*.
- [04_DATA_MODEL.md](file:///home/rakibul/Projects/CarbonBill/docs/ai/04_DATA_MODEL.md): Full database schema, columns, RLS rules, and entity relationships *(owned by Dev 2 / P0-1b)*.
- [05_API_CONTRACT.md](file:///home/rakibul/Projects/CarbonBill/docs/ai/05_API_CONTRACT.md): REST endpoints under `/api/v1`, shapes, roles, and status codes *(owned by Dev 2 / P0-1b)*.
- [06_CORE_FLOWS.md](file:///home/rakibul/Projects/CarbonBill/docs/ai/06_CORE_FLOWS.md): Capture, review, missing data workflows, and 4 state machines *(owned by Dev 2 / P0-1b)*.
- [07_CALCULATION_RULES.md](file:///home/rakibul/Projects/CarbonBill/docs/ai/07_CALCULATION_RULES.md): GHG formulas, canonical units, rounding, and emission factor logic *(owned by Dev 3 / P0-1c)*.
- [08_FLAGS_SPEC.md](file:///home/rakibul/Projects/CarbonBill/docs/ai/08_FLAGS_SPEC.md): Flag families, trigger rules, fatigue controls, and lifecycle *(owned by Dev 3 / P0-1c)*.
- [09_RECOMMENDATIONS_SPEC.md](file:///home/rakibul/Projects/CarbonBill/docs/ai/09_RECOMMENDATIONS_SPEC.md): Measure library schema, 8-step pipeline, and payback in BDT *(owned by Dev 3 / P0-1c)*.
- [10_REPORTING_SPEC.md](file:///home/rakibul/Projects/CarbonBill/docs/ai/10_REPORTING_SPEC.md): Role dashboards, QuestPDF layout, Excel export, and auditor links *(owned by Dev 3 / P0-1c)*.
- [11_SECURITY_PRIVACY.md](file:///home/rakibul/Projects/CarbonBill/docs/ai/11_SECURITY_PRIVACY.md): Roles matrix, upload sanitisation, privacy promises, and tier 3 consent *(owned by Dev 3 / P0-1c)*.
- [12_NFR_TESTING_OBSERVABILITY.md](file:///home/rakibul/Projects/CarbonBill/docs/ai/12_NFR_TESTING_OBSERVABILITY.md): Performance targets, golden OCR test set, Testcontainers, and OTEL *(owned by Dev 3 / P0-1c)*.

### Conventions & Workflow
- [13_CONVENTIONS.md](file:///home/rakibul/Projects/CarbonBill/docs/ai/13_CONVENTIONS.md): C# standards, module layout, decimal precision, problem+json, and i18n rules.
- [14_WORKFLOW_GIT.md](file:///home/rakibul/Projects/CarbonBill/docs/ai/14_WORKFLOW_GIT.md): Branching rules, PR format, contract-change protocol, daily sync (S1), and Gates G0..G4.
- [15_DECISIONS.md](file:///home/rakibul/Projects/CarbonBill/docs/ai/15_DECISIONS.md): 6 decisions to confirm from architecture, open questions, and ADR log.
- [16_ROADMAP_STATUS.md](file:///home/rakibul/Projects/CarbonBill/docs/ai/16_ROADMAP_STATUS.md): Roadmap tracker across Phases 0 to 3.

### Tracks, Progress & Handoffs
- Tracks: [TRACK_A.md](file:///home/rakibul/Projects/CarbonBill/docs/ai/tracks/TRACK_A.md) | `TRACK_B.md` | `TRACK_C.md`
- Progress: [PROGRESS_A.md](file:///home/rakibul/Projects/CarbonBill/docs/ai/progress/PROGRESS_A.md) | `PROGRESS_B.md` | `PROGRESS_C.md`
- Inter-Agent Handoffs: `docs/ai/handoffs/` (named `<FROM>-to-<TO>-<topic>.md`)
- Contract Requests: `docs/ai/contract-requests/` (named `<date>-<FROM>-<topic>.md`)

---

## 3. The 16 CarbonBill Agent Rules

Every agent operating in this repository must strictly adhere to these rules:

1. **Read docs first:** Read [00_PROJECT_CONTEXT.md](file:///home/rakibul/Projects/CarbonBill/docs/ai/00_PROJECT_CONTEXT.md) and your specific track file (`TRACK_A.md`, `TRACK_B.md`, or `TRACK_C.md`) before working.
2. **Strict folder ownership:** Only edit folders you own (see [02_MODULES_AND_OWNERSHIP.md](file:///home/rakibul/Projects/CarbonBill/docs/ai/02_MODULES_AND_OWNERSHIP.md)). Never edit another dev's module or feature folder.
3. **Frozen Contracts project:** `src/CarbonBill.Contracts` is frozen after tag `contracts-v0.1`. To change it, create `docs/ai/contract-requests/<date>-<from>-<topic>.md` and stop; do not edit it yourself unless you are the Contracts owner (Dev 1) and the request is approved.
4. **Build against contracts:** Build against Contracts interfaces. If a real implementation does not exist yet, use the fake from `CarbonBill.Contracts.Fakes`.
5. **Exact decimal precision:** Money = `decimal numeric(18,2)` BDT. Quantities and emission factors = `decimal numeric(18,6)`. Never use `float` or `double`.
6. **Dual tenant isolation:** Every tenant table has `org_id`. Enforce with EF Core global query filter **AND** PostgreSQL row-level security (RLS).
7. **No hard-coded factors or parameters:** Never hard-code emission factors, savings %, capex, or thresholds. They live in `seeds/` and database tables, each with a verifiable source row.
8. **Honest numbers:** Label estimated figures as "estimated", show ranges (low / typical / high), and display "no benchmark yet" when peer data is thin.
9. **Bilingual i18n:** Every user-visible string must exist in Bangla and English (`i18n` keys, no inline strings). Bangla digits (১২৩৪৫৬৭৮৯০) and BDT currency formatting in the UI.
10. **Full traceability:** Every figure must be traceable: original document, emission factor version, and confirming user.
11. **Abstract paid dependencies:** Every paid-capable dependency sits behind an interface (`IOcrProvider`, `IFileStore`, `INotifier`, `IReportRenderer`).
12. **Rigorous testing:** Unit tests for logic, Testcontainers with PostgreSQL for database integration, and a tenant-isolation test for every new tenant table.
13. **Small atomic commits:** Small commits, branch name `feat/<track>-<prompt-id>-<slug>`, PR into `main`, squash merge.
14. **Document completion & handoff:** Finish every task by updating `docs/ai/progress/PROGRESS_<track>.md` and writing a handoff file in `docs/ai/handoffs/` if another dev depends on your work.
15. **Log open questions:** If something is unclear or conflicts with the docs, write the question in [15_DECISIONS.md](file:///home/rakibul/Projects/CarbonBill/docs/ai/15_DECISIONS.md) under "Open questions" and proceed with the safest assumption. Do not invent numbers.
16. **GHG Protocol disclaimer:** Outputs are estimates aligned with GHG Protocol methodology, not audited or certified. All generated reports must explicitly state this.

---

## 4. Session-Start Routine

At the start of every new AI session, the user will paste:

```text
Read AGENTS.md, docs/ai/00_PROJECT_CONTEXT.md, docs/ai/tracks/TRACK_<A|B|C>.md and docs/ai/progress/PROGRESS_<A|B|C>.md. Check docs/ai/handoffs/ and docs/ai/contract-requests/ for items addressed to me. Summarise in 5 lines where we are and what the next prompt is. Do not start coding until I confirm.
```

When you receive this prompt:
1. Load `AGENTS.md`, [00_PROJECT_CONTEXT.md](file:///home/rakibul/Projects/CarbonBill/docs/ai/00_PROJECT_CONTEXT.md), and your assigned track and progress files.
2. Check `docs/ai/handoffs/` and `docs/ai/contract-requests/` for items addressed to you.
3. Summarise in exactly 5 lines your current progress, blockers, and the next scheduled prompt.
4. Stop and wait for user confirmation before executing any tool or code modifications.

---

## 5. Team Split Summary

| Dev | Track | Owns (Backend) | Owns (Frontend `web/src/features/`) |
|---|---|---|---|
| **Dev 1** | **A: Platform and Data Backbone** | `SharedKernel`, `Api` host, `IdentityTenancy`, `Onboarding`, `ActivityUnits`, `FactorRegistry`, `Calculation`, `Audit`, `PlatformAdmin`, `infra` | `auth`, `onboarding`, `admin`, `consultant` |
| **Dev 2** | **B: Capture and Extraction** | `Documents`, `Extraction`, `Review` | `capture` (floor PWA), `review`, app shell (`web/src/app`) & shared UI kit (`web/src/shared`) |
| **Dev 3** | **C: Insights and Output** | `GapDetection`, `Notifications`, `Flags`, `Insights`, `Recommendations`, `Reporting` | `dashboard`, `flags`, `recommendations`, `reports`, `auditor` |

---

## 6. Pointer Files

- Claude-based agents: See [CLAUDE.md](file:///home/rakibul/Projects/CarbonBill/CLAUDE.md), which redirects to this file.
