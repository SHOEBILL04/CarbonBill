import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { getStoredUser, AuthUser, clearSession } from '../shared';
import { ErrorBoundary } from '../shared/components/ErrorBoundary';
import LoginView from '../routes/main/LoginView';
import DashboardView from '../routes/main/DashboardView';

// Code-split floor route for ultra-fast loading on low-end Android mobile devices
const FloorStaffView = lazy(() => import('../routes/floor/FloorStaffView'));
const ReviewWorkspace = lazy(() => import('../features/review/ReviewWorkspace'));

export default function App() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [view, setView] = useState<'login' | 'dashboard' | 'floor' | 'review'>('login');

  useEffect(() => {
    const storedUser = getStoredUser();
    const params = new URLSearchParams(window.location.search);
    if (storedUser) {
      setUser(storedUser);
      if (storedUser.activeRole === 'FloorStaff') {
        setView('floor');
      } else if (params.get('mode') === 'review') {
        setView('review');
      } else {
        setView('dashboard');
      }
    } else {
      if (params.get('mode') === 'floor') {
        setView('floor');
      } else if (params.get('mode') === 'review') {
        setView('review');
      } else {
        setView('login');
      }
    }
  }, []);

  function handleLoginSuccess(role: string) {
    const updated = getStoredUser();
    setUser(updated);
    if (role === 'FloorStaff') {
      setView('floor');
    } else {
      setView('dashboard');
    }
  }

  function handleLogout() {
    clearSession();
    setUser(null);
    setView('login');
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        {view === 'floor' && (
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center p-8 text-center text-sm font-semibold text-slate-500">
              ফ্লোর মোড লোড হচ্ছে... (Loading Floor Mode...)
            </div>
          }>
            <FloorStaffView onBack={user && user.activeRole !== 'FloorStaff' ? () => setView('dashboard') : () => setView('login')} />
          </Suspense>
        )}

        {view === 'review' && (
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center p-8 text-center text-sm font-semibold text-slate-500">
              পর্যালোচনা ওয়ার্কস্পেস লোড হচ্ছে... (Loading Review Workspace...)
            </div>
          }>
            <ReviewWorkspace onBack={() => setView('dashboard')} />
          </Suspense>
        )}

        {view === 'login' && (
          <LoginView
            onLoginSuccess={handleLoginSuccess}
            onGoToFloor={() => setView('floor')}
          />
        )}

        {view === 'dashboard' && user && (
          <DashboardView
            user={user}
            onGoToFloor={() => setView('floor')}
            onGoToReview={() => setView('review')}
            onLogout={handleLogout}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
