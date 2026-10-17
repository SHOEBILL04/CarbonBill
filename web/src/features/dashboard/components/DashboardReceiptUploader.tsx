import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, Zap, Fuel, Flame, Truck } from 'lucide-react';
import { uploadReceiptFromDashboard } from '../dashboardApi';
import { triggerFlagEvaluation } from '../../flags/flagsApi';

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
        // Trigger live flag evaluation so missing document flags resolve and new receipt anomalies are caught
        await triggerFlagEvaluation('2026-09');

        setStatusMessage({
          type: 'success',
          text: isBangla
            ? `রসিদ সফলভাবে আপলোড হয়েছে! ড্যাশবোর্ড ও কার্বন ফ্ল্যাগস আপডেট করা হয়েছে।`
            : `Receipt successfully analyzed! Dashboard carbon footprint and flags updated.`,
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
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-xs space-y-3">
      {/* Header & Category Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
            <Upload size={16} className="text-[#3f593f]" />
            {isBangla ? 'রসিদ বা চালান জমা দিন' : 'Quick Ingest: Energy Receipt or Bill'}
          </h3>
          <p className="text-[11px] text-stone-500 pt-0.5">
            {isBangla
              ? 'বিদ্যুৎ, গ্যাস বা জ্বালানির বিল আপলোড করুন — এআই সাথে সাথে পদচিহ্ন আপডেট করবে।'
              : 'Upload utility bills or slips — AI extracts metrics and updates your footprint dynamically.'}
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1">
          {categories.map((c) => {
            const Icon = c.icon;
            const isSelected = selectedCategory === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setSelectedCategory(c.key)}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition flex items-center gap-1 ${
                  isSelected
                    ? 'bg-[#2d3c2d] text-white border-[#2d3c2d] shadow-2xs'
                    : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                }`}
              >
                <Icon size={11} />
                {isBangla ? c.labelBn : c.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* Streamlined Drag & Drop Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl py-4 px-4 text-center cursor-pointer transition flex items-center justify-center gap-3 ${
          isDragging
            ? 'border-[#3f593f] bg-[#f4f7f4] ring-2 ring-[#cfddcf]'
            : isUploading
            ? 'border-stone-300 bg-stone-50 cursor-wait'
            : 'border-stone-300/80 hover:border-[#3f593f] hover:bg-[#f4f7f4]/40'
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
          <div className="flex items-center gap-2.5 py-1">
            <RefreshCw size={20} className="text-[#3f593f] animate-spin" />
            <p className="text-xs font-bold text-stone-700">
              {isBangla ? 'Groq Vision/LLM তথ্য নিষ্কাশন করছে...' : 'Groq AI extracting bill metrics...'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            <div className="p-2 bg-[#e6ede6] text-[#2d3c2d] rounded-lg shrink-0">
              <Upload size={18} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-800">
                {isBangla
                  ? 'বিল বা চালানের ছবি / পিডিএফ এখানে ড্রপ করুন অথবা নির্বাচন করুন'
                  : 'Drop bill image or PDF here, or click to browse'}
              </p>
              <p className="text-[10px] text-stone-400">
                DESCO, BPDB, Padma Oil, Titas Gas (PDF, PNG, JPG)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            statusMessage.type === 'success'
              ? 'bg-[#f4f7f4] border-[#cfddcf] text-[#2d3c2d]'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-stone-100 border-stone-200 text-stone-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 size={15} className="text-[#3f593f] shrink-0" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
            ) : (
              <RefreshCw size={15} className="text-[#3f593f] animate-spin shrink-0" />
            )}
            <span className="font-semibold text-[11px]">{statusMessage.text}</span>
          </div>

          {statusMessage.type === 'success' && onGoToReview && statusMessage.docId && (
            <button
              type="button"
              onClick={() => onGoToReview(statusMessage.docId)}
              className="px-2.5 py-1 bg-white text-[#2d3c2d] border border-[#cfddcf] rounded-lg font-bold text-[10px] hover:bg-stone-50 transition shrink-0"
            >
              {isBangla ? 'রিভিউ কিউ' : 'Review Queue'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
