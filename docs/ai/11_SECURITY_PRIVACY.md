# 11. Security, Privacy & Data Protection Specification

## 1. Roles & Permissions Authorization Matrix

CarbonBill enforces fine-grained policy-based authorization using ASP.NET Core policies mapped to business capabilities:

| Capability / Action | Floor Staff (`FloorStaff`) | Accountant (`Accountant`) | Compliance (`Compliance`) | Factory Owner (`Owner`) | Consultant (`Consultant`) | Auditor Share Link (`AuditorLink`) | Platform Admin (`PlatformAdmin`) |
|---|---|---|---|---|---|---|---|
| **Capture & view own uploads** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | No | No |
| **Review & confirm queue** | No | **Yes** | **Yes** | No | **Yes** | No | No |
| **View dashboards & flags** | No | **Yes** | **Yes** | **Yes** | **Yes** | **Read-Only** | No |
| **Request factor override** | No | Request | **Yes** | **Yes** | Request with note | No | No |
| **Approve factor override** | No | No | **Yes** | **Yes** | No | No | No |
| **Approve carbon reports** | No | No | **Yes** | **Yes** | No | No | No |
| **Generate auditor share link** | No | No | **Yes** | **Yes** | No | No | No |
| **Manage users & memberships** | No | No | No | **Yes** | Within client org | No | Support only |
| **Ingest platform datasets** | No | No | No | No | No | No | **Yes** |

---

## 2. Transport & Storage Security

- **TLS Encryption in Transit:** Strict TLS 1.3 enforcement across all API endpoints, frontend hosting (Cloudflare Pages), and Caddy reverse proxies. HTTP Strict Transport Security (HSTS) with `max-age=31536000; includeSubDomains` enabled.
- **Object Storage Encryption:** Cloudflare R2 server-side AES-256 encryption at rest. Documents are accessed strictly via short-lived pre-signed URLs (15-minute expiration).
- **Database Connection Security:** SSL mode required (`sslmode=require`) on all PostgreSQL connections from application containers.
- **Database User Least Privilege:** The application database user has read/write privileges strictly limited to application tables; `DROP TABLE`, `ALTER TABLE`, and schema manipulation rights are denied at runtime.

---

## 3. Upload Pipeline Hardening

Every uploaded document binary undergoes validation before entering storage:
1. **Magic-Byte MIME Verification:** File type is validated by examining initial header magic bytes (`%PDF`, `\xFF\xD8\xFF`, `RIFF....WEBP`). Client-supplied file extensions and `Content-Type` headers are never trusted.
2. **File Size Enforcement:** Maximum file size capped at 10 MB on API boundary; mobile clients compress images to $< 400$ KB before transmission.
3. **Image Re-Encoding & Sanitization:** All uploaded images are decoded and re-encoded using SkiaSharp / ImageSharp, neutralizing embedded malware payloads.
4. **Metadata Scrubbing:** EXIF metadata—specifically GPS geographical coordinates, camera serial numbers, and device identifiers—is permanently stripped.
5. **Anti-Virus Scanning:** Interface `IAntiVirusScanner` provides optional asynchronous scanning via ClamAV container before OCR execution.

---

## 4. Immutable Audit Trail

- **Append-Only Logging:** The `audit.audit_logs` table records every critical business action:
  - `DocumentConfirmed`
  - `ExtractedFieldCorrected`
  - `FactorOverrideRequested` / `FactorOverrideApproved`
  - `ReportApproved`
  - `ShareLinkCreated`
  - `ReportExported`
- **Database Security Rule:** The application database role lacks `UPDATE` and `DELETE` permissions on `audit.audit_logs`.
- **Optional Hash Chaining:** Each audit entry can compute an SHA-256 hash linking to the preceding log record, creating a tamper-evident audit chain.

---

## 5. In-Product Privacy Guarantees

Factories are hesitant to upload proprietary utility slips due to competitive confidentiality concerns. The product displays an explicit **Privacy Card** during onboarding and upload:
1. **Zero AI Model Training:** Explicit contractual guarantee that customer bills and data are never used to train external public foundation AI models.
2. **Data Residency & Security:** All factory invoices and financial ledgers reside encrypted in the Singapore data center region.
3. **Role-Based Isolation:** Factory competitor tenants can never access or query other organizations' slips under any circumstance.
4. **Right to Export & Erasure:** Complete data deletion and export supported upon written tenant request.
5. *(VERIFY)* Alignment with Bangladesh's national Cyber Security Act and data protection regulations regarding commercial records.

---

## 6. OCR Tier 3 (Vision LLM) Customer Consent & Vendor Warning

> **Critical AI Data Privacy Warning:**
> Free API tiers of commercial AI providers (e.g. consumer Gemini or OpenAI APIs) may reserve rights to retain and analyze user inputs for product development and model training.

- **Mandatory Organizational Consent:**
  - Tier 3 Vision LLM is **disabled by default** across all organizations.
  - Activation requires explicit written opt-in by the Factory Owner in organizational settings (`consent_ai_tier3: true`).
- **Data Minimization:**
  - When Tier 3 is triggered, only the cropped bounding region of handwritten fields is transmitted to the multimodal API, rather than the entire full-page factory bill.
- **Enterprise Zero-Retention Tier:**
  - In production pilot environments, Tier 3 must connect strictly to enterprise paid tiers with signed **Zero Data Retention (ZDR)** agreements.

---

## 7. Database Backups & Disaster Recovery

- **Nightly Encrypted Dumps:** Automated `pg_dump` runs nightly via a scheduled cron container, encrypts dumps with AES-256 (GPG key), and transmits them to an isolated, geographically separate Cloudflare R2 backup bucket.
- **Retention Schedule:** Daily backups retained for 30 days; weekly backups retained for 12 weeks.
- **Disaster Recovery Targets:**
  - **Recovery Point Objective (RPO):** 24 hours.
  - **Recovery Time Objective (RTO):** 4 hours.
- **Monthly Restore Drill:** Monthly automated rehearsal restoring the latest backup to a staging container to verify database recovery integrity.
