# 00. Project Context: CarbonBill

## 1. What CarbonBill Is

CarbonBill turns the physical paper slips and bills an export factory already handles—such as electricity bills, fuel challans, gas invoices, and transport slips—into defensible, buyer-ready greenhouse gas (GHG) accounting reports. It translates carbon data into plain-language business insights and action recommendations priced in Bangladeshi Taka (BDT).

Designed specifically for Bangladeshi export manufacturers (particularly Ready-Made Garments [RMG] and textile suppliers), CarbonBill addresses supply-chain decarbonization demands from international retail buyers without requiring expensive external consulting engagements.

---

## 2. The 4 Core User Pains Solved

Field research with 17 factory managers and personnel identified that the product succeeds or fails on four critical problems:

1. **Never Lose a Slip (Lost Documents = 32% of survey pain):**
   Paper receipts get misplaced before accounting receives them. CarbonBill introduces an **Expected-Document Calendar** that models expected monthly utility bills and challans deterministically, paired with a 2-tap offline-first mobile web capture app for floor workers and a manual fallback entry mode for damaged slips.

2. **Trust the OCR (Human-in-the-Loop Verification):**
   Users do not trust black-box automation. CarbonBill places the original scanned document side-by-side with extracted values, visually highlights bounding boxes, focuses low-confidence fields first, and requires human confirmation before figures enter accounting calculations.

3. **No Consultant Needed (Automated GHG Math in Taka):**
   Small factories cannot afford recurring sustainability consultant fees. CarbonBill automatically converts units into canonical standards, applies regional and national grid emission factors, and calculates carbon footprints aligned with the GHG Protocol corporate standard. Furthermore, it delivers reduction recommendations ranked by payback period in BDT using the factory's own bill-derived tariffs.

4. **Buyer's Format (Instant Export & Audit-Ready Proof):**
   International buyers demand standard GHG reporting formats (such as Higg FEM, base GHG Protocol, and custom buyer spreadsheets). CarbonBill produces compliant PDF and Excel exports, complete with Data Quality Scores, methodology statements, and expiring read-only auditor share links that trace every number directly to the original underlying invoice.

---

## 3. Personas

| Persona | Role & Setting | Core Responsibilities & Flow |
|---|---|---|
| **Jahid** (Floor Staff) | Generator operator / utility clerk on factory floor. Low-end Android phone, patchy 3G/Wi-Fi. | Uses a dedicated 2-tap mobile PWA (Bangla only) with large icons to photograph fuel slips and meter receipts. Receives immediate visual receipt confirmation; can view personal submissions. |
| **Rahim** (Accounts Clerk) | Accounts / administration desk. High-volume challan processing, desktop browser. | Manages the review queue sorted by lowest OCR confidence first. Uses keyboard shortcuts (`Tab`, `Enter`, `N`) to confirm or correct extracted fields. Resolves duplicates and manages batch captures. |
| **Nusrat / Kabir** (Compliance Officer / Factory Owner) | Management office. Decides on factory operations and capital expenditures (capex). | Views high-level dashboard summaries, track-level footprint trends, top Carbon Flags, and top 3 recommended interventions in BDT. Signs off on final buyer reports. |
| **Farhana** (Sustainability Consultant) | External consultant advising 5–10 SME supplier factories simultaneously. | Uses a multi-organization workspace with a single login. Reviews cross-factory readiness, assists with complex allocations, and proposes emission factor overrides with mandatory justification notes. |
| **Anna** (Buyer / External Auditor) | International apparel brand auditor or third-party verifier. | Accesses an expiring, read-only web share link. Inspects frozen report snapshots, clicks any figure to inspect its source document, confirming user, and factor citation; optional price redaction. |

---

## 4. The 3 Major Changes vs Earlier Solution Pack

The current solution architecture introduces three fundamental architectural changes compared to the preliminary conceptual pack:

1. **Backend Technology Stack:**
   Transitioned from PHP/Laravel to **ASP.NET Core (current LTS)** as a strongly-typed **Modular Monolith**. This provides high performance, type safety for complex calculation rules, and strict in-process module isolation.

2. **New Capability — Carbon Flags Engine:**
   A deterministic, explainable rule engine that proactively monitors data quality (missing expected slips, duplicate bills, statistical outliers), footprint behaviour (month-on-month surges, generator over-reliance), and buyer audit readiness.

3. **New Capability — Evidence-Based Recommendations Engine:**
   Replaces generic sustainability tips with an evidence-graded Measure Library (grades A, B, C) that computes realistic investment ranges, carbon avoidance, and financial payback in BDT based on factory-specific utility tariffs extracted from actual bills.

---

## 5. Design Principles

| Principle | Meaning in Build & Architecture |
|---|---|
| **One job per persona** | Separate entry points and views for Jahid (capture), Rahim (review), Nusrat/Kabir (dashboard & decisions), Farhana (multi-org), and Anna (read-only audit). |
| **Trust before automation** | Original document scan always displayed next to extracted fields. No document enters accounting without explicit human confirmation (or sampling-audited auto-confirmation). |
| **Honest numbers** | Estimates are explicitly tagged as "estimated" and visually hatched in charts. Realistic ranges (low/typical/high) are used instead of false single-number precision. Thin peer data displays "no benchmark yet". |
| **Works on weak phone & network** | Floor route under 200 KB initial JavaScript payload, offline-capable IndexedDB queue, client-side image compression under 400 KB, Bangla language first. |
| **Free and fast first** | Hosted in Singapore region (closest low-latency to Dhaka). Built on free tiers and open-source tooling. Every external paid dependency is abstracted behind an interface. |
| **Everything traceable** | Every output number links immutably to its source document image, applied factor version, and confirming user ID. |

---

## 6. Scope Boundaries

### In Scope for MVP
- **Scope 1 (Direct Emissions):**
  - Diesel and petrol consumption in backup generators and company-owned vehicles.
  - Natural gas and liquefied petroleum gas (LPG) consumed in factory boilers.
  - Fugitive refrigerant top-ups (only if manually logged from maintenance invoices).
- **Scope 2 (Indirect Emissions from Purchased Energy):**
  - Purchased grid electricity from local distribution utilities (e.g. DPDC, DESCO, REB, BPDB, NESCO).
  - Calculated strictly via the **Location-Based** method using Bangladesh's national grid emission factor and citation year.
- **Scope 3 (Selected Upstream/Downstream Transportation Only):**
  - Goods transport invoices (shipping challans and cargo invoices) calculated using `tonne-km` multiplied by vehicle/mode emission factors.

### Non-Goals (Out of Scope for MVP)
- **No Machine Learning in MVP:** Recommendations and Carbon Flags rely strictly on deterministic rules, statistical thresholds, and curated reference databases. No opaque ML models are used for calculation or advisory.
- **No Market-Based Scope 2:** Bangladesh lacks an open, certifiable renewable energy certificate (REC) or Power Purchase Agreement (PPA) market accessible to SME factories; market-based Scope 2 accounting is excluded.
- **No Full Scope 3 Coverage:** Upstream purchased raw materials (e.g. yarn, raw cotton, chemicals) and downstream garment use/disposal are excluded; reports clearly label these categories as "not yet covered".
- **No External Certification Claim:** Outputs are estimates aligned with GHG Protocol methodology, not certified or third-party accredited audits.
