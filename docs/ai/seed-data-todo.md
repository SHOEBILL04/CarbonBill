# Seed Data To-Do: Pre-Pilot Expert Validation Register

This register catalogues the real-world datasets that must be officially sourced, verified by a qualified sustainability/energy specialist, and ingested into CarbonBill prior to pilot customer deployment.

> **CRITICAL RULE:**
> Under no circumstances may AI agents or developers invent emission factors, capex costs, savings percentages, or peer benchmarks from conversational memory. Every production number must link directly to an audited, cited row in this register.

---

## 1. Emission Factors Dataset (`seeds/factors/`)

| # | Item Description | Candidate Source (per Architecture Doc) | Verification Action Required | Status |
|---|---|---|---|---|
| 1 | **Bangladesh National Grid Emission Factor** (Combined Margin $\text{kg CO}_2\text{e}/\text{kWh}$) | IGES Grid Emission Factor list or UNFCCC CDM harmonized dataset | **VERIFY:** Verify the most recently published year and exact Combined Margin (CM) factor. Confirm whether Operating Margin (OM) or Build Margin (BM) weighting aligns with buyer guidelines. | Pending Expert |
| 2 | **Diesel Combustion Factors** (Stationary generator & mobile fleet) | IPCC Emission Factor Database (EFDB) 2006/2019 Refinements | **VERIFY:** Confirm Net Calorific Value (NCV) and default carbon oxidation factor for industrial gas oil in South Asia. | Pending Expert |
| 3 | **Natural Gas Combustion Factor** ($\text{kg CO}_2\text{e}/\text{m}^3$) | Petrobangla / Titas Gas heating value reports + IPCC EFDB | **VERIFY:** Obtain actual average gross heating value (GHV / BTU/CFT) for Bangladesh pipeline natural gas from recent utility publications. | Pending Expert |
| 4 | **LPG Combustion Factor** ($\text{kg CO}_2\text{e}/\text{kg}$) | IPCC EFDB Stationary Combustion | **VERIFY:** Confirm commercial butane/propane blend ratio used in Bangladesh cylinders. | Pending Expert |
| 5 | **Heavy Goods Road Freight Factors** ($\text{kg CO}_2\text{e}/\text{tonne-km}$) | UK DEFRA / DESNZ Conversion Factors 2023/2024 | **VERIFY:** Select appropriate truck tonnage category (e.g. Rigid 7.5–17 tonne vs Articulated >33 tonne) reflecting standard Dhaka-Chittagong highway container transport. | Pending Expert |
| 6 | **Container Vessel Sea Freight Factor** ($\text{kg CO}_2\text{e}/\text{tonne-km}$) | Clean Cargo Working Group (CCWG) / UK DEFRA | **VERIFY:** Confirm feeder vessel factor between Chittagong Port and regional transshipment hubs (Singapore / Colombo). | Pending Expert |

---

## 2. Measure Library Numbers & Costs (`seeds/measures/`)

Every numerical field in `seeds/measures/measure_library_TEMPLATE.json` must be supplied with an explicit citation:

| # | Measure | Required Empirical Parameters | Candidate Source (per Architecture Doc) | Status |
|---|---|---|---|---|
| 1 | **Power Factor Correction** | Cost per kVAR (BDT), expected kVA reduction % | IFC PaCT Resource Efficiency Case Studies *(VERIFY)* | Pending Expert |
| 2 | **LED & Daylighting** | Lighting energy reduction % range, fixture capex (BDT) | IFC PaCT Textile Energy Reports *(VERIFY)* | Pending Expert |
| 3 | **VFD on Motors & Compressors** | Electrical energy reduction % range, VFD inverter capex per kW (BDT) | IFC PaCT Case Studies *(VERIFY)* | Pending Expert |
| 4 | **Compressed Air Leak Repair** | System leakage reduction % range, audit & maintenance cost (BDT) | Cascale Higg FEM Guidance *(VERIFY)* | Pending Expert |
| 5 | **Steam Trap & Boiler Insulation** | Boiler gas reduction % range, thermal jacket cost per meter (BDT) | IFC PaCT Steam System Case Studies *(VERIFY)* | Pending Expert |
| 6 | **Boiler Burner Tuning** | Gas efficiency gain % range, combustion analyzer tuning cost (BDT) | IFC PaCT Boilers Guideline *(VERIFY)* | Pending Expert |
| 7 | **Rooftop Solar PV** | Solar yield (kWh/kWp/year), turnkey EPC installation capex (BDT/kWp) | SREDA Net Metering Guidelines & Global Solar Atlas *(VERIFY)* | Pending Expert |
| 8 | **Genset Scheduling & Optimization** | Diesel reduction % range, controller installation capex (BDT) | Industrial Energy Audit Case Studies *(VERIFY)* | Pending Expert |
| 9 | **Servo Motors on Sewing Machines** | Sewing machine electricity reduction % range, servo motor unit capex (BDT) | IFC PaCT Garment Factory Benchmarks *(VERIFY)* | Pending Expert |
| 10 | **Waste Heat Recovery (Economizer)** | Feedwater preheating gas reduction % range, economizer capex (BDT) | IFC PaCT Case Studies *(VERIFY)* | Pending Expert |
| 11 | **Freight Consolidation & Logistics** | Transport emissions reduction % range, fleet software cost (BDT) | Cascale Higg FEM Logistics *(VERIFY)* | Pending Expert |
| 12 | **Fleet Preventive Maintenance** | Vehicle fuel reduction % range, maintenance cost per vehicle (BDT) | Cascale Higg FEM Fleet Practice *(VERIFY)* | Pending Expert |

---

## 3. Sector Benchmark Datasets (`seeds/benchmarks/`)

| # | Benchmark Cohort | Required Distribution Values | Source Requirement | Status |
|---|---|---|---|---|
| 1 | **RMG Small Garments (1–500 machines)** | P25, P50 (median), P75, P90 ($\text{kg CO}_2\text{e}/\text{piece}$) | **VERIFY:** Require $n \ge 10$ audited factory submissions before releasing benchmark in UI. | Awaiting Pilot Data |
| 2 | **RMG Medium Garments (501–1500 machines)**| P25, P50 (median), P75, P90 ($\text{kg CO}_2\text{e}/\text{piece}$) | **VERIFY:** Require $n \ge 10$ audited factory submissions before releasing benchmark in UI. | Awaiting Pilot Data |
| 3 | **Textile Dyeing & Finishing (10–30 t/day)**| P25, P50 (median), P75, P90 ($\text{kg CO}_2\text{e}/\text{kg fabric}$) | **VERIFY:** Require $n \ge 10$ audited factory submissions before releasing benchmark in UI. | Awaiting Pilot Data |

---

## 4. Sign-Off Protocol Before Pilot Launch

1. **Reviewer Profile:** Review must be conducted by a credentialed sustainability consultant (matching the Farhana persona) or a faculty energy/environmental engineering specialist.
2. **Review Checklist:**
   - [ ] Every active factor has an official URL, publication title, and year.
   - [ ] Unit conversion multipliers validated against standard SI definitions.
   - [ ] Measure Library savings ranges (low/typical/high) cross-referenced with IFC PaCT or equivalent peer-reviewed industrial data.
   - [ ] Currency conversions and current market costs in BDT validated against Dhaka supplier pricing.
   - [ ] Benchmark sets verified with sample size $n \ge 10$ prior to unhiding peer curves.
