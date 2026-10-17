import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  Truck,
  Flame,
  Fuel,
  Sun,
  Banknote,
  DollarSign,
  Clock,
  Leaf,
  Layers,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { DedicatedBreakdownResponse, CategoryAdviceDto } from '../types';
import { fetchDedicatedRagBreakdown, DEFAULT_CALIBRATED_BREAKDOWN } from '../recommendationsApi';

interface DedicatedRecommendationBoxProps {
  isBangla: boolean;
  recalculateSignal?: number;
}

export const DedicatedRecommendationBox: React.FC<DedicatedRecommendationBoxProps> = ({
  isBangla,
  recalculateSignal,
}) => {
  const [data, setData] = useState<DedicatedBreakdownResponse>(DEFAULT_CALIBRATED_BREAKDOWN);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('all');

  function loadBreakdown() {
    fetchDedicatedRagBreakdown()
      .then((res) => {
        if (res && res.categories && res.categories.length > 0) setData(res);
      })
      .catch(() => {
        setData(DEFAULT_CALIBRATED_BREAKDOWN);
      });
  }

  useEffect(() => {
    loadBreakdown();
  }, []);

  useEffect(() => {
    if (recalculateSignal && recalculateSignal > 0) {
      loadBreakdown();
    }
  }, [recalculateSignal]);

  const categoryIcons: Record<string, React.ReactNode> = {
    electricity: <Sun size={18} className="text-amber-500" />,
    transport: <Truck size={18} className="text-blue-500" />,
    diesel: <Fuel size={18} className="text-orange-500" />,
    gas: <Flame size={18} className="text-rose-500" />,
  };

  const categoryBadges: Record<string, { bg: string; text: string; border: string }> = {
    electricity: { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200' },
    transport: { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200' },
    diesel: { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-200' },
    gas: { bg: 'bg-rose-50', text: 'text-rose-900', border: 'border-rose-200' },
  };

  const displayedCategories =
    activeTab === 'all'
      ? data?.categories ?? []
      : (data?.categories ?? []).filter((c) => c.key === activeTab);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden space-y-4 p-5 md:p-6">
      {/* Box Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-teal-700 to-emerald-600 text-white rounded-xl shadow-xs">
            <Sparkles size={22} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>
                {isBangla
                  ? 'জ্বালানি রূপান্তর ও ব্যবহারের সুনির্দিষ্ট সুপারিশমালা'
                  : 'Dedicated Fuel-Switching & Energy Reduction Recommendations'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isBangla
                ? 'কারখানার সার্বিক জ্বালানি এবং বিদ্যুৎ, পরিবহন, ডিজেল ও গ্যাস খাতের পৃথক সাশ্রয় ও CO2 হ্রাস'
                : 'Actionable switch & reduction roadmap covering overall operations, electricity, transport, diesel, and gas'}
            </p>
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'all', bn: 'সকল খাত', en: 'All Categories' },
            { id: 'electricity', bn: '⚡ বিদ্যুৎ ও সোলার', en: '⚡ Electricity' },
            { id: 'transport', bn: '🚚 পরিবহন', en: '🚚 Transport' },
            { id: 'diesel', bn: '⛽ ডিজেল', en: '⛽ Diesel' },
            { id: 'gas', bn: '🔥 গ্যাস ও বয়লার', en: '🔥 Gas & Boiler' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-teal-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isBangla ? tab.bn : tab.en}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs font-semibold text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw size={16} className="animate-spin text-teal-700" />
          <span>{isBangla ? 'সুপারিশ লোড হচ্ছে...' : 'Loading recommendations...'}</span>
        </div>
      ) : (
        <>
          {/* Overall Strategy Callout */}
          {data && (
            <div className="p-4 bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 text-white rounded-xl space-y-2 shadow-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-teal-400" />
                  <span className="font-black text-xs sm:text-sm text-teal-200 uppercase tracking-wide">
                    {isBangla ? 'সার্বিক কারখানা কৌশল (Overall Factory Strategy)' : 'Overall Factory Decarbonization Strategy'}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  {isBangla ? 'সব খাতের সমন্বিত হিসাব' : 'Cross-Category Integrated'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-sans">
                {isBangla ? data.overallStrategyBn : data.overallStrategyEn}
              </p>
            </div>
          )}

          {/* Individual Category Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {displayedCategories.map((cat: CategoryAdviceDto) => {
              const badge = categoryBadges[cat.key] || {
                bg: 'bg-slate-50',
                text: 'text-slate-800',
                border: 'border-slate-200',
              };
              const icon = categoryIcons[cat.key] || <Zap size={18} />;

              return (
                <div
                  key={cat.key}
                  className="bg-white border border-slate-200/90 rounded-xl p-4 space-y-3.5 shadow-2xs hover:shadow-sm transition"
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-100">{icon}</div>
                      <h4 className="font-black text-slate-900 text-sm">
                        {isBangla ? cat.titleBn : cat.titleEn}
                      </h4>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      {cat.key.toUpperCase()}
                    </span>
                  </div>

                  {/* Recommended Action / Fuel Switch */}
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      {isBangla ? 'প্রস্তাবিত পদক্ষেপ ও রূপান্তর:' : 'Recommended Action / Switch:'}
                    </span>
                    <p className="text-xs font-bold text-slate-900 leading-snug">
                      {isBangla ? cat.switchActionBn : cat.switchActionEn}
                    </p>
                  </div>

                  {/* Dual Metrics Grid: Financial & CO2 */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-0.5">
                      <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                        <Banknote size={12} className="text-emerald-700" />
                        {isBangla ? 'বার্ষিক সাশ্রয়:' : 'Annual Savings:'}
                      </span>
                      <p className="font-black text-emerald-950 font-mono text-xs">
                        {cat.savingsBdt}
                      </p>
                    </div>

                    <div className="p-2.5 bg-sky-50/70 border border-sky-200 rounded-lg space-y-0.5">
                      <span className="text-[10px] font-bold text-sky-800 flex items-center gap-1">
                        <Leaf size={12} className="text-sky-700" />
                        {isBangla ? 'কার্বন হ্রাস:' : 'CO₂ Avoided:'}
                      </span>
                      <p className="font-black text-sky-950 font-mono text-xs">
                        {cat.co2Avoided}
                      </p>
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                        <DollarSign size={12} className="text-slate-500" />
                        {isBangla ? 'প্রাক্কলিত Capex:' : 'Capex Range:'}
                      </span>
                      <p className="font-bold text-slate-900 font-mono text-[11px]">
                        {cat.capexBdt}
                      </p>
                    </div>

                    <div className="p-2.5 bg-teal-50/70 border border-teal-200 rounded-lg space-y-0.5">
                      <span className="text-[10px] font-bold text-teal-800 flex items-center gap-1">
                        <Clock size={12} className="text-teal-700" />
                        {isBangla ? 'পে-ব্যাক:' : 'Payback:'}
                      </span>
                      <p className="font-black text-teal-950 font-mono text-xs">
                        {cat.payback}
                      </p>
                    </div>
                  </div>

                  {/* Concrete Steps */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      {isBangla ? 'বাস্তবায়নের মূল ধাপসমূহ:' : 'Implementation Steps:'}
                    </span>
                    <div className="text-[11px] text-slate-700 whitespace-pre-line bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/80 leading-relaxed font-sans">
                      {isBangla ? cat.keyStepsBn : cat.keyStepsEn}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
