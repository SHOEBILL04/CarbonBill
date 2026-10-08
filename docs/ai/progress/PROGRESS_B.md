# PROGRESS_B: Track B Progress Tracker (Dev 2)

## Deliverables Status

| Prompt | Description | Status | Branch / PR | Notes |
|---|---|---|---|---|
| **P0-1b** | Domain, data model, API & flow docs | done | `docs/p0-1b` | Glossary, schema, contracts, sequence flows |
| **P0-3** | React PWA scaffold & app shell | done | `feat/b-p0-3-web-scaffold` | Workbox, IndexedDB, formatters, floor chunk 11.07 KB gzipped |
| **B1** | Documents backend & storage | done | `feat/b-b1-documents-backend` | Magic-bytes, SHA-256 deduplication, state machine, manual fallback |
| **B2** | Extraction pipeline Tier 1 | todo | - | Option C Dual OCR (PaddleOCR + Tesseract), normalizer |
| **B3** | OCR Tiers 2 & 3, golden harness | todo | - | Groq gpt-oss-120b intelligence, golden OCR harness |
| **B4** | Review backend & confirm flow | todo | - | Review queue, corrections, sampling auto-confirm |
| **B5** | Floor staff capture PWA | todo | - | 2-tap Bangla UI, offline queue, receipt confirmation |
| **B6** | Review UI workspace | todo | - | Side-by-side viewer, bbox highlight, keyboard flow |
| **I2** | End-to-end pipeline integration test| todo | - | Automated Playwright upload -> OCR -> confirm |
| **I5** | Golden OCR set & offline torture | todo | - | 150 bills accuracy report, offline stress test |
| **I9** | Usability tests | todo | - | 5 users per persona, floor task <20 s |

---

**Blocked on:** None.

**Next prompt:** B2 (Extraction pipeline Tier 1: Option C Dual OCR).

**Open questions logged in 15_DECISIONS.md:**
- Tier 3 Vision LLM customer privacy and consent requirements.
