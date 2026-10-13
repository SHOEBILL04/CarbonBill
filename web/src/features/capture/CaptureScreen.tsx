import React, { useState, useEffect, useRef } from 'react';
import {
  Fuel,
  Flame,
  Zap,
  Truck,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Layers,
  FileText,
  Bell,
  Wifi,
  WifiOff,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import {
  enqueueCapture,
  getAllCaptureItems,
  processQueueUploads,
  retryCaptureItem,
  CaptureQueueItem,
} from './offlineCaptureQueue';
import { processAndCompressImage } from './imageProcessing';
import { requestAndSubscribePush } from './pushSubscription';
import { formatBanglaNumber, formatBanglaDate } from '../../shared/formatters';

function detectCategoryFromFileName(fileName: string): 'diesel' | 'gas' | 'electricity' | 'shipment' {
  const lower = fileName.toLowerCase();
  if (lower.includes('gas') || lower.includes('titas') || lower.includes('bakhrabad') || lower.includes('jalalabad')) return 'gas';
  if (lower.includes('diesel') || lower.includes('fuel') || lower.includes('octane') || lower.includes('petrol') || lower.includes('pocl')) return 'diesel';
  if (lower.includes('ship') || lower.includes('truck') || lower.includes('transport') || lower.includes('challan') || lower.includes('freight')) return 'shipment';
  return 'electricity';
}

export function CaptureScreen({ onBack }: { onBack?: () => void } = {}) {
  const [selectedCategory, setSelectedCategory] = useState<'diesel' | 'gas' | 'electricity' | 'shipment' | null>(null);
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [batchCount, setBatchCount] = useState<number>(0);
  const [isManualMode, setIsManualMode] = useState<boolean>(false);
  const [manualQuantity, setManualQuantity] = useState<string>('');
  const [manualSlipNumber, setManualSlipNumber] = useState<string>('');
  const [manualUnit, setManualUnit] = useState<string>('litre');
  const [confirmedReceipt, setConfirmedReceipt] = useState<{ id: string; code: string; serverDocId?: string } | null>(null);
  const [submissions, setSubmissions] = useState<CaptureQueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pushSubscribed, setPushSubscribed] = useState<boolean>(false);

  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    {
      key: 'diesel' as const,
      labelBn: 'ডিজেল স্লিপ',
      subBn: 'জেনারেটর ও বয়লার ফুয়েল',
      icon: Fuel,
      color: 'bg-amber-500 text-white',
      accentBg: 'bg-amber-50',
      activeBorder: 'border-amber-500 ring-2 ring-amber-400',
      badgeColor: 'bg-amber-100 text-amber-900',
      defaultUnit: 'লিটার',
    },
    {
      key: 'gas' as const,
      labelBn: 'গ্যাস বিল',
      subBn: 'তিতাস / বাখরাবাদ আরএমএস',
      icon: Flame,
      color: 'bg-orange-500 text-white',
      accentBg: 'bg-orange-50',
      activeBorder: 'border-orange-500 ring-2 ring-orange-400',
      badgeColor: 'bg-orange-100 text-orange-900',
      defaultUnit: 'ঘনমিটার',
    },
    {
      key: 'electricity' as const,
      labelBn: 'বিদ্যুৎ বিল',
      subBn: 'ডেসকো / ডিপিডিসি / আরইবি',
      icon: Zap,
      color: 'bg-yellow-500 text-white',
      accentBg: 'bg-yellow-50',
      activeBorder: 'border-yellow-500 ring-2 ring-yellow-400',
      badgeColor: 'bg-yellow-100 text-yellow-900',
      defaultUnit: 'কেডব্লিউএইচ',
    },
    {
      key: 'shipment' as const,
      labelBn: 'পরিবহন চালান',
      subBn: 'ট্রাক ও কার্গো চালান',
      icon: Truck,
      color: 'bg-blue-500 text-white',
      accentBg: 'bg-blue-50',
      activeBorder: 'border-blue-500 ring-2 ring-blue-400',
      badgeColor: 'bg-blue-100 text-blue-900',
      defaultUnit: 'কেজি',
    },
  ];

  useEffect(() => {
    loadQueue();

    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  async function loadQueue() {
    const list = await getAllCaptureItems();
    setSubmissions(list);
  }

  async function triggerSync() {
    setIsProcessing(true);
    try {
      await processQueueUploads();
      await loadQueue();
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleRetry(id: string) {
    setIsProcessing(true);
    try {
      await retryCaptureItem(id);
      await loadQueue();
    } finally {
      setIsProcessing(false);
    }
  }

  function handleSelectCategory(cat: 'diesel' | 'gas' | 'electricity' | 'shipment') {
    setSelectedCategory(cat);
    setCaptureError(null);
    const found = categories.find((c) => c.key === cat);
    if (found) setManualUnit(found.defaultUnit);
  }

  async function processFile(file: File) {
    const activeCategory = selectedCategory || detectCategoryFromFileName(file.name);
    setSelectedCategory(activeCategory);
    setCaptureError(null);
    setIsProcessing(true);

    try {
      // 1. Client-side crop/resize to max 1600px, compress <400KB, strip EXIF GPS (or bypass if PDF)
      const processed = await processAndCompressImage(file, file.name);

      // 2. Enqueue into IndexedDB
      const queued = await enqueueCapture({
        id: processed.idempotencyKey,
        category: activeCategory,
        blob: processed.blob,
        fileName: processed.fileName,
        fileSizeBytes: processed.fileSizeBytes,
      });

      const receiptCode = queued.id.slice(0, 8).toUpperCase();
      setConfirmedReceipt({ id: queued.id, code: receiptCode });

      if (isBatchMode) {
        setBatchCount((prev) => prev + 1);
      } else {
        setSelectedCategory(null);
      }

      await loadQueue();

      // Trigger upload immediately if online
      if (navigator.onLine) {
        await processQueueUploads();
        const updatedList = await getAllCaptureItems();
        setSubmissions(updatedList);
        const match = updatedList.find((i) => i.id === queued.id);
        if (match?.serverDocId) {
          setConfirmedReceipt({ id: queued.id, code: receiptCode, serverDocId: match.serverDocId });
        }
      }
    } catch (err: any) {
      console.error('Capture error:', err);
      setCaptureError(err?.message || 'ডকুমেন্ট আপলোড বা প্রসেসিং করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  }

  function handleFileCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  function handleDropFile(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCategory || !manualQuantity) return;

    setIsProcessing(true);
    setCaptureError(null);
    try {
      const parsedQty = parseFloat(manualQuantity);
      const queued = await enqueueCapture({
        id: crypto.randomUUID(),
        category: selectedCategory,
        manualQuantity: parsedQty,
        manualSlipNumber: manualSlipNumber,
        manualUnit,
      });

      const receiptCode = queued.id.slice(0, 8).toUpperCase();
      setConfirmedReceipt({ id: queued.id, code: receiptCode });
      setSelectedCategory(null);
      setIsManualMode(false);
      setManualQuantity('');
      setManualSlipNumber('');
      await loadQueue();

      if (navigator.onLine) {
        await processQueueUploads();
        await loadQueue();
      }
    } catch (err: any) {
      console.error('Manual capture error:', err);
      setCaptureError(err?.message || 'ম্যানুয়াল এন্ট্রি সংরক্ষণ করতে সমস্যা হয়েছে।');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleSubscribePush() {
    const sub = await requestAndSubscribePush();
    if (sub) {
      setPushSubscribed(true);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-16">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf,.pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFileCapture}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileCapture}
      />

      {/* Top PC Web Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                title="ড্যাশবোর্ডে ফিরে যান"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">ফিরে যান</span>
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-emerald-800 tracking-tight">কার্বনবিল</span>
                <span className="hidden sm:inline text-xs font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                  ইনজেশন পোর্টাল
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500">ফ্যাক্টরি ফ্লোর চালান ও ইউটিলিটি বিল ইনজেশন</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Batch Mode Switch */}
            <button
              onClick={() => setIsBatchMode(!isBatchMode)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                isBatchMode
                  ? 'bg-emerald-700 text-white shadow-emerald-200'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
              title="একের পর এক একাধিক চালান স্ক্যান করতে ব্যাচ মোড ব্যবহার করুন"
            >
              <Layers size={15} />
              <span>ব্যাচ মোড</span>
              {isBatchMode && (
                <span className="bg-emerald-900 text-emerald-100 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  {formatBanglaNumber(batchCount)}
                </span>
              )}
            </button>

            {/* Manual Mode Toggle */}
            <button
              onClick={() => setIsManualMode(!isManualMode)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                isManualMode
                  ? 'bg-amber-600 text-white shadow-amber-200'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <FileText size={15} />
              <span>{isManualMode ? 'স্ক্যান মোডে ফিরুন' : 'ম্যানুয়াল এন্ট্রি'}</span>
            </button>

            {/* Online/Offline Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs ${
                isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {isOnline ? <Wifi size={14} className="text-emerald-600" /> : <WifiOff size={14} className="text-rose-600" />}
              <span className="hidden sm:inline">{isOnline ? 'অনলাইন' : 'অফলাইন'}</span>
            </span>

            {/* Sync Button */}
            <button
              onClick={triggerSync}
              disabled={isProcessing}
              title="সার্ভারের সাথে সিঙ্ক করুন"
              className="p-2 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
            >
              <RefreshCw size={16} className={isProcessing ? 'animate-spin text-emerald-600' : ''} />
            </button>

            {/* Push Notification Setup */}
            {!pushSubscribed && (
              <button
                onClick={handleSubscribePush}
                title="পুশ নোটিফিকেশন চালু করুন"
                className="hidden md:flex p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs items-center gap-1.5 font-medium transition"
              >
                <Bell size={15} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Processing Banner */}
        {isProcessing && (
          <div className="mb-6 bg-teal-50 border border-teal-300 rounded-2xl p-4 shadow-sm animate-pulse flex items-center gap-3">
            <RefreshCw size={24} className="text-teal-600 animate-spin shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-teal-950">ডকুমেন্ট প্রক্রিয়াকরণ ও ব্যাকগ্রাউন্ড সিঙ্ক চলছে...</h4>
              <p className="text-xs text-teal-700">ফাইল কম্প্রেস করে সার্ভারে পাঠানো হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন।</p>
            </div>
          </div>
        )}

        {/* Error Alert Banner */}
        {captureError && (
          <div className="mb-6 bg-rose-50 border border-rose-300 rounded-2xl p-4 shadow-sm flex items-start gap-3">
            <AlertCircle size={24} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-rose-950">আপলোড ব্যর্থ হয়েছে</h4>
              <p className="text-xs text-rose-800 mt-0.5">{captureError}</p>
              <button
                onClick={() => setCaptureError(null)}
                className="mt-2 text-xs font-bold text-rose-700 hover:underline"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        )}

        {/* Confirmed Receipt Banner */}
        {confirmedReceipt && (
          <div className="mb-6 bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-5 shadow-sm animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-950">চালান সফলভাবে জমা দেওয়া হয়েছে!</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs text-emerald-800">রসিদ ট্র্যাকিং কোড:</span>
                  <span className="font-mono font-black text-sm bg-emerald-200/90 text-emerald-950 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                    {confirmedReceipt.code}
                  </span>
                  <span className="text-xs text-emerald-700">
                    — ডকুমেন্টটি হিসাবরক্ষকের পর্যালোচনার জন্য প্রস্তুত।
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <a
                href={`/?mode=review&docId=${confirmedReceipt.serverDocId || confirmedReceipt.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                <ExternalLink size={14} />
                পর্যালোচনা কিউ-তে বিলটি দেখুন
              </a>
              <button
                onClick={() => setConfirmedReceipt(null)}
                className="px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 rounded-xl transition"
              >
                বাতিল
              </button>
            </div>
          </div>
        )}

        {/* Responsive 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Capture & Ingestion Workspace (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6">
            {isManualMode ? (
              /* Manual Entry Card */
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        ম্যানুয়াল ফলব্যাক এন্ট্রি
                      </h2>
                      <p className="text-xs text-slate-500">চালান বা বিলের ছবি অস্পষ্ট হলে সরাসরি তথ্য প্রদান করুন</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
                    ম্যানুয়াল মোড
                  </span>
                </div>

                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">১. ক্যাটাগরি নির্বাচন করুন</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {categories.map((c) => {
                        const Icon = c.icon;
                        const isSelected = selectedCategory === c.key;
                        return (
                          <button
                            key={c.key}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(c.key);
                              setManualUnit(c.defaultUnit);
                            }}
                            className={`p-3 rounded-xl text-xs font-bold border text-left flex flex-col gap-1.5 transition ${
                              isSelected
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs ring-2 ring-emerald-400'
                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <Icon size={16} className={isSelected ? 'text-emerald-700' : 'text-slate-500'} />
                              <span>{c.labelBn}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-normal">{c.defaultUnit}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        ২. পরিমাণ ({manualUnit}) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          required
                          value={manualQuantity}
                          onChange={(e) => setManualQuantity(e.target.value)}
                          placeholder="যেমন: ৩,৫০০"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-bold text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition"
                        />
                        <span className="absolute right-3.5 top-3 text-xs font-semibold text-slate-400">
                          {manualUnit}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        ৩. স্লিপ / চালান নম্বর (ঐচ্ছিক)
                      </label>
                      <input
                        type="text"
                        value={manualSlipNumber}
                        onChange={(e) => setManualSlipNumber(e.target.value)}
                        placeholder="যেমন: POCL-44912"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={isProcessing || !selectedCategory || !manualQuantity}
                      className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm shadow-md transition disabled:opacity-50"
                    >
                      {isProcessing ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন ও কিউ-তে জমা দিন'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsManualMode(false)}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition"
                    >
                      বাতিল
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* PC Web File Ingestion Workspace */
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                {/* Step 1: Category Selection */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        ১. জ্বালানি বা ইউটিলিটি ক্যাটাগরি নির্বাচন করুন
                      </h3>
                      <p className="text-xs text-slate-500">
                        ক্যাটাগরি আগে নির্বাচন না করলেও ফাইলের নাম অনুযায়ী স্বয়ংক্রিয়ভাবে শনাক্ত হবে
                      </p>
                    </div>
                    {selectedCategory && (
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="text-xs font-semibold text-emerald-700 hover:underline"
                      >
                        ক্যাটাগরি পরিবর্তন
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = selectedCategory === cat.key;

                      return (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => handleSelectCategory(cat.key)}
                          className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition text-center shadow-xs ${
                            isSelected
                              ? `${cat.activeBorder} ${cat.accentBg} shadow-sm`
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-11 h-11 rounded-xl ${cat.color} flex items-center justify-center mb-2.5 shadow-xs`}>
                            <Icon size={22} strokeWidth={2.2} />
                          </div>
                          <span className="text-sm font-bold text-slate-900 tracking-tight leading-tight">
                            {cat.labelBn}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500 mt-0.5">
                            {cat.subBn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: PC Drag & Drop Dropzone */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">
                    ২. চালান বা বিলের ডকুমেন্ট আপলোড করুন
                  </h3>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDropFile}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                      isDragging
                        ? 'border-emerald-500 bg-emerald-50/80 scale-[1.01]'
                        : 'border-slate-300 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-400'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-xs text-emerald-700 flex items-center justify-center mx-auto mb-3.5">
                      <Upload size={30} strokeWidth={2} />
                    </div>

                    <h4 className="text-base font-bold text-slate-900 mb-1">
                      চালান বা বিলের পিডিএফ (PDF) অথবা ছবি ড্র্যাগ করে এখানে ছাড়ুন
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
                      কম্পিউটার থেকে সরাসরি ইনভয়েস, ক্যাশ মেমো, তিতাস/ডেসকো বিল বা ডেলিভারি চালান ড্রপ করুন
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition active:scale-95 cursor-pointer"
                      >
                        <Upload size={16} />
                        কম্পিউটার থেকে ফাইল বাছুন
                      </button>

                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={isProcessing}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition active:scale-95 cursor-pointer"
                      >
                        <Camera size={16} />
                        ক্যামেরা দিয়ে স্ক্যান
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 font-medium mt-4">
                      সমর্থিত ফরম্যাট: PDF, JPG, PNG, WEBP (ক্লাইন্ট-সাইড নিরাপদ অটো-কম্প্রেশন)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Submitted Submissions Queue (5 cols on lg) */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">আমার জমা দেওয়া চালানসমূহ</h2>
                  <p className="text-xs text-slate-500">অফলাইন ও অনলাইন ইনজেকশন হিস্ট্রি</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                    মোট: {formatBanglaNumber(submissions.length)}
                  </span>
                  <button
                    onClick={loadQueue}
                    title="রিফ্রেশ করুন"
                    className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {/* Submissions List */}
              {submissions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                    <FileText size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">এখনও কোনো চালান জমা দেওয়া হয়নি</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    বামপাশের ড্রপজোন বা আপলোড বাটন ব্যবহার করে প্রথম চালানটি জমা দিন।
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 overflow-y-auto max-h-[580px] pr-1">
                  {submissions.map((sub) => {
                    const isReceived = sub.status === 'received';
                    const isUploading = sub.status === 'uploading';
                    const isFailed = sub.status === 'failed';

                    return (
                      <div
                        key={sub.id}
                        className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 flex items-center justify-between gap-3 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0">
                            {sub.category === 'diesel' && <Fuel size={18} className="text-amber-600" />}
                            {sub.category === 'gas' && <Flame size={18} className="text-orange-600" />}
                            {sub.category === 'electricity' && <Zap size={18} className="text-yellow-600" />}
                            {sub.category === 'shipment' && <Truck size={18} className="text-blue-600" />}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 font-mono tracking-tight bg-slate-200/80 px-1.5 py-0.2 rounded text-[11px]">
                                {sub.receiptCode || sub.id.slice(0, 8).toUpperCase()}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {formatBanglaDate(sub.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 font-medium truncate mt-0.5" title={sub.fileName || 'ম্যানুয়াল চালান'}>
                              {sub.manualQuantity
                                ? `ম্যানুয়াল: ${formatBanglaNumber(sub.manualQuantity)} ${sub.manualUnit || ''}`
                                : sub.fileName || 'ক্যামেরা ফটো'}
                            </p>
                            {isFailed && sub.error && (
                              <p className="text-[10px] text-rose-600 font-medium truncate" title={sub.error}>
                                {sub.error}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status Badges & Action Buttons */}
                        <div className="shrink-0">
                          {isReceived && (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 size={12} /> গৃহীত
                              </span>
                              <a
                                href={`/?mode=review&docId=${sub.serverDocId || sub.id}`}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer"
                                title="পর্যালোচনা কিউ-তে বিলটি দেখুন"
                              >
                                <ExternalLink size={11} /> দেখুন
                              </a>
                            </div>
                          )}
                          {isUploading && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 animate-pulse">
                              <RefreshCw size={12} className="animate-spin" /> আপলোড হচ্ছে
                            </span>
                          )}
                          {sub.status === 'queued' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                              <Clock size={12} /> অপেক্ষমান
                            </span>
                          )}
                          {isFailed && (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                                <AlertCircle size={12} /> ব্যর্থ
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRetry(sub.id)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer"
                                title="পুনরায় আপলোড চেষ্টা করুন"
                              >
                                <RefreshCw size={11} /> পুনরায়
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CaptureScreen;
