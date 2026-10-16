import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RoleType, DashboardSummary, TrendDataPoint, IntensityData, ClientOrgSummary } from './types';
import {
  fetchDashboardSummary,
  fetchDashboardTrend,
  fetchIntensityData,
  fetchConsultantClients,
} from './dashboardApi';
import { RoleDashboard } from './components/RoleDashboard';
import { TrendChart } from './components/TrendChart';
import { ScopeBreakdownChart } from './components/ScopeBreakdownChart';
import { IntensityChart } from './components/IntensityChart';
import { DashboardReceiptUploader } from './components/DashboardReceiptUploader';
import { RecentReceiptsImpact } from './components/RecentReceiptsImpact';
import { AuthUser } from '../../lib/apiClient';
import {
  Leaf,
  Users,
  Calendar,
  Layers,
  AlertCircle,
  FileText,
  TrendingDown,
  ShieldCheck,
  Search,
} from 'lucide-react';

interface DashboardFeatureProps {
  user: AuthUser;
  onNavigateTab: (tab: 'dashboard' | 'flags' | 'recommendations' | 'reports' | 'auditor') => void;
  onGoToFloor?: () => void;
  onGoToReview?: (docId?: string) => void;
}

export const DashboardFeature: React.FC<DashboardFeatureProps> = ({
  user,
  onNavigateTab,
  onGoToFloor,
  onGoToReview,
}) => {
  const { i18n } = useTranslation();
  const isBangla = i18n.language === 'bn';

  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trend, setTrend] = useState<TrendDataPoint[]>([]);
  const [intensity, setIntensity] = useState<IntensityData | null>(null);
  const [clientOrgs, setClientOrgs] = useState<ClientOrgSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Extract all unique periods from user's uploaded receipts
  const receiptPeriods = React.useMemo(() => {
    if (!summary?.recentReceipts) return [];
    const set = new Set<string>();
    for (const r of summary.recentReceipts) {
      if (r.period) set.add(r.period);
    }
    return Array.from(set).sort().reverse();
  }, [summary?.recentReceipts]);

  const loadData = useCallback(async () => {
    try {
      const [sumRes, trendRes, intRes, clientRes] = await Promise.all([
        fetchDashboardSummary(selectedPeriod),
        fetchDashboardTrend(selectedPeriod),
        fetchIntensityData(selectedPeriod === 'all' ? (receiptPeriods[0] || '2026-03') : selectedPeriod),
        fetchConsultantClients(),
      ]);
      setSummary(sumRes);
      setTrend(trendRes);
      setIntensity(intRes);
      setClientOrgs(clientRes);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !summary || !intensity) {
    return (
      <div className="p-12 text-center text-slate-500 font-semibold text-sm">
        {isBangla ? 'ড্যাশবোর্ড ডেটা লোড হচ্ছে...' : 'Loading Dashboard Analytics...'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unified Executive Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl uppercase tracking-wider">
            {user?.activeOrgName || 'Apex Textiles'}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {isBangla ? 'পূর্ণ নিয়ন্ত্রণ ও সার্বিক কার্বন সারসংক্ষেপ' : 'Full Access Executive Carbon Overview'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Calendar size={14} />
            {isBangla ? 'হিসাবকাল:' : 'Period:'}
          </span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="text-xs font-bold px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
          >
            <option value="all">
              {isBangla ? 'সার্বিক হিসাব (সবগুলো রসিদ সহ)' : 'All Time (Cumulative Footprint)'}
            </option>
            {receiptPeriods.map((p) => (
              <option key={p} value={p}>
                {p} ({isBangla ? 'রসিদের সময়কাল' : 'Receipt Evidence Period'})
              </option>
            ))}
            <option value="2026-09">{isBangla ? 'সেপ্টেম্বর ২০২৬' : 'September 2026'}</option>
            <option value="2026-08">{isBangla ? 'আগস্ট ২০২৬' : 'August 2026'}</option>
            <option value="2026-07">{isBangla ? 'জুলাই ২০২৬' : 'July 2026'}</option>
          </select>
        </div>
      </div>

      {/* Live Receipt Ingestion Dropzone */}
      <DashboardReceiptUploader
        isBangla={isBangla}
        onReceiptUploaded={loadData}
        onGoToReview={onGoToReview}
      />

      {/* Unified Executive Overview */}
      <RoleDashboard
        role="Owner"
        summary={summary}
        clientOrgs={clientOrgs}
        isBangla={isBangla}
        onNavigateTab={onNavigateTab}
        onGoToReview={onGoToReview}
      />

      {/* Evidence Receipts & Inventory Impact */}
      {summary.recentReceipts && summary.recentReceipts.length > 0 && (
        <RecentReceiptsImpact
          receipts={summary.recentReceipts}
          isBangla={isBangla}
          onReceiptUpdated={loadData}
          onGoToReview={onGoToReview}
        />
      )}

      {/* Analytical Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart data={trend} isBangla={isBangla} />
        <ScopeBreakdownChart
          scope1={summary.scope1Emissions}
          scope2={summary.scope2Emissions}
          scope3={summary.scope3Emissions}
          isBangla={isBangla}
        />
      </div>

      {/* Intensity vs Benchmark Section */}
      <IntensityChart data={intensity} isBangla={isBangla} />
    </div>
  );
};
