import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Bot,
  ChevronDown,
  ChevronUp,
  FileText,
  Zap,
  Building2,
  Database,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { RagAskResponse, RagCorpusSummary, RagKnowledgeChunk } from '../types';
import { askRagRecommendations, fetchRagCorpusSummary } from '../recommendationsApi';

interface RagAssistantProps {
  isBangla: boolean;
  recalculateSignal?: number;
}

export const RagAssistant: React.FC<RagAssistantProps> = ({ isBangla, recalculateSignal }) => {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<RagAskResponse | null>(null);
  const [corpus, setCorpus] = useState<RagCorpusSummary | null>(null);
  const [showEvidence, setShowEvidence] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [autoTriggered, setAutoTriggered] = useState<boolean>(false);

  useEffect(() => {
    fetchRagCorpusSummary().then((res) => {
      if (res) setCorpus(res);
    });
  }, []);

  // Automatically trigger multi-category RAG recalculation whenever 'Recalculate with AI' is clicked
  useEffect(() => {
    if (recalculateSignal && recalculateSignal > 0) {
      setIsExpanded(true);
      setAutoTriggered(true);
      const auditPrompt = isBangla
        ? 'আমাদের কারখানার বর্তমান বিদ্যুৎ, গ্যাস এবং পেট্রোল/ডিজেল ব্যবহারের সম্পূর্ণ অডিট করুন। প্রতিটি খাতে ব্যবহার হ্রাস ও জ্বালানি রূপান্তর (যেমন বিদ্যুৎ থেকে ছাদে সোলার প্যানেল, বয়লার থেকে ওয়েস্ট হিট রিকভারি, এবং পরিবহন/জেনারেটরে ডিজেল-পেট্রোল সাশ্রয়) সংক্রান্ত সুনির্দিষ্ট সুপারিশ দিন—প্রতিটি পদক্ষেপের জন্য আর্থিক সাশ্রয় (টাকা/বছর, বিনিয়োগ, পে-ব্যাক) এবং CO2 নির্গমন হ্রাস (tCO2e) উল্লেখ করুন।'
        : 'Comprehensive Energy Reduction & Fuel-Switching Audit: Analyze our current electricity, gas, and petrol/diesel consumption. Recommend specific steps to reduce usage and switch (e.g., switch electricity to rooftop solar PV, natural gas to waste heat economizer, and optimize diesel/petrol fleet & genset), detailing both financial impact (annual BDT savings, capex, payback) and CO2 reduction (tCO2e/year) for every category.';

      setQuery(auditPrompt);
      handleAsk(auditPrompt);
    }
  }, [recalculateSignal]);

  const quickQuestions = isBangla
    ? [
        {
          label: '☀️ সোলার প্যানেল সেটআপের ধাপ ও লোন',
          q: 'আমাদের কারখানার ছাদে সোলার প্যানেল কীভাবে সেটআপ করব? ধাপে ধাপে ইন্সটলেশন প্রক্রিয়া, ডেসকো নেট-মিটারিং এবং ইডকল ৫.৫% লোনের সুবিধা কীভাবে পাব?',
        },
        {
          label: '⛽ পেট্রোল/ডিজেল ও পরিবহন খরচ কমানো',
          q: 'আমাদের কারখানার জেনারেটর এবং মালবাহী পরিবহনে পেট্রোল ও ডিজেল খরচ কমাতে কী কী পদক্ষেপ নেওয়া যায়? এর আর্থিক সাশ্রয় ও CO2 হ্রাস কত?',
        },
        {
          label: '⚡ বিদ্যুৎ কমাতে সোলারে রূপান্তর',
          q: 'আমাদের বিদ্যুৎ খরচ অনেক বেশি। গ্রিড বিদ্যুৎ কমিয়ে ছাদে সোলার পিভিতে রূপান্তর করলে বার্ষিক কত টাকা ও tCO2e কার্বন সাশ্রয় হবে এবং পে-ব্যাক কত?',
        },
        {
          label: '🔥 বয়লারে প্রাকৃতিক গ্যাস সাশ্রয়',
          q: 'বয়লার ফ্লু গ্যাসে ওয়েস্ট হিট রিকভারি ইকোনোমাইজার এবং স্টিম ট্র্যাপ মেরামত করে প্রাকৃতিক গ্যাস খরচ কীভাবে হ্রাস করা যাবে?',
        },
        {
          label: '⚡ পাওয়ার ফ্যাক্টর জরিমানা (APFC)',
          q: 'আমাদের ডেসকো বিলের লো পাওয়ার ফ্যাক্টর জরিমানা দূর করতে APFC ক্যাপাসিটর ব্যাংক কীভাবে কাজ করবে এবং পে-ব্যাক কত?',
        },
      ]
    : [
        {
          label: '☀️ How to Setup Rooftop Solar',
          q: 'How do we setup rooftop solar panels on our factory roof? Explain the step-by-step installation roadmap, DESCO net-metering approval, and IDCOL 5.5% green financing.',
        },
        {
          label: '⛽ Reduce Petrol, Diesel & Fleet Costs',
          q: 'How can we reduce our diesel, petrol, and factory transport/freight fuel costs? Provide specific actions with annual BDT savings and tCO2e reduction.',
        },
        {
          label: '⚡ High Electricity: Switch to Solar PV',
          q: 'Our electricity consumption is high. How can we switch to rooftop solar PV and APFC to reduce grid costs? Detail both financial BDT and CO2 savings.',
        },
        {
          label: '🔥 Reduce Natural Gas in Boilers',
          q: 'How can we reduce boiler natural gas consumption using waste heat recovery economizers and steam trap repairs with capex and payback?',
        },
        {
          label: '⚡ Eliminate Power Factor Penalty (APFC)',
          q: 'How can our factory eliminate the low power factor penalty from our DESCO electricity bills, and what is the estimated payback?',
        },
      ];

  async function handleAsk(qToAsk?: string) {
    const text = qToAsk || query;
    if (!text.trim() || loading) return;

    setLoading(true);
    try {
      const res = await askRagRecommendations(text.trim(), 5);
      setResponse(res);
      setShowEvidence(true);
    } catch (err) {
      console.error('RAG request failed', err);
    } finally {
      setLoading(false);
    }
  }

  function getChunkTypeBadge(type: string) {
    switch (type) {
      case 'UtilityBill':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: <FileText size={12} className="text-emerald-700" />,
          label: isBangla ? 'বাস্তব ইউটিলিটি বিল' : 'Live Utility Bill',
        };
      case 'OperationalFlag':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <Zap size={12} className="text-amber-700" />,
          label: isBangla ? 'চিহ্নিত অসঙ্গতি' : 'Operational Flag',
        };
      case 'MeasureLibrary':
        return {
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          icon: <ShieldCheck size={12} className="text-indigo-700" />,
          label: isBangla ? 'IFC PaCT গবেষণা' : 'IFC PaCT Measure',
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-800 border-slate-200',
          icon: <Building2 size={12} className="text-slate-700" />,
          label: isBangla ? 'কারখানা প্রোফাইল' : 'Factory Profile',
        };
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl border border-indigo-800/80 shadow-md overflow-hidden">
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-violet-600 to-indigo-500 rounded-xl shadow-inner">
            <Bot size={22} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black tracking-wide text-white">
                {isBangla ? 'এআই আরএজি পরামর্শক (Interactive RAG Advisor)' : 'Industrial RAG Energy Advisor'}
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-400/30">
                <Sparkles size={11} className="text-violet-400" />
                Retrieval-Augmented Generation
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isBangla
                ? 'আপনার কারখানার প্রকৃত বিল, অ্যাক্টিভ ফ্ল্যাগ এবং IFC PaCT গবেষণাপত্রের সমন্বয়ে তৈরি লাইভ এআই'
                : 'Synthesizing verified factory utility bills, active operational anomalies, and IFC PaCT benchmarks via Groq AI'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {corpus && (
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-slate-300 font-mono"
              title="Indexed Knowledge Chunks"
            >
              <Database size={12} className="text-violet-400" />
              <span>{corpus.totalChunks} indexed sources</span>
            </div>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
            title={isExpanded ? 'Minimize' : 'Expand'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Quick Prompt Pills */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isBangla ? 'দ্রুত পরামর্শ প্রশ্নসমূহ (Quick Inquiries):' : 'Suggested Inquiries:'}
            </span>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(item.q);
                    handleAsk(item.q);
                  }}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-violet-600/30 hover:border-violet-400/50 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-all text-left flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>{item.label}</span>
                  <ArrowRight size={11} className="opacity-60" />
                </button>
              ))}
            </div>
          </div>

          {/* Search Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  isBangla
                    ? 'আপনার কারখানার বিল ও প্রযুক্তি সংক্রান্ত যেকোনো প্রশ্ন করুন (যেমন: সোলার পে-ব্যাক বা বয়লার সাশ্রয়)...'
                    : 'Ask anything about your factory bills, tariff optimization, or IFC PaCT retrofits...'
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>{isBangla ? 'অনুসন্ধান হচ্ছে...' : 'Retrieving...'}</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>{isBangla ? 'পরামর্শ নিন' : 'Ask RAG'}</span>
                </>
              )}
            </button>
          </form>

          {/* AI Response Display Area */}
          {response && (
            <div className="p-4 sm:p-5 bg-white/5 border border-white/15 rounded-xl space-y-3.5 backdrop-blur-xs">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-xs text-violet-200">
                    {isBangla ? 'উৎস-প্রমাণিত এআই বিশ্লেষণ' : 'Grounded RAG Response'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({response.model})
                  </span>
                </div>
                <button
                  onClick={() => setShowEvidence(!showEvidence)}
                  className="text-xs text-violet-300 hover:text-violet-100 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>
                    {isBangla
                      ? `${response.retrievedContextCount} টি উৎস উদ্ধৃত`
                      : `${response.retrievedContextCount} Retrieved Evidence Chunks`}
                  </span>
                  {showEvidence ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {/* Formatted Answer Body */}
              <div className="text-xs sm:text-sm text-slate-100 leading-relaxed space-y-2 whitespace-pre-line font-sans">
                {response.answer}
              </div>

              {/* Collapsible Retrieved Evidence Drawer */}
              {showEvidence && response.retrievedChunks && (
                <div className="pt-3 border-t border-white/10 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isBangla ? 'সিস্টেম থেকে প্রাপ্ত উদ্ধৃত রেফারেন্সসমূহ:' : 'Retrieved Evidence Context:'}
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {response.retrievedChunks.map((chunk: RagKnowledgeChunk, idx: number) => {
                      const badge = getChunkTypeBadge(chunk.type);
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-black/30 border border-white/10 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.bg}`}
                            >
                              {badge.icon}
                              {badge.label}
                            </span>
                            <span className="text-[10px] font-mono text-violet-300">
                              score: {chunk.relevanceScore}
                            </span>
                          </div>
                          <h5 className="font-bold text-slate-100 text-[11px]">
                            {chunk.title}
                          </h5>
                          <p className="text-slate-300 text-[11px] line-clamp-3 leading-normal">
                            {chunk.content}
                          </p>
                          <span className="text-[9px] text-slate-400 block pt-0.5">
                            Source: {chunk.sourceCitation}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
