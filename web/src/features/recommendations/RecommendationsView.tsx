import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Recommendation, RecommendationStatus, RecommendationsPayload } from './types';
import { fetchRecommendationsPayload, recalculateRecommendations, updateRecommendationStatus } from './recommendationsApi';
import { RecommendationCard } from './components/RecommendationCard';
import { MaccChart } from './components/MaccChart';
import { StatusChangeModal } from './components/StatusChangeModal';
import { RagAssistant } from './components/RagAssistant';
import { toBanglaDigits, formatBdt } from '../../shared';
import {
  TrendingDown,
  BarChart2,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Zap,
  Building2,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';

export const RecommendationsView: React.FC = () => {
  const { i18n } = useTranslation();
  const isBangla = i18n.language === 'bn';

  const [payload, setPayload] = useState<RecommendationsPayload | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [recalculating, setRecalculating] = useState<boolean>(false);
  const [ragRecalculateSignal, setRagRecalculateSignal] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'cards' | 'macc'>('cards');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Status modal
  const [statusModalData, setStatusModalData] = useState<{
    rec: Recommendation;
    targetStatus: RecommendationStatus;
  } | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetchRecommendationsPayload();
      setPayload(res);
      setRecommendations(Array.isArray(res.recommendations) ? res.recommendations : []);
    } catch {
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRecalculate() {
    setRecalculating(true);
    try {
      await recalculateRecommendations();
      await loadData();
      // Auto-trigger RAG recalculation audit across electricity, gas, and fuel
      setRagRecalculateSignal((prev) => prev + 1);
    } finally {
      setRecalculating(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const list = Array.isArray(recommendations) ? recommendations : [];
    // Strictly display 'Suggested' recommendations (Planned, Done, NotFeasible are omitted from this action feed)
    const suggestedOnly = list.filter((r) => r.status === 'Suggested');
    if (categoryFilter === 'all') return suggestedOnly;

    return suggestedOnly.filter((r) => {
      if (r.category === categoryFilter) return true;
      if (categoryFilter === 'Solar' && (r.category === 'SolarPV' || r.category.includes('Solar'))) return true;
      if (categoryFilter === 'Electricity' && ['PowerFactor', 'Lighting', 'Motors', 'Electricity'].includes(r.category)) return true;
      if (categoryFilter === 'Boiler' && (r.category === 'Boilers' || r.category.includes('Boiler'))) return true;
      if (categoryFilter === 'Fuel_Transport' && ['Generators', 'Transport'].includes(r.category)) return true;
      if (categoryFilter === 'CompressedAir' && (r.category === 'CompressedAir' || r.category.includes('Air'))) return true;
      return false;
    });
  }, [recommendations, categoryFilter]);

  function handleInitiateStatusChange(rec: Recommendation, newStatus: RecommendationStatus) {
    if (newStatus === 'NotFeasible' || newStatus === 'Done') {
      setStatusModalData({ rec, targetStatus: newStatus });
    } else {
      handleConfirmStatusChange(rec.id, newStatus, '');
    }
  }

  async function handleConfirmStatusChange(
    id: string,
    status: RecommendationStatus,
    reason: string
  ) {
    await updateRecommendationStatus(id, status, reason);
    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, statusReason: reason } : r))
    );
  }

  const baseline = payload?.baselineData;

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-800 text-white rounded-2xl shadow-sm">
              <TrendingDown size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-black text-slate-900">
                  {isBangla ? 'গতিশীল এআই ও প্রমাণভিত্তিক সুপারিশমালা' : 'Dynamic AI & Evidence-Based Recommendations'}
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200">
                  <Sparkles size={11} className="text-violet-600" />
                  {isBangla ? 'রিয়েল-টাইম এআই চালিত' : 'Real-Time AI Powered'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isBangla
                  ? 'কারখানার নিজস্ব নিশ্চিত বিলের ট্যারিফ, অপারেশনাল ফ্ল্যাগ এবং IFC PaCT গবেষণার ভিত্তিতে গণনাকৃত'
                  : 'Calibrated from your verified utility bills, active operational flags, and IFC PaCT empirical guidelines'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRecalculate}
              disabled={recalculating || loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-violet-900 bg-violet-50 hover:bg-violet-100 border border-violet-200 transition disabled:opacity-50"
              title={isBangla ? 'সর্বশেষ বিল ও ফ্ল্যাগ অনুযায়ী পুনরায় হিসাব করুন' : 'Recalculate with latest bills and flags'}
            >
              <Sparkles size={13} className={recalculating ? 'animate-spin text-violet-600' : 'text-violet-600'} />
              {recalculating
                ? (isBangla ? 'হিসাব হচ্ছে...' : 'Recalculating...')
                : (isBangla ? 'এআই পুনর্গননা' : 'Recalculate with AI')}
            </button>

            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('cards')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'cards'
                    ? 'bg-white text-teal-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isBangla ? 'পদক্ষেপ কার্ডসমূহ' : 'Action Cards'}
              </button>
              <button
                onClick={() => setActiveTab('macc')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                  activeTab === 'macc'
                    ? 'bg-white text-teal-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart2 size={13} /> {isBangla ? 'MACC চার্ট' : 'MACC Curve'}
              </button>
            </div>

            <button
              onClick={loadData}
              className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              title={isBangla ? 'রিফ্রেশ' : 'Refresh'}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Dynamic Facility Baseline Banner */}
        {baseline && (
          <div className="p-4 bg-gradient-to-r from-slate-50 to-teal-50/40 border border-slate-200 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-teal-800" />
                <span className="font-bold text-xs text-slate-800">
                  {isBangla ? 'কারখানার সক্রিয় বেসলাইন ডেটা:' : 'Live Factory Baseline Data:'}
                </span>
                {baseline.hasRealBills ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <FileCheck size={12} className="text-emerald-700" />
                    {isBangla
                      ? `বাস্তব বিল চালিত (${toBanglaDigits(baseline.billsCount)} টি বিল বিশ্লেষিত)`
                      : `Dynamic Bills (${baseline.billsCount} confirmed bills)`}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                    <AlertTriangle size={12} className="text-amber-700" />
                    {isBangla ? 'প্রাথমিক প্রোফাইল ভিত্তিক' : 'Initial Profile (Upload bills to calibrate)'}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500">
                {isBangla ? 'সব সাশ্রয় ও পে-ব্যাক এই সংখ্যার উপর ভিত্তি করে তৈরি' : 'All savings & payback ranges derived from these figures'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-white/80 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">
                  {isBangla ? 'বার্ষিক বিদ্যুৎ খরচ' : 'Annual Electricity'}
                </span>
                <span className="font-bold text-slate-900 font-mono">
                  {isBangla ? toBanglaDigits(Math.round(baseline.annualElectricityKwh).toLocaleString()) : Math.round(baseline.annualElectricityKwh).toLocaleString()} kWh
                </span>
              </div>
              <div className="p-2.5 bg-white/80 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">
                  {isBangla ? 'কার্যকর বিদ্যুৎ ট্যারিফ' : 'Effective Grid Tariff'}
                </span>
                <span className="font-bold text-teal-800 font-mono">
                  {formatBdt(baseline.electricityTariffBdtPerKwh, { useBanglaDigits: isBangla })} / kWh
                </span>
              </div>
              <div className="p-2.5 bg-white/80 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">
                  {isBangla ? 'বার্ষিক ডিজেল খরচ' : 'Annual Diesel'}
                </span>
                <span className="font-bold text-slate-900 font-mono">
                  {isBangla ? toBanglaDigits(Math.round(baseline.annualDieselLitres).toLocaleString()) : Math.round(baseline.annualDieselLitres).toLocaleString()} L
                </span>
              </div>
              <div className="p-2.5 bg-white/80 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">
                  {isBangla ? 'কার্যকর ডিজেল ট্যারিফ' : 'Diesel Fuel Tariff'}
                </span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatBdt(baseline.dieselTariffBdtPerLitre, { useBanglaDigits: isBangla })} / L
                </span>
              </div>
            </div>

            {/* Active Flags Callout */}
            {baseline.activeFlagCodes && baseline.activeFlagCodes.length > 0 && (
              <div className="p-2.5 bg-amber-50/90 border border-amber-200 rounded-lg flex items-start gap-2 text-xs">
                <Zap size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-amber-900">
                      {isBangla ? 'চিহ্নিত অপারেশনাল অসঙ্গতি (Active Flags):' : 'Active Operational Flags Detected:'}
                    </span>
                    {baseline.activeFlagCodes.map((code) => (
                      <span key={code} className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-amber-200/80 text-amber-900 rounded">
                        {code}
                      </span>
                    ))}
                  </div>
                  <p className="text-amber-800 text-[11px]">
                    {isBangla
                      ? 'এআই সুপারিশ ইঞ্জিন এই অসঙ্গতিগুলো দূর করার লক্ষ্যে সংশ্লিষ্ট পদক্ষেপগুলোকে সর্বোচ্চ অগ্রাধিকার (Score Boost) দিয়েছে।'
                      : 'The recommendation engine detected these operational inefficiencies and boosted the priority ranking of measures that directly eliminate them.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Executive Decarbonization Brief */}
        {payload?.executiveBrief && (
          <div className="p-4 bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white rounded-2xl shadow-sm space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <Sparkles size={16} className="text-violet-300" />
                </div>
                <h3 className="text-sm font-bold text-violet-100">
                  {isBangla ? 'এআই ডিকার্বনাইজেশন নির্বাহী বিশ্লেষণ' : 'AI Executive Decarbonization Brief'}
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-violet-200 bg-white/10 px-2 py-0.5 rounded-full">
                {isBangla ? 'কারখানার ডেটা চালিত এআই' : 'Factory Data-Driven AI'}
              </span>
            </div>
            <div className="text-xs text-slate-200 leading-relaxed space-y-1 whitespace-pre-line font-sans">
              {payload.executiveBrief}
            </div>
          </div>
        )}

        {/* Interactive RAG Energy Advisor */}
        <RagAssistant isBangla={isBangla} recalculateSignal={ragRecalculateSignal} />

        {/* Honesty & Range Rules Notice */}
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-start gap-2.5">
          <ShieldCheck size={18} className="text-teal-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">
              {isBangla
                ? 'দায়িত্বশীল হিসাব ও পরিসীমা নীতি (Honest Ranges Protocol):'
                : 'Scientific Range Protocol:'}
            </span>
            <p className="text-slate-600 mt-0.5 text-[11px]">
              {isBangla
                ? 'কার্বনবিলে কখনো অনুমাননির্ভর একক সংখ্যা দেওয়া হয় না। সাশ্রয়, পে-ব্যাক ও বিনিয়োগ সর্বদা ন্যূনতম, গড় ও সর্বোচ্চ পরিসীমায় (Low/Typical/High) প্রদর্শিত হয়।'
                : 'Under CarbonBill engineering standards, financial savings and payback are always presented as calibrated ranges (Low, Typical, High), never deceptive single-point estimates.'}
            </p>
          </div>
        </div>

        {/* Category Filter Pills & Suggested-Only State */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-500 mr-1">
            {isBangla ? 'বিভাগ ফিল্টার:' : 'Filter Category:'}
          </span>
          {[
            { id: 'all', bn: 'সকল সক্রিয় সুপারিশ', en: 'All Suggested' },
            { id: 'Solar', bn: '☀️ সোলার পিভি', en: '☀️ Solar PV' },
            { id: 'Electricity', bn: '⚡ বিদ্যুৎ ও মোটর', en: '⚡ Electricity & Motors' },
            { id: 'Boiler', bn: '🔥 বয়লার ও বাষ্প', en: '🔥 Boilers & Gas' },
            { id: 'Fuel_Transport', bn: '⛽ জ্বালানি ও পরিবহন', en: '⛽ Fuel & Transport' },
            { id: 'CompressedAir', bn: '💨 কম্প্রেসড এয়ার', en: '💨 Compressed Air' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                categoryFilter === cat.id
                  ? 'bg-teal-900 text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isBangla ? cat.bn : cat.en}
            </button>
          ))}
          <span className="ml-auto text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            {isBangla ? `শুধুমাত্র সুপারিশকৃত পদক্ষেপে প্রদর্শন (${toBanglaDigits(filtered.length)} টি)` : `Showing Suggested Only (${filtered.length})`}
          </span>
        </div>
      </div>

      {/* Main View Body */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs font-semibold">
          {isBangla ? 'সুপারিশমালা প্রস্তুত হচ্ছে...' : 'Loading recommendations...'}
        </div>
      ) : activeTab === 'macc' ? (
        <MaccChart recommendations={filtered} isBangla={isBangla} />
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-xs font-semibold shadow-xs">
          {isBangla ? 'এই ক্যাটাগরিতে কোনো সুপারিশ পাওয়া যায়নি।' : 'No recommendations found for this category.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((rec) => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              isBangla={isBangla}
              onUpdateStatus={handleInitiateStatusChange}
            />
          ))}
        </div>
      )}

      {/* Status Modal for Reason */}
      {statusModalData && (
        <StatusChangeModal
          rec={statusModalData.rec}
          targetStatus={statusModalData.targetStatus}
          isBangla={isBangla}
          onClose={() => setStatusModalData(null)}
          onConfirm={handleConfirmStatusChange}
        />
      )}
    </div>
  );
};
