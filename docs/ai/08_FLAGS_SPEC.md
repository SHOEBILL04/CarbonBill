# 08. Carbon Flags Engine Specification

## 1. Overview & Purpose

The Carbon Flags engine proactively monitors data quality, operational footprint behaviour, and international buyer audit readiness. Flags provide deterministic, explainable answers to: *"What needs my immediate attention, and what concrete action should I take?"*

> **Critical Design Principle:**
> All numeric thresholds defined below are **tunable starting defaults stored in `flags.flag_rules`**, not rigid empirical research findings. Platform Admin can modify these parameters at runtime without requiring code deployments.

---

## 2. Carbon Flag Families & Trigger Specifications

| Family | Flag Code | Default Trigger Condition (Tunable in `FlagRule`) | Severity | Suggested Action Shown to User (Bilingual) |
|---|---|---|---|---|
| **Data Quality** | `MISSING_DOCUMENT` | An `ExpectedDocRule` due date has elapsed without a confirmed/uploaded document. | **Amber** (due date), **Red** (5 days past due) | **BN:** অমীমাংসিত মিটার/জ্বালানি স্লিপটি অবিলম্বে আপলোড করুন।<br>**EN:** Upload the missing meter or fuel slip immediately. |
| **Data Quality** | `LOW_OCR_CONFIDENCE` | Any required field on an extracted slip has confidence $< 0.70$. | **Amber** | **BN:** কম কনফিডেন্সের ফিল্ডগুলো রিভিউ স্ক্রিনে যাচাই ও সংশোধন করুন।<br>**EN:** Review and correct low-confidence fields in the review queue. |
| **Data Quality** | `DUPLICATE_SUSPECTED` | Matching SHA-256 hash or identical (vendor + bill number + billing period). | **Amber** | **BN:** সম্ভাব্য ডুপ্লিকেট চালান সনাক্ত হয়েছে; একটি রেখে বাকিটি বাতিল করুন।<br>**EN:** Suspected duplicate slip detected; retain one and discard the duplicate. |
| **Data Quality** | `IMPLAUSIBLE_VALUE` | Extracted quantity falls outside $3 \times \text{IQR}$ (Interquartile Range) of asset's history or unit mismatch. | **Amber** | **BN:** চালানের পরিমাণের সাথে পূর্বের রেকর্ডের অস্বাভাবিক পার্থক্য দেখা গেছে; মূল চালান যাচাই করুন।<br>**EN:** Implausible quantity detected outside historical range; verify against physical slip. |
| **Data Quality** | `ESTIMATED_SHARE_HIGH` | Historical estimates constitute $> 10\%$ of total $\text{kg CO}_2\text{e}$ for the reporting period. | **Amber** | **BN:** মোট কার্বনের ১০%-এর বেশি অনুমাননির্ভর; প্রকৃত বিল আপলোড করে ডেটার মান বৃদ্ধি করুন।<br>**EN:** Over 10% of footprint is estimated; replace estimates with verified slips. |
| **Footprint** | `SPIKE_MOM` | Category total $> 1.3 \times$ trailing 3-month median (**Amber**), or $> 1.6 \times$ (**Red**). *(Requires $\ge 3$ months data)*. | **Amber** / **Red** | **BN:** জ্বালানি বা বিদ্যুৎ ব্যবহারে অস্বাভাবিক বৃদ্ধি; সংশ্লিষ্ট চালানের তালিকা পরীক্ষা করুন।<br>**EN:** Significant surge in energy use; inspect the contributing documents. |
| **Footprint** | `HOTSPOT_DETECTED` | A single emission source or asset accounts for $> 50\%$ of factory's total footprint. | **Info** | **BN:** কার্বন ফুটপ্রিন্টের সিংহভাগ একটি খাত থেকে আসছে; হ্রাসকরণ সুপারিশগুলো দেখুন।<br>**EN:** Single source accounts for >50% of footprint; view reduction recommendations. |
| **Footprint** | `GENSET_RELIANCE` | Diesel generator electricity accounts for $> 20\%$ of total monthly electricity consumption. | **Amber** | **BN:** জেনারেটর নির্ভরতা ২০% অতিক্রম করেছে; গ্রিড স্থিতিশীলতা এবং সোলার বিকল্প পর্যালোচনা করুন।<br>**EN:** Genset reliance exceeds 20%; review grid uptime and rooftop solar options. |
| **Footprint** | `INTENSITY_ABOVE_PEERS` | $\text{kg CO}_2\text{e}$ per output unit exceeds peer distribution P75 (**Amber**) or P90 (**Red**). *(Gated by peer sample $n \ge 10$)*. | **Amber** / **Red** | **BN:** প্রতি ইউনিটে নির্গমন সহকর্মীদের চেয়ে বেশি; জ্বালানি দক্ষতা বৃদ্ধির পদক্ষেপ নিন।<br>**EN:** Emission intensity exceeds peer benchmark; implement ranked efficiency measures. |
| **Footprint** | `TARGET_DRIFT` | Year-to-date cumulative footprint exceeds organizational reduction target trajectory. | **Amber** | **BN:** বাৎসরিক নির্গমন লক্ষ্যমাত্রা থেকে বিচ্যুত হচ্ছে; অগ্রাধিকারমূলক পদক্ষেপ গ্রহণ করুন।<br>**EN:** Trajectory exceeds carbon reduction target; review reduction initiatives. |
| **Buyer Readiness** | `REPORT_NOT_READY` | Unconfirmed documents remain, missing calendar months, or Data Quality Score $< 80\%$. | **Red** | **BN:** অসম্পূর্ণ তথ্যের কারণে রিপোর্ট চূড়ান্ত করার উপযুক্ত নয়; চেকলিস্টের ঘাটতিগুলো পূরণ করুন।<br>**EN:** Report not audit-ready; complete unconfirmed documents and fill gaps. |
| **Buyer Readiness** | `FACTOR_OUTDATED` | Active FactorSet reference year is older than the reporting period year. | **Amber** | **BN:** নির্গমন ফ্যাক্টর হালনাগাদ করা প্রয়োজন; নতুন ফ্যাক্টর সেটে পুনর্গণনার অনুমোদন দিন।<br>**EN:** Emission factor set is outdated; approve recalculation with updated factor set. |
| **Buyer Readiness** | `OVERRIDE_UNAPPROVED` | Custom factor override exists without approved compliance sign-off or justification. | **Red** | **BN:** কাস্টম ফ্যাক্টরে অনুমোদন বা যৌক্তিক ব্যাখ্যা নেই; অনুমোদন সম্পন্ন করুন।<br>**EN:** Factor override lacks justification or approver; submit justification note. |
| **Bill Savings** | `POWER_FACTOR_PENALTY` | Power factor ($< 0.90$) or maximum demand charge penalty line detected on utility bill. | **Info** | **BN:** বিদ্যুৎ বিলে পাওয়ার ফ্যাক্টর পেনাল্টি সনাক্ত হয়েছে; ক্যাপাসিটর ব্যাংক মেরামত বিবেচনা করুন।<br>**EN:** Power factor penalty detected on electricity bill; evaluate capacitor bank correction. |

---

## 3. Flag Record Structure & Schema

Each raised flag is modeled as an instance in `flags.flags`:
```json
{
  "id": "urn:uuid:8f1e2d3c-4b5a-6789-0123-abcdef456789",
  "orgId": "urn:uuid:11111111-2222-3333-4444-555555555555",
  "siteId": "urn:uuid:66666666-7777-8888-9999-000000000000",
  "ruleCode": "SPIKE_MOM",
  "family": "Footprint",
  "severity": "Amber",
  "period": "2026-09",
  "evidence": {
    "documentIds": ["urn:uuid:doc-1", "urn:uuid:doc-2"],
    "assetId": "urn:uuid:genset-1",
    "calculatedValue": 1420.50,
    "thresholdValue": 1050.00
  },
  "explanationBn": "জেনারেটর ১-এ গত ৩ মাসের তুলনায় ডিজেল ব্যবহার ৩৫% বৃদ্ধি পেয়েছে।",
  "explanationEn": "Diesel consumption on Generator 1 increased by 35% compared to trailing 3-month median.",
  "suggestedActionBn": "জেনারেটরের লগবুক পরীক্ষা করুন এবং রক্ষণাবেক্ষণ সম্পন্ন হয়েছে কিনা যাচাই করুন।",
  "suggestedActionEn": "Inspect generator logbook and verify recent maintenance schedule.",
  "state": "Open",
  "createdAt": "2026-10-01T04:00:00Z"
}
```

---

## 4. Flag Lifecycle State Machine

1. **Open:** Raised automatically when evaluator rule returns true.
2. **Acknowledged:** Viewed by user (Rahim, Nusrat, or Farhana); indicates team awareness without dismissal.
3. **Resolved:** Condition clears automatically (e.g. missing slip is uploaded, low-confidence field confirmed, outdated factor updated).
4. **Dismissed (Strict Anti-Hiding Rule):**
   - User dismisses flag by providing a **mandatory non-empty justification string** (e.g. "Overtime production surge for Eid shipment").
   - **Dismissal Expiration:** Dismissal automatically expires after **30 days**. If the underlying condition still persists after 30 days, the flag reopens to prevent critical defects from remaining permanently hidden.

---

## 5. Flag Fatigue Controls

To prevent alert fatigue and cognitive overload:
1. **Top 5 Priority Display:** The primary factory dashboard displays strictly the **top 5 most critical flags**, ordered by `Severity` (`Red` > `Amber` > `Info`), then by `CreatedAt` descending.
2. **Consolidated Weekly Digest:** Notifications are grouped into a single weekly email digest delivered on Mondays rather than firing real-time emails for non-critical alerts.
3. **Snooze with Expiry:** Users may snooze a flag for 7, 14, or 30 days.

---

## 6. Intensity Metrics & Peer Benchmark Gating

- **Intensity Formula:**
  $$\text{Intensity} = \frac{\text{Total kg CO}_2\text{e}}{\text{Production Units (pieces, kg of fabric)}}$$
- **Benchmark Honesty Rule:**
  Peer distribution statistics (P25, P50, P75, P90) are displayed **only if the reference peer dataset contains at least $n \ge 10$ verified factories** in the same sector and size band. If $n < 10$, the UI and reporting engine explicitly display:
  > **"No benchmark yet"** (প্রতুল তথ্য এখনও পাওয়া যায়নি)
  The system must **never** synthesize or invent benchmark statistics.
