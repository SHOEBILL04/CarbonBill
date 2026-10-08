# 13. Engineering Conventions: CarbonBill

## 1. C# and .NET Standards

- **Target Framework:** .NET (current LTS, .NET 8).
- **Language Features:** C# 12 features enabled.
  - Nullable reference types strictly enabled (`<Nullable>enable</Nullable>`).
  - Warnings treated as errors (`<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`).
  - File-scoped namespaces throughout all files (`namespace CarbonBill.Modules.Identity;`).
  - Primary constructors for classes and records where concise and idiomatic.
  - Immutability by default: use C# `record` types for DTOs, domain events, commands, and queries.
- **Result Pattern for Business Outcomes:**
  - Avoid throwing exceptions for expected business errors or validation failures.
  - Use a strongly-typed `Result<T>` and `Error` pattern defined in `CarbonBill.Contracts`.

---

## 2. Numerical & Decimal Precision Rules (Strict)

Floating point types (`float`, `double`) are **strictly prohibited** in financial, energy, and GHG calculation logic due to binary representation inaccuracies.

- **Monetary Values (BDT):**
  - C# Type: `decimal`
  - PostgreSQL Column: `numeric(18,2)`
  - Represents currency in Bangladeshi Taka (e.g. `125000.50`).
- **Physical Quantities, Fuel Volumes, Energy & Activity:**
  - C# Type: `decimal`
  - PostgreSQL Column: `numeric(18,6)`
  - Handles high precision for small fractional quantities (e.g. `0.000412` tonnes).
- **Emission Factors & GWP Multipliers:**
  - C# Type: `decimal`
  - PostgreSQL Column: `numeric(18,6)`
- **Rounding:**
  - Rounding must only occur at the presentation layer (UI, PDF rendering, Excel export). Never round intermediate calculation results in the database or domain models.

---

## 3. Module Folder Structure

Every module under `src/Modules/CarbonBill.Modules.<ModuleName>/` must follow a standard Clean Architecture onion layout:

```text
CarbonBill.Modules.<ModuleName>/
├── Domain/
│   ├── Entities/                 # Domain entities and aggregates
│   ├── ValueObjects/             # Immutable value types (e.g. BoundingBox, Period)
│   ├── Enums/                    # Domain-specific enumerations
│   └── Exceptions/               # Domain-specific unrecoverable exceptions
├── Application/
│   ├── Commands/                 # Write operations (Command record + Handler)
│   ├── Queries/                  # Read operations (Query record + Handler + DTO)
│   ├── EventHandlers/            # Handlers for internal or contract domain events
│   └── Validators/               # FluentValidation command validators
├── Infrastructure/
│   ├── Persistence/              # ModuleDbContext, EF configurations, Migrations
│   ├── Adapters/                 # Implementations of module or contract interfaces
│   └── BackgroundJobs/           # Hangfire recurring and queue job definitions
├── Endpoints/
│   └── <Entity>Endpoints.cs      # Minimal API route definitions (MapGroup)
└── ModuleRegistration.cs         # ServiceCollection and EndpointRouteBuilder extension methods
```

### Module Registration Standard
Each module must expose a single extension class containing:
```csharp
public static class ModuleRegistration
{
    public static IServiceCollection Add<Name>Module(this IServiceCollection services, IConfiguration configuration);
    public static IEndpointRouteBuilder Map<Name>Endpoints(this IEndpointRouteBuilder app);
}
```

---

## 4. Multi-Tenancy & Database Conventions

- **Database Schemas:**
  - Every module owns a dedicated PostgreSQL schema matching its domain (e.g. `identity`, `onboarding`, `documents`, `extraction`, `calculation`, `flags`, `recommendations`, `reporting`).
- **Organization Isolation (`org_id`):**
  - Every tenant-scoped entity must inherit from a common base entity or interface containing `Guid OrgId { get; }`.
  - **Defense Layer 1 (Application):** EF Core global query filters automatically filter queries by `ITenantContext.OrgId`.
  - **Defense Layer 2 (Database):** PostgreSQL Row-Level Security (RLS) policies enforce isolation even against raw SQL or misconfigured queries:
    ```sql
    ALTER TABLE <schema>.<table_name> ENABLE ROW LEVEL SECURITY;
    CREATE POLICY tenant_isolation_policy ON <schema>.<table_name>
      USING (org_id = NULLIF(current_setting('app.current_org', true), '')::uuid);
    ```
- **Naming Conventions:**
  - PostgreSQL tables and columns use `snake_case`.
  - C# classes, records, and properties use `PascalCase`.
  - EF Core configurations must explicitly map property names using snake_case conventions.

---

## 5. API Design & Error Handling

- **Endpoint Paths:** All REST endpoints reside under versioned paths `/api/v1/...`.
- **Error Format:**
  - Follow RFC 7807 `application/problem+json`.
  - Errors must contain:
    - `type`: URI identifying the error condition.
    - `title`: Short error summary.
    - `status`: HTTP status code (e.g. 400, 404, 409, 422).
    - `detail`: User-safe message localized according to the `Accept-Language` header (`bn` for Bangla, `en` for English).
    - `instance`: Request trace / correlation ID.
- **Pagination:**
  - High-volume listing endpoints (e.g. `/documents`, `/review/queue`, `/flags`) must use **cursor-based pagination** (`cursor`, `limit`).
  - Cursor encodes creation timestamp or sequential identifier; page numbers (`page=X`) are avoided for mutating queues.
- **Concurrency & Caching (ETags):**
  - Resource representations (e.g. document review fields, reports) return strong `ETag` headers.
  - Mutation endpoints support `If-Match` headers to prevent lost updates in concurrent review sessions.
- **Idempotency Keys:**
  - Mutation endpoints with network retry risks (notably `POST /api/v1/documents`) require an `Idempotency-Key: <guid>` header.
  - Middleware stores the idempotency key and cached response hash in PostgreSQL for 24 hours.

---

## 6. Internationalization (i18n) & Localisation Rules

- **Zero Inline Text:**
  - Hard-coded user-facing strings are strictly forbidden in UI components.
  - Every label, button, error message, and tooltip must use an i18next translation key.
- **Supported Locales:**
  - `bn` (Bangla - Default for Floor Staff capture routes).
  - `en` (English - Standard business/export terminology).
- **Bangla Numerals and Currency:**
  - Numbers in the Bangla locale must format using Bangla digits (`১২৩৪৫৬৭৮৯০`).
  - Currency values must explicitly format as Bangladeshi Taka (`৳` or `BDT`).
- **Calendar Representation:**
  - Display dates using localized month names in Bangla for factory floor clarity.

---

## 7. Testing Standards & Test Types

| Test Suite | Project Path | Responsibilities & Technology |
|---|---|---|
| **Unit Tests** | `tests/CarbonBill.UnitTests` | Pure business logic, unit conversions, formula verification, Flag rule triggers, recommendation calculations. Fast, zero I/O. |
| **Architecture Tests** | `tests/CarbonBill.ArchitectureTests` | NetArchTest enforcing: zero cross-module references, no direct DB access from controllers, strict interface conventions. |
| **Integration Tests** | `tests/CarbonBill.IntegrationTests` | Testcontainers with real PostgreSQL: EF Core migrations, global query filters, RLS policy verification, outbox event dispatching. |
| **Tenant Isolation Tests** | `tests/CarbonBill.IntegrationTests` | **Mandatory requirement:** For every new tenant entity, a test must execute an adversarial query proving that Org A cannot read or modify Org B's data under any circumstance. |
| **Contract Tests** | `src/CarbonBill.Contracts` | Abstract test classes that verify both `CarbonBill.Contracts.Fakes` and real module implementations satisfy expected interface behaviors. |
| **Golden OCR Tests** | `tests/OcrGolden` | Evaluation harness running sample bills (printed and handwritten Bangla) against OCR pipeline to track field-level extraction accuracy. |
