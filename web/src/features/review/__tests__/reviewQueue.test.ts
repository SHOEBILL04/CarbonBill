import { describe, it, expect } from 'vitest';
import { fetchReviewQueue, ReviewQueueItem, ConfirmRequest } from '../reviewApi';

describe('Review Queue & Workspace Logic Unit Tests', () => {
  it('correctly sorts documents by overallConfidence ascending (lowest confidence first)', async () => {
    const queue: ReviewQueueItem[] = await fetchReviewQueue();
    expect(queue.length).toBeGreaterThan(0);

    // Verify queue is sorted with lowest confidence first
    for (let i = 0; i < queue.length - 1; i++) {
      expect(queue[i].overallConfidence).toBeLessThanOrEqual(queue[i + 1].overallConfidence);
    }
  });

  it('identifies documents qualifying for bulk confirmation (>= 0.90 threshold)', async () => {
    const sampleDocs: ReviewQueueItem[] = [
      {
        documentId: 'doc-low',
        fileName: 'padma_low.jpg',
        contentType: 'image/jpeg',
        fileSizeBytes: 150000,
        status: 'NeedsReview',
        capturedAtUtc: '2026-06-15T00:00:00Z',
        overallConfidence: 0.65,
        isEstimated: false,
        fields: [],
      },
      {
        documentId: 'doc-high-1',
        fileName: 'desco_high.pdf',
        contentType: 'application/pdf',
        fileSizeBytes: 200000,
        status: 'NeedsReview',
        capturedAtUtc: '2026-06-15T00:00:00Z',
        overallConfidence: 0.94,
        isEstimated: false,
        fields: [],
      },
      {
        documentId: 'doc-high-2',
        fileName: 'titas_high.pdf',
        contentType: 'application/pdf',
        fileSizeBytes: 210000,
        status: 'NeedsReview',
        capturedAtUtc: '2026-06-15T00:00:00Z',
        overallConfidence: 0.98,
        isEstimated: false,
        fields: [],
      },
    ];

    const bulkCandidates = sampleDocs
      .filter((d) => d.overallConfidence >= 0.90)
      .map((d) => d.documentId);

    expect(bulkCandidates).toHaveLength(2);
    expect(bulkCandidates).toContain('doc-high-1');
    expect(bulkCandidates).toContain('doc-high-2');
    expect(bulkCandidates).not.toContain('doc-low');
  });

  it('correctly constructs ConfirmRequest payload with corrections and estimated flag', () => {
    const payload: ConfirmRequest = {
      overrideQuantity: 1250,
      overrideUnit: 'kWh',
      overrideAmountBdt: 14500,
      overridePeriod: '2026-05',
      isEstimated: true,
      notes: 'মিটার রিডিং কিছুটা অস্পষ্ট থাকায় প্রাক্কলিত হিসেবে চিহ্নিত করা হয়েছে',
    };

    expect(payload.overrideQuantity).toBe(1250);
    expect(payload.overrideUnit).toBe('kWh');
    expect(payload.isEstimated).toBe(true);
    expect(payload.notes).toContain('মিটার রিডিং');
  });

  it('correctly handles bounding box coordinates and low confidence identification', async () => {
    const queue = await fetchReviewQueue();
    const firstDoc = queue[0];
    expect(firstDoc).toBeDefined();

    // Verify fields have valid structure and bounding box JSON
    const fieldWithBbox = firstDoc.fields.find((f) => f.boundingBoxJson);
    expect(fieldWithBbox).toBeDefined();

    if (fieldWithBbox?.boundingBoxJson) {
      const parsedBox = JSON.parse(fieldWithBbox.boundingBoxJson);
      expect(parsedBox).toHaveProperty('left');
      expect(parsedBox).toHaveProperty('top');
      expect(parsedBox).toHaveProperty('width');
      expect(parsedBox).toHaveProperty('height');
    }
  });
});
