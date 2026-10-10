import { DashboardSummary, TrendDataPoint, IntensityData, ClientOrgSummary } from './types';
import { apiFetch } from '../../lib/apiClient';

export const mockDashboardSummary: DashboardSummary = {
  period: '2026-09',
  scope1Emissions: 12.45,
  scope2Emissions: 48.20,
  scope3Emissions: 5.10,
  totalEmissions: 65.75,
  dataQualityScore: 0.9125,
  dqsGrade: 'Grade A',
  verifiedPercentage: 92.4,
  status: 'ReadyForReview',
  activeFlagsCount: 3,
  missingDocsCount: 2,
};

export const mockTrendData: TrendDataPoint[] = [
  {
    period: '2026-04',
    periodLabelBn: 'এপ্রিল',
    periodLabelEn: 'Apr',
    verifiedEmissions: 58.2,
    estimatedEmissions: 4.1,
    totalEmissions: 62.3,
    hatchFlag: false,
  },
  {
    period: '2026-05',
    periodLabelBn: 'মে',
    periodLabelEn: 'May',
    verifiedEmissions: 61.5,
    estimatedEmissions: 3.8,
    totalEmissions: 65.3,
    hatchFlag: false,
  },
  {
    period: '2026-06',
    periodLabelBn: 'জুন',
    periodLabelEn: 'Jun',
    verifiedEmissions: 64.1,
    estimatedEmissions: 4.5,
    totalEmissions: 68.6,
    hatchFlag: false,
  },
  {
    period: '2026-07',
    periodLabelBn: 'জুলাই',
    periodLabelEn: 'Jul',
    verifiedEmissions: 59.8,
    estimatedEmissions: 5.2,
    totalEmissions: 65.0,
    hatchFlag: false,
  },
  {
    period: '2026-08',
    periodLabelBn: 'আগস্ট',
    periodLabelEn: 'Aug',
    verifiedEmissions: 55.4,
    estimatedEmissions: 7.9,
    totalEmissions: 63.3,
    hatchFlag: true, // > 10% estimated
  },
  {
    period: '2026-09',
    periodLabelBn: 'সেপ্টেম্বর',
    periodLabelEn: 'Sep',
    verifiedEmissions: 60.75,
    estimatedEmissions: 5.0,
    totalEmissions: 65.75,
    hatchFlag: false,
  },
];

export const mockIntensityData: IntensityData = {
  metric: 'intensity_garments',
  metricLabelBn: 'পোশাক উৎপাদন প্রতি কার্বন ঘনত্ব',
  metricLabelEn: 'Garment Output Emission Intensity',
  unit: 'kg CO₂e / 1,000 pcs',
  productionQuantity: 35000,
  verifiedIntensity: 18.78,
  inclEstimateIntensity: 19.45,
  // When peer data is thin (n < 10), benchmark is null, triggering "no benchmark yet"
  benchmark: {
    p25: 14.5,
    p50: 18.2,
    p75: 22.8,
    p90: 27.5,
    n: 14, // > 10, so benchmark is valid
    source: 'Bangladesh Textile RMG Cluster Benchmark (BGMEA/IFC)',
    year: 2025,
  },
};

export const mockConsultantClientOrgs: ClientOrgSummary[] = [
  {
    orgId: 'org-apex',
    orgName: 'Apex Textiles Ltd.',
    sector: 'Knit Dyeing & Finishing',
    totalEmissions: 65.75,
    dqsScore: 0.9125,
    dqsGrade: 'Grade A',
    openFlagsCount: 3,
    pendingOverridesCount: 0,
    lastUpdated: '2026-10-08',
  },
  {
    orgId: 'org-square',
    orgName: 'Square Fashions (Unit 2)',
    sector: 'Woven Garments',
    totalEmissions: 142.30,
    dqsScore: 0.8850,
    dqsGrade: 'Grade A',
    openFlagsCount: 1,
    pendingOverridesCount: 1,
    lastUpdated: '2026-10-07',
  },
  {
    orgId: 'org-hameem',
    orgName: 'Ha-Meem Denim Mill',
    sector: 'Denim Spinning & Weaving',
    totalEmissions: 310.80,
    dqsScore: 0.7420,
    dqsGrade: 'Grade B',
    openFlagsCount: 6,
    pendingOverridesCount: 2,
    lastUpdated: '2026-10-06',
  },
  {
    orgId: 'org-beximco',
    orgName: 'Beximco Apparels Industrial Park',
    sector: 'Composite Textile',
    totalEmissions: 495.10,
    dqsScore: 0.9410,
    dqsGrade: 'Grade A',
    openFlagsCount: 0,
    pendingOverridesCount: 0,
    lastUpdated: '2026-10-09',
  },
];

export async function fetchDashboardSummary(period: string = '2026-09'): Promise<DashboardSummary> {
  try {
    const raw = await apiFetch<any>(`/api/v1/dashboard/summary?period=${encodeURIComponent(period)}`);
    if (!raw) return mockDashboardSummary;

    const s1 = Number(raw.scope1Emissions ?? raw.scope1Tco2e ?? mockDashboardSummary.scope1Emissions);
    const s2 = Number(raw.scope2Emissions ?? raw.scope2Tco2e ?? mockDashboardSummary.scope2Emissions);
    const s3 = Number(raw.scope3Emissions ?? raw.scope3Tco2e ?? mockDashboardSummary.scope3Emissions);
    const total = Number(raw.totalEmissions ?? raw.totalTco2e ?? (s1 + s2 + s3));
    const dqsRaw = raw.dataQualityScore ?? mockDashboardSummary.dataQualityScore;
    const dqs = typeof dqsRaw === 'number' ? (dqsRaw > 1 ? dqsRaw / 100 : dqsRaw) : 0.9125;

    return {
      period: raw.reportingPeriod || raw.period || period,
      scope1Emissions: s1,
      scope2Emissions: s2,
      scope3Emissions: s3,
      totalEmissions: total,
      dataQualityScore: dqs,
      dqsGrade: raw.dqsGrade || (dqs >= 0.85 ? 'Grade A' : dqs >= 0.70 ? 'Grade B' : 'Grade C'),
      verifiedPercentage: Number(raw.verifiedPercentage ?? raw.verifiedSharePercent ?? 92.4),
      status: raw.status || 'ReadyForReview',
      activeFlagsCount: Number(raw.activeFlagsCount ?? mockDashboardSummary.activeFlagsCount),
      missingDocsCount: Number(raw.missingDocsCount ?? mockDashboardSummary.missingDocsCount),
    };
  } catch {
    return mockDashboardSummary;
  }
}

export async function fetchDashboardTrend(start: string = '2026-04', end: string = '2026-09'): Promise<TrendDataPoint[]> {
  try {
    const data = await apiFetch<any[]>(`/api/v1/dashboard/trend?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
    if (!Array.isArray(data) || data.length === 0) return mockTrendData;
    return data.map((pt) => {
      const v = Number(pt.verifiedEmissions ?? (pt.verifiedKgCo2e ? pt.verifiedKgCo2e / 1000 : 0));
      const e = Number(pt.estimatedEmissions ?? (pt.estimatedKgCo2e ? pt.estimatedKgCo2e / 1000 : 0));
      const t = Number(pt.totalEmissions ?? (pt.totalKgCo2e ? pt.totalKgCo2e / 1000 : v + e));
      return {
        period: pt.period || pt.reportingPeriod || '2026-09',
        periodLabelBn: pt.periodLabelBn || pt.period || 'মাস',
        periodLabelEn: pt.periodLabelEn || pt.period || 'Month',
        verifiedEmissions: v,
        estimatedEmissions: e,
        totalEmissions: t,
        hatchFlag: Boolean(pt.hatchFlag),
      };
    });
  } catch {
    return mockTrendData;
  }
}

export async function fetchIntensityData(period: string = '2026-09'): Promise<IntensityData> {
  try {
    const data = await apiFetch<IntensityData>(`/api/v1/dashboard/intensity?period=${encodeURIComponent(period)}`);
    return data || mockIntensityData;
  } catch {
    return mockIntensityData;
  }
}

export async function fetchConsultantClients(): Promise<ClientOrgSummary[]> {
  try {
    const data = await apiFetch<ClientOrgSummary[]>('/api/v1/consultant/clients');
    return Array.isArray(data) ? data : mockConsultantClientOrgs;
  } catch {
    return mockConsultantClientOrgs;
  }
}
