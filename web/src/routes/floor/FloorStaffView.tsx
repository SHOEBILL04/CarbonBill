import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Fuel, Flame, Zap, Truck, Camera, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { enqueueUpload, getPendingUploads, PendingUpload } from '../../lib/offlineQueue';

export default function FloorStaffView({ onBack }: { onBack?: () => void }) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [slipNumber, setSlipNumber] = useState('');
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<PendingUpload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { key: 'diesel', label: t('floor.categories.diesel'), icon: Fuel, color: 'bg-amber-600' },
    { key: 'gas', label: t('floor.categories.gas'), icon: Flame, color: 'bg-orange-600' },
    { key: 'electricity', label: t('floor.categories.electricity'), icon: Zap, color: 'bg-yellow-600' },
    { key: 'shipment', label: t('floor.categories.shipment'), icon: Truck, color: 'bg-blue-600' }
  ];

  useEffect(() => {
    loadSubmissions();
  }, []);

  async function loadSubmissions() {
    const list = await getPendingUploads();
    setSubmissions(list.slice(-5).reverse());
  }

  async function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedCategory) return;

    setIsSubmitting(true);
    try {
      const item = await enqueueUpload({
        category: selectedCategory,
        blob: file,
        fileName: file.name
      });
      setConfirmedId(item.id.slice(0, 8).toUpperCase());
      setSelectedCategory(null);
      await loadSubmissions();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCategory || !quantity) return;

    setIsSubmitting(true);
    try {
      const item = await enqueueUpload({
        category: selectedCategory,
        manualQuantity: parseFloat(quantity),
        manualSlipNumber: slipNumber
      });
      setConfirmedId(item.id.slice(0, 8).toUpperCase());
      setSelectedCategory(null);
      setManualMode(false);
      setQuantity('');
      setSlipNumber('');
      await loadSubmissions();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 p-4 font-sans text-slate-900 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg">
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-teal-800">{t('appName')}</h1>
            <p className="text-xs text-slate-500">{t('floor.subtitle')}</p>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-teal-100 text-teal-800 text-xs font-semibold rounded-full">
          {t('roles.FloorStaff')}
        </span>
      </div>

      {/* Confirmation Banner */}
      {confirmedId && (
        <div className="mb-4 bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center gap-3 text-emerald-900 shadow-sm animate-fade-in">
          <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={28} />
          <div>
            <p className="text-sm font-semibold">{t('floor.receiptConfirmed')} <span className="font-mono font-bold">{confirmedId}</span></p>
            <p className="text-xs text-emerald-700">হিসাবরক্ষকের নিকট পর্যালোচনার জন্য পাঠানো হয়েছে।</p>
          </div>
        </div>
      )}

      {/* Step 1: Select Category */}
      {!selectedCategory ? (
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-700">১. বিল বা রসিদের ধরন সিলেক্ট করুন:</p>
          <div className="grid grid-cols-2 gap-3">
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className="flex flex-col items-center justify-center p-5 bg-white border-2 border-slate-200 rounded-2xl shadow-sm hover:border-teal-500 active:scale-95 transition-all text-center gap-2"
                >
                  <div className={`p-3 rounded-full text-white ${cat.color}`}>
                    <Icon size={32} />
                  </div>
                  <span className="font-bold text-base text-slate-800">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Step 2: Capture or Manual Entry */
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-sm font-semibold text-slate-700">
              নির্বাচিত: <strong className="text-teal-700">{categories.find(c => c.key === selectedCategory)?.label}</strong>
            </span>
            <button
              onClick={() => { setSelectedCategory(null); setManualMode(false); }}
              className="text-xs text-red-600 font-medium"
            >
              পরিবর্তন করুন
            </button>
          </div>

          {!manualMode ? (
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-teal-500 bg-teal-50/50 rounded-2xl p-8 cursor-pointer active:bg-teal-100 transition-colors text-center">
                <Camera size={48} className="text-teal-600 mb-2" />
                <span className="font-bold text-lg text-teal-900">{t('floor.tapToCapture')}</span>
                <span className="text-xs text-slate-500 mt-1">ক্যামেরা দিয়ে রসিদের স্পষ্ট ছবি তুলুন</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoCapture}
                  disabled={isSubmitting}
                />
              </label>

              <button
                type="button"
                onClick={() => setManualMode(true)}
                className="w-full text-xs text-center text-teal-700 font-semibold py-2 underline"
              >
                {t('floor.manualFallback')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('floor.quantityLabel')}</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  placeholder="যেমন: 250"
                  className="w-full border border-slate-300 rounded-xl p-3 text-lg font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('floor.slipNumber')}</label>
                <input
                  type="text"
                  value={slipNumber}
                  onChange={e => setSlipNumber(e.target.value)}
                  placeholder="যেমন: SL-8812"
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManualMode(false)}
                  className="flex-1 py-3 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  ছবি তুলুন
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 text-sm font-bold text-white bg-teal-700 rounded-xl hover:bg-teal-800"
                >
                  {t('floor.submitReceipt')}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Recent Submissions */}
      <div className="mt-6">
        <h2 className="text-sm font-bold text-slate-700 mb-2">{t('floor.recentSubmissions')}</h2>
        {submissions.length === 0 ? (
          <p className="text-xs text-slate-400 bg-white p-3 rounded-xl border border-slate-200 text-center">
            এখনও কোনো রসিদ আপলোড করা হয়নি।
          </p>
        ) : (
          <div className="space-y-2">
            {submissions.map(s => (
              <div key={s.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 uppercase">{s.category}</span>
                  <span className="text-slate-400 ml-2 font-mono">#{s.id.slice(0, 8)}</span>
                  {s.manualQuantity && <p className="text-slate-600">পরিমাণ: {s.manualQuantity}</p>}
                </div>
                <span className={`px-2 py-0.5 rounded-full font-semibold ${s.status === 'synced' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {s.status === 'synced' ? 'গৃহীত' : 'অফলাইন কিউ'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Privacy card note as per section 3 change 11 */}
      <div className="mt-6 p-3 bg-slate-100 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-tight">
        🔒 <strong>গোপনীয়তা নিশ্চয়তা:</strong> আপনার আপলোড করা বিল বা রসিদ কোনো পাবলিক AI মডেল প্রশিক্ষণে ব্যবহার করা হবে না। ডেটা আপনার প্রতিষ্ঠানের জন্যই সংরক্ষিত।
      </div>
    </div>
  );
}
