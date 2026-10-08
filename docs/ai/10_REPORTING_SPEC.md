# 10. Reporting, Dashboards and Auditor Verification Specification

## 1. Role-Tailored Dashboards

Each user persona receives an optimized interface tailored to their specific job responsibilities:

| Persona / Role | Home Screen & Primary Metrics | Core Action Components |
|---|---|---|
| **Floor Staff** (`FloorStaff` - Jahid) | 2-tap capture screen in Bangla. Icon-based submission counts for the month. | "নতুন চালান তুলুন" (Capture new slip), "আমার জমা দেওয়া তালিকা" (My submissions list), Push notification task feed. |
| **Accountant** (`Accountant` - Rahim) | Verification Queue. Unconfirmed document counter, low-confidence warning badge, missing documents count. | Side-by-side verification viewer, keyboard navigation queue, bulk confirm action, manual fallback entry button. |
| **Compliance Officer** (`Compliance` - Nusrat) | Audit Readiness Dashboard. Data Quality Score (DQS), expected document checklist, pending flags list. | Report generation wizard, factor override request/approval, auditor share link generator. |
| **Factory Owner** (`Owner` - Kabir) | Executive Taka & Carbon Dashboard. Total footprint trend, top 3 Carbon Flags, top 3 reduction actions in BDT. | Capex decision cards, buyer report sign-off button, financial payback charts. |
| **Consultant** (`Consultant` - Farhana) | Multi-Client Portfolio Workspace. Client organization selector, cross-factory readiness metrics. | Client switching toolbar, cross-factory Carbon Flags feed, factor override proposal modal. |
| **Auditor / Buyer** (`AuditorLink` - Anna) | Read-Only Audit Portal. Locked report view, Scope 1/2/3 totals, per-figure document drilldown. | Source document viewer, factor citation inspector, PDF/Excel download. |

---

## 2. Buyer PDF Report Structure (QuestPDF)

The generated carbon report adheres strictly to the GHG Protocol Corporate Standard layout rendered via QuestPDF:

1. **Cover Page:**
   - Factory legal entity name, location, reporting period (`YYYY-MM` or `YYYY-Q1..Q4`).
   - Organizational boundary description (Operational Control).
   - Prominent **Data Quality Score (DQS)** badge (e.g. `94.2% Verified`).
   - Mandatory GHG Protocol analytical estimate disclaimer.
2. **Executive Summary & Scope Totals:**
   - Total emissions in metric tonnes $\text{CO}_2\text{e}$ with verified vs. estimated visual split.
   - Breakdown table: Scope 1 (direct), Scope 2 (location-based grid), Scope 3 (freight).
   - Intensity metric: $\text{kg CO}_2\text{e}$ per production unit (pieces or kg of fabric).
3. **Monthly & Activity Breakdown:**
   - Tabular ledger of electricity, diesel, natural gas, LPG, and transport consumption in canonical units.
   - Comparison charts against previous quarter / preceding year.
4. **Emission Factor Registry & Methodology Statement:**
   - Table displaying every applied emission factor, source citation, publication year, and GWP basis (AR5/AR6).
   - Factor overrides listed separately with approver and written justification.
5. **Document Audit Trail & Provenance Appendix:**
   - Itemized reference table connecting every calculated line item to its specific underlying physical invoice ID, capture timestamp, and confirming reviewer.
6. **Data Quality & Limitations Statement:**
   - List of unmonitored emission sources labeled as "not yet covered" (Scope 3 purchased raw materials, waste).

---

## 3. Buyer Template Mapping & ClosedXML Excel Export

- **Configurable Buyer Templates:**
  A JSON mapping dictionary allows the same frozen activity dataset to populate distinct buyer portal formats (e.g. Higg FEM spreadsheet, Inditex supplier upload, H&M carbon portal).
- **Excel Export Structure (`ClosedXML`):**
  Workbooks include raw normalized activity rows, calculated emissions, emission factor metadata, and summary pivot tables. All numerical cells store raw `numeric` values formatted to 2 or 6 decimal places, preventing rounding corruption.

---

## 4. ReportSnapshot Immutability & Content Hash

1. **Freezing on Approval:**
   When a Compliance Officer or Factory Owner approves a report, the system creates a `reporting.report_snapshots` entity:
   - Compiles all underlying `activity_records`, `emission_results`, `emission_factors`, and `documents` metadata into a structured JSON payload (`frozen_data`).
   - Computes a cryptographic SHA-256 hash of the entire JSON representation (`content_hash`).
2. **Locked State Enforcement:**
   - Report transitions to `Locked`.
   - Editing underlying documents, recalculating activities, or altering factor tables cannot modify an existing locked snapshot.
   - Any retrospective audit revision must be issued as a new report version, marking the prior snapshot `Superseded`.

---

## 5. Auditor Share Link Behaviour

- **Expiring Secure Access:**
  Generates an unguessable cryptographic token URL (`/auditor/verify?token=...`) with a user-specified expiry duration (typically 14 or 30 days).
- **Click-to-Source Traceability:**
  Clicking any number in the digital report opens a drill-down modal displaying:
  - Scanned original document image side-by-side.
  - Reviewer ID and confirmation timestamp.
  - Applied emission factor citation and national source URL.
- **Price Redaction Option (`redact_prices: true`):**
  Factory owners can toggle price redaction on share links. In redacted mode, unit tariffs (BDT/kWh) and monetary expenditures (BDT) are masked (`[Confidential]`), exposing only physical quantities and carbon figures.

---

## 6. Day-1 Technical Spike: QuestPDF Bangla Font Rendering

*(Mandatory technical spike requirement before production PDF generation)*:
- **Font Package:** QuestPDF must be configured with `Noto Sans Bengali` (Google Fonts) including regular, bold, and medium font weights.
- **Glyph Shaping Validation:** Verify proper complex conjunct rendering for Bangla characters (e.g. `ক্ষ`, `জ্ঞ`, `ষ্ক`, `স্থ`, `ত্র`) and vowel signs (`কার`).
- **Fallback Policy:** If QuestPDF glyph shaping exhibits rendering anomalies on Linux containers during the Day-1 spike, switch `IReportRenderer` to headless Playwright HTML-to-PDF rendering. *(Record result in `docs/ai/15_DECISIONS.md`)*.
