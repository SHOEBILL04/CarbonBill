# 05. REST API Contract Specification: CarbonBill

All API endpoints follow REST conventions, versioned under `/api/v1`.

## 1. Global Conventions

- **Content-Type:** `application/json` (or `multipart/form-data` for file upload).
- **Authentication:** Bearer JWT in `Authorization` header (`Authorization: Bearer <token>`).
- **Error Format:** RFC 7807 `application/problem+json`:
  ```json
  {
    "type": "https://carbonbill.org/errors/validation-failed",
    "title": "Validation Failed",
    "status": 400,
    "detail": "বিদ্যুৎ বিলের মিটার নম্বর পাওয়া যায়নি।",
    "instance": "urn:trace:a81b-4f92-b01c",
    "errors": {
      "meterNumber": ["Meter number is required."]
    }
  }
  ```
- **Language Negotiation:** Respects `Accept-Language: bn` (Bangla) or `Accept-Language: en` (English) for user-facing `detail` error messages.
- **Idempotency:** Mutation endpoints with network retry risks require header `Idempotency-Key: <guid>` (e.g. `POST /api/v1/documents`).
- **Pagination:** List endpoints return cursor-based pagination:
  ```json
  {
    "items": [...],
    "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI2LTEwLTA4VDA5OjAwOjAwWiJ9",
    "hasMore": true
  }
  ```

---

## 2. Endpoints by Owning Module

### 2.1 Identity & Tenancy (Owned by Dev 1)

#### `POST /api/v1/auth/login`
- **Role Required:** Public / Anonymous
- **Request:**
  ```json
  { "email": "rahim@factory.com", "password": "secure_password" }
  ```
- **Response (200 OK):**
  ```json
  {
    "accessToken": "jwt_token_string",
    "expiresIn": 900,
    "user": { "id": "uuid", "fullName": "Rahim Ahmed", "role": "Accountant", "orgId": "uuid" }
  }
  ```

#### `POST /api/v1/auth/join` (Floor Staff QR Join)
- **Role Required:** Public / Anonymous
- **Request:**
  ```json
  { "inviteToken": "qr_token_string", "pin": "1234", "fullName": "Jahid Hossain" }
  ```
- **Response (200 OK):**
  ```json
  {
    "accessToken": "jwt_token_string",
    "user": { "id": "uuid", "fullName": "Jahid Hossain", "role": "FloorStaff", "orgId": "uuid" }
  }
  ```

#### `POST /api/v1/auth/refresh`
- **Role Required:** Public (via HTTP-only refresh cookie)
- **Response (200 OK):** `{ "accessToken": "new_jwt", "expiresIn": 900 }`

#### `POST /api/v1/auth/switch-org` (Consultant Multi-Tenant)
- **Role Required:** `Consultant`
- **Request:** `{ "targetOrgId": "uuid" }`
- **Response (200 OK):** `{ "accessToken": "scoped_jwt_for_target_org" }`

---

### 2.2 Onboarding (Owned by Dev 1)

#### `POST /api/v1/onboarding/sites`
- **Role Required:** `Owner`, `Compliance`
- **Request:**
  ```json
  { "name": "Savar Unit 1", "location": "Savar, Dhaka" }
  ```
- **Response (201 Created):** `{ "id": "uuid", "name": "Savar Unit 1" }`

#### `POST /api/v1/onboarding/assets`
- **Role Required:** `Owner`, `Compliance`
- **Request:**
  ```json
  { "siteId": "uuid", "type": "genset", "name": "Cummins Diesel 500kVA" }
  ```
- **Response (201 Created):** `{ "id": "uuid", "name": "Cummins Diesel 500kVA" }`

#### `POST /api/v1/onboarding/rules`
- **Role Required:** `Owner`, `Compliance`
- **Request:**
  ```json
  {
    "assetId": "uuid",
    "docType": "diesel_slip",
    "frequency": "monthly",
    "dueDay": 5,
    "responsibleUserId": "uuid"
  }
  ```
- **Response (201 Created):** `{ "id": "uuid", "status": "Active" }`

#### `POST /api/v1/onboarding/profile/facility`
- **Role Required:** `Owner`, `Compliance`
- **Request:**
  ```json
  {
    "hasBoiler": true,
    "hasGenset": true,
    "roofAreaSqFt": 25000,
    "buildingOwnership": "Owned",
    "budgetBandBdt": "500000-2000000"
  }
  ```
- **Response (200 OK):** `{ "status": "ProfileSaved" }`

---

### 2.3 Documents (Owned by Dev 2)

#### `POST /api/v1/documents`
- **Role Required:** `FloorStaff`, `Accountant`, `Compliance`, `Owner`, `Consultant`
- **Headers:** `Idempotency-Key: <client-guid>`
- **Content-Type:** `multipart/form-data`
- **Request:**
  - `file`: binary WebP/JPEG image (max 1600px, <400 KB)
  - `capturedAt`: `2026-10-08T05:00:00Z`
  - `source`: `"phone"`
- **Response (202 Accepted):**
  ```json
  {
    "id": "uuid",
    "status": "Uploaded",
    "receipt": { "received": true, "timestamp": "2026-10-08T05:00:01Z" }
  }
  ```

#### `GET /api/v1/documents`
- **Role Required:** `Accountant`, `Compliance`, `Owner`, `Consultant`
- **Query Params:** `status=NeedsReview&cursor=&limit=20`
- **Response (200 OK):**
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "sha256": "hash",
        "status": "NeedsReview",
        "capturedAt": "2026-10-08T05:00:00Z",
        "source": "phone"
      }
    ],
    "nextCursor": null
  }
  ```

#### `POST /api/v1/documents/manual-entry`
- **Role Required:** `FloorStaff`, `Accountant`, `Compliance`
- **Request:**
  ```json
  {
    "assetId": "uuid",
    "docType": "diesel_slip",
    "slipNumber": "CH-9812",
    "quantityLitres": 250.00,
    "amountBdt": 27250.00,
    "date": "2026-10-08"
  }
  ```
- **Response (201 Created):** `{ "id": "uuid", "status": "NeedsReview", "isManualFallback": true }`

#### `GET /api/v1/documents/my-submissions`
- **Role Required:** `FloorStaff`
- **Response (200 OK):**
  ```json
  [
    { "id": "uuid", "capturedAt": "2026-10-08T05:00:00Z", "status": "Confirmed", "docType": "diesel_slip" }
  ]
  ```

---

### 2.4 Review (Owned by Dev 2)

#### `GET /api/v1/review/queue`
- **Role Required:** `Accountant`, `Compliance`, `Consultant`
- **Query Params:** `sortBy=confidence_asc&limit=20`
- **Response (200 OK):**
  ```json
  {
    "items": [
      {
        "documentId": "uuid",
        "imageUrl": "https://r2.storage.url/...",
        "overallConfidence": 0.72,
        "fields": [
          { "fieldName": "total_kwh", "rawValue": "12500", "normalizedValue": "12500.00", "confidence": 0.65, "bbox": {"x": 100, "y": 200, "w": 80, "h": 20} },
          { "fieldName": "amount_bdt", "rawValue": "112500", "normalizedValue": "112500.00", "confidence": 0.98, "bbox": {"x": 100, "y": 240, "w": 90, "h": 20} }
        ]
      }
    ]
  }
  ```

#### `PUT /api/v1/documents/{id}/fields`
- **Role Required:** `Accountant`, `Compliance`, `Consultant`
- **Request:**
  ```json
  {
    "correctedFields": [
      { "fieldName": "total_kwh", "correctedValue": "12600.00" }
    ]
  }
  ```
- **Response (200 OK):** `{ "status": "Updated" }`

#### `POST /api/v1/documents/{id}/confirm`
- **Role Required:** `Accountant`, `Compliance`, `Consultant`
- **Response (200 OK):** `{ "documentId": "uuid", "status": "Confirmed", "activityRecordId": "uuid" }`

#### `POST /api/v1/documents/bulk-confirm`
- **Role Required:** `Accountant`, `Compliance`
- **Request:** `{ "documentIds": ["uuid1", "uuid2"] }`
- **Response (200 OK):** `{ "confirmedCount": 2 }`

---

### 2.5 Gap Detection (Owned by Dev 3)

#### `GET /api/v1/gaps`
- **Role Required:** `Accountant`, `Compliance`, `Owner`, `Consultant`
- **Query Params:** `period=2026-10`
- **Response (200 OK):**
  ```json
  [
    {
      "id": "uuid",
      "assetName": "Diesel Gen 2",
      "docType": "diesel_slip",
      "dueDate": "2026-10-05",
      "escalationState": "DayMinus3",
      "responsibleUserName": "Jahid Hossain"
    }
  ]
  ```

#### `POST /api/v1/gaps/{id}/nudge`
- **Role Required:** `Accountant`, `Compliance`
- **Response (200 OK):** `{ "sent": true, "channel": "push" }`

---

### 2.6 Carbon Flags (Owned by Dev 3)

#### `GET /api/v1/flags`
- **Role Required:** `Accountant`, `Compliance`, `Owner`, `Consultant`
- **Query Params:** `state=Open&limit=5`
- **Response (200 OK):**
  ```json
  [
    {
      "id": "uuid",
      "ruleCode": "SPIKE_MOM",
      "family": "Footprint",
      "severity": "Amber",
      "period": "2026-09",
      "explanationBn": "গত ৩ মাসের তুলনায় ডিজেল ব্যবহার ৩৩% বৃদ্ধি পেয়েছে।",
      "explanationEn": "Diesel consumption increased 33% compared to trailing 3-month median.",
      "suggestedActionBn": "জেনারেটর ২-এর লগ এবং জ্বালানি স্লিপ যাচাই করুন।",
      "suggestedActionEn": "Check Generator 2 logbook and fuel slips.",
      "evidence": { "documentIds": ["uuid1", "uuid2"] }
    }
  ]
  ```

#### `POST /api/v1/flags/{id}/acknowledge`
- **Role Required:** `Accountant`, `Compliance`, `Owner`, `Consultant`
- **Response (200 OK):** `{ "id": "uuid", "state": "Acknowledged" }`

#### `POST /api/v1/flags/{id}/dismiss`
- **Role Required:** `Compliance`, `Owner`
- **Request:** `{ "reason": "Expected seasonal production rush for export order." }`
- **Response (200 OK):** `{ "id": "uuid", "state": "Dismissed", "expiresAt": "2026-11-08T00:00:00Z" }`

---

### 2.7 Insights & Benchmarks (Owned by Dev 3)

#### `GET /api/v1/dashboard/summary`
- **Role Required:** `Accountant`, `Compliance`, `Owner`, `Consultant`
- **Query Params:** `period=2026-09`
- **Response (200 OK):**
  ```json
  {
    "period": "2026-09",
    "totalKgCo2e": 48250.25,
    "verifiedKgCo2e": 45100.00,
    "estimatedKgCo2e": 3150.25,
    "dataQualityScore": 93.47,
    "topFlags": [...],
    "topRecommendationsBdt": [...]
  }
  ```

#### `GET /api/v1/dashboard/intensity`
- **Role Required:** `Compliance`, `Owner`, `Consultant`
- **Response (200 OK):**
  ```json
  {
    "metric": "kg_co2e_per_piece",
    "unit": "piece",
    "factoryValue": 0.425,
    "peerBenchmark": {
      "hasBenchmark": true,
      "p25": 0.310,
      "p50": 0.415,
      "p75": 0.520,
      "p90": 0.650,
      "n": 32
    }
  }
  ```

---

### 2.8 Recommendations (Owned by Dev 3)

#### `GET /api/v1/recommendations`
- **Role Required:** `Compliance`, `Owner`, `Consultant`
- **Response (200 OK):**
  ```json
  [
    {
      "id": "uuid",
      "measureCode": "VFD_MOTORS",
      "titleBn": "মোটরে ভেরিয়েবল ফ্রিকোয়েন্সি ড্রাইভ (VFD) সংযোজন",
      "titleEn": "Install Variable Frequency Drives (VFD) on Sewing Motors",
      "category": "Motors",
      "evidenceGrade": "A",
      "sourceCitation": "IFC PaCT Bangladesh Textile Case Studies",
      "savingRangeCo2e": { "low": 12.5, "typical": 18.0, "high": 24.2 },
      "savingRangeBdt": { "low": 185000.00, "typical": 265000.00, "high": 356000.00 },
      "capexRangeBdt": { "low": 350000.00, "high": 450000.00 },
      "paybackYears": 1.6,
      "status": "Suggested"
    }
  ]
  ```

#### `PUT /api/v1/recommendations/{id}/status`
- **Role Required:** `Compliance`, `Owner`
- **Request:** `{ "status": "Planned", "reason": null }`
- **Response (200 OK):** `{ "id": "uuid", "status": "Planned" }`

---

### 2.9 Factor Registry (Owned by Dev 1)

#### `GET /api/v1/factors`
- **Role Required:** `Accountant`, `Compliance`, `Owner`, `Consultant`
- **Response (200 OK):**
  ```json
  [
    { "id": "uuid", "activityType": "grid_electricity", "factorValue": 0.621000, "unit": "kWh", "source": "IGES Grid Factor", "year": 2023 }
  ]
  ```

#### `POST /api/v1/factor-overrides`
- **Role Required:** `Compliance`, `Owner` (`Consultant` can submit request)
- **Request:**
  ```json
  {
    "factorId": "uuid",
    "overrideValue": 0.585000,
    "justification": "Verified on-site captive gas co-generation turbine audit."
  }
  ```
- **Response (201 Created):** `{ "id": "uuid", "status": "Approved" }`

---

### 2.10 Reporting (Owned by Dev 3)

#### `POST /api/v1/reports`
- **Role Required:** `Compliance`, `Owner`
- **Request:** `{ "period": "2026-Q3" }`
- **Response (201 Created):** `{ "id": "uuid", "status": "Draft", "totalKgCo2e": 145000.00 }`

#### `POST /api/v1/reports/{id}/approve`
- **Role Required:** `Compliance`, `Owner`
- **Response (200 OK):** `{ "id": "uuid", "status": "Approved", "snapshotHash": "sha256_hash" }`

#### `GET /api/v1/reports/{id}/pdf`
- **Role Required:** `Compliance`, `Owner`, `Consultant`
- **Response (200 OK):** Binary PDF file (`Content-Type: application/pdf`).

#### `POST /api/v1/reports/{id}/share`
- **Role Required:** `Compliance`, `Owner`
- **Request:** `{ "expiresInDays": 30, "redactPrices": true }`
- **Response (201 Created):**
  ```json
  {
    "shareUrl": "https://carbonbill.org/auditor/verify?token=crypto_token",
    "expiresAt": "2026-11-08T00:00:00Z"
  }
  ```

---

### 2.11 Platform Admin (Owned by Dev 1)

#### `POST /api/v1/admin/datasets`
- **Role Required:** `PlatformAdmin`
- **Content-Type:** `multipart/form-data`
- **Request:** `kind`: `"Factors"`, `file`: CSV/JSON seed file, `version`: `"2024.1"`
- **Response (200 OK):** `{ "datasetVersionId": "uuid", "recordsLoaded": 48 }`

#### `GET /api/v1/admin/tenants`
- **Role Required:** `PlatformAdmin`
- **Response (200 OK):**
  ```json
  [
    { "id": "uuid", "name": "Apex Knitting", "sector": "RMG", "usersCount": 8, "documentsCount": 142 }
  ]
  ```

---

## 3. Assumptions

1. The API relies on standard bearer tokens; token refresh is negotiated via an HTTP-only cookie to mitigate XSS risks on public PWA browsers.
2. Binary exports (`/pdf`, `/excel`) stream directly with appropriate `Content-Disposition` attachment headers.
