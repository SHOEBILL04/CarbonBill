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
}

export const RagAssistant: React.FC<RagAssistantProps> = ({ isBangla }) => {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<RagAskResponse | null>(null);
  const [corpus, setCorpus] = useState<RagCorpusSummary | null>(null);
  const [showEvidence, setShowEvidence] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  useEffect(() => {
    fetchRagCorpusSummary().then((res) => {
      if (res) setCorpus(res);
    });
  }, []);

  const quickQuestions = isBangla
    ? [
        {
          label: '⚡ পাওয়ার ফ্যাক্টর জরিমানা (APFC)',
          q: 'আমাদের ডেসকো বিলের লো পাওয়ার ফ্যাক্টর জরিমানা কীভাবে দূর করব এবং এর পে-ব্যাক কত?',
        },
        {
          label: '☀️ ২৫,০০০ বর্গফুট ছাদে সৌর বিদ্যুৎ',
          q: 'আমাদের কারখানার ২৫,০০০ বর্গফুট ছাদে নেট-মিটারিং সোলার পিভি স্থাপন করলে বার্ষিক সাশ্রয় ও পে-ব্যাক কেমন হবে?',
        },
        {
          label: '🏭 বয়লার স্টিম অপচয় (HOTSPOT)',
          q: 'বয়লার লাইনে চিহ্নিত HOTSPOT_DETECTED সতর্কতা দূর করতে কোন প্রযুক্তি কার্যকর এবং আইডিবিএল/ইডকল অর্থায়ন সুবিধা কী?',
        },
        {
          label: '🧵 সেলাই মেশিনে সার্ভো মোটর',
          q: 'আমাদের সেলাই লাইনে ডিরেক্ট-ড্রাইভ সার্ভো মোটর রূপান্তরের খরচ ও জ্বালানি সাশ্রয় কত?',
        },
      ]
    : [
        {
          label: '⚡ Power Factor Penalty (APFC)',
          q: 'How can our factory eliminate the low power factor penalty from our DESCO electricity bills, and what is the estimated payback?',
        },
        {
          label: '☀️ Rooftop Solar PV (25k sqft)',
          q: 'What solar PV capacity can our 25,000 sq ft factory rooftop support under net-metering and what are the financial returns?',
        },
        {
          label: '🏭 Boiler Steam Hotspot (HOTSPOT)',
          q: 'How to resolve the active HOTSPOT_DETECTED operational anomaly on boiler flue lines using IFC PaCT measures?',
        },
        {
          label: '🧵 Servo Motors on Sewing Lines',
          q: 'Evaluate the energy reduction, capex, and simple payback of direct-drive servo motors for our sewing operations.',
        },
      ];

  async function handleAsk(qToAsk?: string) {
    const text = qToAsk || query;
    if (!text.trim() || loading) return;

    setLoading(true);
    try {
      const res = await askRagRecommendations(text.trim(), 4);
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
