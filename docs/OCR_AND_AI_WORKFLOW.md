# CarbonBill: OCR & AI Workflow Specification

> **Module Ownership:** `CarbonBill.Modules.Extraction`  
> **Key Services:** [`ExtractionService`](file:///e:/Hackathons/Hack%20for%20Humanity/CarbonBill/src/CarbonBill.Modules.Extraction/Services/ExtractionService.cs), [`DualOcrEngine`](file:///e:/Hackathons/Hack%20for%20Humanity/CarbonBill/src/CarbonBill.Modules.Extraction/Services/Providers/DualOcrEngine.cs), [`DocumentClassifier`](file:///e:/Hackathons/Hack%20for%20Humanity/CarbonBill/src/CarbonBill.Modules.Extraction/Services/Classification/DocumentClassifier.cs), [`GroqLlmExtractor`](file:///e:/Hackathons/Hack%20for%20Humanity/CarbonBill/src/CarbonBill.Modules.Extraction/Services/Groq/GroqLlmExtractor.cs), [`BanglaNormalizer`](file:///e:/Hackathons/Hack%20for%20Humanity/CarbonBill/src/CarbonBill.Modules.Extraction/Services/Normalization/BanglaNormalizer.cs), and [`LangSmithTracer`](file:///e:/Hackathons/Hack%20for%20Humanity/CarbonBill/src/CarbonBill.Modules.Extraction/Services/Tracing/LangSmithTracer.cs).

---

## 1. Unified Pipeline Architecture

The extraction subsystem consists of two complementary layers:
1. **The OCR Workflow:** Ingests raw document binaries (PDF or image) and recovers high-quality raw text across Bengali and English scripts using automated multi-engine fallback and scoring heuristics.
2. **The AI Semantic Workflow:** Ingests the raw image bytes and OCR text, classifies document type, extracts domain entities (quantities, units, meter numbers, financial penalties) via Vision LLMs, normalizes Bengali numerals/units, logs telemetry traces to LangSmith, and hands off to the human review workspace.

```mermaid
flowchart TD
    DocInput["📄 Document Ingested<br/>(PDF or JPEG/PNG/WebP)"] --> OCRFlow

    subgraph OCRFlow["Layer 1: OCR Ingestion & Multi-Engine Recovery"]
        CheckFormat{"Is Document PDF?"}
        PDFBase["OCRmyPDF (ben+eng)<br/>Fallback: pdftoppm + Tesseract CLI"]
        ImgBase["Tesseract CLI (ben+eng)<br/>Fallback: Windows Native OCR"]
        EvalScore{"Evaluate Quality Score<br/>(Length + 40+ Utility Keywords)<br/>Score >= 0.60?"}
        PaddleTier["Tier 2 Fallback: PaddleOCR<br/>(PP-OCRv4 Detection & Recognition)"]
        SelectBest["Select Highest-Scoring Raw Text"]

        CheckFormat -- Yes --> PDFBase --> EvalScore
        CheckFormat -- No --> ImgBase --> EvalScore
        EvalScore -- Yes --> SelectBest
        EvalScore -- No (<0.60) --> PaddleTier --> SelectBest
    end

    SelectBest --> AIFlow

    subgraph AIFlow["Layer 2: AI Semantic Intelligence & Normalization"]
        Classify["1. DocumentClassifier.Classify()<br/>(Electricity, Diesel, Gas, Shipping)"]
        Consent{"Tenant Consented to<br/>Tier 3 Cloud AI?"}
        RuleFallback["Rule-Based Extraction<br/>- BanglaNormalizer (১২৩৪ ➡️ 1234)<br/>- UnitSynonyms (লিটার ➡️ litre)<br/>- Domain Regex Matchers"]
        
        subgraph GroqCloud["Groq Multimodal Intelligence"]
            VisionCheck{"Image Bytes<br/>Available?"}
            VisionLLM["Groq Vision Model<br/>(qwen/qwen3.8-27b)<br/>Extracts directly from image canvas"]
            TextLLM["Groq Text Completion<br/>(openai/gpt-oss-120b)<br/>Extracts from OCR raw text"]
            StrictJSON["JSON Schema Enforcement<br/>(Vendor, Period, Qty, Unit, BDT, Meter)"]
        end

        Trace["LangSmith Telemetry Trace<br/>(Tokens, Latency, Prompt, Run ID)"]
        Persist["Persist ExtractionRun & ExtractedFields<br/>(Calibrated Confidences & Tier Used)"]
    end

    Classify --> Consent
    Consent -- No --> RuleFallback --> Persist
    Consent -- Yes --> VisionCheck
    VisionCheck -- Yes --> VisionLLM --> StrictJSON
    VisionCheck -- No / Failed --> TextLLM --> StrictJSON
    StrictJSON -.-> Trace
    StrictJSON --> Persist

    Persist --> ReviewQueue(["📬 Dispatches DocumentExtractedEvent<br/>Queued for Human Side-by-Side Review"])
```

---

## 2. Detailed OCR Workflow

Implemented in [`DualOcrEngine.cs`](file:///e:/Hackathons/Hack%20for%20Humanity/CarbonBill/src/CarbonBill.Modules.Extraction/Services/Providers/DualOcrEngine.cs).

```mermaid
sequenceDiagram
    autonumber
    participant Svc as ExtractionService
    participant Dual as DualOcrEngine
    participant Base as Base Engine (OCRmyPDF / Tesseract)
    participant Win as Windows Native OCR
    participant Paddle as PaddleOCR (PP-OCRv4)

    Svc->>Dual: ExtractRawTextAsync(stream, fileName, contentType)
    
    alt Document is PDF
        Dual->>Base: RunOcrMyPdfAsync(ben + eng)
        alt OCRmyPDF empty
            Dual->>Base: ExtractPdfTextWithPdftoppmAsync()
        end
    else Document is Image (JPEG/PNG/WebP)
        Dual->>Base: RunTesseractCliAsync(-l ben+eng)
        alt Tesseract CLI empty & Windows OS
            Dual->>Win: RunWindowsOcrAsync() via PowerShell
        end
    end

    Dual->>Dual: EvaluateAccuracy(baseOcrText)
    Note over Dual: Evaluates character length, noise ratio, and presence of<br/>40+ Bengali & English utility keywords (টাকা, বিল, ইউনিট, KWH, DESCO...)

    alt Score >= 0.60 (Acceptable)
        Dual-->>Svc: Return Base OCR Text
    else Score < 0.60 (Low Accuracy / Noisy)
        Dual->>Paddle: RunPaddleOcrAsync(bytes) (paddle_ocr.py)
        Dual->>Dual: EvaluateAccuracy(paddleText)
        alt PaddleScore > BaseScore
            Dual-->>Svc: Return PaddleOCR Text (Tier 2 Upgrade)
        else Base Has Content
            Dual-->>Svc: Retain Base OCR Text
        end
    end
```

### OCR Engine Capabilities & Fallbacks

| Tier / Engine | Target Formats | Languages | Execution Method | Strengths |
|---|---|---|---|---|
| **Tier 1 (Base PDF)** | `.pdf` | `ben` + `eng` | `ocrmypdf` CLI / `pdftoppm` | Generates searchable PDF text layers, preserves multi-page structure. |
| **Tier 1 (Base Image)** | `.jpg`, `.png`, `.webp` | `ben` + `eng` | `tesseract` CLI | Ultra-fast local execution, $0 cost, zero data egress. |
| **Windows Native Fallback** | Images on Windows | System Language Pack | `Windows.Media.Ocr.OcrEngine` | Hardware-accelerated native Windows optical reader. |
| **Tier 2 (PaddleOCR)** | Low-confidence images/PDFs | Latin + CJK/Multilingual | Python `paddleocr` (PP-OCRv4) | Exceptional line detection on faded carbon copies, low-contrast stamps, and skewed paper bills. |

### Accuracy Evaluation Heuristic (`EvaluateAccuracy`)
- **Minimum Length Threshold:** Text $<35$ characters receives an immediate score of $0.15$.
- **Utility Domain Keyword Density:** Matches against 40+ curated Bengali and English terms:
  - *Bengali:* `টাকা`, `বিল`, `ইউনিট`, `মিটার`, `কিলোওয়াট`, `লিটার`, `গ্যাস`, `ডিজেল`, `চালান`, `ডেসকো`, `ডিপিডিসি`, `তিতাস`, `বাখরাবাদ`, `পদ্মা`, `মেঘনা`, etc.
  - *English:* `kwh`, `meter`, `dpdc`, `desco`, `bpdb`, `breb`, `titas`, `diesel`, `litre`, `amount`, `vat`, `challan`, `balance`, `reading`, etc.
- **Scoring Formula:**
  $$\text{Score} = \text{Clamp}\left(0.15 + \min\left(\frac{\text{matchedKeywords}}{4}, 1.0\right) \times 0.65 + \min\left(\frac{\text{length}}{200}, 1.0\right) \times 0.20, 0.0, 1.0\right)$$
- If $\text{Score} \ge 0.60$, the output is accepted. Otherwise, it triggers Tier 2 PaddleOCR.

---

## 3. Detailed AI Semantic Extraction Workflow

Implemented in [`GroqLlmExtractor.cs`](file:///e:/Hackathons/Hack%20for%20Humanity/CarbonBill/src/CarbonBill.Modules.Extraction/Services/Groq/GroqLlmExtractor.cs), [`DocumentClassifier.cs`](file:///e:/Hackathons/Hack%20for%20Humanity/CarbonBill/src/CarbonBill.Modules.Extraction/Services/Classification/DocumentClassifier.cs), and [`BanglaNormalizer.cs`](file:///e:/Hackathons/Hack%20for%20Humanity/CarbonBill/src/CarbonBill.Modules.Extraction/Services/Normalization/BanglaNormalizer.cs).

```mermaid
sequenceDiagram
    autonumber
    participant App as ExtractionService
    participant Cls as DocumentClassifier
    participant Norm as BanglaNormalizer
    participant Groq as GroqLlmExtractor
    participant Vision as Groq Vision (Qwen-27B)
    participant Text as Groq LLM (GPT-OSS-120B)
    participant Trace as LangSmithTracer

    App->>Cls: Classify(rawOcrText, fileName)
    Cls-->>App: ClassificationResult (ElectricityBill / DieselSlip / GasBill / ShippingChallan)

    alt Tenant has not consented to Cloud AI
        App->>Norm: NormalizeNumerals() & NormalizeUnit()
        App->>Groq: FallbackRuleBasedExtraction()
        Groq-->>App: ExtractedFields (Tier 1 Rule-Based)
    else Tenant Consent Granted
        App->>Groq: ExtractAsync(rawOcrText, imageBytes, hasConsent=true)
        
        alt Image Bytes Available & Supported Format
            Groq->>Vision: POST /chat/completions (model: qwen/qwen3.8-27b, temperature: 0.1)
            Note over Vision: High-resolution canvas inspection directly reads stamps,<br/>handwritten notes, and complex tabular structures
            Vision-->>Groq: Raw JSON (vendor, billingPeriod, quantity, unit, amountBdt, penalties)
            Groq->>Trace: TraceRunAsync("GroqVisionBillExtraction", tokens, latency, status)
        else Vision Failed or Text-Only Document
            Groq->>Text: POST /chat/completions (model: openai/gpt-oss-120b)
            Note over Text: Ingests raw OCR text, resolves typos, extracts numbers,<br/>converts Bengali numerals (১২৩৪ ➡️ 1234)
            Text-->>Groq: Raw JSON matching schema
            Groq->>Trace: TraceRunAsync("GroqLlmBillExtraction", tokens, latency, status)
        end

        Groq->>Norm: Post-process & validate Canonical Units (kWh, litre, m3)
        Groq-->>App: OcrExtractionResult (Structured Fields, Tier 3 Tag, Confidence)
    end

    App->>App: Persist to ExtractionRuns & ExtractedFields
    App-->>App: Fire DocumentExtractedEvent (Ready for Human Review)
```

### 1. Document Classification ([`DocumentClassifier`](file:///e:/Hackathons/Hack%20for%20Humanity/CarbonBill/src/CarbonBill.Modules.Extraction/Services/Classification/DocumentClassifier.cs))
Before LLM invocation, text is classified to prime the system prompt and assign metadata:
- **`ElectricityBill` (0.95 confidence):** Triggered by BPDB, DESCO, DPDC, BREB, NESCO, WZPDCL, Palli Bidyut, KWH, Sanctioned Load, Power Factor, Consumed Unit.
- **`DieselSlip` (0.95 confidence):** Triggered by Diesel, Octane, Petrol, Padma Oil, Meghna Petroleum, Jamuna Oil, Fuel Slip, Generator Fuel.
- **`GasBill` (0.95 confidence):** Triggered by Titas, Bakhrabad, Karnaphuli, Jalalabad, PGCL, SGCL, RMS, Cubic Meter, $m^3$.
- **`ShippingChallan` (0.90 confidence):** Triggered by Challan, Transport, Truck, Cargo, Freight, Tonne-km.

### 2. Multi-Modal Vision LLM (`qwen/qwen3.8-27b`)
- **Direct Image Understanding:** Operates on the original image bytes formatted as a base64 Data URL, bypassing OCR text corruption for handwritten receipts, folded paper, carbon copies, and skewed stamps.
- **Calibrated Field Confidence Scoring:** Rather than returning a static $0.95$ score, the model produces individual, honest field confidence ratings:
  - $0.90 - 0.99$: Crisp digital scan with 100% unambiguous numbers.
  - $0.75 - 0.89$: Clear, readable despite slight crease or glare.
  - $0.50 - 0.74$: Carbon copy slip, messy handwriting, or inferred values.
  - $< 0.50$: Degraded or uncertain reading.

### 3. Bengali Normalization & Synonyms ([`BanglaNormalizer`](file:///e:/Hackathons/Hack%20for%20Humanity/CarbonBill/src/CarbonBill.Modules.Extraction/Services/Normalization/BanglaNormalizer.cs))
Ensures all extracted text maps into deterministic, mathematical values:
- **Numeral Transformation:** All Eastern Arabic / Bengali numerals are mapped to standard ASCII Latin digits:
  $$\text{০}\to 0,\; \text{১}\to 1,\; \text{২}\to 2,\; \text{৩}\to 3,\; \text{৪}\to 4,\; \text{৫}\to 5,\; \text{৬}\to 6,\; \text{৭}\to 7,\; \text{৮}\to 8,\; \text{৯}\to 9$$
- **Canonical Unit Canonicalization:**
  - Electricity: `কেডব্লিউএইচ`, `কিলোওয়াট`, `ইউনিট`, `kw-h`, `units` $\longrightarrow$ `kWh`
  - Liquid Fuel: `লিটার`, `লিঃ`, `লি`, `ltr`, `liter` $\longrightarrow$ `litre`
  - Natural Gas: `ঘনমিটার`, `cum`, `cu.m`, `cubic meter` $\longrightarrow$ `m3`
  - Solid Fuel / Cargo: `কেজি`, `কিলোগ্রাম`, `kgs` $\longrightarrow$ `kg`

### 4. Telemetry & Tracing ([`LangSmithTracer`](file:///e:/Hackathons/Hack%20for%20Humanity/CarbonBill/src/CarbonBill.Modules.Extraction/Services/Tracing/LangSmithTracer.cs))
All LLM inferences emit asynchronous telemetry to LangSmith under the `CarbonBill` project:
- Model name and prompt versioning.
- Execution latency in milliseconds.
- Input file metadata (file name, MIME type, file size).
- Extracted JSON output and field confidences.
- HTTP error statuses and fallback escalation tracking.

---

## 4. Human-in-the-Loop Review Handoff

The AI extraction never silently mutates production carbon balances. It serves as an assistive copilot for the factory accountant:

1. The extracted fields are stored in the database with their respective bounding boxes and confidence flags.
2. If any critical field has a confidence score $< 0.75$, the accountant workspace highlights the field with an amber warning badge.
3. The accountant verifies the extracted figures side-by-side with the high-resolution original document.
4. Only upon clicking **"Confirm & Sign Off"** is the record converted into an `ActivityRecord` and forwarded to the calculation engine.
