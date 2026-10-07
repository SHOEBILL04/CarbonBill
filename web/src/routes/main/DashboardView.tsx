import React from 'react';
import { useTranslation } from 'react-i18next';
import { AuthUser, clearSession } from '../../lib/apiClient';
import { Leaf, AlertCircle, TrendingDown, FileText, CheckCircle, ShieldCheck, LogOut, ArrowRight } from 'lucide-react';

interface DashboardViewProps {
  user: AuthUser;
  onGoToFloor: () => void;
  onLogout: () => void;
}

export default function DashboardView({ user, onGoToFloor, onLogout }: DashboardViewProps) {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-700 rounded-xl text-white">
              <Leaf size={22} />
            </div>
            <div>
              <h1 className="text-lg font-black text-teal-900">{t('appName')}</h1>
              <p className="text-xs text-slate-500 font-medium">{user.activeOrgName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'bn' ? 'en' : 'bn')}
              className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-700 rounded-md border"
            >
              {i18n.language === 'bn' ? 'English' : 'বাংলা'}
            </button>

            <button
              onClick={onGoToFloor}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold rounded-xl"
            >
              📷 ফ্লোর মোড
            </button>

            <div className="flex items-center gap-2 border-l pl-3">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-800">{user.fullName}</p>
                <span className="text-[10px] text-teal-700 font-semibold px-1.5 py-0.5 bg-teal-50 rounded">
                  {t(`roles.${user.activeRole}`)}
                </span>
              </div>
              <button
                onClick={() => { clearSession(); onLogout(); }}
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                title={t('nav.logout')}
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">{t('dashboard.scope1')}</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-slate-900">১২.৪৫</span>
              <span className="text-xs text-slate-500">tCO₂e</span>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
              <ShieldCheck size={14} /> ৯২% যাচাইকৃত (Verified)
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">{t('dashboard.scope2')}</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-slate-900">৪৮.২০</span>
              <span className="text-xs text-slate-500">tCO₂e</span>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
              <ShieldCheck size={14} /> ১০০% গ্রিড বিল সংরক্ষিত
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">{t('dashboard.scope3')}</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-slate-900">৫.১০</span>
              <span className="text-xs text-slate-500">tCO₂e</span>
            </div>
            <div className="mt-3 text-[11px] text-amber-700 font-medium">
              ⚠️ চালান ট্র্যাকিং চলমান
            </div>
          </div>

          {/* Data Quality Score (DQS) */}
          <div className="bg-teal-900 text-white p-5 rounded-2xl shadow-sm">
            <span className="text-xs font-semibold text-teal-200">{t('dashboard.dataQualityScore')}</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-black text-white">৯১%</span>
              <span className="text-xs text-teal-300">Grade A</span>
            </div>
            <div className="mt-3 text-[11px] text-teal-200">
              ✓ ক্রেতা অডিট ও রিপোর্টের জন্য প্রস্তুত
            </div>
          </div>
        </div>

        {/* Action & Flag Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Carbon Flags Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-amber-600" size={20} />
                <h2 className="font-bold text-slate-900">{t('dashboard.topFlags')}</h2>
              </div>
              <span className="text-xs text-slate-400">শীর্ষ ৩টি নোটিশ</span>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-amber-900">
                  <span>অনুপস্থিত বিল: জেনারেটর ২ ডিজেল স্লিপ</span>
                  <span className="px-1.5 py-0.5 bg-amber-200 rounded text-[10px]">Amber</span>
                </div>
                <p className="text-slate-600">সেপ্টেম্বর মাসের ২টি ডিজেল সরবরাহ স্লিপ এখনও আপলোড হয়নি।</p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-blue-900">
                  <span>পাওয়ার ফ্যাক্টর পেনাল্টি সনাক্তকরণ</span>
                  <span className="px-1.5 py-0.5 bg-blue-200 rounded text-[10px]">Info</span>
                </div>
                <p className="text-slate-600">ডেসকো বিলে ৩,৪৫০ টাকা লো-পাওয়ার ফ্যাক্টর জরিমানা ধরা পড়েছে।</p>
              </div>
            </div>
          </div>

          {/* Taka-First Recommendations */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="text-teal-700" size={20} />
                <h2 className="font-bold text-slate-900">{t('dashboard.topActions')}</h2>
              </div>
              <span className="text-xs text-slate-400">IFC PaCT গবেষণা ভিত্তিক</span>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>পাওয়ার ফ্যাক্টর ক্যাপাসিটর ব্যাংক সংস্কার</span>
                  <span className="text-emerald-700 font-black">৳১,২০,০০০ / বছর সাশ্রয়</span>
                </div>
                <p className="text-slate-500">পে-ব্যাক সময়: ৪ মাস | এভিডেন্স গ্রেড: A (বাংলাদেশি কারখানার ডেটা)</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>কম্প্রেসড এয়ার পাইপলাইন লিক মেরামত</span>
                  <span className="text-emerald-700 font-black">৳৮৫,০০০ / বছর সাশ্রয়</span>
                </div>
                <p className="text-slate-500">পে-ব্যাক সময়: ২ সপ্তাহ | এভিডেন্স গ্রেড: A</p>
              </div>
            </div>
          </div>
        </div>

        {/* Traceability & Compliance Notice */}
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl text-xs text-teal-900 flex items-start gap-3">
          <ShieldCheck size={24} className="text-teal-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">ডিফেন্সিবল ও অডিট-প্রস্তুত কার্বন অ্যাকাউন্টিং</p>
            <p className="text-slate-600 mt-0.5">
              কার্বনবিলের প্রতিটি সংখ্যা সরাসরি মূল নথি, ফ্যাক্টর সংস্করণ এবং অনুমোদকের সাথে লিংকযুক্ত। GHG Protocol স্ট্যান্ডার্ড অনুযায়ী হিসেবকৃত।
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
