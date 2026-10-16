import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthUser, clearSession } from '../../lib/apiClient';
import {
  LayoutDashboard,
  AlertCircle,
  TrendingDown,
  FileText,
  ShieldCheck,
  LogOut,
  Camera,
  ClipboardList,
} from 'lucide-react';
import { DashboardFeature } from '../../features/dashboard';
import { FlagsFeed } from '../../features/flags';
import { fetchFlags } from '../../features/flags/flagsApi';
import { toBanglaDigits } from '../../shared';
import { RecommendationsView } from '../../features/recommendations';
import { ReportsView } from '../../features/reports';
import { AuditorView } from '../../features/auditor';
import { UserProfileModal } from '../../features/profile';

export type MainTab = 'dashboard' | 'flags' | 'recommendations' | 'reports' | 'auditor';

interface DashboardViewProps {
  user: AuthUser;
  onGoToFloor: () => void;
  onGoToReview?: () => void;
  onLogout: () => void;
}

export default function DashboardView({ user, onGoToFloor, onGoToReview, onLogout }: DashboardViewProps) {
  const { t, i18n } = useTranslation();
  const isBangla = i18n.language === 'bn';

  const [activeTab, setActiveTab] = useState<MainTab>('dashboard');
  const [openFlagsCount, setOpenFlagsCount] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser>(user);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadOpenFlagsCount() {
      try {
        const list = await fetchFlags('open');
        if (isMounted) {
          setOpenFlagsCount(list.length);
        }
      } catch {
        // fallback
      }
    }

    loadOpenFlagsCount();

    const handleUpdate = () => {
      loadOpenFlagsCount();
    };

    window.addEventListener('carbonbill:flags-updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('carbonbill:flags-updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, [activeTab]);

  useEffect(() => {
    function syncTabFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as MainTab;
      if (tabParam && ['dashboard', 'flags', 'recommendations', 'reports', 'auditor'].includes(tabParam)) {
        setActiveTab(tabParam);
      } else {
        setActiveTab('dashboard');
      }
    }

    syncTabFromUrl();
    window.addEventListener('popstate', syncTabFromUrl);
    return () => window.removeEventListener('popstate', syncTabFromUrl);
  }, []);

  function handleTabChange(tab: MainTab) {
    if (tab === activeTab) return;
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === 'dashboard') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', tab);
    }
    window.history.pushState({ tab }, '', url.toString());
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* Top Main Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-950/5 border border-teal-800/10 flex items-center justify-center p-1 shadow-2xs">
              <img src="/logo-icon.png" alt="CarbonBill" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-black text-teal-900">{t('appName')}</h1>
              <p className="text-xs text-slate-500 font-medium">{user.activeOrgName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'bn' ? 'en' : 'bn')}
              className="text-xs font-semibold px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition"
            >
              {i18n.language === 'bn' ? 'English' : 'বাংলা'}
            </button>

            {/* Quick Mode Links */}
            <button
              onClick={onGoToFloor}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold rounded-xl hover:bg-teal-100 transition"
            >
              <Camera size={14} />
              {isBangla ? 'ফ্লোর মোড' : 'Floor PWA'}
            </button>

            {onGoToReview && (
              <button
                onClick={onGoToReview}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-bold rounded-xl hover:bg-indigo-100 transition"
              >
                <ClipboardList size={14} />
                {isBangla ? 'রিভিউ কিউ' : 'Review Queue'}
              </button>
            )}

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2 border-l pl-3">
              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                className="text-right hover:opacity-90 transition cursor-pointer flex items-center gap-2.5 group p-1 -m-1 rounded-xl hover:bg-slate-50"
                title={isBangla ? 'প্রোফাইল ও টিম রোল ম্যানেজমেন্ট' : 'Profile & Team Role Management'}
              >
                <div className="w-8 h-8 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-xs ring-2 ring-teal-600/30 group-hover:ring-teal-700 transition shadow-2xs">
                  {currentUser.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : 'CB'}
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800 group-hover:text-teal-900 transition flex items-center justify-end gap-1.5">
                    <span>{currentUser.fullName}</span>
                    <span className="text-[10px] text-teal-800 font-bold px-1.5 py-0.2 bg-teal-50 border border-teal-200 rounded-md">
                      {currentUser.role || 'Accountant'}
                    </span>
                  </p>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    {currentUser.activeOrgName || 'Apex Textiles'}
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  clearSession();
                  onLogout();
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer ml-1"
                title={t('nav.logout')}
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="border-t border-slate-100 bg-white">
          <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 overflow-x-auto py-1">
            <button
              onClick={() => handleTabChange('dashboard')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-teal-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard size={14} />
              {isBangla ? 'ড্যাশবোর্ড' : 'Dashboard'}
            </button>

            <button
              onClick={() => handleTabChange('flags')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'flags'
                  ? 'bg-teal-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <AlertCircle size={14} />
              {isBangla ? 'কার্বন ফ্ল্যাগস' : 'Carbon Flags'}
              {openFlagsCount !== null && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] text-white font-bold ml-0.5 transition ${
                    openFlagsCount > 0 ? 'bg-amber-500' : 'bg-emerald-600'
                  }`}
                >
                  {isBangla ? toBanglaDigits(openFlagsCount) : openFlagsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('recommendations')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'recommendations'
                  ? 'bg-teal-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <TrendingDown size={14} />
              {isBangla ? 'সাশ্রয়ী পদক্ষেপ (MACC)' : 'Recommendations (MACC)'}
            </button>

            <button
              onClick={() => handleTabChange('reports')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'bg-teal-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <FileText size={14} />
              {isBangla ? 'প্রতিবেদন ও এক্সপোর্ট' : 'Buyer Reports'}
            </button>

            <button
              onClick={() => handleTabChange('auditor')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'auditor'
                  ? 'bg-teal-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <ShieldCheck size={14} />
              {isBangla ? 'অডিটর পোর্টাল' : 'Auditor Portal'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <DashboardFeature
            user={user}
            onNavigateTab={handleTabChange}
            onGoToFloor={onGoToFloor}
            onGoToReview={onGoToReview}
          />
        )}

        {activeTab === 'flags' && <FlagsFeed onGoToReview={onGoToReview} />}

        {activeTab === 'recommendations' && <RecommendationsView />}

        {activeTab === 'reports' && <ReportsView />}

        {activeTab === 'auditor' && <AuditorView />}
      </main>

      {/* User Profile & Team Roles Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onUserUpdated={(updated) => {
          setCurrentUser(updated);
        }}
      />
    </div>
  );
}
