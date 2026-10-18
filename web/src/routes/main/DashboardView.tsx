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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Top Main Navbar - Sleek Slate-900 */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center p-1 shadow-inner shrink-0">
              <img src="/logo-icon.png" alt="CarbonBill" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight truncate">{t('appName')}</h1>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">{user.activeOrgName}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Language Switcher */}
            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'bn' ? 'en' : 'bn')}
              className="text-xs font-semibold px-2 sm:px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition cursor-pointer"
            >
              {i18n.language === 'bn' ? 'English' : 'বাংলা'}
            </button>

            {/* Quick Mode Links (Desktop / Tablet) */}
            <button
              onClick={onGoToFloor}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl hover:bg-slate-700 transition cursor-pointer"
            >
              <Camera size={14} className="text-slate-400" />
              <span>{isBangla ? 'ফ্লোর মোড' : 'Floor PWA'}</span>
            </button>

            {onGoToReview && (
              <button
                onClick={onGoToReview}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl hover:bg-slate-700 transition cursor-pointer"
              >
                <ClipboardList size={14} className="text-slate-400" />
                <span>{isBangla ? 'রিভিউ কিউ' : 'Review Queue'}</span>
              </button>
            )}

            {/* User Profile & Logout */}
            <div className="flex items-center gap-1.5 sm:gap-2 border-l border-slate-800 pl-2 sm:pl-3">
              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                className="text-right hover:opacity-90 transition cursor-pointer flex items-center gap-2 group p-1 -m-1 rounded-xl hover:bg-slate-800"
                title={isBangla ? 'প্রোফাইল ও টিম রোল ম্যানেজমেন্ট' : 'Profile & Team Role Management'}
              >
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-500/30 group-hover:ring-emerald-500/60 transition shadow-xs shrink-0">
                  {currentUser.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : 'CB'}
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-xs font-bold text-white group-hover:text-slate-200 transition flex items-center justify-end gap-1.5">
                    <span>{currentUser.fullName}</span>
                    <span className="text-[10px] text-slate-300 font-bold px-1.5 py-0.2 bg-slate-800 border border-slate-700 rounded-md">
                      {currentUser.role || 'Accountant'}
                    </span>
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[140px]">
                    {currentUser.activeOrgName || 'Apex Textiles'}
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  clearSession();
                  onLogout();
                }}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition cursor-pointer ml-0.5 sm:ml-1"
                title={t('nav.logout')}
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="border-t border-slate-800 bg-slate-950/70">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 flex items-center gap-1.5 overflow-x-auto py-1.5 no-scrollbar scroll-smooth">
            {/* Quick access icons on mobile screens (< sm) */}
            <button
              onClick={onGoToFloor}
              className="sm:hidden px-2.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 shrink-0 cursor-pointer"
              title={isBangla ? 'ফ্লোর ক্যামেরা মোড' : 'Floor PWA'}
            >
              <Camera size={13} />
              <span>{isBangla ? 'ফ্লোর' : 'Floor'}</span>
            </button>
            {onGoToReview && (
              <button
                onClick={onGoToReview}
                className="sm:hidden px-2.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap bg-slate-800 text-slate-300 border border-slate-700 shrink-0 cursor-pointer"
                title={isBangla ? 'রিভিউ কিউ' : 'Review Queue'}
              >
                <ClipboardList size={13} />
                <span>{isBangla ? 'রিভিউ' : 'Review'}</span>
              </button>
            )}

            <button
              onClick={() => handleTabChange('dashboard')}
              className={`px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <LayoutDashboard size={14} />
              <span>{isBangla ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
            </button>

            <button
              onClick={() => handleTabChange('flags')}
              className={`px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'flags'
                  ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <AlertCircle size={14} />
              <span>{isBangla ? 'কার্বন ফ্ল্যাগস' : 'Carbon Flags'}</span>
              {openFlagsCount !== null && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] text-white font-bold ml-0.5 transition ${
                    openFlagsCount > 0 ? 'bg-amber-600' : 'bg-slate-700'
                  }`}
                >
                  {isBangla ? toBanglaDigits(openFlagsCount) : openFlagsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('recommendations')}
              className={`px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'recommendations'
                  ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <TrendingDown size={14} />
              <span>{isBangla ? 'এআই ও আরএজি সুপারিশমালা' : 'AI Recommendations & RAG'}</span>
            </button>

            <button
              onClick={() => handleTabChange('reports')}
              className={`px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <FileText size={14} />
              <span>{isBangla ? 'প্রতিবেদন ও এক্সপোর্ট' : 'Buyer Reports'}</span>
            </button>

            <button
              onClick={() => handleTabChange('auditor')}
              className={`px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'auditor'
                  ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <ShieldCheck size={14} />
              <span>{isBangla ? 'অডিটর পোর্টাল' : 'Auditor Portal'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
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
