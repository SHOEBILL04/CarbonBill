import React, { useMemo, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { ensureChartRegistered } from './ChartSetup';
import { toBanglaDigits } from '../../../shared';
import { Flame, Zap, Truck, PieChart, Layers } from 'lucide-react';

ensureChartRegistered();

interface ScopeBreakdownChartProps {
  scope1?: number;
  scope2?: number;
  scope3?: number;
  isBangla: boolean;
}

export const ScopeBreakdownChart: React.FC<ScopeBreakdownChartProps> = ({
  scope1 = 0,
  scope2 = 0,
  scope3 = 0,
  isBangla,
}) => {
  const [activeScope, setActiveScope] = useState<1 | 2 | 3 | null>(null);
  const [hoveredScope, setHoveredScope] = useState<1 | 2 | 3 | null>(null);

  const effectiveScope = hoveredScope ?? activeScope;

  const s1 = Number(scope1 || 0);
  const s2 = Number(scope2 || 0);
  const s3 = Number(scope3 || 0);
  const total = s1 + s2 + s3;

  const s1Pct = total > 0 ? (s1 / total) * 100 : 0;
  const s2Pct = total > 0 ? (s2 / total) * 100 : 0;
  const s3Pct = total > 0 ? (s3 / total) * 100 : 0;

  const chartData = useMemo(() => {
    return {
      labels: [
        isBangla ? 'স্কোপ ১ (ডিজেল ও গ্যাস)' : 'Scope 1 (Fuels & Diesel)',
        isBangla ? 'স্কোপ ২ (গ্রিড বিদ্যুৎ)' : 'Scope 2 (Grid Electricity)',
        isBangla ? 'স্কোপ ৩ (পরিবহন ও লজিস্টিকস)' : 'Scope 3 (Freight & Value Chain)',
      ],
      datasets: [
        {
          data: [s1, s2, s3],
          backgroundColor: [
            effectiveScope === null || effectiveScope === 1 ? '#f97316' : '#fed7aa',
            effectiveScope === null || effectiveScope === 2 ? '#0284c7' : '#bae6fd',
            effectiveScope === null || effectiveScope === 3 ? '#8b5cf6' : '#ddd6fe',
          ],
          borderWidth: 3,
          borderColor: '#ffffff',
          hoverOffset: 16,
          hoverBorderWidth: 4,
          hoverBorderColor: '#ffffff',
          borderRadius: 8,
          spacing: 3,
        },
      ],
    };
  }, [s1, s2, s3, isBangla, effectiveScope]);

  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '74%',
      layout: {
        padding: 16,
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 900,
        easing: 'easeOutQuart' as const,
      },
      transitions: {
        active: {
          animation: {
            duration: 250,
            easing: 'easeOutQuart' as const,
          },
        },
      },
      onHover: (_evt: any, elements: any[]) => {
        if (elements && elements.length > 0) {
          setHoveredScope((elements[0].index + 1) as 1 | 2 | 3);
        } else {
          setHoveredScope(null);
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleFont: { family: 'inherit', size: 12, weight: 700 },
          bodyFont: { family: 'inherit', size: 11, weight: 500 },
          padding: 12,
          cornerRadius: 12,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          boxPadding: 4,
          callbacks: {
            title: () => '', // Prevents awkward duplicate / truncated title
            label: (context: any) => {
              const val = Number(context.parsed ?? 0);
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
              const formattedVal = isBangla ? toBanglaDigits(val.toFixed(2)) : val.toFixed(2);
              const formattedPct = isBangla ? toBanglaDigits(pct) : pct;
              return ` ${context.label}: ${formattedVal} tCO₂e (${formattedPct}%)`;
            },
          },
        },
      },
    };
  }, [total, isBangla]);

  // Center display values based on activeScope or hoveredScope selection
  const centerValue = useMemo(() => {
    if (effectiveScope === 1) return { val: s1, pct: s1Pct, label: isBangla ? 'স্কোপ ১' : 'Scope 1' };
    if (effectiveScope === 2) return { val: s2, pct: s2Pct, label: isBangla ? 'স্কোপ ২' : 'Scope 2' };
    if (effectiveScope === 3) return { val: s3, pct: s3Pct, label: isBangla ? 'স্কোপ ৩' : 'Scope 3' };
    return { val: total, pct: 100, label: isBangla ? 'সর্বমোট পদচিহ্ন' : 'Total Footprint' };
  }, [effectiveScope, s1, s2, s3, total, s1Pct, s2Pct, s3Pct, isBangla]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-gradient-to-bl from-sky-100/40 via-indigo-50/20 to-transparent pointer-events-none rounded-tr-3xl" />

      {/* Header */}
      <div className="relative flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200/60 shadow-sm">
              <PieChart size={16} />
            </span>
            <h3 className="font-bold text-slate-900 text-base md:text-lg tracking-tight">
              {isBangla ? 'স্কোপভিত্তিক নির্গমন বিভাজন' : 'Scope Breakdown Analysis'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-9">
            {isBangla
              ? 'GHG প্রোটোকল কর্পোরেট অ্যাকাউন্টিং স্ট্যান্ডার্ড অনুযায়ী'
              : 'GHG Protocol Corporate Standard classification'}
          </p>
        </div>

        {activeScope !== null && (
          <button
            onClick={() => setActiveScope(null)}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200"
          >
            {isBangla ? 'রিসেট ভিউ' : 'Reset View'}
          </button>
        )}
      </div>

      {/* Interactive Donut with Center Hub */}
      <div className="relative h-56 w-full flex items-center justify-center py-2">
        <Doughnut data={chartData} options={options} />

        {/* Center Interactive Hub with Ambient Glow Ring */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-32 h-32 rounded-full border border-slate-200/60 bg-white/90 shadow-sm backdrop-blur-xs flex flex-col items-center justify-center transition-all duration-500 transform hover:scale-105">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {centerValue.label}
            </span>
            <span className="text-3xl font-black text-slate-900 tracking-tight mt-0.5 transition-all duration-300">
              {isBangla ? toBanglaDigits(centerValue.val.toFixed(2)) : centerValue.val.toFixed(2)}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[11px] font-bold text-teal-700">tCO₂e</span>
              {activeScope !== null && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-teal-100 text-teal-800 rounded-md animate-pulse">
                  {isBangla ? toBanglaDigits(centerValue.pct.toFixed(0)) : centerValue.pct.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rich Scope Cards */}
      <div className="space-y-2 pt-1 border-t border-slate-100">
        {/* Scope 1 */}
        <div
          onClick={() => setActiveScope(activeScope === 1 ? null : 1)}
          className={`p-3 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col gap-1.5 hover:-translate-y-0.5 ${
            effectiveScope === 1
              ? 'bg-orange-50/90 border-orange-300 shadow-md ring-2 ring-orange-200 scale-101'
              : 'bg-slate-50/60 border-slate-200/70 hover:bg-slate-50 hover:border-orange-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`p-1 rounded-lg bg-orange-100 text-orange-600 transition-transform duration-300 ${effectiveScope === 1 ? 'scale-110' : ''}`}>
                <Flame size={13} />
              </span>
              <span className="font-bold text-slate-800">
                {isBangla ? 'স্কোপ ১: প্রত্যক্ষ জ্বালানি (ডিজেল ও গ্যাস)' : 'Scope 1: Direct Fuels (Diesel & Gas)'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="font-black text-slate-900">
                {isBangla ? toBanglaDigits(s1.toFixed(2)) : s1.toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-400">tCO₂e</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-800">
                {isBangla ? toBanglaDigits(s1Pct.toFixed(1)) : s1Pct.toFixed(1)}%
              </span>
            </div>
          </div>
          {/* Progress Bar with Shimmer */}
          <div className="relative w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
            <div
              style={{ width: `${s1Pct}%` }}
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700 ease-out"
            />
            {effectiveScope === 1 && (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer pointer-events-none" />
            )}
          </div>
        </div>

        {/* Scope 2 */}
        <div
          onClick={() => setActiveScope(activeScope === 2 ? null : 2)}
          className={`p-3 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col gap-1.5 hover:-translate-y-0.5 ${
            effectiveScope === 2
              ? 'bg-sky-50/90 border-sky-300 shadow-md ring-2 ring-sky-200 scale-101'
              : 'bg-slate-50/60 border-slate-200/70 hover:bg-slate-50 hover:border-sky-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`p-1 rounded-lg bg-sky-100 text-sky-600 transition-transform duration-300 ${effectiveScope === 2 ? 'scale-110' : ''}`}>
                <Zap size={13} />
              </span>
              <span className="font-bold text-slate-800">
                {isBangla ? 'স্কোপ ২: গ্রিড বিদ্যুৎ (DESCO / PHED)' : 'Scope 2: Grid Power (DESCO / PHED)'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="font-black text-slate-900">
                {isBangla ? toBanglaDigits(s2.toFixed(2)) : s2.toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-400">tCO₂e</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800">
                {isBangla ? toBanglaDigits(s2Pct.toFixed(1)) : s2Pct.toFixed(1)}%
              </span>
            </div>
          </div>
          {/* Progress Bar with Shimmer */}
          <div className="relative w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
            <div
              style={{ width: `${s2Pct}%` }}
              className="h-full bg-gradient-to-r from-sky-400 to-blue-600 rounded-full transition-all duration-700 ease-out"
            />
            {effectiveScope === 2 && (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer pointer-events-none" />
            )}
          </div>
        </div>

        {/* Scope 3 */}
        <div
          onClick={() => setActiveScope(activeScope === 3 ? null : 3)}
          className={`p-3 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col gap-1.5 hover:-translate-y-0.5 ${
            effectiveScope === 3
              ? 'bg-purple-50/90 border-purple-300 shadow-md ring-2 ring-purple-200 scale-101'
              : 'bg-slate-50/60 border-slate-200/70 hover:bg-slate-50 hover:border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`p-1 rounded-lg bg-purple-100 text-purple-600 transition-transform duration-300 ${effectiveScope === 3 ? 'scale-110' : ''}`}>
                <Truck size={13} />
              </span>
              <span className="font-bold text-slate-800">
                {isBangla ? 'স্কোপ ৩: পরিবহন ও ফ্রেইট চালান' : 'Scope 3: Freight & Transport Slips'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="font-black text-slate-900">
                {isBangla ? toBanglaDigits(s3.toFixed(2)) : s3.toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-400">tCO₂e</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800">
                {isBangla ? toBanglaDigits(s3Pct.toFixed(1)) : s3Pct.toFixed(1)}%
              </span>
            </div>
          </div>
          {/* Progress Bar with Shimmer */}
          <div className="relative w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
            <div
              style={{ width: `${s3Pct}%` }}
              className="h-full bg-gradient-to-r from-purple-400 to-indigo-600 rounded-full transition-all duration-700 ease-out"
            />
            {effectiveScope === 3 && (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer pointer-events-none" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
