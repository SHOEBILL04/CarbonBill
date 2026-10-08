# PROGRESS_A: Track A Progress Tracker (Dev 1)

## Deliverables Status

| Prompt | Description | Status | Branch / PR | Notes |
|---|---|---|---|---|
| **P0-1a** | Core context docs + AGENTS.md | done | `docs/p0-1a` | Initialized repository skeleton and foundational guides |
| **P0-2** | .NET solution scaffold + infra | todo | - | Solution setup, module class libraries, NetArchTest |
| **P0-5** | Contracts + Fakes | todo | - | Interfaces, DTOs, domain events, and in-memory fakes |
| **A1** | Building blocks & tenancy RLS | todo | - | Multi-schema EF Core, RLS helper, outbox, problem+json |
| **A2** | Identity and Tenancy | todo | - | ASP.NET Core Identity, JWT, QR join, roles matrix |
| **A3** | Onboarding & expected documents | todo | - | Sites, assets, expected doc rules, facility profile |
| **A4** | Units & Factor Registry | todo | - | Canonical units, immutable FactorSets, overrides |
| **A5** | Activity & Calculation | todo | - | `IActivityWriter`, Scope 1 & 2 calc, verified vs estimated |
| **A6** | Platform Admin & isolation tests | todo | - | Dataset versioning, tenant isolation automated scan |
| **A7** | Frontend (auth, onboarding, admin)| todo | - | Web features for auth, onboarding, admin, consultant |
| **I1** | Real module wiring (swap fakes) | todo | - | Host integration with `UseFakes=false` |
| **I4** | Security hardening & audit | todo | - | OWASP ASVS checklist, adversarial IDOR sweep |
| **I7** | Consultant workspace | todo | - | Multi-tenant consultant workspace |
| **I8** | Pilot deployment & backups | todo | - | VPS Docker Compose behind Caddy, backup restore drill |

---

**Blocked on:** None.

**Next prompt:** P0-2 (.NET solution scaffold and infra) following Gate G0.

**Open questions logged in 15_DECISIONS.md:**
- None currently blocking Track A.
