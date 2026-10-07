import React, { useState, useEffect, lazy, Suspense } from 'react';
import { getStoredUser, AuthUser } from './lib/apiClient';
import LoginView from './routes/main/LoginView';
import DashboardView from './routes/main/DashboardView';

// Code-split floor route for fast loading on weak mobile devices
const FloorStaffView = lazy(() => import('./routes/floor/FloorStaffView'));

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [view, setView] = useState<'login' | 'dashboard' | 'floor'>('login');

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      if (storedUser.activeRole === 'FloorStaff') {
        setView('floor');
      } else {
        setView('dashboard');
      }
    } else {
      // Check query param e.g. ?mode=floor
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'floor') {
        setView('floor');
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
    setUser(null);
    setView('login');
  }

  return (
    <div className="min-h-screen">
      {view === 'floor' && (
        <Suspense fallback={<div className="p-8 text-center text-sm font-semibold text-slate-500">ফ্লোর মোড লোড হচ্ছে...</div>}>
          <FloorStaffView onBack={user && user.activeRole !== 'FloorStaff' ? () => setView('dashboard') : () => setView('login')} />
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
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
