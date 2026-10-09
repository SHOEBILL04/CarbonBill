# PROGRESS_C: Track C Progress Tracker (Dev 3)

## Deliverables Status

| Prompt | Description | Status | Branch / PR | Notes |
|---|---|---|---|---|
| **P0-1c** | Rules, flags, recommendations, reports & security docs | done | `docs/p0-1c` | Specs 07 through 12, Track C and Progress C |
| **P0-4** | Seeds, fixtures & dev dataset | done | `feat/c-p0-4-seeds` | Seed schemas, templates, samples, and 14-flag dev dataset |
| **C1** | Gap detection engine | done | `feat/c-c1-gap-detection` | MissingAlert entity, nightly Hangfire job & DocumentUploaded handler, Day -7/-3/0 escalation, bilingual plain requests, auto-resolve |
| **C2** | Notifications subsystem | done | `feat/c-c2-notifications` | In-app, Web Push VAPID, Brevo/Resend/Logging email with Polly backoff, bilingual bn/en templates, Bangla numerals, top 5 weekly digest, alert collapse, snooze with reason, event subscriptions |
| **C3** | Flags engine & data-quality rules | todo | - | FlagRule schema, deterministic evaluator, top 5 dashboard query |
| **C4** | Footprint flags, intensity & benchmarks | todo | - | MoM spike, genset reliance, intensity denominator, peer benchmark gating |
| **C5** | Measure Library & recommendations engine | todo | - | 8-step pipeline, BDT savings & payback, closed-loop savings verification |
| **C6** | Reporting backend (PDF, Excel, Auditor link) | todo | - | QuestPDF GHG report, ClosedXML export, ReportSnapshot hash, share links |
| **C7** | Frontend (dashboard, flags, recommendations, reports, auditor) | todo | - | Role dashboards, flag feed, recommendation cards, auditor trace view |
| **I3** | Role dashboards & buyer PDF on real data | todo | - | Real data reconciliation and golden PDF verification |
| **I6** | Observability & flag tuning | todo | - | OpenTelemetry business metrics and pilot threshold tuning guide |
| **I10**| Pilot data & expert review | todo | - | Dataset validation checklist and expert sign-off register |

---

**Blocked on:** None.

**Next prompt:** C3 (Carbon Flags engine & data-quality rules).

**Open questions logged in 15_DECISIONS.md:**
- QuestPDF Bangla font glyph rendering spike outcome.
- Expert reviewer appointment for Measure Library and emission factors.
