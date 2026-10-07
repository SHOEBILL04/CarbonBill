import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Leaf, QrCode, Lock, Mail } from 'lucide-react';
import { setSession } from '../../lib/apiClient';

interface LoginViewProps {
  onLoginSuccess: (role: string) => void;
  onGoToFloor: () => void;
}

export default function LoginView({ onLoginSuccess, onGoToFloor }: LoginViewProps) {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<'password' | 'pin'>('password');
  
  // Password form
  const [email, setEmail] = useState('owner@apex.local');
  const [password, setPassword] = useState('Pass1234!');

  // PIN / QR form
  const [token, setToken] = useState('apex-floor-demo');
  const [pin, setPin] = useState('1234');
  const [fullName, setFullName] = useState('Jahid Hasan');
  const [phone, setPhone] = useState('01700000000');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || t('login.loginFailed'));
      }

      const data = await res.json();
      setSession(data.accessToken, {
        userId: data.userId,
        email: data.email,
        fullName: data.fullName,
        activeOrgId: data.activeOrgId,
        activeOrgName: data.activeOrgName,
        activeRole: data.activeRole,
        memberships: data.memberships
      });

      onLoginSuccess(data.activeRole);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handlePinJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          pin,
          fullName,
          phoneNumber: phone
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Join with PIN failed');
      }

      const data = await res.json();
      setSession(data.accessToken, {
        userId: data.userId,
        email: `floor_${token.slice(0, 6)}@carbonbill.local`,
        fullName: data.fullName,
        activeOrgId: data.orgId,
        activeOrgName: 'Apex Textiles',
        activeRole: data.role,
        memberships: [{ orgId: data.orgId, orgName: 'Apex Textiles', role: data.role }]
      });

      onLoginSuccess(data.role);
    } catch (err: any) {
      setError(err.message || 'Join failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-slate-900 to-teal-950 flex flex-col justify-center items-center p-4 font-sans text-slate-100">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 md:p-8 text-slate-900 shadow-2xl space-y-6">
        {/* Branding & Language */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-teal-600 rounded-2xl text-white shadow-md">
              <Leaf size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-teal-900">{t('appName')}</h1>
              <p className="text-xs text-slate-500">{t('tagline')}</p>
            </div>
          </div>
          
          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'bn' ? 'en' : 'bn')}
            className="text-xs font-bold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
          >
            {i18n.language === 'bn' ? 'English' : 'বাংলা'}
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => { setTab('password'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${tab === 'password' ? 'bg-white shadow-sm text-teal-900' : 'text-slate-500'}`}
          >
            {t('login.submit')}
          </button>
          <button
            type="button"
            onClick={() => { setTab('pin'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${tab === 'pin' ? 'bg-white shadow-sm text-teal-900' : 'text-slate-500'}`}
          >
            {t('login.joinPin')}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Password Form */}
        {tab === 'password' ? (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('login.emailPlaceholder')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="owner@apex.local"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('login.passwordPlaceholder')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-lg transition-all active:scale-98"
            >
              {loading ? 'প্রবেশ করা হচ্ছে...' : t('login.submit')}
            </button>
          </form>
        ) : (
          /* QR / PIN Join Form */
          <form onSubmit={handlePinJoin} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('login.tokenPlaceholder')}</label>
              <div className="relative">
                <QrCode className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder="apex-floor-demo"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('login.pinPlaceholder')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="1234"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-mono font-bold tracking-widest text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('login.namePlaceholder')}</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('login.phonePlaceholder')}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-lg transition-all"
            >
              {loading ? 'যুক্ত হওয়া হচ্ছে...' : t('login.joinSubmit')}
            </button>
          </form>
        )}

        {/* Quick link to Floor view directly */}
        <div className="pt-2 border-t text-center">
          <button
            onClick={onGoToFloor}
            className="text-xs text-teal-700 font-bold hover:underline"
          >
            📱 ফ্লোর স্টাফ ক্যামেরা মোড খুলুন (Floor Capture)
          </button>
        </div>
      </div>
    </div>
  );
}
