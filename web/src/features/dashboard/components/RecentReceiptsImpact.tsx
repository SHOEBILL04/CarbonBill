import React, { useState } from 'react';
import { ReceiptImpactItem } from '../types';
import { toBanglaDigits, formatBdt } from '../../../shared';
import { quickConfirmReceipt } from '../dashboardApi';
import { triggerFlagEvaluation } from '../../flags/flagsApi';
import {
  FileText,
  CheckCircle2,
  Clock,
  Zap,
  Fuel,
  Flame,
  Truck,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface RecentReceiptsImpactProps {
  receipts: ReceiptImpactItem[];
  isBangla: boolean;
  onReceiptUpdated: () => Promise<void> | void;
  onGoToReview?: (docId?: string) => void;
}

export const RecentReceiptsImpact: React.FC<RecentReceiptsImpactProps> = ({
  receipts,
  isBangla,
  onReceiptUpdated,
  onGoToReview,
}) => {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (!receipts || receipts.length === 0) {
    return null;
  }

  const handleQuickApprove = async (docId: string) => {
    setConfirmingId(docId);
    try {
      const ok = await quickConfirmReceipt(docId);
      if (ok) {
        await triggerFlagEvaluation('2026-09');
        await onReceiptUpdated();
      }
    } finally {
      setConfirmingId(null);
    }
  };

  const getCategoryIcon = (docType: string, fileName: string) => {
    const combined = `${docType} ${fileName}`.toLowerCase();
    if (combined.includes('diesel') || combined.includes('fuel')) return <Fuel size={14} className="text-amber-600" />;
    if (combined.includes('gas') || combined.includes('titas')) return <Flame size={14} className="text-orange-600" />;
    if (combined.includes('transport') || combined.includes('ship') || combined.includes('truck')) return <Truck size={14} className="text-purple-600" />;
    return <Zap size={14} className="text-sky-600" />;
  };

  const totalReceiptsTco2e = receipts.reduce((sum, r) => sum + (r.emissionsTco2e || 0), 0);

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <FileText size={17} className="text-[#2d3c2d]" />
          <h3 className="font-bold text-stone-900 text-sm md:text-base">
            {isBangla ? 'রসিদের ভিত্তিতে কার্বন নির্গমন প্রভাব' : 'Evidence Receipts & Footprint Impact'}
          </h3>
          <span className="px-2 py-0.5 bg-[#e6ede6] border border-[#cfddcf] text-[#2d3c2d] text-[10px] font-bold rounded-full">
            {isBangla ? `${toBanglaDigits(receipts.length)}টি রসিদ` : `${receipts.length} receipts`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold text-stone-600 flex items-center gap-1.5">
            <span>{isBangla ? 'রসিদ থেকে নির্গমন:' : 'Receipt Emissions:'}</span>
            <span className="text-[#2d3c2d] font-black">
              +{isBangla ? toBanglaDigits(totalReceiptsTco2e.toFixed(3)) : totalReceiptsTco2e.toFixed(3)} tCO₂e
            </span>
          </div>

          {onGoToReview && (
            <button
              onClick={() => onGoToReview()}
              className="text-xs font-bold text-[#2d3c2d] hover:text-[#172117] hover:underline hidden sm:inline-flex items-center gap-1"
            >
              <span>{isBangla ? 'সব দেখুন' : 'View all'}</span>
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Receipts Table / List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-stone-700">
          <thead>
            <tr className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200 text-[11px]">
              <th className="py-2.5 px-3">{isBangla ? 'রসিদ ও নথি' : 'Receipt & Document'}</th>
              <th className="py-2.5 px-3">{isBangla ? 'সরবরাহকারী / বিল নং' : 'Vendor / Bill No'}</th>
              <th className="py-2.5 px-3">{isBangla ? 'পরিমাণ ও খরচ' : 'Quantity & Cost'}</th>
              <th className="py-2.5 px-3">{isBangla ? 'নির্গমন প্রভাব' : 'Emission Impact'}</th>
              <th className="py-2.5 px-3">{isBangla ? 'স্ট্যাটাস ও পদক্ষেপ' : 'Status & Action'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {receipts.map((r) => {
              const isVerified = r.status === 'Calculated' || r.status === 'Confirmed';
              const scopeLabel = r.scope ? `Scope ${r.scope}` : (r.docType?.includes('Electric') ? 'Scope 2' : 'Scope 1');

              return (
                <tr key={r.documentId} className="hover:bg-stone-50/80 transition">
                  {/* File & Type */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-stone-100 rounded-lg shrink-0">
                        {getCategoryIcon(r.docType, r.fileName)}
                      </div>
                      <div>
                        <p className="font-bold text-stone-900 truncate max-w-[180px]" title={r.fileName}>
                          {r.fileName}
                        </p>
                        <p className="text-[10px] text-stone-400">
                          {r.capturedAtUtc ? r.capturedAtUtc.slice(0, 10) : ''}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Vendor & Bill No */}
                  <td className="py-3 px-3">
                    <p className="font-medium text-stone-800">
                      {r.vendor || (isBangla ? 'অজ্ঞাত ভেন্ডর' : 'Detected Vendor')}
                    </p>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-stone-400">
                        {r.billNumber ? `#${r.billNumber}` : (isBangla ? 'বিল নং নেই' : 'No Bill #')}
                      </span>
                      {r.period && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-[#e6ede6] text-[#2d3c2d] rounded border border-[#cfddcf]">
                          {r.period}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Quantity & Amount */}
                  <td className="py-3 px-3">
                    <p className="font-bold text-stone-900">
                      {r.quantity != null
                        ? `${isBangla ? toBanglaDigits(r.quantity.toLocaleString()) : r.quantity.toLocaleString()} ${r.unit || ''}`
                        : '—'}
                    </p>
                    {r.amountBdt != null && (
                      <p className="text-[10px] text-stone-500">
                        {formatBdt(r.amountBdt, { useBanglaDigits: isBangla })}
                      </p>
                    )}
                  </td>

                  {/* Emission Impact */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-[#2d3c2d] text-xs">
                        +{isBangla ? toBanglaDigits(r.emissionsTco2e.toFixed(3)) : r.emissionsTco2e.toFixed(3)} tCO₂e
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded">
                        {scopeLabel}
                      </span>
                    </div>
                  </td>

                  {/* Status & Quick Action */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#e6ede6] text-[#2d3c2d] border border-[#cfddcf] text-[11px] font-bold rounded-md">
                          <CheckCircle2 size={12} />
                          {isBangla ? 'যাচাইকৃত' : 'Verified'}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={confirmingId === r.documentId}
                            onClick={() => handleQuickApprove(r.documentId)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-[#2d3c2d] text-white text-[11px] font-bold rounded-lg hover:bg-[#1f2b1f] shadow-2xs transition disabled:opacity-50"
                            title={isBangla ? 'সরাসরি অনুমোদন করুন' : 'Confirm & add to verified inventory'}
                          >
                            {confirmingId === r.documentId ? (
                              <RefreshCw size={11} className="animate-spin" />
                            ) : (
                              <ShieldCheck size={11} />
                            )}
                            {isBangla ? 'অনুমোদন' : 'Quick Approve'}
                          </button>

                          {onGoToReview && (
                            <button
                              type="button"
                              onClick={() => onGoToReview(r.documentId)}
                              className="p-1 text-stone-400 hover:text-stone-700 transition"
                              title={isBangla ? 'রিভিউ কিউতে সম্পাদনা করুন' : 'Edit in review queue'}
                            >
                              <ArrowRight size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
