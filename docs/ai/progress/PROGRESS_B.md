# PROGRESS_B: Track B Progress Tracker (Dev 2)

## Deliverables Status

| Prompt | Description | Status | Branch / PR | Notes |
|---|---|---|---|---|
| **P0-1b** | Domain, data model, API & flow docs | done | `docs/p0-1b` | Glossary, schema, contracts, sequence flows |
| **P0-3** | React PWA scaffold & app shell | done | `feat/b-p0-3-web-scaffold` | Workbox, IndexedDB, formatters, floor chunk 11.07 KB gzipped |
| **B1** | Documents backend & storage | done | `feat/b-b1-documents-backend` | Magic-bytes, SHA-256 deduplication, state machine, manual fallback |
| **B2** | Extraction pipeline Tier 1 | done | `feat/b-b2-extraction-dual-ocr` | Option C Dual OCR (PaddleOCR + Tesseract), BanglaNormalizer, Classifier |
| **B3** | OCR Tiers 2 & 3, golden harness | done | `feat/b-b3-golden-harness` | Groq gpt-oss-120b semantic parser, consent gating, Golden Harness runner |
| **B4** | Review backend & confirm flow | done | `feat/b-b4-review-backend` | Review queue, corrections, atomic confirmation, duplicate resolution, audit log |
| **B5** | Floor staff capture PWA | done | `feat/b-b5-capture-pwa` | 2-tap Bangla UI, offline IndexedDB queue, 12.5KB gzipped floor chunk, EXIF GPS stripped, manual fallback |
| **B6** | Review UI workspace | todo | - | Side-by-side viewer, bbox highlight, keyboard flow |
| **I2** | End-to-end pipeline integration test| todo | - | Automated Playwright upload -> OCR -> confirm |
| **I5** | Golden OCR set & offline torture | todo | - | 150 bills accuracy report, offline stress test |
| **I9** | Usability tests | todo | - | 5 users per persona, floor task <20 s |

---

**Blocked on:** None.

**Next prompt:** B6 (Review UI workspace).

**Open questions logged in 15_DECISIONS.md:**
- Tier 3 Vision LLM customer privacy and consent requirements.
