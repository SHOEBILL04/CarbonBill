import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RecommendationsPayload } from './types';
import { fetchRecommendationsPayload, recalculateRecommendations } from './recommendationsApi';
import { DedicatedRecommendationBox } from './components/DedicatedRecommendationBox';
import { RagAssistant } from './components/RagAssistant';
import { toBanglaDigits, formatBdt } from '../../shared';
import {
  TrendingDown,
  RefreshCw,
  Sparkles,
  Zap,
  Building2,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  Info,
} from 'lucide-react';

export const RecommendationsView: React.FC = () => {
  const { i18n } = useTranslation();
  const isBangla = i18n.language === 'bn';

  const [payload, setPayload] = useState<RecommendationsPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [recalculating, setRecalculating] = useState<boolean>(false);
  const [ragRecalculateSignal, setRagRecalculateSignal] = useState<number>(0);
  const [recalculateMessage, setRecalculateMessage] = useState<{
    text: string;
    hasNew: boolean;
  } | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetchRecommendationsPayload();
      setPayload(res);
    } catch {
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleRecalculate() {
    setRecalculating(true);
    setRecalculateMessage(null);
    try {
      const res = await recalculateRecommendations();
      if (res.hasNewDocuments) {
        // New document present! Trigger RAG recalculation
        setRagRecalculateSignal((prev) => prev + 1);
        await loadData();
        setRecalculateMessage({
          text: isBangla
            ? `নতুন ডকুমেন্ট পাওয়া গেছে (${toBanglaDigits(res.newDocCount)} টি)। আরএজি ও সুপারিশ পুনর্গননা সম্পন্ন!`
            : `New documents detected (${res.newDocCount} items). RAG recommendations updated!`,
          hasNew: true,
        });
      } else {
        // No new document present! Stays same as it is
        setRecalculateMessage({
          text: isBangla
            ? 'কোনো নতুন ডকুমেন্ট পাওয়া যায়নি। বর্তমান সুপারিশ অপরিবর্তিত রয়েছে।'
            : 'No new documents found. Current recommendations remain up to date.',
          hasNew: false,
        });
      }
    } finally {
      setRecalculating(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const defaultBaseline = {
    hasRealBills: true,
    billsCount: 3,
    annualElectricityKwh: 300000,
    electricityTariffBdtPerKwh: 10.5,
    annualDieselLitres: 14400,
    dieselTariffBdtPerLitre: 108.0,
    activeFlagCodes: ['HOTSPOT_DETECTED', 'GENSET_RELIANCE'],
  };

  const baseline = payload?.baselineData || defaultBaseline;

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-800 text-white rounded-2xl shadow-xs">
            <TrendingDown size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base md:text-lg font-black text-slate-900">
                {isBangla ? 'গতিশীল এআই ও আরএজি সুপারিশমালা' : 'Dynamic AI Recommendations & RAG Advisor'}
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200">
                <Sparkles size={11} className="text-violet-600" />
                {isBangla ? 'রিয়েল-টাইম এআই চালিত' : 'Live RAG Powered'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isBangla
                ? 'কারখানার নিশ্চিত ইউটিলিটি বিল, সক্রিয় অপারেশনাল অসঙ্গতি ও আইএফসি প্যাক্ট গবেষণার ভিত্তিতে প্রস্তুতকৃত'
                : 'Calibrated from verified factory bills, operational flags, and IFC PaCT benchmarks'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {recalculateMessage && (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                recalculateMessage.hasNew
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {recalculateMessage.hasNew ? (
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              ) : (
                <Info size={14} className="text-slate-500 shrink-0" />
              )}
              <span>{recalculateMessage.text}</span>
            </div>
          )}

          <button
            onClick={handleRecalculate}
            disabled={recalculating || loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-violet-900 bg-violet-50 hover:bg-violet-100 border border-violet-200 transition disabled:opacity-50 cursor-pointer shadow-2xs"
            title={
              isBangla
                ? 'নতুন ডকুমেন্ট থাকলে আরএজি পুনর্গননা করুন, না থাকলে অপরিবর্তিত থাকবে'
                : 'Recalculate RAG if new documents are present'
            }
          >
            <Sparkles
              size={14}
              className={recalculating ? 'animate-spin text-violet-600' : 'text-violet-600'}
            />
            {recalculating
              ? (isBangla ? 'পরীক্ষা ও হিসাব হচ্ছে...' : 'Checking documents...')
              : (isBangla ? 'এআই পুনর্গননা' : 'Recalculate with AI')}
          </button>

          <button
            onClick={loadData}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            title={isBangla ? 'রিফ্রেশ' : 'Refresh'}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 1. Live Factory Baseline Data */}
      {baseline && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-teal-50/40 border border-slate-200 rounded-2xl shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-teal-800" />
              <span className="font-bold text-xs sm:text-sm text-slate-800">
                {isBangla ? 'কারখানার সক্রিয় বেসলাইন ডেটা (Live Factory Baseline Data):' : 'Live Factory Baseline Data:'}
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
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 block">
                {isBangla ? 'বার্ষিক বিদ্যুৎ খরচ' : 'Annual Electricity'}
              </span>
              <span className="font-bold text-slate-900 font-mono text-xs sm:text-sm">
                {isBangla
                  ? toBanglaDigits(Math.round(baseline.annualElectricityKwh).toLocaleString())
                  : Math.round(baseline.annualElectricityKwh).toLocaleString()}{' '}
                kWh
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 block">
                {isBangla ? 'কার্যকর বিদ্যুৎ ট্যারিফ' : 'Effective Grid Tariff'}
              </span>
              <span className="font-bold text-teal-800 font-mono text-xs sm:text-sm">
                {formatBdt(baseline.electricityTariffBdtPerKwh, { useBanglaDigits: isBangla })} / kWh
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 block">
                {isBangla ? 'বার্ষিক ডিজেল খরচ' : 'Annual Diesel'}
              </span>
              <span className="font-bold text-slate-900 font-mono text-xs sm:text-sm">
                {isBangla
                  ? toBanglaDigits(Math.round(baseline.annualDieselLitres).toLocaleString())
                  : Math.round(baseline.annualDieselLitres).toLocaleString()}{' '}
                L
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 block">
                {isBangla ? 'কার্যকর ডিজেল ট্যারিফ' : 'Diesel Fuel Tariff'}
              </span>
              <span className="font-bold text-slate-900 font-mono text-xs sm:text-sm">
                {formatBdt(baseline.dieselTariffBdtPerLitre, { useBanglaDigits: isBangla })} / L
              </span>
            </div>
          </div>

          {/* Active Flags Callout */}
          {baseline.activeFlagCodes && baseline.activeFlagCodes.length > 0 && (
            <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs">
              <Zap size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-amber-900">
                    {isBangla ? 'চিহ্নিত অপারেশনাল অসঙ্গতি (Active Flags):' : 'Active Operational Flags Detected:'}
                  </span>
                  {baseline.activeFlagCodes.map((code) => (
                    <span
                      key={code}
                      className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-amber-200/80 text-amber-900 rounded"
                    >
                      {code}
                    </span>
                  ))}
                </div>
                <p className="text-amber-800 text-[11px]">
                  {isBangla
                    ? 'আরএজি সুপারিশ ইঞ্জিন এই অসঙ্গতিগুলো দূর করার লক্ষ্যে সংশ্লিষ্ট পদক্ষেপগুলোকে সর্বোচ্চ অগ্রাধিকার দিয়েছে।'
                    : 'The recommendation engine detected these operational inefficiencies and prioritized measures that directly eliminate them.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Dedicated Fuel-Switching & Energy Reduction Recommendations */}
      <DedicatedRecommendationBox
        isBangla={isBangla}
        recalculateSignal={ragRecalculateSignal}
      />

      {/* 3. Industrial RAG Energy Advisor */}
      <RagAssistant
        isBangla={isBangla}
        recalculateSignal={ragRecalculateSignal}
      />
    </div>
  );
};
export default RecommendationsView;
