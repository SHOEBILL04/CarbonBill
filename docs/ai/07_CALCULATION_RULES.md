# 07. Greenhouse Gas (GHG) Calculation Engine Specification

## 1. Canonical Units & Unit Normalization

CarbonBill standardizes all raw energy, fuel, and activity measurements into **Canonical Units** before performing any greenhouse gas calculations:

| Activity Domain | Canonical Standard Unit | Raw Input Examples | Conversion Table (`activity.unit_conversions`) |
|---|---|---|---|
| **Electricity** | **kWh** | MWh, MJ, GJ | 1 MWh = 1,000 kWh; 1 MJ = 0.277778 kWh |
| **Liquid Fuels (Diesel, Petrol, Octane)** | **litre** | Gallon (US), Gallon (UK), Barrel, m3 | 1 US Gallon = 3.785412 litres; 1 m3 = 1,000 litres |
| **Solid Fuels & Biomass** | **kg** | Tonne (metric), Ton (short/long), Pound (lb) | 1 metric tonne = 1,000 kg; 1 short ton = 907.18474 kg |
| **Gaseous Fuels (Natural Gas, LPG, Biogas)** | **m3** | Cubic feet (CFT / 100 CFT), Litres (liquid LPG), kg | 100 CFT = 2.831685 m3 |
| **Freight Transport (Goods Shipping)** | **tonne-km** | km, miles, truck trips, container TEU | Computed from: payload (tonnes) x distance (km) |

### Versioned Unit Conversions
All conversions are stored in the database table `activity.unit_conversions` with an explicit version string. Hard-coding conversion ratios in application code is strictly prohibited. Raw units (e.g. "gallons", "MJ", "CFT") never pass beyond the ingestion and normalization boundary.

---

## 2. Core Emission Formula

$$\text{kg CO}_2\text{e} = \text{quantity\_standard} \times \text{emission\_factor}$$

Where:
- $\text{quantity\_standard}$: The confirmed consumption volume/mass in canonical units (`numeric(18,6)`).
- $\text{emission\_factor}$: The composite multiplier (`numeric(18,6)`) expressing emissions in $\text{kg CO}_2\text{e}$ per canonical unit.
- The factor includes the combined Global Warming Potential (GWP) of Carbon Dioxide ($\text{CO}_2$), Methane ($\text{CH}_4$), and Nitrous Oxide ($\text{N}_2\text{O}$).
- Every factor record explicitly stores its reference GWP basis (IPCC Fifth Assessment Report **AR5** or Sixth Assessment Report **AR6**).

---

## 3. Decimal Precision & Rounding Rules

1. **Strict Types:**
   - Calculations must exclusively use the C# `decimal` type.
   - Database columns use PostgreSQL `numeric(18,6)` for activity quantities, emission factors, and intermediate calculations.
   - Financial amounts (BDT) use `numeric(18,2)`.
   - Floating-point primitives (`float`, `double`) are **strictly prohibited**.
2. **Zero Premature Rounding:**
   - Rounding must never be performed during arithmetic operations or storage in `activity.activity_records` and `calculation.emission_results`.
   - Rounding is applied **only at the presentation layer** (UI displays, QuestPDF documents, and ClosedXML sheets) according to buyer display rules (typically 2 decimal places for kg CO2e, or integer values for large totals).

---

## 4. Factor Selection Hierarchy (Precedence Order)

When an activity record is confirmed, the calculation engine selects the applicable emission factor strictly following this precedence:

```text
1. Organization Override (FactorOverride)
   └── Validated: Must have non-empty written justification + approved_by user ID
         │ (if absent)
         ▼
2. National / Grid-Specific Factor (EmissionFactor)
   └── e.g. Bangladesh National Grid Factor (IGES/UNFCCC published dataset with year)
         │ (if absent)
         ▼
3. Regional / International Benchmark Factor (EmissionFactor)
   └── e.g. IPCC Emission Factor Database (EFDB), UK DEFRA/DESNZ conversion factors
```

Every generated `calculation.emission_results` record immutably stores the selected `factor_id`, `factor_version`, `conversion_version`, and publication year. Reports must explicitly display the citation source and publication year next to each calculated figure.

---

## 5. Scope Coverage Matrix (MVP)

| Scope | Included in MVP | Accounting Method | Canonical Unit | Source Data Required |
|---|---|---|---|---|
| **Scope 1** | **Yes** | Fuel quantity x Fuel-specific factor | Litre (diesel/petrol), m3 (natural gas/LPG) | Generator fuel receipts, boiler gas bills, company vehicle fuel slips. |
| **Scope 2** | **Yes** | **Location-Based** method using Bangladesh National Grid factor with publication year | kWh | Monthly utility bills (DPDC, DESCO, BPDB, REB, NESCO). |
| **Scope 2 (Market-Based)** | **No** | *Out of Scope for MVP* | - | Excluded due to absence of accessible certified PPA/REC market for Bangladeshi SME factories. |
| **Scope 3 (Freight Only)** | **Yes** | Distance x Weight x Mode factor | tonne-km | Commercial shipping invoices and transport challans. |
| **Scope 3 (Other Categories)** | **No** | *Out of Scope for MVP* | - | Raw materials (yarn, fabric, chemicals), waste, employee commuting labeled in reports as **"not yet covered"**. |

---

## 6. Immutability, Historical Versioning & Recalculation

- **Immutable Results:**
  Once generated and committed, an `EmissionResult` record is permanent and immutable. It cannot be updated or deleted in place.
- **Handling Corrections:**
  If a underlying utility bill is amended during an audit review, a new `ActivityRecord` is recorded, generating a new `EmissionResult` version that supersedes the prior record.
- **Factor Releases & Recalculation Proposals:**
  When a new national grid or IPCC factor set is published (e.g. Bangladesh Grid Factor 2025 released):
  - Previously approved reports and snapshots are **never silently modified**.
  - The engine generates a formal **Recalculation Proposal** displaying the variance in tonnes and percentage.
  - Recalculation requires explicit sign-off by the Factory Owner or Compliance Officer.

---

## 7. Reference Factor Sources to Ingest

1. **IPCC Emission Factor Database (EFDB):** Global fuel combustion default factors (diesel, petrol, natural gas, heavy fuel oil).
2. **UK DEFRA / DESNZ Conversion Factors:** Comprehensive mobile transport emission factors (freight transport modes, vans, container vessels).
3. **Bangladesh National Grid Emission Factor:** *(VERIFY)* Published Combined Margin (CM) grid emission factor from the Institute for Global Environmental Strategies (IGES) Grid Emission Factor list or UNFCCC CDM harmonized dataset (verify latest published year, typically ~0.62–0.67 kg CO2e/kWh).
4. **GHG Protocol Cross-Sector Tools:** Stationary and mobile combustion default emission coefficients.

---

## 8. Mandatory Boundary & Limitations Disclaimer

Every generated dashboard, PDF report, Excel export, and auditor link must prominently include the following exact statutory disclaimer:

> **GHG Protocol Methodology Disclaimer:**
> "All figures and carbon emissions presented in this report are estimates calculated in strict accordance with the Greenhouse Gas Protocol Corporate Accounting and Reporting Standard (Location-Based Scope 2 method). CarbonBill outputs are analytical estimates and do not constitute an officially accredited, audited, or third-party certified verification report."
