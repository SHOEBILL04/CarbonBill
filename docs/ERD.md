# CarbonBill: Entity Relationship Diagram (ERD)

> **Storage Engine:** SQLite 3 (WAL Mode)  
> **Multi-Tenancy:** Row-level isolation via EF Core Global Query Filter on `OrgId`  
> **Scope:** Full platform data model for SME carbon accounting and buyer reporting

---

## 1. Simplified Core ERD (The 7 Pillars)

High-level stakeholder view of the fundamental entities that power the platform from bill ingestion to verified buyer report:

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

## 2. Complete Domain-by-Domain Modular ERD

Because CarbonBill is built as a **Modular Monolith**, hard database foreign keys are strictly enforced within modules, while cross-module boundaries communicate through logical identifiers (`Guid`).

### 2.1 Identity, Tenancy & Factory Onboarding

```mermaid
erDiagram
    Organizations ||--o{ Memberships : has
    Users ||--o{ Memberships : holds
    Users ||--o{ RefreshTokens : owns
    Organizations ||--o{ Invitations : issues
    Organizations ||--o{ Sites : operates
    Organizations ||--o{ OrganizationSettings : configures
    Sites ||--o{ Assets : equips
    Sites ||--o{ FacilityProfiles : profiles
    Assets ||--o{ ExpectedDocRules : requires

    Organizations {
        TEXT Id PK
        TEXT Name
        TEXT Slug
        TEXT Sector
        INTEGER IsActive
    }
    Users {
        TEXT Id PK
        TEXT Email
        TEXT FullName
        TEXT Role
        TEXT PhoneNumber
        TEXT PreferredLanguage
    }
    Memberships {
        TEXT Id PK
        TEXT OrgId FK
        TEXT UserId FK
        TEXT Role
        INTEGER IsActive
    }
    Invitations {
        TEXT Id PK
        TEXT OrgId FK
        TEXT Token UK
        TEXT PinHash
        TEXT Role
        TEXT ExpiresAtUtc
    }
    Sites {
        TEXT Id PK
        TEXT OrgId FK
        TEXT Name
        TEXT Location
    }
    Assets {
        TEXT Id PK
        TEXT OrgId
        TEXT SiteId FK
        TEXT Name
        TEXT Type
        TEXT IdentifierOrMeterNumber
        TEXT FuelOrEnergyType
    }
    ExpectedDocRules {
        TEXT Id PK
        TEXT OrgId
        TEXT AssetId FK
        TEXT DocumentType
        TEXT Frequency
        INTEGER ExpectedDayOfMonth
    }
```

---

### 2.2 Documents, Extraction & Human Review

```mermaid
erDiagram
    Documents ||--o{ DocumentPages : contains
    Documents ||--o{ ExtractionRuns : triggers
    ExtractionRuns ||--o{ ExtractedFields : yields
    Documents ||--o{ Decisions : confirmed_by

    Documents {
        TEXT Id PK
        TEXT OrgId
        TEXT FileName
        TEXT Sha256 UK
        TEXT Status
        TEXT StoragePath
        INTEGER FileSizeBytes
    }
    DocumentPages {
        TEXT Id PK
        TEXT DocumentId FK
        INTEGER PageNumber
        TEXT StoragePath
    }
    ExtractionRuns {
        TEXT Id PK
        TEXT OrgId
        TEXT DocumentId
        INTEGER TierUsed
        TEXT OverallConfidence
        TEXT Status
    }
    ExtractedFields {
        TEXT Id PK
        TEXT ExtractionRunId FK
        TEXT FieldKey
        TEXT RawValue
        TEXT NormalizedValue
        TEXT Confidence
        TEXT BoundingBoxJson
    }
    Decisions {
        TEXT Id PK
        TEXT OrgId
        TEXT DocumentId
        TEXT ReviewerUserId
        TEXT DecisionType
        TEXT FieldOverridesJson
    }
```

---

### 2.3 Activity Records, Emission Factors & Calculations

```mermaid
erDiagram
    FactorSets ||--o{ EmissionFactors : publishes
    EmissionFactors ||--o{ FactorOverrides : customizes
    Units ||--o{ UnitConversions : converts
    ActivityRecords ||--o{ EmissionResults : calculates
    EmissionResults ||--o{ RecalculationProposals : proposes_change

    ActivityRecords {
        TEXT Id PK
        TEXT OrgId
        TEXT DocumentId
        TEXT SiteId
        TEXT AssetId
        TEXT ActivityType
        TEXT QuantityStandard
        TEXT StandardUnit
        TEXT TotalCostBdt
        TEXT Period
        INTEGER IsEstimated
    }
    FactorSets {
        TEXT Id PK
        TEXT Name
        TEXT GwpBasis
        INTEGER Year
        TEXT Region
    }
    EmissionFactors {
        TEXT Id PK
        TEXT FactorSetId FK
        TEXT FuelOrActivityType
        TEXT FactorValue
        TEXT Unit
        TEXT Scope
    }
    FactorOverrides {
        TEXT Id PK
        TEXT OrgId
        TEXT EmissionFactorId FK
        TEXT OverrideValue
        TEXT Justification
    }
    EmissionResults {
        TEXT Id PK
        TEXT OrgId
        TEXT ActivityRecordId
        TEXT EmissionFactorId
        TEXT KgCo2e
        TEXT Scope
        INTEGER IsEstimated
    }
```

---

### 2.4 Reports, Flags, Benchmarks & Recommendations

```mermaid
erDiagram
    Reports ||--o{ ReportSnapshots : freezes
    Reports ||--o{ ShareLinks : exposes
    MeasureSources ||--o{ Measures : catalogs
    Measures ||--o{ Recommendations : instances
    FlagRules ||--o{ Flags : flags

    Reports {
        TEXT Id PK
        TEXT OrgId
        TEXT ReportingPeriod
        TEXT Scope1KgCo2e
        TEXT Scope2KgCo2e
        TEXT Scope3KgCo2e
        TEXT TotalKgCo2e
        TEXT Status
    }
    ReportSnapshots {
        TEXT Id PK
        TEXT ReportId FK
        TEXT SnapshotHash
        TEXT SerializedDataJson
        TEXT CreatedAtUtc
    }
    ShareLinks {
        TEXT Id PK
        TEXT ReportId FK
        TEXT Token UK
        INTEGER RedactCommercialPrices
        TEXT ExpiresAtUtc
    }
    Flags {
        TEXT Id PK
        TEXT OrgId
        TEXT RuleId FK
        TEXT Severity
        TEXT Status
        TEXT EvidenceJson
    }
    Recommendations {
        TEXT Id PK
        TEXT OrgId
        TEXT MeasureId FK
        TEXT EstimatedAnnualSavingBdt
        TEXT EstimatedCapexBdt
        TEXT PaybackPeriodYears
        TEXT Status
    }
```
