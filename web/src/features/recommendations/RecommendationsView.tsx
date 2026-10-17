import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Recommendation, RecommendationStatus, RecommendationsPayload } from './types';
import { fetchRecommendationsPayload, recalculateRecommendations, updateRecommendationStatus } from './recommendationsApi';
import { RecommendationCard } from './components/RecommendationCard';
import { MaccChart } from './components/MaccChart';
import { StatusChangeModal } from './components/StatusChangeModal';
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
  RotateCcw,
} from 'lucide-react';

export function matchCategory(itemCategory: string, filterId: string): boolean {
  if (!filterId || filterId === 'all') return true;
  const cat = (itemCategory || '').toLowerCase();
  const filter = filterId.toLowerCase();

  if (filter === 'electricity') {
    return (
      cat.includes('elec') ||
      cat.includes('light') ||
      cat.includes('motor') ||
      cat.includes('powerfactor')
    );
  }
  if (filter === 'boiler') {
    return cat.includes('boil') || cat.includes('steam') || cat.includes('thermal');
  }
  if (filter === 'air') {
    return cat.includes('air') || cat.includes('compress');
  }
  if (filter === 'solar') {
    return cat.includes('solar') || cat.includes('renew');
  }
  return cat === filter;
}

export const RecommendationsView: React.FC = () => {
  const { i18n } = useTranslation();
  const isBangla = i18n.language === 'bn';

  const [payload, setPayload] = useState<RecommendationsPayload | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [recalculating, setRecalculating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'cards' | 'macc'>('cards');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

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
    } finally {
      setRecalculating(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const list = Array.isArray(recommendations) ? recommendations : [];
    if (categoryFilter === 'all') return list;
    return list.filter((r) => matchCategory(r.category, categoryFilter));
  }, [recommendations, categoryFilter]);

  const categoryCounts = useMemo(() => {
    const list = Array.isArray(recommendations) ? recommendations : [];
    const counts: Record<string, number> = {
      all: list.length,
      electricity: 0,
      boiler: 0,
      air: 0,
      solar: 0,
    };
    list.forEach((r) => {
      if (matchCategory(r.category, 'electricity')) counts.electricity++;
      if (matchCategory(r.category, 'boiler')) counts.boiler++;
      if (matchCategory(r.category, 'air')) counts.air++;
      if (matchCategory(r.category, 'solar')) counts.solar++;
    });
    return counts;
  }, [recommendations]);

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

  const handleSelectCardFromMacc = (id: string) => {
    setActiveTab('cards');
    setHighlightedId(id);
    setTimeout(() => {
      const el = document.getElementById(`card-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const baseline = payload?.baselineData;

  const categoryPills = [
    { id: 'all', bn: 'সকল বিভাগ', en: 'All Categories' },
    { id: 'electricity', bn: 'বিদ্যুৎ ও মোটর', en: 'Electricity & Motors' },
    { id: 'boiler', bn: 'বয়লার ও বাষ্প', en: 'Boiler & Steam' },
    { id: 'air', bn: 'কম্প্রেসড এয়ার', en: 'Compressed Air' },
    { id: 'solar', bn: 'সৌর বিদ্যুৎ (Solar)', en: 'Rooftop Solar' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-white rounded-2xl shadow-xs">
              <TrendingDown size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-black text-slate-900">
                  {isBangla ? 'গতিশীল এআই ও প্রমাণভিত্তিক সুপারিশমালা' : 'Dynamic AI & Evidence-Based Recommendations'}
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Sparkles size={11} className="text-emerald-600" />
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
              type="button"
              onClick={handleRecalculate}
              disabled={recalculating || loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition disabled:opacity-50 cursor-pointer"
              title={isBangla ? 'সর্বশেষ বিল ও ফ্ল্যাগ অনুযায়ী পুনরায় হিসাব করুন' : 'Recalculate with latest bills and flags'}
            >
              <Sparkles size={13} className={recalculating ? 'animate-spin text-emerald-600' : 'text-emerald-600'} />
              {recalculating
                ? (isBangla ? 'হিসাব হচ্ছে...' : 'Recalculating...')
                : (isBangla ? 'এআই পুনর্গননা' : 'Recalculate with AI')}
            </button>

            {/* View Switcher: Action Cards vs MACC Curve */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('cards')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'cards'
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{isBangla ? 'পদক্ষেপ কার্ডসমূহ' : 'Action Cards'}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'cards' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {isBangla ? toBanglaDigits(filtered.length) : filtered.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('macc')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'macc'
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart2 size={13} />
                <span>{isBangla ? 'MACC চার্ট' : 'MACC Curve'}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'macc' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {isBangla ? toBanglaDigits(filtered.length) : filtered.length}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={loadData}
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
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
                    {Array.from(new Set(baseline.activeFlagCodes)).map((code) => (
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
          <div className="p-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-sm border border-indigo-900/60 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-violet-500/20 text-violet-300 rounded-lg">
                  <Sparkles size={16} />
                </div>
                <h3 className="text-sm font-bold text-violet-100">
                  {isBangla ? 'এআই ডিকার্বনাইজেশন নির্বাহী বিশ্লেষণ' : 'AI Executive Decarbonization Brief'}
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-violet-200 bg-violet-900/40 border border-violet-700/50 px-2.5 py-0.5 rounded-full">
                {isBangla ? 'কারখানার ডেটা চালিত এআই' : 'Factory Data-Driven AI'}
              </span>
            </div>
            <div className="space-y-1.5 font-sans">
              {payload.executiveBrief.split('\n').map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) {
                  return <div key={idx} className="h-1" />;
                }

                const isHeader = trimmed.startsWith('⚡') || trimmed.startsWith('⚠️') || trimmed.startsWith('💰') || trimmed.startsWith('#');
                const isBullet = trimmed.startsWith('•');

                const parts = line.split(/(\*\*.*?\*\*)/g);
                const renderedParts = parts.map((part, pIdx) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                      <strong key={pIdx} className="font-extrabold text-white">
                        {part.slice(2, -2)}
                      </strong>
                    );
                  }
                  return part;
                });

                if (isHeader) {
                  return (
                    <div key={idx} className="font-bold text-violet-200 text-xs pt-1.5 flex items-center gap-1.5">
                      {renderedParts}
                    </div>
                  );
                }

                if (isBullet) {
                  return (
                    <div key={idx} className="pl-3 text-slate-200 text-xs leading-relaxed flex items-start gap-1.5">
                      <span>{renderedParts}</span>
                    </div>
                  );
                }

                return (
                  <div key={idx} className="text-xs text-slate-300 leading-relaxed">
                    {renderedParts}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Honesty & Range Rules Notice */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 flex items-start gap-2.5">
          <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">
              {isBangla
                ? 'দায়িত্বশীল হিসাব ও পরিসীমা নীতি (Honest Ranges Protocol):'
                : 'Scientific Range Protocol:'}
            </span>
            <p className="text-slate-500 mt-0.5 text-[11px]">
              {isBangla
                ? 'কার্বনবিলে কখনো অনুমাননির্ভর একক সংখ্যা দেওয়া হয় না। সাশ্রয়, পে-ব্যাক ও বিনিয়োগ সর্বদা ন্যূনতম, গড় ও সর্বোচ্চ পরিসীমায় (Low/Typical/High) প্রদর্শিত হয়।'
                : 'Under CarbonBill engineering standards, financial savings and payback are always presented as calibrated ranges (Low, Typical, High), never deceptive single-point estimates.'}
            </p>
          </div>
        </div>

        {/* Category Filter Pills with Live Item Counts */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {categoryPills.map((cat) => {
            const count = categoryCounts[cat.id] ?? 0;
            const isSelected = categoryFilter === cat.id;
            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{isBangla ? cat.bn : cat.en}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? 'bg-slate-800 text-white'
                      : count > 0
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isBangla ? toBanglaDigits(count) : count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main View Body */}
      {loading ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center text-slate-500 text-xs font-semibold shadow-xs">
          <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-emerald-600" />
          {isBangla ? 'সুপারিশমালা প্রস্তুত হচ্ছে...' : 'Loading recommendations...'}
        </div>
      ) : activeTab === 'macc' ? (
        <MaccChart
          recommendations={filtered}
          isBangla={isBangla}
          onSelectCard={handleSelectCardFromMacc}
          onResetFilter={() => setCategoryFilter('all')}
        />
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-xs">
          <p className="text-slate-500 text-xs font-semibold">
            {isBangla ? 'এই ক্যাটাগরিতে কোনো সুপারিশ পাওয়া যায়নি।' : 'No recommendations found for this category.'}
          </p>
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition cursor-pointer"
          >
            <RotateCcw size={13} />
            {isBangla ? 'সকল সুপারিশ দেখুন' : 'Show All Recommendations'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((rec) => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              isBangla={isBangla}
              onUpdateStatus={handleInitiateStatusChange}
              isHighlighted={highlightedId === rec.id}
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
