# ADR 0001: Use SQLite for Demo/Pilot and Scale Path to PostgreSQL

## Status
Accepted

## Context
The "CarbonBill: System Architecture and Solution Design (.NET Edition)" original specification targeted PostgreSQL with row-level security (RLS). For the initial demo and pilot phases (serving 5 to 10 SME factories), minimizing moving parts, eliminating cloud database egress latency, and running zero-cost local infrastructure is prioritized.

## Decision
We adopt **SQLite** as the primary storage engine for the API and Hangfire background jobs during the Demo and Pilot stages, with the following architectural constraints:

1. **Connection PRAGMAs (Enforced via Interceptor)**:
   - `PRAGMA journal_mode = WAL;` (Enables concurrent readers while a single write transaction executes)
   - `PRAGMA foreign_keys = ON;` (Enforces relational foreign key integrity)
   - `PRAGMA busy_timeout = 5000;` (Waits up to 5000ms on lock contention before erroring)
   - `PRAGMA synchronous = NORMAL;` (Ensures durability while maximizing write throughput in WAL mode)

2. **Tenant Isolation Enforced in Code**:
   - SQLite lacks native Row-Level Security (RLS).
   - Enforced via EF Core **Global Query Filters** (`OrgId == CurrentOrgId`) on all tenant-scoped entities.
   - Enforced via `TenantSaveChangesInterceptor` which automatically stamps `OrgId` on inserts and throws `CrossTenantAccessException` on any unauthorized cross-tenant writes/deletes.

3. **Storage Topology**:
   - Single database file residing on a mounted volume (`/data/carbonbill.db`).
   - The API and Hangfire worker share the same database file on the same host with shared cache.
   - Write transactions are kept short and fast.
   - Transient `SQLITE_BUSY` errors are handled gracefully via Polly exponential backoff retry middleware.

4. **Backups & Disaster Recovery**:
   - Atomic live backups are taken using SQLite's native `VACUUM INTO` command via a Hangfire scheduled job.
   - Backup snapshots are pushed to Cloudflare R2 object storage via the `IFileStore` abstraction.

## Scale Path & Triggers to Migrate to PostgreSQL
We will trigger migration back to PostgreSQL when any of the following conditions are met:
- **Multiple API Instances**: Need to scale horizontally across multiple compute nodes (SQLite cannot share write locks across network filesystems).
- **Write Contention**: Peak concurrent bill uploads/extractions cause recurring write wait times > 2 seconds.
- **Advanced DB Features**: Need for PostgreSQL native partitioned tables or pgvector.
