import React from 'react';
import { AuditorLineItem } from '../types';
import { toBanglaDigits, formatBdt } from '../../../shared';
import { X, ShieldCheck, FileText, CheckCircle2, Award, Lock, ExternalLink, Calendar } from 'lucide-react';

interface ProvenanceInspectorModalProps {
  item: AuditorLineItem;
  redactPrices: boolean;
  isBangla: boolean;
  onClose: () => void;
}

export const ProvenanceInspectorModal: React.FC<ProvenanceInspectorModalProps> = ({
  item,
  redactPrices,
  isBangla,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-100 text-teal-800 rounded-xl">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                  {item.scope}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  ID: {item.id}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-base mt-0.5">
                {isBangla ? item.sourceNameBn : item.sourceNameEn}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Traceability Grid */}
        <div className="space-y-3 text-xs">
          {/* 1. Primary Source Document */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <FileText size={14} className="text-teal-700" />
                {isBangla ? 'মূল চালানের বিবরণ (Source Document):' : 'Primary Document Record:'}
              </span>
              <span className="font-mono font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {item.documentId}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-slate-400">{isBangla ? 'নথির ধরন:' : 'Type:'}</span>{' '}
                <strong className="text-slate-700">
                  {isBangla ? item.documentTypeBn : item.documentTypeEn}
                </strong>
              </div>
              <div>
                <span className="text-slate-400">{isBangla ? 'চালানের তারিখ:' : 'Date:'}</span>{' '}
                <strong className="text-slate-700">{item.documentDate}</strong>
              </div>
              <div>
                <span className="text-slate-400">{isBangla ? 'OCR নির্ভরযোগ্যতা:' : 'OCR Score:'}</span>{' '}
                <strong className="text-emerald-700 font-mono">
                  {isBangla ? toBanglaDigits(item.ocrConfidence.toFixed(1)) : item.ocrConfidence.toFixed(1)}%
                </strong>
              </div>
              <div>
                <span className="text-slate-400">{isBangla ? 'যাচাইকারী:' : 'Confirmed By:'}</span>{' '}
                <strong className="text-slate-700">{item.confirmedBy}</strong>
              </div>
            </div>
          </div>

          {/* 2. Measured Activity & Emissions */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-teal-50/60 border border-teal-200/80 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-teal-900">
                {isBangla ? 'নিশ্চিতকৃত পরিমাণ (Activity):' : 'Verified Activity:'}
              </span>
              <p className="text-sm font-black text-teal-950 font-mono">
                {isBangla
                  ? toBanglaDigits(item.activityQuantity.toLocaleString('en-US'))
                  : item.activityQuantity.toLocaleString('en-US')}{' '}
                {item.activityUnit}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-500">
                {isBangla ? 'হিসাবকৃত নির্গমন:' : 'Carbon Emissions:'}
              </span>
              <p className="text-sm font-black text-slate-900 font-mono">
                {isBangla ? toBanglaDigits(item.emissionsTco2e.toFixed(2)) : item.emissionsTco2e.toFixed(2)}{' '}
                tCO₂e
              </p>
            </div>
          </div>

          {/* 3. Commercial BDT Amount (Price Redaction Enforcement) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <span className="font-semibold text-slate-600">
              {isBangla ? 'চালানের আর্থিক পরিমাণ (Billed Price):' : 'Billed Invoice Amount:'}
            </span>
            {redactPrices ? (
              <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1 font-mono text-[11px]">
                <Lock size={12} /> {isBangla ? '[গোপনীয় - বাণিজ্যিক নিরাপত্তা]' : '[Confidential - Redacted]'}
              </span>
            ) : (
              <span className="font-mono font-bold text-slate-900">
                {formatBdt(item.billedAmountBdt || 0, { useBanglaDigits: isBangla })}
              </span>
            )}
          </div>

          {/* 4. Applied Emission Factor Citation */}
          <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/70 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                <Award size={14} className="text-emerald-700" />
                {isBangla ? 'প্রয়োগকৃত নির্গমন ফ্যাক্টর:' : 'Applied Emission Factor:'}
              </span>
              <span className="font-mono font-bold text-emerald-900">
                {item.factorValue} kg CO₂e / {item.activityUnit}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong>{isBangla ? 'উৎস ও বছর: ' : 'Source: '}</strong>
              {item.factorSource} ({item.factorCitationYear})
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400">
            {isBangla ? 'যাচাই সময়: ' : 'Confirmed: '}
            {new Date(item.confirmedAt).toLocaleDateString()}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl transition"
          >
            {isBangla ? 'বন্ধ করুন' : 'Close Inspector'}
          </button>
        </div>
      </div>
    </div>
  );
};
