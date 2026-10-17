# CarbonBill: Simplified AI & OCR Workflow Diagram

> **Module:** Ingestion & Extraction (`CarbonBill.Modules.Extraction`)  
> **Engines:** Tesseract OCR, PaddleOCR (PP-OCRv4), Groq Vision LLM (`qwen/qwen3.8-27b`), and Bangla Normalizer

---

## 1. Unified AI & OCR Flowchart

This simplified diagram illustrates the end-to-end journey from a bill photo or PDF to structured, accountant-verified carbon data:

```mermaid
flowchart TD
    Start["📸 Bill Uploaded (Photo or PDF)"] --> OCR

    subgraph OCR ["1. OCR Layer (Reading Raw Text)"]
        direction TB
        O1["Read Text from Image<br/>(Tesseract + PaddleOCR)"]
        O2["Capture Bengali & English Print"]
        O1 --> O2
    end

    OCR --> AI

    subgraph AI ["2. AI Layer (Understanding the Data)"]
        direction TB
        A1["Identify Bill Type<br/>(Electricity, Gas, or Diesel)"]
        A2["Vision LLM Extraction<br/>(Pulls meter no, kWh/Litres, BDT amount)"]
        A3["Bangla Converter<br/>(১২৩৪ ➡️ 1234 & লিটার ➡️ litre)"]
        A1 --> A2 --> A3
    end

    AI --> Output["✅ Structured Data Ready<br/>(Vendor, Quantity, Cost, Period)"]
    Output --> Review["🧑‍💼 Accountant Side-by-Side Review"]
```

---

## 2. The 4-Step Breakdown

```mermaid
flowchart LR
    Step1["1. Upload Bill<br/>(Photo or PDF)"] --> Step2["2. OCR Read<br/>(Tesseract / Paddle)"]
    Step2 --> Step3["3. AI Understand<br/>(Vision LLM & Bangla)"]
    Step3 --> Step4["4. Human Sign-Off<br/>(Side-by-side check)"]
```

| Step | Component | What Happens | Real-World Benefit |
|---|---|---|---|
| **1. Upload** | Mobile PWA / Web | Staff captures utility bill; auto-saves offline in IndexedDB if no network. | Works on factory floor without reliable 4G. |
| **2. OCR (Reading)** | Base & Enhanced OCR | Runs local Tesseract; auto-escalates to PaddleOCR if the bill is blurry or faded. | $0 cloud cost for standard utility bills. |
| **3. AI (Understanding)** | Groq Vision LLM (`qwen/qwen3.8-27b`) | Extracts meter number, consumption units (kWh/L), cost (৳ BDT), and converts Bengali digits (`১২৩৪ ➡️ 1234`). | Eliminates manual accountant data entry. |
| **4. Human Sign-Off** | Review Workspace | Displays extracted values side-by-side with original photo for one-click verification. | 100% audit defensibility — zero hallucinated data. |
