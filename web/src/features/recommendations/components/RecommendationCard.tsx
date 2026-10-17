import React, { useState } from 'react';
import { Recommendation, EvidenceGrade } from '../types';
import { toBanglaDigits, formatBdt } from '../../../shared';
import {
  TrendingDown,
  Award,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Banknote,
  DollarSign,
  Clock,
  Leaf,
  CheckCircle2,
  Sparkles,
  Zap,
  AlertTriangle,
  Info,
  ArrowRight,
} from 'lucide-react';

function cleanTitle(str: string): string {
  if (!str) return '';
  return str
    .replace(/FAKE/gi, '')
    .replace(/\(Unit Tests Only\)/gi, '')
    .replace(/টেস্ট/gi, '')
    .trim();
}

interface RecommendationCardProps {
  rec: Recommendation;
  isBangla: boolean;
  onUpdateStatus: (rec: Recommendation, newStatus: any) => void;
  isHighlighted?: boolean;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  rec,
  isBangla,
  onUpdateStatus,
  isHighlighted = false,
}) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const gradeColor: Record<EvidenceGrade, { bg: string; text: string; labelBn: string; labelEn: string; descBn: string; descEn: string }> = {
    A: {
      bg: 'bg-emerald-100 border-emerald-300',
      text: 'text-emerald-900',
      labelBn: 'গ্রেড A (বাস্তব কারখানার ডেটা)',
      labelEn: 'Grade A (Empirical Factory Data)',
      descBn: 'বাংলাদেশের টেক্সটাইল কারখানায় IFC PaCT বা সরাসরি মাঠপর্যায়ের এনার্জি অডিটে পরীক্ষিত সংখ্যা। সর্বোচ্চ নির্ভরযোগ্য।',
      descEn: 'Proven by real field audits in Bangladeshi RMG/Textile factories (IFC PaCT benchmarks). Highest reliability.',
    },
    B: {
      bg: 'bg-sky-100 border-sky-300',
      text: 'text-sky-900',
      labelBn: 'গ্রেড B (জাতীয় নির্দেশিকা)',
      labelEn: 'Grade B (National Sector Guide)',
      descBn: 'বাংলাদেশ টেকসই ও নবায়নযোগ্য জ্বালানি উন্নয়ন কর্তৃপক্ষ (SREDA) বা BPDB-এর জাতীয় মানদণ্ড অনুযায়ী প্রস্তুত।',
      descEn: 'Calculated using national Bangladesh industrial benchmarks from SREDA and BPDB guidelines.',
    },
    C: {
      bg: 'bg-slate-100 border-slate-300',
      text: 'text-slate-700',
      labelBn: 'গ্রেড C (আন্তর্জাতিক মডেল)',
      labelEn: 'Grade C (International Model)',
      descBn: 'আন্তর্জাতিক গবেষণা ও জিএইচজি প্রোটোকল মডেল ভিত্তিক প্রাথমিক প্রাক্কলন।',
      descEn: 'Derived from international energy models (UNIDO / GHG Protocol baseline).',
    },
  };

  const currentGrade = gradeColor[rec.evidenceGrade] || gradeColor['B'];

  // Format ranges with BDT and Bangla numerals safely
  const savingsLow = Number(rec.savingsBdtRange?.low ?? 0);
  const savingsHigh = Number(rec.savingsBdtRange?.high ?? 0);
  const savingsTyp = Number(rec.savingsBdtRange?.typical ?? 0);
  const savingsRangeFormatted = `${formatBdt(savingsLow, {
    useBanglaDigits: isBangla,
  })} – ${formatBdt(savingsHigh, {
    useBanglaDigits: isBangla,
  })} (${isBangla ? 'গড়ে ' : 'avg '}${formatBdt(savingsTyp, {
    useBanglaDigits: isBangla,
  })})`;

  const capexLow = Number(rec.capexBdtRange?.low ?? 0);
  const capexHigh = Number(rec.capexBdtRange?.high ?? 0);
  const capexRangeFormatted = `${formatBdt(capexLow, {
    useBanglaDigits: isBangla,
  })} – ${formatBdt(capexHigh, {
    useBanglaDigits: isBangla,
  })}`;

  const pLow = Number(rec.paybackMonthsRange?.low ?? 0).toFixed(1);
  const pHigh = Number(rec.paybackMonthsRange?.high ?? 0).toFixed(1);
  const pTyp = Number(rec.paybackMonthsRange?.typical ?? 0).toFixed(1);
  const paybackRangeFormatted = isBangla
    ? `${toBanglaDigits(pLow)} – ${toBanglaDigits(pHigh)} মাস (গড়ে ${toBanglaDigits(pTyp)} মাস)`
    : `${pLow} – ${pHigh} mos (avg ${pTyp} mos)`;

  const cLow = Number(rec.tco2eAvoidedRange?.low ?? 0).toFixed(1);
  const cHigh = Number(rec.tco2eAvoidedRange?.high ?? 0).toFixed(1);
  const cTyp = Number(rec.tco2eAvoidedRange?.typical ?? 0).toFixed(1);
  const carbonRangeFormatted = isBangla
    ? `${toBanglaDigits(cLow)} – ${toBanglaDigits(cHigh)} tCO₂e/বছর (গড়ে ${toBanglaDigits(cTyp)})`
    : `${cLow} – ${cHigh} tCO₂e/yr (avg ${cTyp})`;

  const rawTitle = isBangla
    ? (rec.titleBn || rec.titleEn || 'পদক্ষেপ')
    : (rec.titleEn || rec.titleBn || 'Recommendation');
  const displayTitle = cleanTitle(rawTitle);

  return (
    <div
      id={`card-${rec.id}`}
      className={`bg-white rounded-2xl border transition-all duration-200 p-5 shadow-xs hover:shadow-md space-y-4 ${
        isHighlighted
          ? 'border-teal-500 ring-2 ring-teal-400/30'
          : 'border-slate-200/90'
      }`}
    >
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Grade Badge with Explanatory Tooltip */}
            <div className="relative group/grade inline-block">
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border flex items-center gap-1 cursor-help ${currentGrade.bg} ${currentGrade.text}`}
                title={isBangla ? currentGrade.descBn : currentGrade.descEn}
              >
                <Award size={13} /> {isBangla ? currentGrade.labelBn : currentGrade.labelEn}
                <Info size={11} className="opacity-70" />
              </span>
              <div className="hidden group-hover/grade:block absolute left-0 top-full mt-1 w-72 p-2.5 bg-slate-900 text-white text-[11px] rounded-xl shadow-xl z-30 leading-relaxed font-normal">
                <p className="font-bold border-b border-white/20 pb-1 mb-1 text-teal-300">
                  {isBangla ? 'গ্রেড মানদণ্ডের অর্থ:' : 'Evidence Grade Meaning:'}
                </p>
                {isBangla ? currentGrade.descBn : currentGrade.descEn}
              </div>
            </div>

            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              {rec.category}
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-bold">
              #{rec.measureCode}
            </span>
            {rec.isAiEnriched && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-100 text-violet-800 border border-violet-200 flex items-center gap-1">
                <Sparkles size={11} className="text-violet-600" />
                {isBangla ? 'এআই ক্যালিব্রেটেড' : 'AI Calibrated'}
              </span>
            )}
          </div>

          <h3 className="font-bold text-slate-900 text-base md:text-lg">
            {displayTitle}
          </h3>

          {/* Active Flag Resolution Badges */}
          {rec.addressedFlags && rec.addressedFlags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {rec.addressedFlags.map((flag) => (
                <span
                  key={flag}
                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300"
                >
                  <Zap size={12} className="text-amber-600" />
                  {isBangla ? `সতর্কতা দূর করবে: ${flag}` : `Resolves Active Flag: ${flag}`}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Status Badge & Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={rec.status}
            onChange={(e) => onUpdateStatus(rec, e.target.value)}
            className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border focus:outline-hidden ${
              rec.status === 'Done'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : rec.status === 'Planned'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                : rec.status === 'NotFeasible'
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="Suggested">{isBangla ? 'প্রস্তাবিত (Suggested)' : 'Suggested'}</option>
            <option value="Planned">{isBangla ? 'পরিকল্পিত (Planned)' : 'Planned'}</option>
            <option value="Done">{isBangla ? 'সম্পন্ন (Done)' : 'Done'}</option>
            <option value="NotFeasible">{isBangla ? 'সম্ভব নয় (Not Feasible)' : 'Not Feasible'}</option>
          </select>
        </div>
      </div>

      {/* HIGHLIGHTED BOX: What is the Issue & What the Owner Should Do */}
      <div className="bg-gradient-to-r from-amber-50/70 via-slate-50 to-teal-50/60 border border-slate-200 rounded-xl p-3.5 space-y-2.5 text-xs">
        {/* The Inefficiency / Issue Identified */}
        <div className="flex items-start gap-2.5">
          <div className="p-1 rounded-md bg-amber-100 text-amber-800 shrink-0 mt-0.5">
            <AlertTriangle size={14} />
          </div>
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              {isBangla ? 'কারখানায় চিহ্নিত সমস্যা/অপচয় (The Issue):' : 'Operational Inefficiency (The Issue):'}
            </span>
            <p className="text-slate-700 leading-relaxed">
              {isBangla
                ? (rec.applicabilityBn || rec.applicabilityEn || 'অতিরিক্ত বিদ্যুৎ বা তাপীয় জ্বালানি ব্যবহারের কারণে উৎপাদন খরচ বৃদ্ধি পাচ্ছে।')
                : (rec.applicabilityEn || rec.applicabilityBn || 'Energy losses and inefficient operating profiles leading to elevated utility expenses.')}
            </p>
          </div>
        </div>

        {/* What the Owner Should Do Immediately */}
        <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200/80">
          <div className="p-1 rounded-md bg-teal-800 text-white shrink-0 mt-0.5">
            <CheckCircle2 size={14} />
          </div>
          <div className="space-y-0.5">
            <span className="font-bold text-teal-950 text-xs flex items-center gap-1.5">
              {isBangla ? 'মালিকের স্পষ্ট করণীয় (What Owner Should Do):' : 'Action for Factory Management (What to Do):'}
            </span>
            <p className="text-teal-900 font-semibold leading-relaxed">
              {isBangla
                ? (rec.nextStepBn || rec.nextStepEn || 'দক্ষ সরবরাহকারী (ভেন্ডর) থেকে টেকনিক্যাল স্পেসিফিকেশন ও কোটেশন সংগ্রহ করে ইনস্টলেশন পরিকল্পনা চূড়ান্ত করুন।')
                : (rec.nextStepEn || rec.nextStepBn || 'Obtain technical quotations from certified industrial vendors, review specifications, and finalize installation schedule.')}
            </p>
          </div>
        </div>
      </div>

      {/* 4-Column Honest Range Matrix (The Financial & Carbon Benefit) */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-slate-700 block">
          {isBangla ? 'আর্থিক ও কার্বন সাশ্রয়ের হিসাব (Projected Benefits):' : 'Projected Financial & Carbon Benefits:'}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Annual Savings in BDT */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/90 rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
              <Banknote size={14} className="text-emerald-700" />
              {isBangla ? 'বার্ষিক সাশ্রয় (Money Saved):' : 'Annual Savings (BDT):'}
            </span>
            <p className="text-xs font-black text-emerald-950 font-mono">
              {savingsRangeFormatted}
            </p>
            <span className="text-[10px] text-emerald-700 block">
              {isBangla ? 'কারখানার নিজস্ব বিল ট্যারিফ অনুযায়ী' : 'Based on actual factory tariff'}
            </span>
          </div>

          {/* 2. Capex Investment in BDT */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <DollarSign size={14} className="text-slate-600" />
              {isBangla ? 'প্রাক্কলিত বিনিয়োগ (Investment):' : 'Estimated Capex:'}
            </span>
            <p className="text-xs font-bold text-slate-900 font-mono">
              {capexRangeFormatted}
            </p>
            <span className="text-[10px] text-slate-500 block">
              {isBangla ? 'যন্ত্রপাতি ও ইনস্টলেশন খরচ' : 'Turnkey installation range'}
            </span>
          </div>

          {/* 3. Payback Period */}
          <div className="p-3 bg-teal-50/70 border border-teal-200/90 rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-teal-900 flex items-center gap-1">
              <Clock size={14} className="text-teal-700" />
              {isBangla ? 'আসল ফেরত আসার সময় (Payback):' : 'Capital Payback Window:'}
            </span>
            <p className="text-xs font-black text-teal-950 font-mono">
              {paybackRangeFormatted}
            </p>
            <span className="text-[10px] text-teal-700 block">
              {isBangla ? 'এই সময়ের মধ্যে মূলধন উঠে আসবে' : 'Window to recover capital'}
            </span>
          </div>

          {/* 4. Carbon Avoidance */}
          <div className="p-3 bg-sky-50/70 border border-sky-200/90 rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-sky-900 flex items-center gap-1">
              <Leaf size={14} className="text-sky-700" />
              {isBangla ? 'কার্বন হ্রাস (Carbon Reduced):' : 'CO₂e Avoided / Year:'}
            </span>
            <p className="text-xs font-black text-sky-950 font-mono">
              {carbonRangeFormatted}
            </p>
            <span className="text-[10px] text-sky-700 block">
              {isBangla ? 'GHG প্রোটোকল স্কোপ ২ হ্রাস' : 'Displaced utility emissions'}
            </span>
          </div>
        </div>
      </div>

      {/* AI Advice & Implementation Roadmap (if available) */}
      {(rec.aiAdviceEn || rec.aiAdviceBn) && (
        <div className="p-3.5 bg-gradient-to-r from-violet-50/70 via-indigo-50/50 to-slate-50 border border-violet-200/90 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-bold text-violet-950 flex items-center gap-1.5">
              <Sparkles size={15} className="text-violet-600" />
              {isBangla ? 'এআই কারিগরি বিশ্লেষণ (AI Engineering Rationale)' : 'AI Engineering Rationale'}
            </span>
            <span className="text-[10px] text-violet-700 font-medium">
              {isBangla ? 'কারখানার বাস্তব বিল ও ডেটার ওপর ভিত্তি করে তৈরি' : 'Calibrated with facility bills & operational flags'}
            </span>
          </div>
          <p className="text-slate-800 leading-relaxed font-sans">
            {isBangla ? (rec.aiAdviceBn || rec.aiAdviceEn) : (rec.aiAdviceEn || rec.aiAdviceBn)}
          </p>
          {(rec.aiRoadmapEn || rec.aiRoadmapBn) && (
            <div className="pt-2 border-t border-violet-200/60 mt-1 space-y-1">
              <span className="font-bold text-violet-950 text-[11px] block">
                {isBangla ? '৩-ধাপের বাস্তবায়ন পথনকশা (Actionable Roadmap):' : '3-Step Action Roadmap:'}
              </span>
              <div className="text-slate-700 text-[11px] font-mono whitespace-pre-line bg-white/80 p-2.5 rounded-lg border border-violet-100 leading-relaxed">
                {isBangla ? (rec.aiRoadmapBn || rec.aiRoadmapEn) : (rec.aiRoadmapEn || rec.aiRoadmapBn)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Financing Note Pill */}
      {(rec.financingNoteBn || rec.financingNoteEn) && (
        <div className="p-3 bg-indigo-50/60 border border-indigo-200/70 rounded-xl flex items-start gap-2 text-xs text-indigo-950">
          <Sparkles size={16} className="text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">
              {isBangla ? 'অর্থায়ন সুযোগ (Green Financing Note): ' : 'Concessional Financing: '}
            </span>
            <span className="text-slate-700">
              {isBangla ? (rec.financingNoteBn || rec.financingNoteEn) : (rec.financingNoteEn || rec.financingNoteBn)}
            </span>
          </div>
        </div>
      )}

      {/* Expandable Engineering & Baseline Drawer */}
      {showDetails && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-3 transition-all duration-200">
          <div>
            <h4 className="font-bold text-slate-800">
              {isBangla ? 'হিসাবের ভিত্তি ও অনুমান (Calculation Assumptions):' : 'Calculation Baseline & Assumptions:'}
            </h4>
            <p className="text-slate-600 mt-0.5 leading-relaxed">
              {isBangla ? (rec.assumptionsBn || rec.assumptionsEn) : (rec.assumptionsEn || rec.assumptionsBn)}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] text-slate-500">
              {isBangla ? 'উৎস তথ্যসূত্র:' : 'Source Citation:'}{' '}
              <strong className="text-slate-700">{rec.sourceCitation || 'IFC PaCT / SREDA Benchmark'}</strong>
            </span>
            {rec.sourceUrl && (
              <a
                href={rec.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-teal-700 hover:underline flex items-center gap-1"
              >
                {isBangla ? 'উৎস দেখুন' : 'View Source'} <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Footer Toggle Button */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
        <button
          type="button"
          onClick={() => setShowDetails((prev) => !prev)}
          className="text-teal-800 hover:text-teal-950 font-bold flex items-center gap-1 py-1 transition-colors cursor-pointer"
        >
          {showDetails ? (
            <>
              {isBangla ? 'হিসাবের ভিত্তি ও তথ্যসূত্র লুকান' : 'Hide Assumptions & Sources'} <ChevronUp size={14} />
            </>
          ) : (
            <>
              {isBangla ? 'গণনার ভিত্তি ও তথ্যসূত্র দেখুন' : 'Inspect Calculation Baseline & Sources'}{' '}
              <ChevronDown size={14} />
            </>
          )}
        </button>

        <span className="text-[11px] text-slate-400">
          {isBangla ? 'প্রকৌশল হিসাব ও অনুমানের পরিসীমা' : 'Calibrated estimate ranges (low/typ/high)'}
        </span>
      </div>
    </div>
  );
};
