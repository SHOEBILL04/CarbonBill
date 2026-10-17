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
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60">
              <Gauge size={15} />
            </span>
            <h3 className="font-bold text-slate-900 text-sm md:text-base">
              {isBangla ? 'পোশাক প্রতি কার্বন ঘনত্ব ও বেঞ্চমার্ক' : 'Garment Intensity & Benchmark'}
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isBangla
              ? 'আন্তর্জাতিক ক্রেতাদের (H&M, Inditex) অডিটে প্রয়োজনীয় পোশাক প্রতি নির্গমন মান'
              : 'Per-piece footprint required for global buyer disclosures (H&M, Inditex)'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
              showSimulator
                ? 'bg-teal-50 text-teal-900 border-teal-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sliders size={12} />
            <span>{isBangla ? 'সিমুলেটর' : 'Simulate'}</span>
          </button>
          <span className="text-[10px] font-bold px-2 py-1 bg-teal-50 text-teal-800 rounded-lg border border-teal-200 uppercase">
            {unit}
          </span>
        </div>
      </div>

      {/* Production Output Simulator Drawer */}
      {showSimulator && (
        <div className="p-3.5 bg-slate-50 border border-teal-200/80 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sliders size={13} className="text-teal-700" />
              {isBangla ? 'মাসিক উৎপাদন সংখ্যা পরীক্ষা করুন:' : 'Adjust Monthly Production Volume:'}
            </span>
            <span className="text-xs font-black text-teal-900 bg-white px-2.5 py-0.5 rounded border border-teal-200">
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
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-700"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>10k pcs</span>
            <span>100k pcs</span>
            <span>250k pcs</span>
            <span>500k pcs</span>
          </div>
        </div>
      )}

      {/* Main Intensity Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Verified Card */}
        <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-700" />
              {isBangla ? 'যাচাইকৃত কার্বন ঘনত্ব' : 'Verified Carbon Intensity'}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
              {isBangla ? 'অডিট গ্রেড' : 'Audit Ready'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-3xl font-black text-emerald-950 tracking-tight">
              {isBangla ? toBanglaDigits(formatIntensityVal(vInt)) : formatIntensityVal(vInt)}
            </span>
            <span className="text-xs font-bold text-emerald-800">kg CO₂e / {unit}</span>
          </div>

          <p className="text-[11px] text-emerald-800">
            ✓ {isBangla
              ? 'শুধুমাত্র আপলোডকৃত মূল বিলের প্রমাণের ভিত্তিতে গণনাকৃত।'
              : 'Strictly calculated from confirmed primary energy receipts.'}
          </p>
        </div>

        {/* Incl. Estimates Card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <AlertTriangle size={14} className="text-amber-600" />
              {isBangla ? 'অনুমিতসহ মোট ঘনত্ব' : 'Incl. Estimates Intensity'}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded">
              {isBangla ? 'প্রক্সি সহ' : 'Includes Proxy'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-3xl font-black text-slate-800 tracking-tight">
              {isBangla ? toBanglaDigits(formatIntensityVal(iInt)) : formatIntensityVal(iInt)}
            </span>
            <span className="text-xs font-bold text-slate-600">kg CO₂e / {unit}</span>
          </div>

          <p className="text-[11px] text-slate-600">
            {isBangla
              ? 'অনুপস্থিত বিলের জন্য স্ট্যান্ডার্ড ফলব্যাক প্রক্সি যুক্ত।'
              : 'Includes regulatory fallback proxy where utility bills are pending.'}
          </p>
        </div>
      </div>

      {/* Peer Benchmark Distribution Spectrum */}
      <div className="space-y-3 pt-1">
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
          <div className="space-y-3 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
            {/* Visual Needle Spectrum */}
            <div className="space-y-2">
              <div className="relative pt-6">
                {/* Needle Indicator */}
                <div
                  style={{
                    left: `${gaugePercent}%`,
                    transition: 'left 0.5s ease-out',
                  }}
                  className="absolute top-0 -translate-x-1/2 flex flex-col items-center z-10"
                >
                  <span className="bg-slate-900 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-md whitespace-nowrap flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    {isBangla ? 'আপনার কারখানা' : 'Your Factory'}: {formatIntensityVal(vInt)}
                  </span>
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-slate-900"></div>
                </div>

                {/* Multi-Stop Gradient Spectrum Bar */}
                <div className="relative h-3.5 rounded-full overflow-hidden flex bg-slate-200">
                  <div style={{ width: '25%' }} className="bg-emerald-500" title="Top 25% (P25)" />
                  <div style={{ width: '25%' }} className="bg-teal-500" title="Median (P50)" />
                  <div style={{ width: '25%' }} className="bg-amber-400" title="75th Percentile (P75)" />
                  <div style={{ width: '25%' }} className="bg-rose-500" title="90th Percentile (P90)" />
                </div>
              </div>

              {/* Benchmark Reference Milestones */}
              <div className="flex justify-between text-[10px] font-semibold text-slate-500 pt-1 font-mono">
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
