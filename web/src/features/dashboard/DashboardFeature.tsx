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
  Calendar,
  Upload,
  BarChart2,
  FileCheck2,
  Gauge,
  Layers,
  X,
} from 'lucide-react';
import { toBanglaDigits } from '../../shared';

export type DashboardSection = 'overview' | 'evidence' | 'benchmark' | 'all';

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
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [showUploader, setShowUploader] = useState<boolean>(false);

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
  }, [selectedPeriod, receiptPeriods]);

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

  const receiptsCount = summary?.recentReceipts?.length || 0;

  return (
    <div className="space-y-5">
      {/* Streamlined Executive Header */}
      <div className="bg-[#fafaf9] p-3.5 sm:p-4 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-stone-800 bg-stone-100 border border-stone-300/80 px-3 py-1.5 rounded-xl uppercase tracking-wider">
            {user?.activeOrgName || 'Apex Textiles'}
          </span>
          <span className="text-xs text-stone-500 font-medium hidden sm:inline">
            {isBangla ? 'সার্বিক কার্বন ড্যাশবোর্ড' : 'Carbon Accounting Dashboard'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Upload Toggle Button */}
          <button
            type="button"
            onClick={() => setShowUploader(!showUploader)}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${
              showUploader
                ? 'bg-[#2d3c2d] text-white border-[#2d3c2d] shadow-2xs'
                : 'bg-stone-100 text-stone-800 border-stone-300/80 hover:bg-stone-200'
            }`}
          >
            {showUploader ? <X size={13} /> : <Upload size={13} />}
            <span>{showUploader ? (isBangla ? 'আপলোড বন্ধ' : 'Close Upload') : (isBangla ? 'রসিদ জমা দিন' : 'Upload Bill')}</span>
          </button>

          {/* Period Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-stone-200 px-2.5 py-1 rounded-xl shadow-2xs">
            <Calendar size={13} className="text-stone-500" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-xs font-semibold bg-transparent text-stone-800 border-none outline-hidden cursor-pointer"
            >
              <option value="all">
                {isBangla ? 'সব সময় (সর্বমোট)' : 'All Time'}
              </option>
              {receiptPeriods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
              <option value="2026-09">{isBangla ? 'সেপ্টেম্বর ২০২৬' : 'September 2026'}</option>
              <option value="2026-08">{isBangla ? 'আগস্ট ২০২৬' : 'August 2026'}</option>
              <option value="2026-07">{isBangla ? 'জুলাই ২০২৬' : 'July 2026'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Conditionally Revealed Quick Uploader */}
      {(showUploader || activeSection === 'evidence') && (
        <DashboardReceiptUploader
          isBangla={isBangla}
          onReceiptUploaded={loadData}
          onGoToReview={onGoToReview}
        />
      )}

      {/* Key KPI Metrics Summary Cards (Persistent across views) */}
      <RoleDashboard
        role="Owner"
        section="kpis"
        summary={summary}
        clientOrgs={clientOrgs}
        isBangla={isBangla}
        onNavigateTab={onNavigateTab}
        onGoToReview={onGoToReview}
      />

      {/* Clean Segmented Section Controller */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-1">
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          <button
            onClick={() => setActiveSection('overview')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'overview'
                ? 'bg-[#2d3c2d] text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900'
            }`}
          >
            <BarChart2 size={13} />
            <span>{isBangla ? 'সারসংক্ষেপ ও চার্ট' : 'Overview & Charts'}</span>
          </button>

          <button
            onClick={() => setActiveSection('evidence')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'evidence'
                ? 'bg-[#2d3c2d] text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900'
            }`}
          >
            <FileCheck2 size={13} />
            <span>{isBangla ? 'রসিদ ও প্রমাণপত্র' : 'Receipts & Evidence'}</span>
            {receiptsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeSection === 'evidence' ? 'bg-[#3f593f] text-white' : 'bg-stone-200 text-stone-700'
              }`}>
                {isBangla ? toBanglaDigits(receiptsCount) : receiptsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('benchmark')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'benchmark'
                ? 'bg-[#2d3c2d] text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900'
            }`}
          >
            <Gauge size={13} />
            <span>{isBangla ? 'ঘনত্ব ও বেঞ্চমার্ক' : 'Garment Benchmark'}</span>
          </button>

          <button
            onClick={() => setActiveSection('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'all'
                ? 'bg-[#2d3c2d] text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900'
            }`}
          >
            <Layers size={13} />
            <span>{isBangla ? 'সবগুলো' : 'View All'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: OVERVIEW (Charts & Priority Action items) */}
      {(activeSection === 'overview' || activeSection === 'all') && (
        <div className="space-y-6">
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

          {/* Priority Notices & Recommended Measures */}
          <RoleDashboard
            role="Owner"
            section="actions"
            summary={summary}
            clientOrgs={clientOrgs}
            isBangla={isBangla}
            onNavigateTab={onNavigateTab}
            onGoToReview={onGoToReview}
          />
        </div>
      )}

      {/* SECTION 2: EVIDENCE & RECEIPTS */}
      {(activeSection === 'evidence' || activeSection === 'all') && (
        <div className="space-y-4">
          {summary.recentReceipts && summary.recentReceipts.length > 0 ? (
            <RecentReceiptsImpact
              receipts={summary.recentReceipts}
              isBangla={isBangla}
              onReceiptUpdated={loadData}
              onGoToReview={onGoToReview}
            />
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/90 text-center text-slate-500 text-xs">
              {isBangla ? 'কোনো রসিদ আপলোড করা হয়নি।' : 'No utility bills or slips uploaded yet.'}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: BENCHMARK & INTENSITY */}
      {(activeSection === 'benchmark' || activeSection === 'all') && (
        <IntensityChart data={intensity} isBangla={isBangla} />
      )}
    </div>
  );
};
