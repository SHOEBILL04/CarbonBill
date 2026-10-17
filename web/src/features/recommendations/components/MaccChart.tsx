import React, { useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Recommendation, EvidenceGrade } from '../types';
import { ensureChartRegistered } from '../../dashboard/components/ChartSetup';
import { toBanglaDigits, formatBdt } from '../../../shared';
import {
  TrendingDown,
  BarChart2,
  Sparkles,
  Zap,
  ArrowRight,
  Award,
  Banknote,
  DollarSign,
  Clock,
  Leaf,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

ensureChartRegistered();

function cleanTitle(str: string): string {
  if (!str) return '';
  return str
    .replace(/FAKE/gi, '')
    .replace(/\(Unit Tests Only\)/gi, '')
    .replace(/টেস্ট/gi, '')
    .trim();
}

interface MaccChartProps {
  recommendations: Recommendation[];
  isBangla: boolean;
  onSelectCard?: (id: string) => void;
  onResetFilter?: () => void;
}

export const MaccChart: React.FC<MaccChartProps> = ({
  recommendations,
  isBangla,
  onSelectCard,
  onResetFilter,
}) => {
  // Sort measures by costPerTco2e ascending (lowest cost / most negative first)
  const sorted = useMemo(() => {
    const list = Array.isArray(recommendations) ? recommendations : [];
    return [...list].sort((a, b) => Number(a.costPerTco2e || 0) - Number(b.costPerTco2e || 0));
  }, [recommendations]);

  const [selectedMeasureId, setSelectedMeasureId] = useState<string | null>(
    sorted[0]?.id || null
  );

  // If selectedMeasureId is no longer in sorted (due to category filter change), update it
  React.useEffect(() => {
    if (sorted.length > 0 && (!selectedMeasureId || !sorted.some((r) => r.id === selectedMeasureId))) {
      setSelectedMeasureId(sorted[0].id);
    }
  }, [sorted, selectedMeasureId]);

  const selectedMeasure = useMemo(() => {
    return sorted.find((r) => r.id === selectedMeasureId) || sorted[0] || null;
  }, [sorted, selectedMeasureId]);

  const chartData = useMemo(() => {
    const labels = sorted.map((r) => {
      const raw = isBangla
        ? (r.titleBn || r.titleEn || 'পদক্ষেপ')
        : (r.titleEn || r.titleBn || 'Measure');
      const title = cleanTitle(raw);
      const clean = (title.includes(' (') ? title.split(' (')[0] : title).trim();
      return clean.length > 22 ? clean.slice(0, 21) + '...' : clean;
    });

    const costs = sorted.map((r) => Number(r.costPerTco2e || 0));

    const backgroundColors = sorted.map((r) => {
      const isSelected = r.id === selectedMeasureId;
      const isProfit = Number(r.costPerTco2e || 0) < 0;
      if (isProfit) {
        return isSelected ? '#047857' : '#10b981'; // Emerald 700 vs 500
      }
      return isSelected ? '#0284c7' : '#38bdf8'; // Sky 600 vs 400
    });

    const borderColors = sorted.map((r) => {
      const isSelected = r.id === selectedMeasureId;
      return isSelected ? '#0f172a' : 'transparent';
    });

    const borderWidths = sorted.map((r) => (r.id === selectedMeasureId ? 2 : 0));

    return {
      labels,
      datasets: [
        {
          label: isBangla ? 'কার্বন হ্রাসে খরচ (BDT / tCO₂e)' : 'Abatement Cost (BDT / tCO₂e)',
          data: costs,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: borderWidths,
          borderRadius: 8,
        },
      ],
    };
  }, [sorted, selectedMeasureId, isBangla]);

  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      onClick: (_event: any, elements: any[]) => {
        if (elements && elements.length > 0) {
          const index = elements[0].index;
          if (sorted[index]) {
            setSelectedMeasureId(sorted[index].id);
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items: any[]) => {
              if (!items || items.length === 0) return '';
              const idx = items[0].dataIndex;
              const rec = sorted[idx];
              if (!rec) return '';
              return isBangla ? (rec.titleBn || rec.titleEn) : (rec.titleEn || rec.titleBn);
            },
            label: (context: any) => {
              const val = Number(context.parsed.y || 0);
              const formatted = formatBdt(Math.abs(val), { useBanglaDigits: isBangla });
              const label =
                val < 0
                  ? isBangla
                    ? `সাশ্রয়ী মুনাফা: ${formatted} / tCO₂e (Net Profit)`
                    : `Net Savings: ${formatted} / tCO₂e (Profitable)`
                  : isBangla
                  ? `নিট খরচ: ${formatted} / tCO₂e`
                  : `Net Cost: ${formatted} / tCO₂e`;
              return ` ${label}`;
            },
            afterLabel: () => {
              return isBangla ? '👉 ক্লিক করে বিস্তারিত দেখুন' : '👉 Click bar to inspect details';
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: 'inherit', size: 10, weight: 600 } },
        },
        y: {
          grid: { color: '#e2e8f0' },
          ticks: {
            callback: (val: any) => (isBangla ? toBanglaDigits(val) : val),
            font: { family: 'inherit', size: 10 },
          },
          title: {
            display: true,
            text: isBangla ? 'খরচ (+) বা সাশ্রয় (-) [BDT / tCO₂e]' : 'Cost (+) or Profit (-) [BDT / tCO₂e]',
            font: { size: 11, weight: 600 },
          },
        },
      },
    };
  }, [sorted, isBangla]);

  // Safe Grade labels
  const gradeLabel: Record<string, { labelBn: string; labelEn: string; bg: string; text: string }> = {
    A: {
      labelBn: 'গ্রেড A (বাস্তব কারখানার ডেটা)',
      labelEn: 'Grade A (Empirical Factory Data)',
      bg: 'bg-emerald-100 border-emerald-300',
      text: 'text-emerald-900',
    },
    B: {
      labelBn: 'গ্রেড B (জাতীয় নির্দেশিকা)',
      labelEn: 'Grade B (National Sector Guide)',
      bg: 'bg-sky-100 border-sky-300',
      text: 'text-sky-900',
    },
    C: {
      labelBn: 'গ্রেড C (আন্তর্জাতিক মডেল)',
      labelEn: 'Grade C (International Model)',
      bg: 'bg-slate-100 border-slate-300',
      text: 'text-slate-700',
    },
  };

  if (sorted.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-4 shadow-xs">
        <div className="p-3 bg-slate-100 text-slate-500 rounded-full w-fit mx-auto">
          <BarChart2 size={24} />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-slate-800 text-sm">
            {isBangla ? 'এই ক্যাটাগরিতে কোনো মার্জিনাল কার্ভ ডেটা নেই' : 'No MACC data found for this category'}
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isBangla
              ? 'এই বিভাগের জন্য কোনো সুপারিশ পাওয়া যায়নি। কারখানার সমস্ত পদক্ষেপ দেখতে ফিল্টার রিসেট করুন।'
              : 'No energy-saving recommendations match this category. Reset the filter to view all factory initiatives.'}
          </p>
        </div>
        {onResetFilter && (
          <button
            onClick={onResetFilter}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition"
          >
            <RotateCcw size={13} />
            {isBangla ? 'সকল ক্যাটাগরি দেখুন' : 'Show All Categories'}
          </button>
        )}
      </div>
    );
  }

  const currentGrade =
    gradeLabel[selectedMeasure?.evidenceGrade || 'B'] || gradeLabel['B'];

  return (
    <div className="space-y-5">
      {/* MACC Curve Canvas Container */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="border-b pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm md:text-base">
                {isBangla
                  ? 'মার্জিনাল অ্যাবেটমেন্ট কস্ট কার্ভ (MACC Curve)'
                  : 'Marginal Abatement Cost Curve (MACC)'}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                {isBangla ? `${toBanglaDigits(sorted.length)} টি পদক্ষেপ` : `${sorted.length} Measures`}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isBangla
                ? 'শূন্য রেখার নিচের সবুজ বারগুলো কারখানায় সরাসরি টাকা সাশ্রয়কারী পদক্ষেপ (Net Financial Profit)'
                : 'Bars below the zero line represent net negative cost interventions that generate immediate cash returns'}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold flex-wrap">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-3 h-3 bg-emerald-500 rounded-sm"></span>
              {isBangla ? 'মুনাফাজনক সাশ্রয় (< 0 BDT)' : 'Net Positive ROI (< 0)'}
            </span>
            <span className="flex items-center gap-1.5 text-sky-700">
              <span className="w-3 h-3 bg-sky-500 rounded-sm"></span>
              {isBangla ? 'মূলধনী বিনিয়োগ (> 0 BDT)' : 'Capex Required (> 0)'}
            </span>
          </div>
        </div>

        {/* Chart Instruction */}
        <div className="text-[11px] text-teal-900 bg-teal-50/70 border border-teal-100 px-3 py-1.5 rounded-lg flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-teal-700 shrink-0" />
            {isBangla
              ? 'চার্টের যেকোনো বারে ক্লিক করুন বা নিচের তালিকায় নির্বাচন করে বিস্তারিত বিবরণ দেখুন।'
              : 'Click any bar on the curve or select a measure below to inspect its engineering details and payback.'}
          </span>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            Ranked: Lowest Cost First
          </span>
        </div>

        <div className="h-72 w-full">
          <Bar data={chartData} options={options} />
        </div>

        <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <span>
            {isBangla
              ? '💡 লক্ষ্য করুন: পাওয়ার ফ্যাক্টর এবং এয়ার পাইপলাইন লিক মেরামত সবচেয়ে দ্রুত অর্থ সাশ্রয়কারী পদক্ষেপ।'
              : '💡 Notice: Power factor correction and compressed air leak sealing generate immediate net returns with zero long-term penalty.'}
          </span>
          <span className="text-[10px] text-slate-400">
            Source: Marginal Abatement Cost Analysis (IFC PaCT / SREDA)
          </span>
        </p>
      </div>

      {/* Selected Measure Detail Drawer / Box */}
      {selectedMeasure && (
        <div className="bg-gradient-to-br from-white to-slate-50 p-5 rounded-2xl border-2 border-teal-600/30 shadow-md space-y-4 transition-all duration-200">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 border-b border-slate-200/80 pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-900 text-white flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  {isBangla ? 'নির্বাচিত পদক্ষেপ' : 'Selected Measure'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${currentGrade.bg} ${currentGrade.text}`}
                >
                  <Award size={12} /> {isBangla ? currentGrade.labelBn : currentGrade.labelEn}
                </span>
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-md">
                  {selectedMeasure.category}
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-bold">
                  #{selectedMeasure.measureCode}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-base md:text-lg">
                {cleanTitle(
                  isBangla
                    ? (selectedMeasure.titleBn || selectedMeasure.titleEn)
                    : (selectedMeasure.titleEn || selectedMeasure.titleBn)
                )}
              </h4>
              <p className="text-xs text-slate-600">
                {isBangla
                  ? (selectedMeasure.applicabilityBn || selectedMeasure.applicabilityEn)
                  : (selectedMeasure.applicabilityEn || selectedMeasure.applicabilityBn)}
              </p>
            </div>

            {onSelectCard && (
              <button
                onClick={() => onSelectCard(selectedMeasure.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 shadow-xs transition shrink-0"
              >
                {isBangla ? 'পদক্ষেপ কার্ডে দেখুন' : 'View Action Card'}
                <ArrowRight size={13} />
              </button>
            )}
          </div>

          {/* 4-Box Metric Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Abatement Cost */}
            <div className={`p-3 rounded-xl border space-y-1 ${
              Number(selectedMeasure.costPerTco2e || 0) < 0
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-sky-50/70 border-sky-200 text-sky-950'
            }`}>
              <span className="text-[11px] font-bold flex items-center gap-1">
                <TrendingDown size={14} className={Number(selectedMeasure.costPerTco2e || 0) < 0 ? 'text-emerald-700' : 'text-sky-700'} />
                {isBangla ? 'প্রতি টন কার্বন হ্রাসে খরচ:' : 'Abatement Cost / tCO₂e:'}
              </span>
              <p className="text-xs font-black font-mono">
                {formatBdt(Number(selectedMeasure.costPerTco2e || 0), { useBanglaDigits: isBangla })} / tCO₂e
              </p>
              <span className="text-[10px] font-semibold block">
                {Number(selectedMeasure.costPerTco2e || 0) < 0
                  ? (isBangla ? '✅ সরাসরি টাকা সাশ্রয়কারী' : '✅ Net Profitable Initiative')
                  : (isBangla ? 'ক্যাপিটাল বিনিয়োগ প্রয়োজন' : 'Capital expenditure required')}
              </span>
            </div>

            {/* 2. Annual Savings */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Banknote size={14} className="text-emerald-700" />
                {isBangla ? 'বার্ষিক সাশ্রয় (Annual Savings):' : 'Annual Savings:'}
              </span>
              <p className="text-xs font-black text-slate-900 font-mono">
                {formatBdt(selectedMeasure.savingsBdtRange?.typical || 0, { useBanglaDigits: isBangla })} / {isBangla ? 'বছর' : 'yr'}
              </p>
              <span className="text-[10px] text-slate-500">
                {isBangla ? 'গড় সাশ্রয় পরিসীমা' : 'Calibrated typical savings'}
              </span>
            </div>

            {/* 3. Estimated Capex */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <DollarSign size={14} className="text-slate-600" />
                {isBangla ? 'প্রাক্কলিত বিনিয়োগ (Capex):' : 'Estimated Capex:'}
              </span>
              <p className="text-xs font-black text-slate-900 font-mono">
                {formatBdt(selectedMeasure.capexBdtRange?.low || 0, { useBanglaDigits: isBangla })} – {formatBdt(selectedMeasure.capexBdtRange?.high || 0, { useBanglaDigits: isBangla })}
              </p>
              <span className="text-[10px] text-slate-500">
                {isBangla ? 'ইনস্টলেশন ও সরঞ্জাম খরচ' : 'Turnkey installation range'}
              </span>
            </div>

            {/* 4. Payback Period */}
            <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200/80 space-y-1">
              <span className="text-[11px] font-bold text-teal-900 flex items-center gap-1">
                <Clock size={14} className="text-teal-700" />
                {isBangla ? 'পে-ব্যাক সময়সীমা:' : 'Simple Payback:'}
              </span>
              <p className="text-xs font-black text-teal-950 font-mono">
                {isBangla
                  ? `${toBanglaDigits(Number(selectedMeasure.paybackMonthsRange?.typical || 0).toFixed(1))} মাস`
                  : `${Number(selectedMeasure.paybackMonthsRange?.typical || 0).toFixed(1)} months`}
              </p>
              <span className="text-[10px] text-teal-700">
                {isBangla ? 'বিনিয়োগ তুলে নেওয়ার সময়' : 'Capital recovery window'}
              </span>
            </div>
          </div>

          {/* AI Advice & Implementation Roadmap (if available) */}
          {(selectedMeasure.aiAdviceEn || selectedMeasure.aiAdviceBn) && (
            <div className="p-3 bg-violet-50/60 border border-violet-200/80 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-violet-950 flex items-center gap-1.5">
                <Sparkles size={14} className="text-violet-600" />
                {isBangla ? 'এআই কারিগরি বিশ্লেষণ (AI Engineering Rationale)' : 'AI Engineering Rationale'}
              </span>
              <p className="text-slate-800 leading-relaxed font-sans">
                {isBangla
                  ? (selectedMeasure.aiAdviceBn || selectedMeasure.aiAdviceEn)
                  : (selectedMeasure.aiAdviceEn || selectedMeasure.aiAdviceBn)}
              </p>
              {(selectedMeasure.aiRoadmapEn || selectedMeasure.aiRoadmapBn) && (
                <div className="pt-2 border-t border-violet-200/60 mt-1 space-y-1">
                  <span className="font-bold text-violet-950 text-[11px] block">
                    {isBangla ? '৩-ধাপের বাস্তবায়ন পথনকশা (Actionable Roadmap):' : '3-Step Action Roadmap:'}
                  </span>
                  <div className="text-slate-700 text-[11px] font-mono whitespace-pre-line bg-white/90 p-2.5 rounded-lg border border-violet-100 leading-relaxed">
                    {isBangla
                      ? (selectedMeasure.aiRoadmapBn || selectedMeasure.aiRoadmapEn)
                      : (selectedMeasure.aiRoadmapEn || selectedMeasure.aiRoadmapBn)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Source Citation */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-2 flex-wrap gap-2">
            <span>
              {isBangla ? 'তথ্যসূত্র:' : 'Source Citation:'}{' '}
              <strong className="text-slate-700">{selectedMeasure.sourceCitation}</strong>
            </span>
            <span className="text-teal-800 font-bold">
              {isBangla
                ? `বার্ষিক কার্বন হ্রাস: ${toBanglaDigits(Number(selectedMeasure.tco2eAvoidedRange?.typical || 0).toFixed(1))} tCO₂e`
                : `Annual Avoided Carbon: ${Number(selectedMeasure.tco2eAvoidedRange?.typical || 0).toFixed(1)} tCO₂e`}
            </span>
          </div>
        </div>
      )}

      {/* Abatement Cost Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
          <h4 className="font-bold text-slate-900 text-xs md:text-sm">
            {isBangla ? 'পদক্ষেপ সমূহের খরচ ও সাশ্রয় তালিকা' : 'MACC Abatement Hierarchy Table'}
          </h4>
          <span className="text-[11px] text-slate-500">
            {isBangla ? 'পদক্ষেপে ক্লিক করে নির্বাচন করুন' : 'Click row to select measure'}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">{isBangla ? 'পদক্ষেপ' : 'Measure'}</th>
                <th className="py-2.5 px-3">{isBangla ? 'বিভাগ' : 'Category'}</th>
                <th className="py-2.5 px-3 text-right">{isBangla ? 'অ্যাবেটমেন্ট কস্ট' : 'Abatement Cost'}</th>
                <th className="py-2.5 px-3 text-right">{isBangla ? 'বাৎসরিক সাশ্রয়' : 'Annual Savings'}</th>
                <th className="py-2.5 px-3 text-right">{isBangla ? 'পে-ব্যাক' : 'Payback'}</th>
                <th className="py-2.5 px-3 text-center">{isBangla ? 'স্ট্যাটাস' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((rec, idx) => {
                const isSelected = rec.id === selectedMeasureId;
                const isProfit = Number(rec.costPerTco2e || 0) < 0;
                return (
                  <tr
                    key={rec.id}
                    onClick={() => setSelectedMeasureId(rec.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-teal-50/80 font-semibold'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">
                        {cleanTitle(
                          isBangla ? (rec.titleBn || rec.titleEn) : (rec.titleEn || rec.titleBn)
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">#{rec.measureCode}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{rec.category}</td>
                    <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                      isProfit ? 'text-emerald-700' : 'text-sky-700'
                    }`}>
                      {formatBdt(Number(rec.costPerTco2e || 0), { useBanglaDigits: isBangla })} / tCO₂e
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                      {formatBdt(rec.savingsBdtRange?.typical || 0, { useBanglaDigits: isBangla })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {isBangla
                        ? `${toBanglaDigits(Number(rec.paybackMonthsRange?.typical || 0).toFixed(1))} মাস`
                        : `${Number(rec.paybackMonthsRange?.typical || 0).toFixed(1)} mos`}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
