import { apiClient } from '../../lib/apiClient';

export interface ReviewField {
  id: string;
  fieldName: string;
  rawValue: string;
  normalizedValue?: string;
  correctedValue?: string;
  confidence: number;
  sourceTier: number;
  boundingBoxJson?: string;
}

export interface ReviewQueueItem {
  documentId: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  status: string;
  docType?: string;
  capturedAtUtc: string;
  overallConfidence: number;
  tierUsed?: number;
  isEstimated: boolean;
  fields: ReviewField[];
}

export interface ConfirmRequest {
  activityType?: string;
  overrideQuantity?: number;
  overrideUnit?: string;
  overrideAmountBdt?: number;
  overridePeriod?: string;
  isEstimated?: boolean;
  resolveDuplicateWithDocId?: string;
  notes?: string;
}

export interface OrgReviewSettings {
  autoConfirmEnabled: boolean;
  autoConfirmThreshold: number;
  manualConfirmCount: number;
  samplingRate: number;
}

export async function fetchReviewQueue(docType?: string): Promise<ReviewQueueItem[]> {
  try {
    const query = docType ? `?docType=${encodeURIComponent(docType)}` : '';
    const res = await apiClient.get<{ items: ReviewQueueItem[]; count: number }>(`/api/v1/review/queue${query}`);
    return res.items || [];
  } catch {
    // Return sample mock data if backend not reachable in dev
    return getFallbackMockQueue();
  }
}

export async function updateFields(
  documentId: string,
  fieldCorrections: Record<string, string>,
  notes?: string
): Promise<boolean> {
  try {
    await apiClient.put(`/api/v1/documents/${documentId}/fields`, { fieldCorrections, notes });
    return true;
  } catch (err) {
    console.error('Update fields failed:', err);
    return false;
  }
}

export async function confirmDocument(
  documentId: string,
  payload: ConfirmRequest
): Promise<boolean> {
  try {
    await apiClient.post(`/api/v1/documents/${documentId}/confirm`, payload);
    return true;
  } catch (err) {
    console.error('Confirm document failed:', err);
    return false;
  }
}

export async function bulkConfirmDocuments(
  documentIds: string[]
): Promise<{ succeeded: number; failed: number }> {
  try {
    const res = await apiClient.post<{ succeeded: number; failed: number }>('/api/v1/documents/bulk-confirm', {
      documentIds,
    });
    return res;
  } catch {
    return { succeeded: 0, failed: documentIds.length };
  }
}

export async function fetchReviewSettings(): Promise<OrgReviewSettings> {
  try {
    return await apiClient.get<OrgReviewSettings>('/api/v1/review/settings');
  } catch {
    return {
      autoConfirmEnabled: false,
      autoConfirmThreshold: 0.95,
      manualConfirmCount: 0,
      samplingRate: 0.1,
    };
  }
}

function getFallbackMockQueue(): ReviewQueueItem[] {
  return [
    {
      documentId: 'doc-001',
      fileName: 'desco_mirpur_jun26.pdf',
      contentType: 'application/pdf',
      fileSizeBytes: 245000,
      status: 'NeedsReview',
      docType: 'ElectricityBill',
      capturedAtUtc: '2026-06-15T10:30:00Z',
      overallConfidence: 0.68, // Low confidence -> sorted first!
      tierUsed: 1,
      isEstimated: false,
      fields: [
        {
          id: 'f-1',
          fieldName: 'Vendor',
          rawValue: 'DESCO',
          normalizedValue: 'DESCO',
          confidence: 0.95,
          sourceTier: 1,
        },
        {
          id: 'f-2',
          fieldName: 'BillNumber',
          rawValue: 'DESCO-98124',
          normalizedValue: 'DESCO-98124',
          confidence: 0.90,
          sourceTier: 1,
        },
        {
          id: 'f-3',
          fieldName: 'BillingPeriod',
          rawValue: '2026-06',
          normalizedValue: '2026-06',
          confidence: 0.92,
          sourceTier: 1,
        },
        {
          id: 'f-4',
          fieldName: 'Quantity',
          rawValue: '৫৪,২০০',
          normalizedValue: '54200.00',
          confidence: 0.65, // Low confidence!
          sourceTier: 1,
          boundingBoxJson: JSON.stringify({ left: 0.35, top: 0.45, width: 0.25, height: 0.08 }),
        },
        {
          id: 'f-5',
          fieldName: 'Unit',
          rawValue: 'kWh',
          normalizedValue: 'kWh',
          confidence: 0.88,
          sourceTier: 1,
        },
        {
          id: 'f-6',
          fieldName: 'AmountBdt',
          rawValue: '৫,৬৯,১০০.০০',
          normalizedValue: '569100.00',
          confidence: 0.70, // Low confidence!
          sourceTier: 1,
          boundingBoxJson: JSON.stringify({ left: 0.40, top: 0.72, width: 0.30, height: 0.09 }),
        },
        {
          id: 'f-7',
          fieldName: 'PowerFactorPenalty',
          rawValue: '০.০০',
          normalizedValue: '0.00',
          confidence: 0.90,
          sourceTier: 1,
        },
      ],
    },
    {
      documentId: 'doc-002',
      fileName: 'padma_oil_diesel_slip.jpg',
      contentType: 'image/jpeg',
      fileSizeBytes: 180000,
      status: 'NeedsReview',
      docType: 'DieselSlip',
      capturedAtUtc: '2026-06-18T14:15:00Z',
      overallConfidence: 0.82,
      tierUsed: 2,
      isEstimated: false,
      fields: [
        {
          id: 'f-8',
          fieldName: 'Vendor',
          rawValue: 'Padma Oil Company Ltd',
          normalizedValue: 'Padma Oil',
          confidence: 0.94,
          sourceTier: 2,
        },
        {
          id: 'f-9',
          fieldName: 'BillNumber',
          rawValue: 'POCL-44912',
          normalizedValue: 'POCL-44912',
          confidence: 0.92,
          sourceTier: 2,
        },
        {
          id: 'f-10',
          fieldName: 'BillingPeriod',
          rawValue: '2026-06',
          normalizedValue: '2026-06',
          confidence: 0.95,
          sourceTier: 2,
        },
        {
          id: 'f-11',
          fieldName: 'Quantity',
          rawValue: '৩,৫০০',
          normalizedValue: '3500.00',
          confidence: 0.85,
          sourceTier: 2,
          boundingBoxJson: JSON.stringify({ left: 0.25, top: 0.50, width: 0.35, height: 0.10 }),
        },
        {
          id: 'f-12',
          fieldName: 'Unit',
          rawValue: 'লিটার',
          normalizedValue: 'litre',
          confidence: 0.95,
          sourceTier: 2,
        },
        {
          id: 'f-13',
          fieldName: 'AmountBdt',
          rawValue: '৩,৭৮,০০০.০০',
          normalizedValue: '378000.00',
          confidence: 0.88,
          sourceTier: 2,
        },
      ],
    },
    {
      documentId: 'doc-003',
      fileName: 'titas_gas_ind_rms.pdf',
      contentType: 'application/pdf',
      fileSizeBytes: 310000,
      status: 'NeedsReview',
      docType: 'GasBill',
      capturedAtUtc: '2026-06-20T09:45:00Z',
      overallConfidence: 0.94,
      tierUsed: 3,
      isEstimated: false,
      fields: [
        {
          id: 'f-14',
          fieldName: 'Vendor',
          rawValue: 'Titas Gas',
          normalizedValue: 'Titas Gas',
          confidence: 0.96,
          sourceTier: 3,
        },
        {
          id: 'f-15',
          fieldName: 'BillNumber',
          rawValue: 'TG-901823',
          normalizedValue: 'TG-901823',
          confidence: 0.95,
          sourceTier: 3,
        },
        {
          id: 'f-16',
          fieldName: 'BillingPeriod',
          rawValue: '2026-06',
          normalizedValue: '2026-06',
          confidence: 0.98,
          sourceTier: 3,
        },
        {
          id: 'f-17',
          fieldName: 'Quantity',
          rawValue: '১২,৩০০',
          normalizedValue: '12300.00',
          confidence: 0.93,
          sourceTier: 3,
        },
        {
          id: 'f-18',
          fieldName: 'Unit',
          rawValue: 'ঘনমিটার',
          normalizedValue: 'm3',
          confidence: 0.97,
          sourceTier: 3,
        },
        {
          id: 'f-19',
          fieldName: 'AmountBdt',
          rawValue: '৩,৬৮,০০০.০০',
          normalizedValue: '368000.00',
          confidence: 0.94,
          sourceTier: 3,
        },
      ],
    },
  ];
}
