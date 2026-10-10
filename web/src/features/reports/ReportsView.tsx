import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ReportItem } from './types';
import { fetchReports, approveReport, createShareLink } from './reportsApi';
import { ReadinessChecklist } from './components/ReadinessChecklist';
import { ReportPreview } from './components/ReportPreview';
import { ShareLinkModal } from './components/ShareLinkModal';
import { FileText, Calendar, PlusCircle, RefreshCw } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { i18n } = useTranslation();
  const isBangla = i18n.language === 'bn';

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>('rep-2026-09');
  const [loading, setLoading] = useState<boolean>(true);
  const [sharingReport, setSharingReport] = useState<ReportItem | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const data = await fetchReports();
      setReports(data);
      if (data.length > 0 && !data.some((r) => r.id === selectedReportId)) {
        setSelectedReportId(data[0].id);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const activeReport = reports.find((r) => r.id === selectedReportId) || reports[0];

  async function handleApprove(id: string) {
    const res = await approveReport(id, 'Nusrat Jahan (Compliance Officer)');
    if (res.success) {
      await loadData();
    }
  }

  async function handleCreateShareLink(expiryDays: number, redactPrices: boolean) {
    if (!activeReport) throw new Error('No report selected');
    const newLink = await createShareLink(activeReport.id, expiryDays, redactPrices);
    await loadData();
    return newLink;
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Period Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-800 text-white rounded-2xl shadow-sm">
            <FileText size={22} />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black text-slate-900">
              {isBangla ? 'কর্পোরেট GHG প্রতিবেদন ও অডিট এক্সপোর্ট' : 'Corporate GHG Reports & Audit Exports'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isBangla
                ? 'আন্তর্জাতিক ব্র্যান্ড ক্রেতাদের (Higg FEM, Inditex) জন্য অনুমোদিত পিডিএফ ও এক্সেল'
                : 'Locked snapshots, QuestPDF generation and ClosedXML exports for buyer compliance'}
            </p>
          </div>
        </div>

        {/* Report Selector Pills */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Calendar size={14} />
            {isBangla ? 'প্রতিবেদন নির্বাচন:' : 'Select Report:'}
          </span>
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {reports.map((rep) => (
              <button
                key={rep.id}
                onClick={() => setSelectedReportId(rep.id)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedReportId === rep.id
                    ? 'bg-white text-teal-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {rep.period} {rep.status === 'Locked' ? '🔒' : '📋'}
              </button>
            ))}
          </div>

          <button
            onClick={loadData}
            className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading || !activeReport ? (
        <div className="p-12 text-center text-slate-500 text-xs font-semibold">
          {isBangla ? 'প্রতিবেদন লোড হচ্ছে...' : 'Loading report snapshot...'}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Readiness Checklist */}
          <ReadinessChecklist
            checklist={activeReport.readinessChecklist}
            isBangla={isBangla}
          />

          {/* Report Preview */}
          <ReportPreview
            report={activeReport}
            isBangla={isBangla}
            onApprove={handleApprove}
            onOpenShareModal={(rep) => setSharingReport(rep)}
          />
        </div>
      )}

      {/* Share Link Modal */}
      {sharingReport && (
        <ShareLinkModal
          report={sharingReport}
          isBangla={isBangla}
          onClose={() => setSharingReport(null)}
          onCreateShareLink={handleCreateShareLink}
        />
      )}
    </div>
  );
};
