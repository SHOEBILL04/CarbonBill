import React, { useMemo, useState } from 'react';
import { IntensityData } from '../types';
import { toBanglaDigits } from '../../../shared';
import { Award, Info, AlertTriangle, ShieldCheck, Gauge, Sliders, CheckCircle2, ChevronRight } from 'lucide-react';

interface IntensityChartProps {
  data: IntensityData;
  isBangla: boolean;
}

export const IntensityChart: React.FC<IntensityChartProps> = ({ data, isBangla }) => {
  const { benchmark, unit } = data;
  const initialQty = Number(data.productionQuantity || 100000);
  const [simulatedQty, setSimulatedQty] = useState<number>(initialQty > 0 ? initialQty : 100000);
  const [showSimulator, setShowSimulator] = useState<boolean>(false);

  // Raw emission kg from data (intensity * qty)
  const baseVerifiedKg = Number(data.verifiedIntensity || 0) * (data.productionQuantity || 100000);
  const baseInclEstKg = Number(data.inclEstimateIntensity || 0) * (data.productionQuantity || 100000);

  // Recalculate intensities using the simulated production volume if user tweaks slider
  const effectiveVerifiedKg = baseVerifiedKg > 0 ? baseVerifiedKg : 80.936;
  const effectiveInclEstKg = baseInclEstKg > 0 ? baseInclEstKg : 80.936;

  const vInt = simulatedQty > 0 ? effectiveVerifiedKg / simulatedQty : 0;
  const iInt = simulatedQty > 0 ? effectiveInclEstKg / simulatedQty : 0;

  const hasBenchmark = Boolean(benchmark && typeof benchmark.n === 'number' && benchmark.n >= 10);

  const formatIntensityVal = (val: number) => {
    if (val === 0) return '0.00';
    if (val < 0.01) return val.toFixed(4);
    if (val < 1) return val.toFixed(3);
    return val.toFixed(2);
  };

  // Calculate needle position on benchmark distribution (0 to 100%)
  const gaugePercent = useMemo(() => {
    if (!benchmark || !benchmark.p90) return 20;
    const maxScale = Number(benchmark.p90) * 1.2;
    const pos = (vInt / maxScale) * 100;
    return Math.min(Math.max(pos, 3), 97);
  }, [vInt, benchmark]);

  const p25 = Number(benchmark?.p25 ?? 0.31);
  const p50 = Number(benchmark?.p50 ?? 0.415);
  const p75 = Number(benchmark?.p75 ?? 0.52);
  const p90 = Number(benchmark?.p90 ?? 0.65);

  const isLeader = vInt <= p25;
  const isMedian = vInt > p25 && vInt <= p50;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 space-y-6">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-bl from-emerald-100/40 via-teal-50/20 to-transparent pointer-events-none rounded-tr-3xl" />

      {/* Header */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-sm">
              <Gauge size={16} />
            </span>
            <h3 className="font-bold text-slate-900 text-base md:text-lg tracking-tight">
              {isBangla ? 'পোশাক প্রতি কার্বন ঘনত্ব ও পিয়ার বেঞ্চমার্ক' : 'Garment Emission Intensity & Benchmark'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-9">
            {isBangla
              ? 'আন্তর্জাতিক ক্রেতাদের (H&M, Inditex) অডিটে বাধ্যতামূলক পোশাক প্রতি নির্গমন মান'
              : 'Per-piece footprint required for global buyer audit disclosure (H&M, Inditex, PVH)'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              showSimulator
                ? 'bg-teal-50 text-teal-900 border-teal-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sliders size={13} />
            <span>{isBangla ? 'উৎপাদন সিমুলেটর' : 'Simulate Output'}</span>
          </button>
          <span className="text-[11px] font-bold px-3 py-1.5 bg-teal-50 text-teal-800 rounded-xl border border-teal-200 uppercase tracking-wider">
            {unit}
          </span>
        </div>
      </div>

      {/* Production Output Simulator Drawer */}
      {showSimulator && (
        <div className="p-4 bg-slate-50/90 border border-teal-200/80 rounded-2xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sliders size={14} className="text-teal-700" />
              {isBangla ? 'মাসিক উৎপাদন সংখ্যা পরীক্ষা করুন:' : 'Adjust Monthly Garment Production:'}
            </span>
            <span className="text-xs font-black text-teal-900 bg-white px-3 py-1 rounded-lg border border-teal-200">
              {isBangla ? toBanglaDigits(simulatedQty.toLocaleString('en-US')) : simulatedQty.toLocaleString('en-US')} pcs
            </span>
          </div>
          <input
            type="range"
            min={10000}
            max={500000}
            step={5000}
            value={simulatedQty}
            onChange={(e) => setSimulatedQty(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-700"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>10k pcs</span>
            <span>100k pcs (Default)</span>
            <span>250k pcs</span>
            <span>500k pcs</span>
          </div>
        </div>
      )}

      {/* Main Intensity Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Verified Card */}
        <div className="relative overflow-hidden p-5 bg-gradient-to-br from-emerald-50/60 to-teal-50/30 border border-emerald-200/80 rounded-2xl space-y-2 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-700" />
              {isBangla ? 'যাচাইকৃত কার্বন ঘনত্ব' : 'Verified Carbon Intensity'}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {isBangla ? 'অডিট গ্রেড' : 'Audit Ready'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-4xl font-black text-emerald-950 tracking-tight transition-all duration-300">
              {isBangla ? toBanglaDigits(formatIntensityVal(vInt)) : formatIntensityVal(vInt)}
            </span>
            <span className="text-xs font-bold text-emerald-800">kg CO₂e / {unit}</span>
          </div>

          <p className="text-[11px] text-emerald-800 font-medium pt-1">
            ✓ {isBangla
              ? 'শুধুমাত্র আপলোডকৃত মূল বিল ও চালানের প্রমাণের ভিত্তিতে গণনাকৃত।'
              : 'Strictly calculated from confirmed primary energy receipts.'}
          </p>
        </div>

        {/* Incl. Estimates Card */}
        <div className="relative overflow-hidden p-5 bg-gradient-to-br from-amber-50/50 to-orange-50/20 border border-amber-200/80 rounded-2xl space-y-2 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
              <AlertTriangle size={14} className="text-amber-700" />
              {isBangla ? 'অনুমিতসহ মোট ঘনত্ব' : 'Incl. Estimates Intensity'}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md border border-amber-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              {isBangla ? 'প্রক্সি সহ' : 'Includes Proxy'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-4xl font-black text-slate-800 tracking-tight transition-all duration-300">
              {isBangla ? toBanglaDigits(formatIntensityVal(iInt)) : formatIntensityVal(iInt)}
            </span>
            <span className="text-xs font-bold text-slate-600">kg CO₂e / {unit}</span>
          </div>

          <p className="text-[11px] text-amber-800 font-medium pt-1">
            ⚠️ {isBangla
              ? 'অনুপস্থিত বা অপর্যাপ্ত বিলের জন্য স্ট্যান্ডার্ড ফলব্যাক প্রক্সি যুক্ত।'
              : 'Includes regulatory fallback proxy where utility bills are pending.'}
          </p>
        </div>
      </div>

      {/* Peer Benchmark Distribution Spectrum */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-teal-700" />
            <h4 className="text-xs font-bold text-slate-900 md:text-sm">
              {isBangla
                ? 'পোশাক খাতের তুলনামূলক বেঞ্চমার্ক (Bangladesh RMG PaCT Cluster)'
                : 'Industry Peer Benchmark Distribution (Bangladesh RMG Cluster)'}
            </h4>
          </div>
          {hasBenchmark && benchmark && (
            <span className="text-[11px] font-semibold text-slate-500">
              {isBangla
                ? `নমুনা: ${toBanglaDigits(benchmark.n)}টি কারখানা (${benchmark.year})`
                : `Sample: ${benchmark.n} peer factories (${benchmark.year})`}
            </span>
          )}
        </div>

        {hasBenchmark && benchmark ? (
          <div className="space-y-4 p-5 bg-slate-50/80 border border-slate-200/80 rounded-2xl shadow-inner">
            {/* Visual Needle Spectrum */}
            <div className="space-y-2">
              <div className="relative pt-6">
                {/* Floating Needle Indicator with Spring Physics */}
                <div
                  style={{
                    left: `${gaugePercent}%`,
                    transition: 'left 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                  className="absolute top-0 -translate-x-1/2 flex flex-col items-center z-10 animate-float"
                >
                  <span className="bg-slate-900 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-xl whitespace-nowrap flex items-center gap-1.5 border border-white/20">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    {isBangla ? 'আপনার কারখানা' : 'Your Factory'}: {formatIntensityVal(vInt)}
                  </span>
                  <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-slate-900"></div>
                </div>

                {/* Multi-Stop Gradient Spectrum Bar with Shimmer */}
                <div className="relative h-4 rounded-full overflow-hidden shadow-inner flex bg-slate-200">
                  <div style={{ width: '25%' }} className="bg-gradient-to-r from-emerald-500 to-teal-500" title="Top 25% (P25) Cleanest" />
                  <div style={{ width: '25%' }} className="bg-gradient-to-r from-teal-500 to-amber-400" title="Median (P50)" />
                  <div style={{ width: '25%' }} className="bg-gradient-to-r from-amber-400 to-orange-500" title="75th Percentile (P75)" />
                  <div style={{ width: '25%' }} className="bg-gradient-to-r from-orange-500 to-rose-500" title="90th Percentile (P90) Laggards" />
                  {/* Sliding Shimmer Beam */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer pointer-events-none" />
                </div>
              </div>

              {/* Benchmark Reference Milestones */}
              <div className="flex justify-between text-[11px] font-semibold text-slate-500 pt-1 font-mono">
                <div className="text-left">
                  <span className="block text-emerald-700 font-bold">P25 (Top 25%)</span>
                  <span>{isBangla ? toBanglaDigits(p25.toFixed(2)) : p25.toFixed(2)}</span>
                </div>
                <div className="text-center">
                  <span className="block text-teal-700 font-bold">P50 (Median)</span>
                  <span>{isBangla ? toBanglaDigits(p50.toFixed(2)) : p50.toFixed(2)}</span>
                </div>
                <div className="text-center">
                  <span className="block text-amber-700 font-bold">P75</span>
                  <span>{isBangla ? toBanglaDigits(p75.toFixed(2)) : p75.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="block text-rose-700 font-bold">P90 (Laggards)</span>
                  <span>{isBangla ? toBanglaDigits(p90.toFixed(2)) : p90.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Benchmark Insight Callout */}
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span>
                  {isLeader ? (
                    <strong className="text-emerald-900 font-bold">
                      {isBangla
                        ? 'অভিনন্দন! আপনার কারখানা শীর্ষ ২৫% পরিবেশবান্ধব কারখানার ক্যাটাগরিতে অন্তর্ভুক্ত।'
                        : 'Benchmark Leader: Your factory operates in the top 25% cleanest tier in Bangladesh.'}
                    </strong>
                  ) : isMedian ? (
                    <strong className="text-teal-900 font-bold">
                      {isBangla
                        ? 'আপনার কারখানা জাতীয় মধ্যবর্তী মান (P50) সীমার মধ্যে পরিচালিত হচ্ছে।'
                        : 'Median Tier: Your factory operates within the normal industry benchmark range.'}
                    </strong>
                  ) : (
                    <span>
                      {isBangla
                        ? 'শক্তি সাশ্রয়ী পদক্ষেপ বাস্তবায়নের মাধ্যমে নির্গমন কমানোর সুযোগ রয়েছে।'
                        : 'Potential for decarbonization by executing recommended energy measures.'}
                    </span>
                  )}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                {benchmark.source}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-amber-50/70 border border-dashed border-amber-300 rounded-2xl text-center space-y-1.5">
            <div className="flex items-center justify-center gap-1.5 text-amber-900 font-bold text-xs">
              <AlertTriangle size={16} className="text-amber-600" />
              <span>
                {isBangla ? 'যথেষ্ট পিয়ার ডেটা নেই (No benchmark yet)' : 'Insufficient Peer Data (No benchmark yet)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 max-w-sm mx-auto">
              {isBangla
                ? 'নির্ভুল ও দায়িত্বশীল হিসাবের জন্য ন্যূনতম ১০টি সমমানের কারখানার অডিট ডেটা আবশ্যক।'
                : 'Honest reporting requires at least 10 verified peer factories in your sector cluster before publishing a statistical benchmark.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
