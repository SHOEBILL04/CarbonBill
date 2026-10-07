# CarbonBill: Verification Checklist

The following items from the Architecture and Solution Design document are marked **"verify"** and must be validated with their official sources prior to pilot release.

- [ ] **1. Cloudflare R2 Free-Tier Quota & Egress**
  - Verify current free tier limits (10 GB/month storage, 1M Class A operations, 10M Class B operations).
  - Confirm zero egress fee policy holds for target region.

- [ ] **2. Azure Document Intelligence (F0 Free Tier) Page Limits**
  - Verify monthly page limit (typically 500 pages/month) and concurrent request quota.
  - Verify supported languages for receipt and invoice prebuilt models in Southeast Asia region.

- [ ] **3. QuestPDF License Terms**
  - Verify community license revenue / funding cap ($1M USD annual revenue limit) against project commercial status.
  - Confirm Bangla font (`Noto Sans Bengali`) glyph rendering performance and text shaping.

- [ ] **4. AI Vision LLM (Tier 3 OCR) Privacy & Data Terms**
  - Verify whether free/standard API tiers use customer bill data for model training.
  - Ensure Tier 3 is restricted to consented documents or utilize zero-data-retention enterprise tier.

- [ ] **5. Bangladesh National Grid Emission Factor**
  - Verify the latest published grid emission factor and year (IGES Grid Emission Factor list or UNFCCC CDM harmonized dataset).
  - Record the exact citation, baseline year, and margin type (Combined Margin / Operating Margin) in `FactorRegistry`.

- [ ] **6. Measure Library Research Data Terms**
  - IFC Partnership for Cleaner Textile (PaCT) resource efficiency case study citations.
  - Cascale (Higg) Facility Environmental Module (FEM) guidance citations.
  - SREDA rooftop solar net-metering guidelines and IDCOL green-finance terms.

- [ ] **7. Email & Web Push Quotas**
  - Brevo / Resend free-tier limits (300 emails/day or 3,000/month).
  - VAPID web push browser support matrix on mobile Chrome / Firefox on Android.

- [ ] **8. Local Bangladeshi Data Protection & Privacy Compliance**
  - Verify national regulatory requirements regarding storage and deletion of SME financial bills.
