import React, { useState } from 'react';
import { ReportItem } from '../types';
import { toBanglaDigits } from '../../../shared';
import {
  FileText,
  FileSpreadsheet,
  Share2,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Download,
  AlertTriangle,
  Fingerprint,
} from 'lucide-react';
import { getPdfDownloadUrl, getExcelDownloadUrl } from '../reportsApi';

interface ReportPreviewProps {
  report: ReportItem;
  isBangla: boolean;
  onApprove: (id: string) => Promise<void>;
  onOpenShareModal: (report: ReportItem) => void;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  report,
  isBangla,
  onApprove,
  onOpenShareModal,
}) => {
  const [approving, setApproving] = useState<boolean>(false);
  const isLocked = report.status === 'Locked';

  async function handleApproveClick() {
    setApproving(true);
    try {
      await onApprove(report.id);
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-6">
      {/* Top Header & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                isLocked
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
              }`}
            >
              {isLocked
                ? isBangla
                  ? '🔒 স্থায়ী ও অপরিবর্তনীয় (Locked)'
                  : '🔒 Permanently Locked'
                : isBangla
                ? '📋 পর্যালোচনার জন্য প্রস্তুত (Ready for Review)'
                : 'Ready for Review'}
            </span>
            <span className="text-xs font-mono text-slate-500 font-semibold">
              v{report.version}.0
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            {isBangla
              ? `কর্পোরেট GHG নির্গমন প্রতিবেদন — ${report.period}`
              : `Corporate GHG Emission Report — ${report.period}`}
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isLocked && (
            <button
              onClick={handleApproveClick}
              disabled={approving || !report.readinessChecklist.isReadyForApproval}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
            >
              <CheckCircle2 size={15} />
              {approving
                ? isBangla
                  ? 'অনুমোদন হচ্ছে...'
                  : 'Approving...'
                : isBangla
                ? 'অনুমোদন ও লক করুন'
                : 'Approve & Lock Report'}
            </button>
          )}

          <button
            onClick={() => onOpenShareModal(report)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <Share2 size={14} />
            {isBangla ? 'অডিটর শেয়ার লিঙ্ক' : 'Auditor Share Link'}
          </button>
        </div>
      </div>

      {/* KPI Totals Matrix */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <span className="text-xs font-semibold text-slate-500">
            {isBangla ? 'মোট নির্গমন (Total Footprint)' : 'Total Footprint'}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">
              {isBangla ? toBanglaDigits(report.totalEmissions.toFixed(2)) : report.totalEmissions.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-slate-500">tCO₂e</span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <span className="text-xs font-semibold text-slate-500">
            {isBangla ? 'স্কোপ ১ (জ্বালানি/গ্যাস)' : 'Scope 1 (Fuels)'}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-orange-600">
              {isBangla ? toBanglaDigits(report.scope1Emissions.toFixed(2)) : report.scope1Emissions.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-slate-500">tCO₂e</span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <span className="text-xs font-semibold text-slate-500">
            {isBangla ? 'স্কোপ ২ (গ্রিড বিদ্যুৎ)' : 'Scope 2 (Grid Electricity)'}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-sky-600">
              {isBangla ? toBanglaDigits(report.scope2Emissions.toFixed(2)) : report.scope2Emissions.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-slate-500">tCO₂e</span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <span className="text-xs font-semibold text-slate-500">
            {isBangla ? 'ডেটা কোয়ালিটি স্কোর (DQS)' : 'Data Quality Score'}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-teal-800">
              {isBangla
                ? toBanglaDigits((report.dataQualityScore * 100).toFixed(0))
                : (report.dataQualityScore * 100).toFixed(0)}
              %
            </span>
            <span className="text-xs font-bold text-teal-700 ml-1">({report.dqsGrade})</span>
          </div>
        </div>
      </div>

      {/* Cryptographic Hash Seal (if locked) */}
      {isLocked && report.contentHashSha256 && (
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-1.5 text-xs text-emerald-950">
          <div className="flex items-center gap-2 font-bold">
            <Fingerprint size={16} className="text-emerald-700" />
            <span>
              {isBangla
                ? 'ক্রিপ্টোগ্রাফিক ডিজিটাল সিলমোহর (SHA-256 Hash):'
                : 'Cryptographic Snapshot Seal (SHA-256):'}
            </span>
          </div>
          <p className="font-mono text-[11px] text-slate-700 break-all select-all bg-white/70 p-1.5 rounded border border-emerald-200">
            {report.contentHashSha256}
          </p>
          <div className="flex items-center justify-between text-[11px] text-emerald-800 pt-0.5">
            <span>
              {isBangla ? 'অনুমোদনকারী কর্মকর্তা: ' : 'Signed By: '}
              <strong>{report.approvedBy || 'Managing Director'}</strong>
            </span>
            <span>
              {isBangla ? 'তারিখ: ' : 'Date: '}
              {report.approvedAt ? new Date(report.approvedAt).toLocaleDateString() : '2026-09-05'}
            </span>
          </div>
        </div>
      )}

      {/* Mandatory GHG Protocol Disclaimer (Rule 16) */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
        <ShieldCheck size={18} className="text-teal-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800">
            {isBangla ? 'GHG প্রোটোকল মেথডোলজি অস্বীকৃতি (Disclaimer):' : 'GHG Protocol Methodology Disclaimer:'}
          </span>
          <p className="mt-0.5 leading-relaxed">
            {isBangla
              ? 'এই প্রতিবেদনের ফলাফলসমূহ GHG Protocol Corporate Accounting and Reporting Standard মেথডোলজি অনুযায়ী হিসাবকৃত বৈজ্ঞানিক প্রকৌশল প্রাক্কলন, কোনো তৃতীয়-পক্ষের সার্টিফায়েড অডিট নয়।'
              : 'Estimates aligned with GHG Protocol methodology, not audited or certified. Figures are calculated based on confirmed primary supplier utility invoices and location-based grid factors.'}
          </p>
        </div>
      </div>

      {/* Download Action Strip */}
      <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-700">
          {isBangla ? 'ক্রেতা অডিট ফাইল ডাউনলোড করুন:' : 'Download Buyer Audit Bundles:'}
        </span>

        <div className="flex items-center gap-2 flex-wrap">
          {/* PDF Bangla */}
          <a
            href={getPdfDownloadUrl(report.id, 'bn')}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <FileText size={14} />
            {isBangla ? 'পিডিএফ (বাংলা)' : 'PDF (Bangla)'}
          </a>

          {/* PDF English */}
          <a
            href={getPdfDownloadUrl(report.id, 'en')}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <FileText size={14} />
            {isBangla ? 'পিডিএফ (English)' : 'PDF (English)'}
          </a>

          {/* Excel ClosedXML */}
          <a
            href={getExcelDownloadUrl(report.id)}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <FileSpreadsheet size={14} />
            {isBangla ? 'এক্সেল (ClosedXML)' : 'Excel (.xlsx)'}
          </a>
        </div>
      </div>
    </div>
  );
};
