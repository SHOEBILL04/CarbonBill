# TRACK C: Insights and Output (Dev 3)

## 1. Track Overview & Scope

Dev 3 owns the analytical intelligence, business value, and verification outputs of CarbonBill: missing document detection, notifications, the Carbon Flags rule engine, intensity benchmarks, the Measure Library, the 8-step Recommendations engine, role dashboards, buyer PDF generation, Excel workbooks, and auditor verification views.

---

## 2. Owned Folders & Modules

### Backend Modules
- `src/Modules/CarbonBill.Modules.GapDetection`
- `src/Modules/CarbonBill.Modules.Notifications`
- `src/Modules/CarbonBill.Modules.Flags`
- `src/Modules/CarbonBill.Modules.Insights`
- `src/Modules/CarbonBill.Modules.Recommendations`
- `src/Modules/CarbonBill.Modules.Reporting`

### Frontend Feature Folders (`web/src/features/`)
- `web/src/features/dashboard` (Role-tailored KPI views, footprint trends, intensity charts)
- `web/src/features/flags` (Carbon Flags cards, snooze, dismiss modal, action deep-links)
- `web/src/features/recommendations` (Measure cards with ranges in BDT, MACC chart)
- `web/src/features/reports` (Readiness checklist, PDF preview, Excel export, share link modal)
- `web/src/features/auditor` (Read-only verification portal, trace-to-source drilldown)

---

## 3. Deliverables Breakdown (C1 to C7)

- **C1 — Gap Detection Engine:**
  - Nightly Hangfire cron and `DocumentUploaded` event listener.
  - Compares `IExpectedDocRuleReader` against received documents.
  - Escalation schedule: Day -7 reminder, Day -3 responsible user push, Day 0 compliance escalation.
  - Endpoints: `GET /api/v1/gaps`, `POST /api/v1/gaps/{id}/nudge`.
- **C2 — Notifications Subsystem:**
  - In-app alerts, Web Push (VAPID), transactional email (Brevo/Resend).
  - Quiet hours filtering, user language preference (`bn`/`en`).
  - Weekly consolidated email digest.
  - Handoff: `C-to-B-notifier.md` (for retake push alerts).
- **C3 — Carbon Flags Engine (Data Quality):**
  - Database-driven rule engine (`flags.flag_rules` and `flags.flags`).
  - Evaluators for data quality: missing documents, low OCR confidence, duplicates, implausible values ($3 \times \text{IQR}$), high estimated share ($>10\%$).
  - Lifecycle: `Open`, `Acknowledged`, `Resolved`, `Dismissed` (requires reason, expires in 30 days).
  - Endpoints: `GET /api/v1/flags`, `POST /api/v1/flags/{id}/acknowledge`, `/dismiss`.
- **C4 — Footprint Flags, Intensity & Benchmarks:**
  - Monthly production metric ingestion (`ProductionMetric`).
  - Intensity calculation: $\text{kg CO}_2\text{e}$ per output unit.
  - Footprint evaluators: MoM spike ($1.3\times$ / $1.6\times$), hotspot ($>50\%$), genset reliance ($>20\%$), intensity above peers (P75/P90), target drift, outdated factors.
  - Peer benchmark gating: Return "no benchmark yet" if peer count $n < 10$.
- **C5 — Measure Library & Recommendations Engine:**
  - `recommendations.measures` and `measure_sources` schemas and seed loaders.
  - 8-step pipeline: profile, eligibility, carbon impact, financial modeling in BDT, realism filters, ranking, card explanation, closed-loop outcome tracking.
  - Closed-loop post-implementation bill comparison for realised savings.
- **C6 — Reporting Backend:**
  - QuestPDF implementation of GHG Protocol corporate report with Bangla font (`Noto Sans Bengali`).
  - ClosedXML Excel export with buyer template mapping.
  - `ReportSnapshot` freezing with SHA-256 hash.
  - Expiring auditor share links with optional price redaction (`redact_prices`).
- **C7 — Frontend (Dashboards, Flags, Recommendations, Reports, Auditor):**
  - Role dashboards (Owner, Accountant, Compliance, Consultant).
  - Carbon Flags interactive feed with deep links.
  - Recommendation cards with BDT payback ranges and financing links.
  - Report approval, export dialogs, and auditor read-only view.

---

## 4. Track Risks & Mitigations

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| **QuestPDF Complex Bangla Rendering** | Corrupted conjunct glyphs or question marks in buyer PDFs. | Day-1 technical spike validating `Noto Sans Bengali` glyph shaping; fallback to Playwright HTML-to-PDF if needed. |
| **Alert Fatigue from Carbon Flags** | Users ignore warnings, leading to audit failures. | Top 5 priority dashboard limit; consolidated weekly digest; 30-day snooze with required reason. |
| **Recommendation Figures Seen as Guarantees** | Disputed ROI and legal liabilities with factory owners. | Always display ranges (low/typical/high); show evidence grades (A/B/C); mandatory engineering estimate disclaimers. |
