# 06. Core System Flows & State Machines: CarbonBill

## 1. Core End-to-End Workflows

### 1.1 Capture and Extraction Pipeline (The Heart of CarbonBill)

1. **Step 1 (Client Capture & Processing):**
   - Floor staff (Jahid) snaps photo of bill/challan on mobile PWA.
   - Client-side canvas crops, corrects deskew hints, resizes to ~1600 px, strips EXIF GPS metadata, and encodes to WebP/JPEG under ~400 KB.
2. **Step 2 (Offline Queue & Idempotent Transmission):**
   - Encoded image stored in IndexedDB with a client-generated UUID `Idempotency-Key`.
   - Workbox Background Sync (Android) or app-open retry (iOS) automatically transmits file upon internet connectivity.
   - Support for manual fallback entry (litres + slip number now, photo later).
3. **Step 3 (API Receipt & Ingestion):**
   - API inspects magic bytes, validates size limits, computes SHA-256 hash.
   - Fast duplicate rejection by hash.
   - Writes `Document` entity with status `Uploaded`, uploads binary to Cloudflare R2, and returns a 202 receipt immediately (<3 s target) so Jahid sees "received".
4. **Step 4 (Asynchronous Extraction Job in Hangfire):**
   - **Normalise:** Converts Bangla numerals (`১২৩৪৫৬৭৮৯০` -> `1234567890`), standardizes Bangla/Latin dates, normalizes unit spelling variants (`"লিটার"`, `"ltr"`, `"L"` -> `litre`).
   - **Classify:** Classifies doc type (`electricity`, `diesel`, `gas`, `shipping`) by layout heuristics and keywords.
   - **Tier 1:** Runs Tesseract (`ben+eng`) with utility template matching. If all required fields exceed confidence and reconcile (totals match, dates plausible), accept Tier 1.
   - **Tier 2:** If confidence is below threshold, escalates to Azure Document Intelligence F0.
   - **Tier 3:** For handwriting or irregular slips, escalates to Vision LLM with JSON schema (only if organization has consented).
   - Records bounding boxes (`bbox`), source tier, and confidence for every extracted field.
   - Checks for power factor or demand charge penalty lines for bill savings flags.
5. **Step 5 (Completion & SignalR Broadcast):**
   - Transitions Document to `NeedsReview` (or `Failed` with plain-language reason and retake notification).
   - Emits SignalR real-time event `"OCR done"` to accountant's review queue.

```mermaid
sequenceDiagram
    autonumber
    actor Jahid as Floor Staff (PWA)
    participant API as CarbonBill API
    participant DB as PostgreSQL
    participant R2 as Cloudflare R2
    participant Queue as Hangfire Worker
    participant OCR as OCR Pipeline (T1/T2/T3)
    actor Rahim as Accountant (Web)

    Jahid->>Jahid: Snap photo, compress <400KB, strip EXIF
    Jahid->>API: POST /api/v1/documents (Idempotency-Key)
    API->>API: Check magic bytes & SHA-256
    API->>R2: Store encrypted image
    API->>DB: Insert Document (status: Uploaded)
    API-->>Jahid: 202 Accepted (Visual Receipt Confirmed)
    API->>Queue: Enqueue ExtractionJob(documentId)
    Queue->>OCR: Normalise digits/dates & classify
    OCR->>OCR: Run Tier 1 Tesseract -> Tier 2 Azure DI -> Tier 3 Vision LLM (if consented)
    OCR-->>Queue: Extracted fields, confidence, bbox
    Queue->>DB: Insert ExtractionRun & ExtractedField
    Queue->>DB: Update Document (status: NeedsReview)
    Queue->>Rahim: SignalR "OCR done" broadcast
```

---

### 1.2 Review and Confirmation Flow

1. **Queue Inspection:** Accountant (Rahim) opens `/review/queue`, sorted by lowest confidence fields first.
2. **Side-by-Side Review:** Left side displays original scanned invoice with zoom/rotate; right side displays editable fields. Clicking an input highlights the corresponding bounding box on the invoice.
3. **Keyboard-Driven Edit:** Rahim navigates using keyboard shortcuts (`Tab` to move, `Enter` to confirm, `N` for next document). Corrections update `corrected_value` while retaining original OCR text.
4. **Bulk Confirmation (Optional):** After 20 manual confirmations, organizations may enable auto-confirmation for documents exceeding high confidence thresholds; 10% random sample is routed to human review.
5. **Atomic Accounting Transaction:** Upon confirmation:
   - Creates `ActivityRecord` in canonical units (e.g. kWh, litres).
   - Looks up applicable emission factor from `FactorRegistry`.
   - Computes emissions: `kg CO2e = quantity_canonical x factor`.
   - Writes `EmissionResult`, sets Document to `Confirmed`, and logs `AuditLog` in one atomic database transaction.

```mermaid
sequenceDiagram
    autonumber
    actor Rahim as Accountant
    participant UI as Review UI
    participant API as Review Endpoints
    participant Calc as Activity & Calculation
    participant DB as PostgreSQL

    Rahim->>UI: Open review queue (lowest confidence first)
    UI->>Rahim: Display side-by-side: Image + Bounding Boxes + Fields
    Rahim->>UI: Correct field (Tab/Enter)
    Rahim->>API: POST /api/v1/documents/{id}/confirm
    API->>Calc: RecordConfirmedActivity(documentId)
    activate Calc
    Calc->>DB: Write ActivityRecord (canonical units)
    Calc->>DB: Fetch EmissionFactor (precedence: override > national > regional)
    Calc->>DB: Write EmissionResult (immutable kg CO2e)
    Calc->>DB: Update Document (status: Confirmed -> Calculated)
    Calc->>DB: Append AuditLog (Action: Confirm)
    deactivate Calc
    API-->>UI: Confirmation succeeded
    UI-->>Rahim: Advance to next document (N)
```

---

### 1.3 Missing-Data Detection & Escalation Flow

1. **Nightly & Upload Trigger:** Hangfire nightly cron and `DocumentUploaded` event compare `ExpectedDocRules` against received documents for each site, asset, and period.
2. **Calendar Checklist Evaluation:** If an asset lacks a confirmed or uploaded document for the billing period:
   - Generates or updates a `MissingAlert`.
3. **Escalation Schedule:**
   - **Day -7 (7 days before due date):** Low-priority calendar reminder in application.
   - **Day -3 (3 days before due date):** Web Push / In-app notification to responsible floor staff ("Please send diesel slip for Generator 2").
   - **Day 0 (Due Date):** Red severity alert escalated to Compliance Officer / Factory Owner dashboard; Carbon Flag `MISSING_DOCUMENT` raised.
4. **Resolution:** When the missing slip is uploaded, the alert resolves automatically.

```mermaid
sequenceDiagram
    autonumber
    participant Cron as Hangfire Nightly Job
    participant Gaps as Gap Detection Engine
    participant DB as PostgreSQL
    participant Push as Web Push / Notification
    actor Jahid as Floor Staff
    actor Nusrat as Compliance Officer

    Cron->>Gaps: EvaluateExpectedCalendar()
    Gaps->>DB: Fetch ExpectedDocRules & Received Documents
    alt Document Missing & Day = -3
        Gaps->>DB: Update MissingAlert (State: DayMinus3)
        Gaps->>Push: Trigger Push("Please send diesel slip for Gen 2")
        Push-->>Jahid: Mobile Push Alert
    else Document Missing & Day >= 0
        Gaps->>DB: Update MissingAlert (State: DayZero, Severity: Red)
        Gaps->>DB: Raise Carbon Flag (MISSING_DOCUMENT)
        Gaps->>Push: Escalate to Compliance
        Push-->>Nusrat: High Priority Alert on Dashboard
    else Document Uploaded
        Gaps->>DB: Mark MissingAlert Resolved
        Gaps->>DB: Resolve Carbon Flag (auto-clear)
    end
```

---

## 2. State Machines

### 2.1 Document State Machine

```mermaid
stateDiagram-v2
    [*] --> Uploaded : Client Upload
    Uploaded --> Queued : Storage Verified
    Queued --> Extracting : Hangfire Worker Picks Up
    Extracting --> NeedsReview : Extraction Completed
    Extracting --> Failed : Unreadable / Corrupted
    Failed --> ReuploadRequested : Retake Push Sent
    ReuploadRequested --> Uploaded : New Photo Received
    Extracting --> Duplicate : Duplicate SHA256 / Bill#
    NeedsReview --> Confirmed : Accountant Confirms
    Confirmed --> Calculated : EmissionResult Created
    Calculated --> InReport : Added to Report Draft
    InReport --> Locked : Report Approved
    Locked --> [*]
```

### 2.2 Report State Machine

```mermaid
stateDiagram-v2
    [*] --> Draft : Period Report Created
    Draft --> ReadyForReview : All Expected Documents Received
    ReadyForReview --> Approved : Compliance/Owner Signs Off
    Approved --> Locked : Content Hash & Snapshot Frozen
    Locked --> Superseded : Recalculation / Revised Factor
    Superseded --> [*]
```

### 2.3 Carbon Flag State Machine

```mermaid
stateDiagram-v2
    [*] --> Open : Rule Evaluated True
    Open --> Acknowledged : User Views & Acknowledges
    Open --> Resolved : Condition Automatically Clears
    Acknowledged --> Resolved : Source Document/Factor Fixed
    Open --> Dismissed : User Dismisses with Reason
    Acknowledged --> Dismissed : User Dismisses with Reason
    Dismissed --> Open : 30-Day Expiry Elapsed & Still Violating
    Resolved --> [*]
```

### 2.4 Recommendation State Machine

```mermaid
stateDiagram-v2
    [*] --> Suggested : Pipeline Identifies Measure
    Suggested --> Planned : Owner Adds to Decarbonization Plan
    Planned --> Done : Measure Implemented on Floor
    Done --> Done : Post-Bill Realised Savings Verified
    Suggested --> NotFeasible : User Dismisses with Reason
    Planned --> NotFeasible : User Dismisses with Reason
```

---

## 3. Assumptions

*No undocumented assumptions made. State transitions and flows accurately follow Sections 7 and 14 of the architecture document.*
