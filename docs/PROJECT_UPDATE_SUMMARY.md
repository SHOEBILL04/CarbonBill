# CarbonBill: Project Update & Architecture Brief

> **One-Liner:** Bangla-first SME carbon-accounting platform converting factory utility bills into verified, audit-defensible GHG buyer reports with human-in-the-loop AI extraction.

---

## 1. Simplified System Architecture (3-Tier View)

Designed to work reliably over 2G/3G factory networks in Bangladesh while delivering enterprise-grade compliance for global fashion brands.

```mermaid
flowchart TD
    subgraph Clients["1. User Touchpoints"]
        PWA["📱 Floor Staff PWA<br/>(Bangla, offline camera scan, <30KB)"]
        Web["💻 Accountant & Owner Portal<br/>(Side-by-side verification & analytics)"]
        Audit["🔗 Buyer Share Link<br/>(Expiring link for H&M / Inditex auditors)"]
    end

    subgraph Core["2. CarbonBill Core Engine (.NET 8 LTS)"]
        API["ASP.NET Core API & Security<br/>(JWT auth, strict multi-tenant isolation)"]
        OCR["Multi-Tier Extraction Pipeline<br/>(Tesseract ➡️ Azure DI ➡️ Vision LLM)"]
        Calc["Carbon Accounting Engine<br/>(Scope 1, 2, 3 • Grid 2024 / IPCC AR6)"]
        Jobs["Hangfire Background Engine<br/>(Nightly backups, missing bill checks)"]
    end

    subgraph Storage["3. Persistent Storage"]
        DB[(SQLite WAL Database<br/>Zero-latency local ACID storage)]
        R2[("Cloudflare R2<br/>Original bill images & report PDFs")]
    end

    Clients -->|Secure HTTPS / REST| API
    API --> OCR
    API --> Calc
    API --> Jobs
    API --> DB
    API --> R2
    Jobs --> DB
    Jobs --> R2
```

---

## 2. End-to-End Bill Journey (4-Step Pipeline)

How an electricity, gas, or diesel bill travels from a factory floor in Gazipur to an ESG audit report in Europe:

```mermaid
flowchart LR
    Step1["1. Capture<br/>📸 Floor Staff snaps bill photo<br/>(Queues offline if no network)"]
    Step2["2. AI Extract<br/>🧠 3-Tier OCR extracts numbers<br/>(Meter no, kWh/Litres, BDT amount)"]
    Step3["3. Verify<br/>🧑‍💼 Accountant confirms fields<br/>(Original photo side-by-side)"]
    Step4["4. Report<br/>🌱 Traceable kg CO2e report<br/>(Export PDF & share link for buyers)"]

    Step1 --> Step2 --> Step3 --> Step4
```

### The 4 Stages Explained:
1. **Capture (Jahid - Floor Staff):** Snaps a photo of the bill using the mobile PWA. If internet drops, it saves securely to IndexedDB and syncs automatically when reconnected.
2. **AI Extract (Automated):** Free local OCR reads printed text first; escalates to vision LLMs (Groq / Qwen) only for challenging handwritten receipts.
3. **Verify (Rahim - Accountant):** Trust before automation. The accountant reviews the original photo side-by-side with extracted values and signs off.
4. **Report (Kabir & Nusrat - Owner & Compliance):** System matches consumption with official national emission factors to calculate verified Scope 1 & 2 carbon footprints.

---

## 3. Simplified Core Data Model (The 7 Pillars)

Instead of the full 41-table internal database, this simplified model shows the 7 fundamental entities that power the platform:

```mermaid
erDiagram
    ORGANIZATION ||--o{ SITE : operates
    SITE ||--o{ ASSET_METER : monitors
    ASSET_METER ||--o{ UTILITY_BILL : generates
    UTILITY_BILL ||--|| CONSUMPTION_ACTIVITY : converts_to
    CONSUMPTION_ACTIVITY ||--|| CARBON_EMISSION : calculates
    CARBON_EMISSION }o--|| BUYER_REPORT : aggregates
    ORGANIZATION ||--o{ ENERGY_RECOMMENDATION : receives

    ORGANIZATION {
        string Name "e.g. Apex Textiles Ltd."
        string Sector "RMG / Dyeing / Garments"
    }
    SITE {
        string Facility "Gazipur Plant #1"
        string Location "Dhaka Division"
    }
    ASSET_METER {
        string Type "Grid Electricity / Gas Boiler / Diesel Gen"
        string MeterNumber "DESCO-449210"
    }
    UTILITY_BILL {
        string PhotoUrl "Original source bill image"
        string SHA256 "Deduplication fingerprint"
        string Status "PendingReview / Confirmed"
    }
    CONSUMPTION_ACTIVITY {
        decimal Quantity "12,450 kWh / 850 Litres"
        decimal CostBDT "৳ 118,500"
        string Period "2026-09 (September)"
    }
    CARBON_EMISSION {
        decimal Scope1_kg "Direct diesel/gas emissions"
        decimal Scope2_kg "Grid electricity emissions"
        string FactorSource "Bangladesh Grid 2024 / IPCC"
    }
    BUYER_REPORT {
        string Period "Q3 2026 ESG Report"
        string ShareToken "Expiring secure link"
        decimal Total_tCO2e "Total metric tons CO2e"
    }
    ENERGY_RECOMMENDATION {
        string Measure "LED retrofitting / VFD on boiler"
        decimal AnnualSavingBDT "৳ 420,000 / year"
        decimal PaybackYears "1.4 years payback"
    }
```

---

## 4. Key Highlights for Project Updates

### 💡 Why This Design Wins
- **Bangla-First Floor Experience:** Built specifically for factory workers with minimal tech literacy; ultra-lightweight (<30 KB initial JavaScript load).
- **Zero Hallucination Risk:** Numbers are never committed to ESG reports without explicit accountant confirmation against the original photo.
- **Cost-Resilient Architecture:** Operates with $0 cloud infrastructure fees during pilot testing using SQLite WAL mode, local Tesseract OCR, and Cloudflare free tier.
- **Traceable to the Exact Meter:** Every carbon number in a buyer's PDF links directly back to the original utility invoice, factor source, and reviewer timestamp.
- **High Throughput & Speed:** Backend built on .NET 8 LTS with 174 passing automated tests ensuring 100% tenant data isolation and mathematical precision.
