import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, Zap, Fuel, Flame, Truck } from 'lucide-react';
import { uploadReceiptFromDashboard } from '../dashboardApi';

interface DashboardReceiptUploaderProps {
  isBangla: boolean;
  onReceiptUploaded: () => Promise<void> | void;
  onGoToReview?: (docId?: string) => void;
}

export const DashboardReceiptUploader: React.FC<DashboardReceiptUploaderProps> = ({
  isBangla,
  onReceiptUploaded,
  onGoToReview,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string; docId?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { key: '', labelBn: 'স্বয়ংক্রিয় সনাক্তকরণ', labelEn: 'Auto-detect Type', icon: Zap },
    { key: 'electricity', labelBn: 'বিদ্যুৎ বিল', labelEn: 'Electricity Bill', icon: Zap },
    { key: 'diesel', labelBn: 'ডিজেল স্লিপ', labelEn: 'Diesel Slip', icon: Fuel },
    { key: 'gas', labelBn: 'গ্যাস বিল', labelEn: 'Gas Bill', icon: Flame },
    { key: 'shipment', labelBn: 'পরিবহন চালান', labelEn: 'Freight Challan', icon: Truck },
  ];

  const handleFileProcess = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setStatusMessage({
      type: 'info',
      text: isBangla
        ? `"${file.name}" আপলোড ও Groq AI দিয়ে বিশ্লেষণ করা হচ্ছে...`
        : `Uploading and analyzing "${file.name}" with Groq Vision/LLM...`,
    });

    try {
      const result = await uploadReceiptFromDashboard(file, selectedCategory || undefined);
      if (result.success) {
        setStatusMessage({
          type: 'success',
          text: isBangla
            ? `রসিদ সফলভাবে আপলোড হয়েছে! ড্যাশবোর্ডের মোট নির্গমন আপডেট করা হয়েছে।`
            : `Receipt successfully analyzed! Dashboard carbon footprint updated.`,
          docId: result.documentId,
        });

        // Trigger immediate dashboard recalculation & data refresh
        await onReceiptUploaded();
      } else {
        setStatusMessage({
          type: 'error',
          text: result.message || (isBangla ? 'আপলোড ব্যর্থ হয়েছে।' : 'Upload failed.'),
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || (isBangla ? 'প্রক্রিয়াকরণে ত্রুটি হয়েছে।' : 'Processing error occurred.'),
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
            <Upload size={18} className="text-teal-700" />
            {isBangla ? 'রসিদ বা চালান জমা দিন (লাইভ পদচিহ্ন আপডেট)' : 'Submit Receipt or Challan (Live Footprint Update)'}
          </h3>
          <p className="text-xs text-slate-500 pt-0.5">
            {isBangla
              ? 'বিদ্যুৎ, গ্যাস, ডিজেল বা পরিবহনের যে কোনো বিল আপলোড করুন — গ্রক এআই সাথে সাথে তথ্য বিশ্লেষণ করে ড্যাশবোর্ড আপডেট করবে।'
              : 'Upload any utility bill, fuel slip or challan — Groq AI instantly extracts metrics and dynamically recalculates your dashboard.'}
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((c) => {
            const Icon = c.icon;
            const isSelected = selectedCategory === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setSelectedCategory(c.key)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
                  isSelected
                    ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon size={12} />
                {isBangla ? c.labelBn : c.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* Drag & Drop Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2.5 ${
          isDragging
            ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-400'
            : isUploading
            ? 'border-slate-300 bg-slate-50 cursor-wait'
            : 'border-slate-300 hover:border-teal-600 hover:bg-teal-50/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileProcess(e.target.files[0]);
            }
          }}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <RefreshCw size={28} className="text-teal-700 animate-spin" />
            <p className="text-xs font-bold text-slate-700">
              {isBangla ? 'Groq Vision/LLM তথ্য নিষ্কাশন করছে...' : 'Groq AI extracting bill metrics...'}
            </p>
          </div>
        ) : (
          <>
            <div className="p-3 bg-teal-50 text-teal-800 rounded-full">
              <Upload size={22} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xs md:text-sm font-bold text-slate-800">
                {isBangla
                  ? 'বিল বা চালানের ছবি / পিডিএফ এখানে ড্রপ করুন অথবা ক্লিক করে নির্বাচন করুন'
                  : 'Drag & drop bill image / PDF here, or click to browse'}
              </p>
              <p className="text-[11px] text-slate-400 pt-0.5">
                {isBangla
                  ? 'সমর্থিত ফরম্যাট: JPG, PNG, WEBP, PDF (DESCO, BPDB, Padma Oil, Titas Gas ইত্যাদি)'
                  : 'Supported formats: JPG, PNG, WEBP, PDF (DESCO, BPDB, Padma Oil, Titas Gas, etc.)'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-teal-50 border-teal-200 text-teal-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
            ) : (
              <RefreshCw size={16} className="text-teal-600 animate-spin shrink-0" />
            )}
            <span className="font-semibold">{statusMessage.text}</span>
          </div>

          {statusMessage.type === 'success' && onGoToReview && statusMessage.docId && (
            <button
              type="button"
              onClick={() => onGoToReview(statusMessage.docId)}
              className="px-2.5 py-1 bg-white text-emerald-800 border border-emerald-300 rounded-lg font-bold text-[11px] hover:bg-emerald-100 transition shrink-0"
            >
              {isBangla ? 'রিভিউ কিউতে দেখুন' : 'View in Review Queue'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
