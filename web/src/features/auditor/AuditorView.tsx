import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AuditorSnapshot, AuditorLineItem } from './types';
import { fetchAuditorSnapshot } from './auditorApi';
import { ProvenanceInspectorModal } from './components/ProvenanceInspectorModal';
import { toBanglaDigits, formatBdt } from '../../shared';
import {
  ShieldCheck,
  Fingerprint,
  FileSearch,
  Lock,
  Search,
  ExternalLink,
  Building,
  CheckCircle2,
  RefreshCw,
  Info,
} from 'lucide-react';

interface AuditorViewProps {
  token?: string;
}

export const AuditorView: React.FC<AuditorViewProps> = ({ token }) => {
  const { i18n } = useTranslation();
  const isBangla = i18n.language === 'bn';

  const [snapshot, setSnapshot] = useState<AuditorSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<AuditorLineItem | null>(null);

  // Extract token from prop or URL query params
  const activeToken = useMemo(() => {
    if (token) return token;
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('token') || undefined;
    }
    return undefined;
  }, [token]);

  async function loadData() {
    setLoading(true);
    try {
      const data = await fetchAuditorSnapshot(undefined, activeToken);
      setSnapshot(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [activeToken]);

  const filteredItems = useMemo(() => {
    if (!snapshot) return [];
    if (!searchTerm.trim()) return snapshot.lineItems;
    const term = searchTerm.toLowerCase();
    return snapshot.lineItems.filter(
      (item) =>
        item.sourceNameEn.toLowerCase().includes(term) ||
        item.sourceNameBn.includes(term) ||
        item.documentId.toLowerCase().includes(term) ||
        item.scope.toLowerCase().includes(term)
    );
  }, [snapshot, searchTerm]);

  if (loading || !snapshot) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs font-semibold">
        {isBangla ? 'অডিটর পোর্টাল যাচাইকরণ লোড হচ্ছে...' : 'Validating auditor verification snapshot...'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Auditor Verified Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-900 text-white rounded-2xl shadow-sm">
              <ShieldCheck size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                  ✓ {isBangla ? 'যাচাইকৃত অডিট ভিউ (Read-Only)' : 'Verified Auditor Access'}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {isBangla ? `হিসাবকাল: ${snapshot.period}` : `Period: ${snapshot.period}`}
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-black text-slate-900 mt-1">
                {snapshot.organizationName}
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Building size={13} className="text-slate-400" />
                {snapshot.facilityLocation}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-slate-400 block">
              {isBangla ? 'ডিজিটাল অডিট সম্মতি:' : 'Audit Preparedness:'}
            </span>
            <span className="text-xl font-black text-teal-800">
              {snapshot.dqsGrade} ({((snapshot.dataQualityScore ?? 0) * 100).toFixed(0)}% DQS)
            </span>
          </div>
        </div>

        {/* Cryptographic SHA-256 Stamp */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Fingerprint size={14} className="text-teal-700" />
              {isBangla ? 'ক্রিপ্টোগ্রাফিক স্ন্যাপশট হ্যাশ (SHA-256):' : 'Cryptographic Hash Stamp (SHA-256):'}
            </span>
            <span>
              {isBangla ? 'অনুমোদনকারী: ' : 'Signed by: '}
              <strong>{snapshot.approvedBy}</strong>
            </span>
          </div>
          <p className="font-mono text-[11px] text-slate-800 break-all select-all bg-white p-1.5 rounded border border-slate-200">
            {snapshot.contentHashSha256}
          </p>
        </div>

        {/* Commercial Price Redaction Status Badge */}
        {snapshot.redactPrices && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
            <Lock size={15} className="text-amber-700 shrink-0" />
            <span>
              {isBangla
                ? 'বাণিজ্যিক গোপনীয়তা নীতি সক্রিয়: চালানের আর্থিক টাকা গোপন রাখা হয়েছে। ফিজিক্যাল ব্যবহার (লিটার, kWh) ও ফ্যাক্টরসমূহ সম্পূর্ণ অডিটযোগ্য।'
                : 'Commercial Price Redaction Active: Financial currency amounts are masked. Physical activity metrics (litres, kWh, m³) and emission factors remain fully auditable.'}
            </span>
          </div>
        )}
      </div>

      {/* Scope Totals Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">
            {isBangla ? 'মোট নির্গমন (Total)' : 'Total Footprint'}
          </span>
          <p className="text-2xl font-black text-slate-900">
            {isBangla ? toBanglaDigits(Number(snapshot.totalEmissions ?? 0).toFixed(2)) : Number(snapshot.totalEmissions ?? 0).toFixed(2)}{' '}
            <span className="text-xs font-semibold text-slate-400">tCO₂e</span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">
            {isBangla ? 'স্কোপ ১ (জ্বালানি/গ্যাস)' : 'Scope 1'}
          </span>
          <p className="text-2xl font-black text-orange-600">
            {isBangla ? toBanglaDigits(Number(snapshot.scope1Emissions ?? 0).toFixed(2)) : Number(snapshot.scope1Emissions ?? 0).toFixed(2)}{' '}
            <span className="text-xs font-semibold text-slate-400">tCO₂e</span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">
            {isBangla ? 'স্কোপ ২ (গ্রিড বিদ্যুৎ)' : 'Scope 2'}
          </span>
          <p className="text-2xl font-black text-sky-600">
            {isBangla ? toBanglaDigits(Number(snapshot.scope2Emissions ?? 0).toFixed(2)) : Number(snapshot.scope2Emissions ?? 0).toFixed(2)}{' '}
            <span className="text-xs font-semibold text-slate-400">tCO₂e</span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">
            {isBangla ? 'স্কোপ ৩ (পরিবহন)' : 'Scope 3'}
          </span>
          <p className="text-2xl font-black text-purple-600">
            {isBangla ? toBanglaDigits(Number(snapshot.scope3Emissions ?? 0).toFixed(2)) : Number(snapshot.scope3Emissions ?? 0).toFixed(2)}{' '}
            <span className="text-xs font-semibold text-slate-400">tCO₂e</span>
          </p>
        </div>
      </div>

      {/* Click-to-Source Traceability Ledger */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm md:text-base">
              {isBangla
                ? 'ক্লিক-টু-সোর্স প্রমাণপত্র লেজার (Click-to-Source Traceability Ledger)'
                : 'Click-to-Source Traceability Ledger'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isBangla
                ? 'যেকোনো সারিতে ক্লিক করে মূল চালান, OCR কনফিডেন্স ও প্রয়োগকৃত ফ্যাক্টর যাচাই করুন'
                : 'Click any row to inspect original supplier invoice, OCR score, and emission factor citation'}
            </p>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isBangla ? 'উৎস বা চালান আইডি খুঁজুন...' : 'Filter ledger items...'}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
            />
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">{isBangla ? 'স্কোপ' : 'Scope'}</th>
                <th className="py-2.5 px-3">{isBangla ? 'নির্গমন উৎস' : 'Activity Source'}</th>
                <th className="py-2.5 px-3">{isBangla ? 'ব্যবহারের পরিমাণ' : 'Quantity'}</th>
                <th className="py-2.5 px-3">{isBangla ? 'আর্থিক মূল্য' : 'Billed (BDT)'}</th>
                <th className="py-2.5 px-3">{isBangla ? 'নির্গমন (tCO₂e)' : 'tCO₂e'}</th>
                <th className="py-2.5 px-3">{isBangla ? 'চালান আইডি' : 'Document ID'}</th>
                <th className="py-2.5 px-3 text-right">{isBangla ? 'যাচাই' : 'Inspect'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="hover:bg-teal-50/50 cursor-pointer transition"
                >
                  <td className="py-3 px-3 font-bold text-slate-700">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px]">
                      {item.scope}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    {isBangla ? item.sourceNameBn : item.sourceNameEn}
                  </td>
                  <td className="py-3 px-3 font-mono">
                    {isBangla
                      ? toBanglaDigits(item.activityQuantity.toLocaleString('en-US'))
                      : item.activityQuantity.toLocaleString('en-US')}{' '}
                    {item.activityUnit}
                  </td>
                  <td className="py-3 px-3">
                    {snapshot.redactPrices ? (
                      <span className="font-mono text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                        {isBangla ? '[গোপনীয়]' : '[Redacted]'}
                      </span>
                    ) : (
                      <span className="font-mono font-bold text-slate-800">
                        {formatBdt(item.billedAmountBdt || 0, { useBanglaDigits: isBangla })}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    {isBangla ? toBanglaDigits(Number(item.emissionsTco2e ?? 0).toFixed(2)) : Number(item.emissionsTco2e ?? 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-teal-800 font-bold">
                    {item.documentId}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      className="px-2.5 py-1 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition inline-flex items-center gap-1"
                    >
                      <FileSearch size={12} />
                      {isBangla ? 'উৎস দেখুন' : 'Trace'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mandatory GHG Protocol Disclaimer */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
        <Info size={16} className="text-teal-700 shrink-0 mt-0.5" />
        <p leading-relaxed>
          {isBangla
            ? 'এই অডিট প্রতিবেদনটি GHG Protocol Corporate Standard পদ্ধতি অনুসারে যাচাইকৃত প্রাইমারি ইউটিলিটি ইনভয়েসের ভিত্তিতে প্রস্তুতকৃত। এটি তৃতীয়-পক্ষের প্রত্যয়িত সনদ নয়।'
            : 'This audit summary reflects verified primary utility records calculated in alignment with GHG Protocol Corporate Accounting Standard. Not an accredited third-party certification.'}
        </p>
      </div>

      {/* Click-to-Source Inspector Modal */}
      {selectedItem && (
        <ProvenanceInspectorModal
          item={selectedItem}
          redactPrices={snapshot.redactPrices}
          isBangla={isBangla}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};
