import { describe, it, expect } from 'vitest';
import { fetchAuditorSnapshot } from '../auditorApi';

describe('Auditor Read-Only Portal & Click-to-Source Traceability', () => {
  it('loads immutable snapshot metadata with cryptographic SHA-256 seal', async () => {
    const snapshot = await fetchAuditorSnapshot('rep-2026-08');
    expect(snapshot).toBeDefined();
    expect(snapshot.organizationName).toBe('Apex Textiles Limited');
    expect(snapshot.contentHashSha256.length).toBe(64);
    expect(snapshot.totalEmissions).toBeCloseTo(
      snapshot.scope1Emissions + snapshot.scope2Emissions + snapshot.scope3Emissions,
      1
    );
  });

  it('guarantees click-to-source traceability for every activity line item', async () => {
    const snapshot = await fetchAuditorSnapshot('rep-2026-08');
    expect(snapshot.lineItems.length).toBeGreaterThan(0);

    for (const item of snapshot.lineItems) {
      // Must link to original document
      expect(item.documentId).toMatch(/^DOC-/);
      expect(item.documentDate.length).toBeGreaterThan(0);

      // Must have OCR confidence score
      expect(item.ocrConfidence).toBeGreaterThanOrEqual(0);
      expect(item.ocrConfidence).toBeLessThanOrEqual(100);

      // Must have confirming reviewer
      expect(item.confirmedBy.length).toBeGreaterThan(0);

      // Must have applied emission factor citation and year
      expect(item.factorSource.length).toBeGreaterThan(5);
      expect(item.factorValue).toBeGreaterThan(0);
      expect(item.factorCitationYear).toBeGreaterThanOrEqual(2020);
    }
  });

  it('verifies that price redaction flag is respected', async () => {
    const snapshot = await fetchAuditorSnapshot('rep-2026-08');
    expect(snapshot.redactPrices).toBe(true);
  });
});
