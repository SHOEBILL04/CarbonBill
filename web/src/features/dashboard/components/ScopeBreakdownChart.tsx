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
        isBangla ? 'স্কোপ ৩ (পরিবহন ও লজিস্টিকস)' : 'Scope 3 (Freight & Logistics)',
      ],
      datasets: [
        {
          data: [s1, s2, s3],
          backgroundColor: [
            effectiveScope === null || effectiveScope === 1 ? '#c2410c' : '#fed7aa',
            effectiveScope === null || effectiveScope === 2 ? '#3f593f' : '#cfddcf',
            effectiveScope === null || effectiveScope === 3 ? '#78716c' : '#e7e5e4',
          ],
          borderWidth: 3,
          borderColor: '#ffffff',
          hoverOffset: 12,
          hoverBorderWidth: 3,
          hoverBorderColor: '#ffffff',
          borderRadius: 6,
          spacing: 2,
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
          backgroundColor: 'rgba(28, 25, 23, 0.95)',
          titleFont: { family: 'inherit', size: 12, weight: 700 },
          bodyFont: { family: 'inherit', size: 11, weight: 500 },
          padding: 12,
          cornerRadius: 12,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          boxPadding: 4,
          callbacks: {
            title: () => '',
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
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#e6ede6] text-[#2d3c2d]">
              <PieChart size={15} />
            </span>
            <h3 className="font-bold text-stone-900 text-sm md:text-base">
              {isBangla ? 'স্কোপভিত্তিক নির্গমন বিভাজন' : 'Scope Breakdown'}
            </h3>
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            {isBangla
              ? 'GHG প্রোটোকল কর্পোরেট স্ট্যান্ডার্ড অনুযায়ী'
              : 'GHG Protocol Corporate Standard classification'}
          </p>
        </div>

        {activeScope !== null && (
          <button
            onClick={() => setActiveScope(null)}
            className="text-[11px] font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200"
          >
            {isBangla ? 'রিসেট' : 'Reset'}
          </button>
        )}
      </div>

      {/* Donut with Center Value */}
      <div className="relative h-52 w-full flex items-center justify-center py-1">
        <Doughnut data={chartData} options={options} />

        {/* Center Hub */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-28 h-28 rounded-full border border-stone-200 bg-white/95 shadow-xs flex flex-col items-center justify-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              {centerValue.label}
            </span>
            <span className="text-2xl font-black text-stone-900 tracking-tight mt-0.5">
              {isBangla ? toBanglaDigits(centerValue.val.toFixed(2)) : centerValue.val.toFixed(2)}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] font-bold text-[#354935]">tCO₂e</span>
              {activeScope !== null && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#e6ede6] text-[#2d3c2d] rounded">
                  {isBangla ? toBanglaDigits(centerValue.pct.toFixed(0)) : centerValue.pct.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scope Breakdown Rows */}
      <div className="space-y-2 pt-1 border-t border-stone-100">
        {/* Scope 1 */}
        <div
          onClick={() => setActiveScope(activeScope === 1 ? null : 1)}
          className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${
            effectiveScope === 1
              ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-200'
              : 'bg-stone-50 border-stone-200 hover:bg-stone-100/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-amber-100 text-amber-800">
                <Flame size={12} />
              </span>
              <span className="font-bold text-stone-800">
                {isBangla ? 'স্কোপ ১: প্রত্যক্ষ জ্বালানি (ডিজেল ও গ্যাস)' : 'Scope 1: Direct Fuels (Diesel & Gas)'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="font-bold text-stone-900">
                {isBangla ? toBanglaDigits(s1.toFixed(2)) : s1.toFixed(2)}
              </span>
              <span className="text-[10px] text-stone-400">tCO₂e</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                {isBangla ? toBanglaDigits(s1Pct.toFixed(1)) : s1Pct.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div
              style={{ width: `${s1Pct}%` }}
              className="h-full bg-amber-600 rounded-full transition-all duration-500"
            />
          </div>
        </div>

        {/* Scope 2 */}
        <div
          onClick={() => setActiveScope(activeScope === 2 ? null : 2)}
          className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${
            effectiveScope === 2
              ? 'bg-[#f4f7f4] border-[#aec5ae] ring-1 ring-[#cfddcf]'
              : 'bg-stone-50 border-stone-200 hover:bg-stone-100/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-[#e6ede6] text-[#2d3c2d]">
                <Zap size={12} />
              </span>
              <span className="font-bold text-stone-800">
                {isBangla ? 'স্কোপ ২: গ্রিড বিদ্যুৎ (DESCO / PHED)' : 'Scope 2: Grid Power (DESCO)'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="font-bold text-stone-900">
                {isBangla ? toBanglaDigits(s2.toFixed(2)) : s2.toFixed(2)}
              </span>
              <span className="text-[10px] text-stone-400">tCO₂e</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#e6ede6] text-[#2d3c2d]">
                {isBangla ? toBanglaDigits(s2Pct.toFixed(1)) : s2Pct.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div
              style={{ width: `${s2Pct}%` }}
              className="h-full bg-[#425b42] rounded-full transition-all duration-500"
            />
          </div>
        </div>

        {/* Scope 3 */}
        <div
          onClick={() => setActiveScope(activeScope === 3 ? null : 3)}
          className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${
            effectiveScope === 3
              ? 'bg-stone-100 border-stone-400 ring-1 ring-stone-300'
              : 'bg-stone-50 border-stone-200 hover:bg-stone-100/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-stone-200 text-stone-700">
                <Truck size={12} />
              </span>
              <span className="font-bold text-stone-800">
                {isBangla ? 'স্কোপ ৩: পরিবহন ও ফ্রেইট' : 'Scope 3: Freight & Logistics'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="font-bold text-stone-900">
                {isBangla ? toBanglaDigits(s3.toFixed(2)) : s3.toFixed(2)}
              </span>
              <span className="text-[10px] text-stone-400">tCO₂e</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-200 text-stone-800">
                {isBangla ? toBanglaDigits(s3Pct.toFixed(1)) : s3Pct.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div
              style={{ width: `${s3Pct}%` }}
              className="h-full bg-stone-500 rounded-full transition-all duration-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
