# CarbonBill Golden OCR Evaluation Dataset & Benchmark Harness

The Golden OCR test harness evaluates the end-to-end extraction accuracy of CarbonBill's OCR pipeline (Option C: Dual OCR Tesseract 5 + PaddleOCR + Groq `openai/gpt-oss-120b`).

## Directory Structure

```text
tests/CarbonBill.OcrGolden/
├── Dataset/                     # Ground truth JSON files and scanned bill images
│   ├── desco-sample-01.json     # DESCO electricity utility bill
│   ├── dpdc-sample-02.json      # DPDC electricity utility bill (with power factor penalty)
│   ├── padma-diesel-03.json     # Padma Oil generator diesel fuel delivery slip
│   ├── titas-gas-04.json        # Titas Gas RMS industrial distribution bill
│   └── shipment-challan-05.json # Inter-district truck transport challan
├── GoldenBillAnnotation.cs     # Contract model for ground truth schemas
├── GoldenHarnessRunner.cs       # Evaluation engine and report generator
└── README.md                    # Benchmark documentation
```

## Ground Truth JSON Schema

Each test sample requires a JSON document with:
```json
{
  "id": "GOLDEN-001",
  "fileName": "desco_mirpur_june_2026.pdf",
  "category": "Electricity",
  "rawTextFixture": "...",
  "expectedVendor": "DESCO",
  "expectedBillNumber": "DESCO-2026-98124",
  "expectedBillingPeriod": "2026-06",
  "expectedQuantity": 54200.00,
  "expectedUnit": "kWh",
  "expectedAmountBdt": 569100.00,
  "expectedMeterNumber": "8819201",
  "expectedPenaltyBdt": 0.00
}
```

## Product Target Metrics
- **Overall Field Extraction Accuracy**: $\ge 90\%$
- **Human Review Escapes / Flagged for Review**: $\le 15\%$ on clean digital scans; $\le 25\%$ on wrinkled/angled mobile camera photos.
- **Bangla Numeral Normalization**: $100\%$ precision on Bengali digits `০-৯` to Latin `0-9`.

## Expanding to 150 Golden Bills
To add additional factory bills:
1. Place the anonymized scan (`.jpg`, `.png`, or `.pdf`) in `tests/CarbonBill.OcrGolden/Dataset/Scans/`.
2. Extract the ground truth values manually and create `<category>-<vendor>-<number>.json` in `Dataset/`.
3. Run `dotnet test` to automatically execute the golden suite and generate `ocr-accuracy-report.md`.
