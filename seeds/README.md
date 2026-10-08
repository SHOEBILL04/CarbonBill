# CarbonBill Seed Files, Fixtures & Dev Data

This directory contains versioned seed templates, sample datasets, JSON validation schemas, and a fake development dataset for testing and running CarbonBill without live external services.

---

## 1. Directory Structure

```text
seeds/
├── schemas/                            # JSON Schemas (Draft 2020-12)
│   ├── unit_conversions.schema.json    # Schema for canonical unit conversions
│   ├── factor_set.schema.json          # Schema for emission factor sets
│   ├── flag_rules.schema.json          # Schema for Carbon Flags rules & thresholds
│   ├── measure_library.schema.json     # Schema for decarbonization measures
│   ├── measure_sources.schema.json     # Schema for research citations
│   └── benchmark.schema.json           # Schema for peer intensity distributions
├── units/
│   └── unit_conversions.csv            # Canonical unit conversions (kWh, litre, kg, m3, tonne-km)
├── factors/
│   ├── factor_set_TEMPLATE.csv         # Clean template with null factor values for real data
│   └── factor_set_SAMPLE.csv           # FAKE_ factors for unit & integration tests
├── flags/
│   └── flag_rules.json                 # All 14 Carbon Flags with default tunable parameters
├── measures/
│   ├── measure_sources_TEMPLATE.json   # Research sources (IFC PaCT, SREDA, IDCOL, Cascale)
│   ├── measure_library_TEMPLATE.json   # 12 starter measures with null numeric fields
│   └── measure_library_SAMPLE.json     # FAKE_ measures for testing the 8-step pipeline
├── benchmarks/
│   ├── benchmark_TEMPLATE.json         # Clean template for sector peer distributions
│   └── benchmark_SAMPLE.json           # FAKE_ benchmarks (gated by min_n_required = 10)
└── dev/                                # Believable fake dataset for local development
    ├── organization.json               # 1 RMG factory (Apex Apparels) + 4 users
    ├── site_assets.json                # 1 site, 2 electricity meters, 1 genset, 1 boiler
    ├── expected_rules.json             # 4 monthly expected document calendar rules
    ├── production_metrics.json         # 12 months piece production data
    ├── documents.json                  # Sample uploaded/processed document metadata
    ├── activity_records.json           # 12 months normalized activity records
    ├── emission_results.json           # 12 months calculated kg CO2e emissions
    └── seed_summary.json               # Matrix proving all 14 Carbon Flags are exercised
```

---

## 2. Seed Data Files Overview

### 2.1 Canonical Units (`seeds/units/unit_conversions.csv`)
- **Canonical Units:** `kWh` (electricity), `litre` (liquid fuels), `kg` (solid fuels/biomass), `m3` (gaseous fuels), `tonne-km` (freight transport).
- **Exact SI / Definition Conversions:** Exact mathematical multipliers (e.g. $1\text{ MWh} = 1000\text{ kWh}$, $1\text{ US Gallon} = 3.785412\text{ litres}$, $100\text{ CFT} = 2.831685\text{ m}^3$).
- **Source Needed:** Flagged with `source_needed = true` for empirical expansions (e.g. liquid-to-gas LPG ratios).

### 2.2 Emission Factors (`seeds/factors/`)
- **Template (`factor_set_TEMPLATE.csv`):** Blank numerical columns where an expert must supply authoritative factors before pilot release.
- **Sample (`factor_set_SAMPLE.csv`):** Clearly marked with `FAKE_TEST_FACTOR_SET_2024` for unit and contract testing.

### 2.3 Carbon Flags (`seeds/flags/flag_rules.json`)
- Defines default starting thresholds for all 14 Carbon Flags across the 4 flag families:
  - **Data Quality:** `MISSING_DOCUMENT`, `LOW_OCR_CONFIDENCE`, `DUPLICATE_SUSPECTED`, `IMPLAUSIBLE_VALUE`, `ESTIMATED_SHARE_HIGH`.
  - **Footprint:** `SPIKE_MOM`, `HOTSPOT_DETECTED`, `GENSET_RELIANCE`, `INTENSITY_ABOVE_PEERS`, `TARGET_DRIFT`.
  - **Buyer Readiness:** `REPORT_NOT_READY`, `FACTOR_OUTDATED`, `OVERRIDE_UNAPPROVED`.
  - **Bill Savings:** `POWER_FACTOR_PENALTY`.
- All thresholds are tunable at runtime via Platform Admin (`flags.flag_rules` table) without application redeployment.

### 2.4 Measure Library (`seeds/measures/`)
- Contains the 12 starter measures relevant to Bangladeshi SME manufacturers (LED daylighting, VFDs, steam trap repair, power factor correction, rooftop solar, etc.).
- Categorized into Evidence Grades **A** (measured local data), **B** (regional case studies), and **C** (engineering estimates).

### 2.5 Sector Benchmarks (`seeds/benchmarks/`)
- Implements the honesty rule: if sample size $n < 10$, the UI and API suppress peer percentiles and return *"no benchmark yet"*.

---

## 3. C# Seed Loader Specification

The seed loader is utilized by `CarbonBill.Contracts.Fakes` in test environments and by `CarbonBill.Modules.PlatformAdmin` for database initialization.

### 3.1 Recommended C# DTO Contracts

```csharp
namespace CarbonBill.Contracts.Seeds;

public sealed record UnitConversionSeedDto(
    string FromUnit,
    string ToUnit,
    decimal Factor,
    string Version,
    bool IsExact,
    bool SourceNeeded,
    string? Notes);

public sealed record EmissionFactorSeedDto(
    string SetName,
    string GwpBasis,
    string Source,
    int Year,
    string Region,
    string Version,
    DateOnly ValidFrom,
    DateOnly? ValidTo,
    string ActivityType,
    string CanonicalUnit,
    decimal? FactorValue,
    bool SourceNeeded,
    string? Notes);

public sealed record FlagRuleSeedDto(
    string FlagCode,
    string Family,
    string NameBn,
    string NameEn,
    string DefaultSeverity,
    Dictionary<string, object> TriggerParameters,
    string SuggestedActionBn,
    string SuggestedActionEn);

public sealed record MeasureSeedDto(
    string MeasureCode,
    string NameBn,
    string NameEn,
    string Category,
    string[] ApplicableSectors,
    Dictionary<string, object> ApplicabilityRules,
    decimal? SavingLow,
    decimal? SavingTypical,
    decimal? SavingHigh,
    decimal? CapexLow,
    decimal? CapexHigh,
    string? CapexUnit,
    int? LifetimeYears,
    string? EvidenceGrade,
    string SourceCode,
    string? LocalNotes);
```

### 3.2 Loader Implementation Pattern

```csharp
public interface ISeedDataLoader
{
    Task<IReadOnlyList<UnitConversionSeedDto>> LoadUnitConversionsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<EmissionFactorSeedDto>> LoadFactorSetAsync(string path, CancellationToken ct = default);
    Task<IReadOnlyList<FlagRuleSeedDto>> LoadFlagRulesAsync(CancellationToken ct = default);
    Task<IReadOnlyList<MeasureSeedDto>> LoadMeasureLibraryAsync(string path, CancellationToken ct = default);
    Task<DevDatasetBundle> LoadDevDatasetAsync(CancellationToken ct = default);
}
```

#### Ingestion Rules:
1. **CSV Parsing:** Use `CsvHelper` with invariant culture (`CultureInfo.InvariantCulture`) to ensure decimals parse with period (`.`) separators.
2. **JSON Parsing:** Use `System.Text.Json` with `JsonNamingPolicy.SnakeCaseLower` and `PropertyNameCaseInsensitive = true`.
3. **Decimal Guard:** Parse all numeric values directly into `decimal`. Never parse through `float` or `double`.
4. **Validation:** Validate loaded datasets against the corresponding JSON schema in `seeds/schemas/` before committing to database tables.

---

## 4. Fake Development Dataset (`seeds/dev/`)

The fake dev dataset models 1 complete annual cycle (2024) for **Apex Apparels Limited** (RMG factory in Savar, Dhaka):
- **1 Site, 4 Assets:** 2 electricity meters, 1 diesel generator, 1 gas boiler.
- **12 Months Activity & Emissions:**
  - 10 regular operational months.
  - **August 2024 (Spike Month):** Diesel consumption surges to 18,500 L (3.25x median), triggering `SPIKE_MOM`, `GENSET_RELIANCE`, and `INTENSITY_ABOVE_PEERS`.
  - **September 2024 (Low Confidence & Penalty):** Bill has OCR confidence 0.62 and power factor 0.82 with 42,500 BDT penalty, triggering `LOW_OCR_CONFIDENCE` and `POWER_FACTOR_PENALTY`.
  - **October 2024 (Duplicate):** Duplicate challan upload triggering `DUPLICATE_SUSPECTED`.
  - **November 2024 (Outlier):** Typo quantity 520,000 L triggering `IMPLAUSIBLE_VALUE`.
  - **December 2024 (Missing Month):** Diesel slip absent, triggering `MISSING_DOCUMENT` and `REPORT_NOT_READY`; estimated electricity accounts for 72.6% of monthly footprint, triggering `ESTIMATED_SHARE_HIGH`.

See `seeds/dev/seed_summary.json` for the complete mapping of every Carbon Flag triggered by this dataset.
