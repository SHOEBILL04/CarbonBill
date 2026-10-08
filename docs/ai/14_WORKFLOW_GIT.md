# 14. Git Workflow, Synchronization & Gates

## 1. Branching Strategy

To maintain clean parallel development without merge conflicts across the three tracks:

- **Main Branch:** `main` represents the stable integration line. Direct pushes to `main` are disabled.
- **Documentation Branches:** `docs/<prompt-id>` (e.g. `docs/p0-1a`, `docs/p0-1b`, `docs/p0-1c`).
- **Feature Branches:** Named strictly according to track, prompt identifier, and slug:
  - Pattern: `feat/<track>-<prompt-id>-<slug>`
  - Examples:
    - `feat/a-a1-building-blocks`
    - `feat/b-b1-documents-backend`
    - `feat/c-c1-gap-detection`
- **Isolation Principle:** Developers only modify files inside their designated module or feature folders. Branches should remain short-lived (1 to 2 days maximum).

---

## 2. Pull Request (PR) Rules

1. **Target Branch:** All feature PRs target `main`.
2. **Review & Approval:**
   - Changes confined to a single track require review from that track's owner.
   - Any PR touching `src/CarbonBill.Contracts` requires approval from **all three developers**.
3. **Automated CI Checks:**
   - `dotnet build --configuration Release`
   - `dotnet test --no-build` (All unit, architecture, and integration tests must pass)
   - NetArchTest architecture verification
   - `npm run build` in `web/` (bundle size for floor route must remain <200 KB)
4. **Merge Method:** **Squash and Merge** only. Commit message must cite prompt ID and deliverable description.

---

## 3. Contract-Change Protocol

`src/CarbonBill.Contracts` is the single source of truth for all cross-module data types, interfaces, events, and fakes. It is **frozen** once tagged with `contracts-v0.1` at Gate G1.

If a developer requires an interface modification, new domain event, or DTO change:

1. **Submit Contract Request:**
   The developer creates a markdown file in `docs/ai/contract-requests/<date>-<from>-<topic>.md` using the standard template:
   ```markdown
   # Contract request: <YYYY-MM-DD>-<FROM>-<topic>
   Status: open
   Why (what I cannot do today):
   Proposed change (smallest additive change):
   Affected modules/devs:
   Workaround until approved:
   ```
2. **Do Not Touch Contracts Directly:** The requesting developer implements a temporary localized workaround or mock and stops.
3. **Steward Review (Dev 1 / S2 Routine):**
   - Dev 1 reviews all open requests daily.
   - Dev 1 ensures the change is strictly cross-module and prefers **backward-compatible, additive changes** (optional properties, new methods).
   - Dev 1 updates `CarbonBill.Contracts`, updates `CarbonBill.Contracts.Fakes`, updates contract tests, bumps the version tag (`contracts-v0.<N+1>`), and updates `docs/ai/contracts-overview.md`.
   - Dev 1 posts a notification in `docs/ai/handoffs/A-to-ALL-contracts-vX.md` and marks the request file as `approved with note`.

---

## 4. Daily Synchronization (S1 Routine)

At the conclusion of each working day, all three developers run the **S1 Sync Routine** (approx. 10 minutes):

1. **Fetch and Rebase:**
   Run `git fetch origin` and `git rebase origin/main` on your active branch. Resolve any merge conflicts **only within your owned folders**. If a conflict arises in another track's folder, halt and notify the owning developer.
2. **Build and Test Verification:**
   Verify the entire workspace compiles cleanly:
   - Backend: `dotnet build && dotnet test`
   - Architecture: NetArchTest passes
   - Frontend: `npm run build` (if touched)
3. **Update Progress Log:**
   Update your designated progress file (`docs/ai/progress/PROGRESS_<track>.md`) recording:
   - Completed prompts
   - In-progress tasks
   - Blockers
   - Next prompt to be executed
4. **Log Handoffs and Requests:**
   - Add new dependency notices in `docs/ai/handoffs/`.
   - Add new contract needs in `docs/ai/contract-requests/`.
5. **Review Inbound Notices:**
   Inspect incoming handoffs addressed to you and confirm readiness. Output a concise 5-line summary.

---

## 5. Project Quality Gates (G0 to G4)

Project progression is regulated by five explicit quality gates. No track may advance beyond a gate until all criteria are satisfied:

| Gate | Name | Gate Passing Criteria |
|---|---|---|
| **G0** | **Context & Docs Alignment** | All P0-1 documentation PRs (`00_PROJECT_CONTEXT.md` through `16_ROADMAP_STATUS.md`) merged into `main`. No contradictions found in `15_DECISIONS.md`. Every developer has verified their track scope. |
| **G1** | **Contracts Frozen & Scaffolding Green** | Solution builds cleanly; `contracts-v0.1` tagged; all fakes pass abstract contract tests; PWA shell compiles with floor route under 200 KB; seed data schemas validated. |
| **G2** | **MVP Track Deliverables Complete** | Every prompt across Tracks A, B, and C checked off as `done` in `PROGRESS_A.md`, `PROGRESS_B.md`, and `PROGRESS_C.md`. All module test suites pass using Contracts Fakes. |
| **G3** | **Integrated End-to-End Pipeline Green** | Fakes swapped for real implementations (`UseFakes=false`). Full E2E flow (Upload -> OCR -> Review -> Calculation -> Flag -> Report) passes cleanly in CI via automated Playwright and integration suites. |
| **G4** | **Production & Pilot Readiness** | Multi-tenant isolation security scan clean across 100% of tables; Golden OCR benchmark report committed (>150 sample bills); database backup/restore drill successfully validated; pilot environment deployed behind Caddy. |
