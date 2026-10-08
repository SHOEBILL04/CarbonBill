# 03. Domain Glossary: CarbonBill

This glossary defines core CarbonBill domain terms in plain English with Bangla factory context. Each definition is kept simple and direct for clear cross-team understanding.

---

## 1. Domain Terms (One Line Each)

- **Expected-Document Calendar:** A deterministic monthly schedule generated during onboarding defining which utility bills, fuel slips, and challans must arrive each month for each factory meter, boiler, generator, and vehicle.
- **ExpectedDocRule:** The configuration rule that ties an asset (e.g. Generator 2) to an expected document type, frequency, and monthly due day, assigning responsibility to a specific user.
- **Estimated vs. Verified:** A calculation status where figures backed by confirmed original slips are "Verified", while periods with missing data filled from historical averages are flagged as "Estimated" and hatched in charts.
- **Data Quality Score (DQS):** The percentage of total kilograms of CO2e in a reporting period that is backed by verified, human-confirmed documents rather than estimates.
- **OCR Tier 1 (Local):** An offline, private text extraction step using Tesseract (`ben+eng`) with utility templates to process printed bills without cloud cost.
- **OCR Tier 2 (Cloud Form Parser):** An automated cloud extraction step using Azure Document Intelligence (F0 tier) for complex printed multi-column utility invoices when Tier 1 confidence is low.
- **OCR Tier 3 (Vision LLM):** A multimodal AI extraction step (e.g. Gemini Flash with strict JSON schema) reserved for handwritten slips, consent-gated per organization.
- **Bounding Box (bbox):** The exact pixel coordinates on the document image where an extracted value (e.g. total kWh or amount in BDT) was found, highlighted when clicked during review.
- **Review Decision:** An audit record recording whether a document was confirmed manually by a human or automatically via sampling rules.
- **Bulk Confirm:** An optional setting allowing documents with high confidence across all fields to auto-confirm after 20 manual confirmations, with 10% random sampling routed to human review.
- **Canonical Unit:** The normalized standard unit of measure (kWh, litre, kg, m3, tonne-km) into which all raw fuel, gas, and electricity entries must be converted.
- **UnitConversion:** A versioned multiplier record used to translate raw units (e.g. gallon, MJ, MWh, ton) into canonical units before calculation.
- **ActivityRecord:** A normalized ledger entry storing the confirmed standard quantity of energy or fuel consumed by an asset in a specific time period.
- **FactorSet:** An immutable, versioned library of greenhouse gas emission factors tied to a specific GWP basis (AR5 or AR6), valid year range, and geographic region.
- **EmissionFactor:** A specific conversion multiplier (`kg CO2e` per canonical unit) representing CO2, CH4, and N2O emissions for a fuel, gas, or grid electricity source.
- **FactorOverride:** A customized emission factor assigned to a specific factory organization, requiring a mandatory written justification and compliance approval.
- **EmissionResult:** An immutable record storing the calculated `kg CO2e` output, linking directly to the activity record, factor version, and estimation status.
- **MissingAlert:** An active notification raised when an expected document is not uploaded by its calendar due date, escalating over time (days -7, -3, 0).
- **Carbon Flag:** An explainable, rule-based alert triggered by data-quality anomalies, footprint surges, generator over-reliance, or buyer-readiness gaps.
- **FlagRule:** A platform configuration record defining the trigger criteria, thresholds, severity, and suggested action for a specific Carbon Flag.
- **Flag Lifecycle:** The deterministic state progression of a Carbon Flag (`Open` -> `Acknowledged` -> `Resolved` or `Dismissed` with mandatory reason expiring in 30 days).
- **Flag Fatigue Control:** Rules that prevent alert overload by displaying only the top 5 flags on dashboards, grouping weekly digests, and allowing snoozing.
- **ProductionMetric:** The monthly production output reported by a factory (e.g. pieces of garments, kg of fabric) used as the denominator for emissions intensity.
- **Emission Intensity:** The carbon efficiency ratio (`kg CO2e` per unit of production output) compared against peer benchmarks.
- **BenchmarkSet:** An anonymized reference distribution (P25, P50, P75, P90) across factories in the same sector and size band, displaying "no benchmark yet" if sample size `n` is insufficient.
- **Measure Library:** A curated, evidence-graded dataset of factory decarbonization interventions (e.g. LED daylighting, VFDs, boiler insulation, rooftop solar).
- **Evidence Grade A:** Recommendation measures supported by documented, measured results from factories operating in Bangladesh.
- **Evidence Grade B:** Recommendation measures supported by regional (South Asia) or international industrial case studies.
- **Evidence Grade C:** Recommendation measures based on standard engineering estimates and manufacturer specifications.
- **Recommendation Lifecycle:** The progression of an energy-saving intervention (`Suggested` -> `Planned` -> `Done` with verified post-intervention savings -> `NotFeasible` with reason).
- **Closed-Loop Savings:** The measurement process where post-implementation utility bills are compared against baseline bills to confirm real-world savings in BDT.
- **ReportSnapshot:** A frozen, immutable snapshot of an approved carbon report with an associated SHA-256 content hash, preventing retroactive edits.
- **Auditor Share Link:** A secure, expiring, read-only URL enabling buyers and auditors to inspect a report, trace any figure to its source slip, with optional price redaction.
- **Consultant Workspace:** A multi-tenant management interface allowing a single consultant account to switch between multiple SME factory clients with strict tenant isolation.
- **Manual Fallback Entry:** A mobile capture mode allowing floor staff to record fuel volume (litres) and receipt number immediately when lighting or cameras fail, attaching photos later.

---

## 2. Assumptions

*No undocumented assumptions made. All terms directly derived from the CarbonBill System Architecture and Solution Design (.NET Edition) v1.0 document.*
