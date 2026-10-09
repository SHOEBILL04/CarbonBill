import { ReportItem, ReportStatus, ShareLinkInfo } from './types';
import { apiFetch } from '../../lib/apiClient';

export const mockReportsList: ReportItem[] = [
  {
    id: 'rep-2026-09',
    period: '2026-09',
    status: 'ReadyForReview',
    version: 1,
    scope1Emissions: 12.45,
    scope2Emissions: 48.20,
    scope3Emissions: 5.10,
    totalEmissions: 65.75,
    dataQualityScore: 0.9125,
    dqsGrade: 'Grade A',
    readinessChecklist: {
      allExpectedDocsReceived: false,
      missingDocsCount: 2,
      criticalFlagsResolved: true,
      openCriticalFlagsCount: 0,
      dqsAboveThreshold: true,
      dqsScore: 0.9125,
      factorsUpToDate: true,
      isReadyForApproval: true,
    },
    activeShareLinks: [],
  },
  {
    id: 'rep-2026-08',
    period: '2026-08',
    status: 'Locked',
    version: 1,
    scope1Emissions: 14.10,
    scope2Emissions: 44.50,
    scope3Emissions: 4.70,
    totalEmissions: 63.30,
    dataQualityScore: 0.8950,
    dqsGrade: 'Grade A',
    contentHashSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    approvedBy: 'Kabir Ahmed (Managing Director)',
    approvedAt: '2026-09-05T14:30:00Z',
    readinessChecklist: {
      allExpectedDocsReceived: true,
      missingDocsCount: 0,
      criticalFlagsResolved: true,
      openCriticalFlagsCount: 0,
      dqsAboveThreshold: true,
      dqsScore: 0.8950,
      factorsUpToDate: true,
      isReadyForApproval: true,
    },
    activeShareLinks: [
      {
        token: 'share-tok-inditex-202608',
        shareUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://app.carbonbill.local'}/auditor?token=share-tok-inditex-202608`,
        expiresAt: '2026-11-05T23:59:59Z',
        redactPrices: true,
        viewCount: 4,
      },
    ],
  },
];

let inMemoryReports = [...mockReportsList];

export async function fetchReports(): Promise<ReportItem[]> {
  try {
    const data = await apiFetch<ReportItem[]>('/api/v1/reports');
    return data;
  } catch {
    return inMemoryReports;
  }
}

export async function submitReportForReview(id: string): Promise<boolean> {
  try {
    await apiFetch(`/api/v1/reports/${encodeURIComponent(id)}/submit-review`, { method: 'POST' });
  } catch {
    // fallback
  }
  inMemoryReports = inMemoryReports.map((r) =>
    r.id === id ? { ...r, status: 'ReadyForReview' } : r
  );
  return true;
}

export async function approveReport(id: string, approvedBy: string): Promise<{ success: boolean; hash: string }> {
  const hash = 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e';
  const now = new Date().toISOString();

  try {
    const res = await apiFetch<{ hash?: string }>(`/api/v1/reports/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approvedBy }),
    });
    if (res.hash) return { success: true, hash: res.hash };
  } catch {
    // fallback
  }

  inMemoryReports = inMemoryReports.map((r) =>
    r.id === id
      ? {
          ...r,
          status: 'Locked',
          contentHashSha256: hash,
          approvedBy,
          approvedAt: now,
        }
      : r
  );
  return { success: true, hash };
}

export async function createShareLink(
  reportId: string,
  expiryDays: number,
  redactPrices: boolean
): Promise<ShareLinkInfo> {
  const token = `share-${Math.random().toString(36).substring(2, 10)}`;
  const expiresAt = new Date(Date.now() + expiryDays * 86400000).toISOString();
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.carbonbill.local';
  const shareUrl = `${origin}/auditor?token=${token}`;

  try {
    const res = await apiFetch<ShareLinkInfo>(`/api/v1/reports/${encodeURIComponent(reportId)}/share`, {
      method: 'POST',
      body: JSON.stringify({ expiryDays, redactPrices }),
    });
    if (res && res.token) return res;
  } catch {
    // fallback
  }

  const newLink: ShareLinkInfo = {
    token,
    shareUrl,
    expiresAt,
    redactPrices,
    viewCount: 0,
  };

  inMemoryReports = inMemoryReports.map((r) =>
    r.id === reportId ? { ...r, activeShareLinks: [...r.activeShareLinks, newLink] } : r
  );

  return newLink;
}

export function getPdfDownloadUrl(id: string, lang: 'bn' | 'en' = 'en', redactPrices: boolean = false): string {
  return `/api/v1/reports/${encodeURIComponent(id)}/pdf?lang=${lang}&redactPrices=${redactPrices}`;
}

export function getExcelDownloadUrl(id: string, redactPrices: boolean = false): string {
  return `/api/v1/reports/${encodeURIComponent(id)}/excel?redactPrices=${redactPrices}`;
}
