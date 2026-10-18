import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  fetchReviewQueue,
  confirmDocument,
  bulkConfirmDocuments,
  requestRetake,
  reprocessDocument,
  fetchReviewSettings,
  ReviewQueueItem,
  ReviewField,
  ConfirmRequest,
} from './reviewApi';
import { DocumentImageViewer } from './DocumentImageViewer';
import { ReviewFieldsForm } from './ReviewFieldsForm';
import { ReviewQueueSidebar } from './ReviewQueueSidebar';
import { ArrowLeft, RefreshCw, CheckCircle2, AlertTriangle, Languages, Layers, FileText, Eye } from 'lucide-react';

interface ReviewWorkspaceProps {
  onBack?: () => void;
}

export function ReviewWorkspace({ onBack }: ReviewWorkspaceProps) {
  const { t, i18n } = useTranslation();
  const isBangla = i18n.language === 'bn';

  const [queue, setQueue] = useState<ReviewQueueItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<ReviewField | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [isBulkEnabled, setIsBulkEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReprocessing, setIsReprocessing] = useState<boolean>(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'queue' | 'viewer' | 'form'>('form');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [items, settings] = await Promise.all([
        fetchReviewQueue(filterType),
        fetchReviewSettings(),
      ]);
      setQueue(items);
      setIsBulkEnabled(settings.autoConfirmEnabled || true);

      // Select target docId from query params if specified
      const params = new URLSearchParams(window.location.search);
      const targetDocId = params.get('docId');
      if (targetDocId && items.some((d) => d.documentId.toLowerCase() === targetDocId.toLowerCase())) {
        setSelectedDocId(targetDocId);
      } else if (!selectedDocId || !items.some((d) => d.documentId === selectedDocId)) {
        // Prioritize the newest document that has extracted fields
        const withFields = items.filter((d) => d.fields && d.fields.length > 0);
        if (withFields.length > 0) {
          const newest = [...withFields].sort(
            (a, b) => new Date(b.capturedAtUtc).getTime() - new Date(a.capturedAtUtc).getTime()
          )[0];
          setSelectedDocId(newest.documentId);
        } else if (items.length > 0) {
          setSelectedDocId(items[0].documentId);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [filterType, selectedDocId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentDoc: ReviewQueueItem | undefined =
    queue.find((d) => d.documentId === selectedDocId) || queue[0];

  const handleNextDocument = useCallback(() => {
    if (queue.length > 0) {
      const currIdx = queue.findIndex((d) => d.documentId === currentDoc?.documentId);
      const nextIdx = currIdx === -1 ? 0 : (currIdx + 1) % queue.length;
      setSelectedDocId(queue[nextIdx].documentId);
      setActiveField(null);
    }
  }, [queue, currentDoc?.documentId]);

  const handleConfirmCurrent = useCallback(
    async (payload: ConfirmRequest) => {
      if (!currentDoc) return;

      const success = await confirmDocument(currentDoc.documentId, payload);
      if (success) {
        setBannerMessage(
          isBangla
            ? `চালান ${currentDoc.fileName} সফলভাবে অনুমোদিত হয়েছে!`
            : `Document ${currentDoc.fileName} approved successfully!`
        );
        setTimeout(() => setBannerMessage(null), 3000);

        const currId = currentDoc.documentId;
        setQueue((prev) => prev.filter((d) => d.documentId !== currId));
        setSelectedDocId(null);
        setActiveField(null);
      }
    },
    [currentDoc, isBangla]
  );

  const handleRejectRetake = useCallback(
    async (reason: string) => {
      if (!currentDoc) return;
      const currId = currentDoc.documentId;
      await requestRetake(currId, reason);
      setQueue((prev) => prev.filter((d) => d.documentId !== currId));
      setSelectedDocId(null);
      setActiveField(null);
      setBannerMessage(
        isBangla
          ? `ফ্লোরে ছবি পুনরায় তোলার অনুরোধ পাঠানো হয়েছে (${reason})`
          : `Retake requested from floor (${reason})`
      );
      setTimeout(() => setBannerMessage(null), 3000);
    },
    [currentDoc, isBangla]
  );

  const handleReprocessCurrent = useCallback(async () => {
    if (!currentDoc) return;
    setIsReprocessing(true);
    setBannerMessage(
      isBangla
        ? 'এআই ভিশন দিয়ে পুনরায় এক্সট্রাক্ট করা হচ্ছে...'
        : 'Re-extracting fields with AI Vision...'
    );
    try {
      await reprocessDocument(currentDoc.documentId);
      setTimeout(async () => {
        await loadData();
        setIsReprocessing(false);
        setBannerMessage(
          isBangla
            ? 'এক্সট্রাকশন সফলভাবে সম্পন্ন হয়েছে!'
            : 'AI extraction completed successfully!'
        );
        setTimeout(() => setBannerMessage(null), 3000);
      }, 2000);
    } catch {
      setIsReprocessing(false);
      setBannerMessage(
        isBangla
          ? 'পুনরায় এক্সট্রাক্ট করতে সমস্যা হয়েছে।'
          : 'Failed to reprocess document.'
      );
      setTimeout(() => setBannerMessage(null), 3000);
    }
  }, [currentDoc, isBangla, loadData]);

  const handleBulkConfirm = useCallback(async () => {
    const highConfIds = queue
      .filter((d) => d.overallConfidence >= 0.9)
      .map((d) => d.documentId);

    if (highConfIds.length === 0) return;

    const res = await bulkConfirmDocuments(highConfIds);
    setBannerMessage(
      isBangla
        ? `${res.succeeded}টি উচ্চ আত্মবিশ্বাসী চালান একযোগে অনুমোদিত হয়েছে!`
        : `${res.succeeded} high-confidence documents approved in bulk!`
    );
    setTimeout(() => setBannerMessage(null), 3000);
    loadData();
  }, [queue, loadData, isBangla]);

  // Global Keyboard Shortcuts (N for next, Enter handled in form)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return; // Don't trigger shortcuts when typing in inputs
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleNextDocument();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextDocument]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Workspace Top Header */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-3 sm:px-6 flex items-center justify-between shadow-sm shrink-0 z-10 text-white">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 -ml-1 text-slate-300 hover:bg-slate-800 rounded-lg transition cursor-pointer shrink-0"
              title={isBangla ? 'ফিরে যান' : 'Go Back'}
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center p-1 shadow-inner shrink-0">
            <img src="/logo-icon.png" alt="CarbonBill" className="w-6 h-6 object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base font-black text-white tracking-tight truncate">
              {isBangla
                ? 'চালান ও বিল পর্যালোচনা'
                : 'Review & Verification'}
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden sm:block truncate">
              {isBangla
                ? 'হিসাবরক্ষক ও কমপ্লায়েন্সের জন্য অপটিমাইজড ডুয়াল ভিউ'
                : 'Dual-pane verification workspace for accounts & compliance'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {bannerMessage && (
            <div className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 animate-fade-in shadow-xs max-w-[180px] sm:max-w-none truncate">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span className="truncate">{bannerMessage}</span>
            </div>
          )}

          {/* Language Switcher */}
          <button
            onClick={() => i18n.changeLanguage(isBangla ? 'en' : 'bn')}
            className="text-xs font-semibold px-2 sm:px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition cursor-pointer"
            title={isBangla ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
          >
            {isBangla ? 'English' : 'বাংলা'}
          </button>

          <button
            onClick={loadData}
            title={isBangla ? 'রিফ্রেশ করুন' : 'Refresh Queue'}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin text-emerald-400' : ''} />
          </button>
        </div>
      </header>

      {/* Mobile/Tablet Pane Switcher Tabs (Only visible on screens < lg) */}
      <div className="lg:hidden flex bg-slate-200/90 p-1 mx-3 mt-2 rounded-2xl text-xs font-bold text-slate-600 border border-slate-300 shrink-0 shadow-2xs">
        <button
          type="button"
          onClick={() => setMobileTab('queue')}
          className={`flex-1 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'queue' ? 'bg-slate-900 text-white shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          <Layers size={13} />
          <span>{isBangla ? 'কিউ' : 'Queue'}</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${mobileTab === 'queue' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-300 text-slate-800'}`}>
            {queue.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('viewer')}
          className={`flex-1 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'viewer' ? 'bg-slate-900 text-white shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          <FileText size={13} />
          <span>{isBangla ? 'চালানের ছবি' : 'Bill Viewer'}</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('form')}
          className={`flex-1 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'form' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          <CheckCircle2 size={13} />
          <span>{isBangla ? 'যাচাই ও অনুমোদন' : 'Verify'}</span>
        </button>
      </div>

      {/* Main Review Layout: 3 columns on lg+, single active pane on < lg */}
      <div className="flex-1 lg:grid lg:grid-cols-12 gap-3 sm:gap-4 p-3 sm:p-4 overflow-hidden min-h-0 flex flex-col">
        {/* Column 1: Review Queue (3 cols on lg) */}
        <div className={`col-span-12 lg:col-span-3 h-full overflow-hidden ${mobileTab === 'queue' ? 'flex-1 flex flex-col' : 'hidden lg:flex lg:flex-col'}`}>
          <ReviewQueueSidebar
            queue={queue}
            selectedDocumentId={currentDoc?.documentId || null}
            onSelectDocument={(doc) => {
              setSelectedDocId(doc.documentId);
              setActiveField(null);
              // On mobile, auto-switch to form view upon selection
              setMobileTab('form');
            }}
            selectedFilter={filterType}
            onFilterChange={(filter) => {
              setFilterType(filter);
              setSelectedDocId(null);
              setActiveField(null);
            }}
            onBulkConfirm={handleBulkConfirm}
            isBulkEnabled={isBulkEnabled}
            isBangla={isBangla}
          />
        </div>

        {/* Column 2: Original Document Image Viewer (5 cols on lg) */}
        <div className={`col-span-12 lg:col-span-5 h-full overflow-hidden ${mobileTab === 'viewer' ? 'flex-1 flex flex-col' : 'hidden lg:flex lg:flex-col'}`}>
          {currentDoc ? (
            <DocumentImageViewer
              documentId={currentDoc.documentId}
              fileName={currentDoc.fileName}
              contentType={currentDoc.contentType}
              activeField={activeField}
              fields={currentDoc.fields}
              isBangla={isBangla}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
              {isBangla ? 'কোনো ডকুমেন্ট নির্বাচিত নেই।' : 'No document selected.'}
            </div>
          )}
        </div>

        {/* Column 3: Extracted Fields Editor (4 cols on lg) */}
        <div className={`col-span-12 lg:col-span-4 h-full overflow-hidden ${mobileTab === 'form' ? 'flex-1 flex flex-col' : 'hidden lg:flex lg:flex-col'}`}>
          {currentDoc ? (
            <ReviewFieldsForm
              document={currentDoc}
              activeField={activeField}
              onSelectField={setActiveField}
              onConfirm={handleConfirmCurrent}
              onRejectRetake={handleRejectRetake}
              onReprocess={handleReprocessCurrent}
              isReprocessing={isReprocessing}
              onNextDocument={handleNextDocument}
              isBangla={isBangla}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
              {isBangla ? 'কিউ খালি।' : 'Review queue is empty.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReviewWorkspace;
