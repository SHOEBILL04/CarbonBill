# TRACK B: Capture and Extraction (Dev 2)

## 1. Track Scope & Responsibilities

Dev 2 owns the complete data intake and verification experience: mobile image capture on factory floors, offline synchronization, multi-tier background OCR pipelines, human-in-the-loop verification, and review interfaces.

---

## 2. Owned Folders & Modules

### Backend Modules
- `src/Modules/CarbonBill.Modules.Documents`
- `src/Modules/CarbonBill.Modules.Extraction`
- `src/Modules/CarbonBill.Modules.Review`

### Frontend Folders (`web/`)
- `web/src/app` (Application shell, root routing, role-based entry)
- `web/src/shared` (Shared UI component kit, design tokens, Bangla/BDT formatters, API client)
- `web/src/features/capture` (Floor staff 2-tap PWA capture, offline queue)
- `web/src/features/review` (Side-by-side review workspace, keyboard shortcuts)

---

## 3. Deliverables Breakdown (B1 to B6)

- **B1 — Documents Backend:**
  - Upload hardening (magic-byte check, image re-encode, EXIF GPS stripping).
  - SHA-256 deduplication and Cloudflare R2 file storage adapter (`IFileStore`).
  - Document entity lifecycle (`Uploaded`..`Locked`) and manual fallback endpoint.
  - Implement `IDocumentReadModel` and `IDocumentStateCommands`.
  - Handoff: `B-to-C-documents-read.md`.
- **B2 — Extraction Pipeline (Tier 1):**
  - Hangfire job running on `DocumentUploaded`.
  - Normalization: Bangla numerals to Latin, date formats, unit variants.
  - Classification heuristics (electricity, diesel, gas, shipping).
  - Tier 1 Tesseract (`ben+eng`) with utility template matching.
  - Bounding box (`bbox`) coordinate persistence and SignalR `"OCR done"` broadcast.
- **B3 — OCR Tiers 2 & 3, Golden Harness:**
  - Azure Document Intelligence (Tier 2, F0 free tier) integration with fallback.
  - Vision LLM (Tier 3) with JSON schema, strictly gated by organizational consent.
  - Golden OCR test set harness in `tests/OcrGolden` evaluating per-field accuracy on 150 bills.
- **B4 — Review Backend:**
  - Review queue endpoint sorted by lowest confidence first.
  - Field correction updates and atomic confirmation transaction (`IActivityWriter`).
  - Optional auto-confirmation rule with 10% random sampling audit.
  - Handoff: `B-to-ALL-review-ready.md`.
- **B5 — Floor Staff Capture PWA:**
  - 2-tap Bangla mobile interface with 4 large category icons (diesel, gas, electricity, shipment).
  - Client-side crop, deskew, and compression under 400 KB.
  - IndexedDB offline queue with Workbox Background Sync surviving app restarts.
  - Instant visual receipt confirmation (<3 s).
- **B6 — Review UI Workspace:**
  - Side-by-side comparison screen (original scan left, editable fields right).
  - Bounding box highlight on click.
  - Keyboard navigation (`Tab`, `Enter`, `N`).
  - SignalR live updates.

---

## 4. Non-Functional & Performance Targets

| Target Metric | Requirement |
|---|---|
| **Capture Receipt Latency** | Under 3 seconds on 3G network once online |
| **Floor Route Bundle Size** | Under 200 KB initial JavaScript payload |
| **OCR Processing Latency** | Under 60 seconds typical execution per bill |
| **Offline Durability** | Offline queue survives app crashes and device restarts |

---

## 5. Track Risks & Mitigations

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| **Bangla Handwriting OCR Failure** | Low accuracy on manual diesel slips and fuel challans. | Tier 3 Vision LLM (consented) paired with manual fallback entry mode (enter litres/taka now, photo later). |
| **Patchy Factory Network Connectivity** | Incomplete uploads and user frustration. | Robust IndexedDB offline queue with Background Sync API and resumable uploads. |
| **Review Fatigue from Large Challan Batches** | Accounting bottlenecks during month-end closing. | Keyboard-only fast workflow (`Tab`/`Enter`/`N`) and sampling-audited auto-confirm for high-confidence bills. |
