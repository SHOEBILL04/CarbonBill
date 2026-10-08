# PROGRESS_C: Track C Progress Tracker (Dev 3)

## Deliverables Status

| Prompt | Description | Status | Branch / PR | Notes |
|---|---|---|---|---|
| **P0-1c** | Rules, flags, recommendations, reports & security docs | done | `docs/p0-1c` | Specs 07 through 12, Track C and Progress C |
| **P0-4** | Seeds, fixtures & dev dataset | done | `feat/c-p0-4-seeds` | Seed schemas, templates, samples, and 14-flag dev dataset |
| **C1** | Gap detection engine | todo | - | Expected calendar comparison, days -7, -3, 0 escalation |
| **C2** | Notifications subsystem | todo | - | In-app, Web Push VAPID, email, quiet hours, weekly digest |
| **C3** | Flags engine & data-quality rules | todo | - | FlagRule schema, deterministic evaluator, top 5 dashboard query |
| **C4** | Footprint flags, intensity & benchmarks | todo | - | MoM spike, genset reliance, intensity denominator, peer benchmark gating |
| **C5** | Measure Library & recommendations engine | todo | - | 8-step pipeline, BDT savings & payback, closed-loop savings verification |
| **C6** | Reporting backend (PDF, Excel, Auditor link) | todo | - | QuestPDF GHG report, ClosedXML export, ReportSnapshot hash, share links |
| **C7** | Frontend (dashboard, flags, recommendations, reports, auditor) | todo | - | Role dashboards, flag feed, recommendation cards, auditor trace view |
| **I3** | Role dashboards & buyer PDF on real data | todo | - | Real data reconciliation and golden PDF verification |
| **I6** | Observability & flag tuning | todo | - | OpenTelemetry business metrics and pilot threshold tuning guide |
| **I10**| Pilot data & expert review | todo | - | Dataset validation checklist and expert sign-off register |

---

**Blocked on:** Await Gate G1 (Contracts frozen, P0-5 tagged).

**Next prompt:** C1 (Gap detection engine) following Gate G1.

**Open questions logged in 15_DECISIONS.md:**
- QuestPDF Bangla font glyph rendering spike outcome.
- Expert reviewer appointment for Measure Library and emission factors.
