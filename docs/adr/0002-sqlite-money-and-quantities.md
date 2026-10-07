# ADR 0002: Representation of Money and Quantities in SQLite

## Status
Accepted

## Context
SQLite stores numbers as either 64-bit signed integers or 64-bit IEEE floating-point numbers (`REAL`). EF Core SQLite cannot reliably aggregate (`SUM`, `AVG`) or sort arbitrary high-precision `decimal` values server-side when stored as floating point or raw text. Floating-point types (`float`, `double`) cause roundoff errors that are unacceptable in carbon accounting and financial calculations.

## Decision
1. **Domain & Application Code**:
   - Strictly use C# `decimal` for all financial amounts (BDT), emission factors, standard quantities, and carbon emission outputs (`kg CO2e`, `tCO2e`). `float` or `double` are forbidden in business logic.
   - Rounding is applied **only at presentation time** (in the UI or PDF reports).

2. **Database Storage in SQLite**:
   - **Money**: Stored as `INTEGER` representing **Paisa** (1 BDT = 100 Paisa). Converted automatically in EF Core using `PaisaMoneyConverter`.
   - **High-Precision Quantities & Emissions**: Stored as scaled 64-bit `INTEGER` with a scale factor of $10^6$ (micro-unit precision, 6 decimal places: `1.000000` = `1,000,000`). Converted automatically using `ScaledQuantityConverter(6)`.
   - Storing as scaled integers allows exact, fast SQL-level `SUM()` and `AVG()` aggregations in SQLite without precision loss.

3. **Value Converters**:
   - `PaisaMoneyConverter`: `v => (long)Math.Round(v * 100m, MidpointRounding.AwayFromZero)` <-> `v => (decimal)v / 100m`
   - `ScaledQuantityConverter`: `v => (long)Math.Round(v * 10^6, MidpointRounding.AwayFromZero)` <-> `v => (decimal)v / 10^6`
