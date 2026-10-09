# Handoff: B-to-ALL-review-ready

- **From**: Dev 2 (Capture & Extraction)
- **To**: Dev 1 (Platform & Activity/Calculation), Dev 3 (Flags & GapDetection), All
- **Date**: 2026-10-08
- **Topic**: Review module backend endpoints and atomic confirmation workflow are live

---

## 1. What was built

1. **Review Module Endpoints**:
   - `GET /api/v1/review/queue` - Sorted lowest confidence first, filterable by `siteId` and `docType`.
   - `PUT /api/v1/documents/{id}/fields` - Correct extracted values with non-destructive versioning (`corrected_value` stored, original `raw_value` and `normalized_value` preserved).
   - `POST /api/v1/documents/{id}/confirm` - Validates required fields (`Vendor`, `BillNumber`, `Period`, `Quantity`, `Unit`), invokes `IActivityWriter.RecordConfirmedActivityAsync`, advances document state to `Confirmed` and then `Calculated`, creates `ReviewDecision`, and appends an audit log.
   - `POST /api/v1/documents/bulk-confirm` - Batch confirmation endpoint.
   - `GET /api/v1/review/settings` & `PUT /api/v1/review/settings` - Configures auto-confirm threshold and 10% sampling rate.

2. **Security & Authorization**:
   - Floor staff / operator role cannot confirm documents (`Operator`, `FloorStaff` blocked with 400).
   - Only `Accountant`, `FacilityManager`, `OrgAdmin`, or `PlatformAdmin` can confirm.

3. **Data Integrity & Duplicate Handling**:
   - "Keep one" duplicate resolution via `resolveDuplicateWithDocId`.
   - Single transaction semantics: if `IActivityWriter` fails, the document confirmation is aborted and state is not advanced.

4. **Estimated Data Support**:
   - Supports `is_estimated = true` for missing month entry estimates.

---

## 2. Integration Points for Other Tracks

- **Dev 1 (A5 Activity & Calculation)**:
  `IActivityWriter` is defined in `CarbonBill.SharedKernel.Contracts.IActivityWriter`. Currently `FakeActivityWriter` provides default execution. When A5 Activity module is ready, wire `ActivityWriter` to insert into `ActivityRecords`.
- **Dev 3 (C3 Flags & C1 GapDetection)**:
  `ReviewDecision` domain events and audit entries are generated on `DocumentConfirmed`. `DocumentStatuses.Calculated` signals ready for footprint calculation and readiness flag evaluation.
