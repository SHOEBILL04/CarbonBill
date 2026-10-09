# PROGRESS_A: Track A Progress Tracker (Dev 1)

## Deliverables Status

| Prompt | Description | Status | Branch / PR | Notes |
|---|---|---|---|---|
| **P0-1a** | Core context docs + AGENTS.md | done | `docs/p0-1a` | Initialized repository skeleton and foundational guides |
| **P0-2** | .NET solution scaffold + infra | done | `feat/a-p0-2-scaffold` | Solution setup, modular monolith class libraries, NetArchTest guard |
| **P0-5** | Contracts + Fakes | done | `feat/a-p0-5-contracts` | Contracts, DTOs, domain events, and in-memory Fakes |
| **A1** | Building blocks & tenancy RLS | done | `feat/a-a1-tenancy-rls` | Multi-schema SQLite/EF Core, global query filters, interceptors, problem+json |
| **A2** | Identity and Tenancy | done | `feat/a-a2-identity` | JWT tokens, refresh cookies, floor staff QR join with 4-digit PIN, org switching |
| **A3** | Onboarding & expected documents | done | `feat/a-a3-onboarding` | Sites, assets, expected doc rules, facility questionnaire profile, RMG template |
| **A4** | Units & Factor Registry | done | `feat/a-a4-factor-registry`| Canonical unit conversion, immutable factor sets, override hierarchy with justification |
| **A5** | Activity & Calculation | done | `feat/a-a5-calculation` | `IActivityWriter` pipeline, decimal(18,6) GHG formula, audit logging, read models |
| **A6** | Platform Admin & isolation tests | done | `feat/a-a6-admin-isolation`| Dataset versioning, tenant overview metrics, 100% tenant table isolation test suite |
| **A7** | Frontend (auth, onboarding, admin)| done | `feat/a-a7-frontend` | React web features for auth, onboarding wizard, admin dashboard, consultant workspace |
| **I1** | Real module wiring (swap fakes) | todo | - | Host integration with `UseFakes=false` |
| **I4** | Security hardening & audit | todo | - | OWASP ASVS checklist, adversarial IDOR sweep |
| **I7** | Consultant workspace | todo | - | Multi-tenant consultant workspace |
| **I8** | Pilot deployment & backups | todo | - | VPS Docker Compose behind Caddy, backup restore drill |

---

**Blocked on:** None. All Track A Core Prompts (P0-1a, P0-2, P0-5, A1, A2, A3, A4, A5, A6, A7) Completed!

**Next prompt:** Phase 2 Integration & Hardening (I1, I4, I7, I8).

**Open questions logged in 15_DECISIONS.md:**
- None currently blocking Track A.
