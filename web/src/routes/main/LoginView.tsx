import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Lock,
  Mail,
  Building,
  User,
  Phone,
  CheckCircle,
  ArrowRight,
  Flame,
  Zap,
  Factory,
  Sun,
  Check,
  Sparkles,
  Settings,
} from 'lucide-react';
import { setSession } from '../../lib/apiClient';

interface LoginViewProps {
  onLoginSuccess: () => void;
  onGoToFloor: () => void;
}

export default function LoginView({ onLoginSuccess, onGoToFloor }: LoginViewProps) {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<'login' | 'register' | 'invite' | 'equipment_setup'>('login');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('owner@apex.local');
  const [password, setPassword] = useState('Pass1234!');

  // Register form state
  const [regOrgName, setRegOrgName] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFacilityType, setRegFacilityType] = useState('RMG_Woven');

  // Post-registration Equipment Setup state
  const [setupSector, setSetupSector] = useState('RMG_Woven');
  const [setupHasBoiler, setSetupHasBoiler] = useState(true);
  const [setupHasGenset, setSetupHasGenset] = useState(true);
  const [setupHasProductionFloor, setSetupHasProductionFloor] = useState(true);
  const [setupBuildingOwnership, setSetupBuildingOwnership] = useState<'Owned' | 'Rented'>('Owned');
  const [setupRoofAreaSqft, setSetupRoofAreaSqft] = useState<number>(25000);
  const [setupBudgetBand, setSetupBudgetBand] = useState<string>('Medium');
  const [setupSaving, setSetupSaving] = useState(false);

  // Invite acceptance state
  const [inviteToken, setInviteToken] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [invitePassword, setInvitePassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inv = params.get('invite');
    if (inv) {
      setInviteToken(inv);
      setTab('invite');
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const isPhone = /^[0-9+]+$/.test(loginIdentifier.replace(/[\s-]/g, ''));
      const payload: Record<string, string> = { password };
      if (isPhone) {
        payload.phoneNumber = loginIdentifier;
      } else {
        payload.email = loginIdentifier;
      }

      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || t('login.loginFailed') || 'লগইন ব্যর্থ হয়েছে। ইমেইল ও পাসওয়ার্ড যাচাই করুন।');
      }

      const data = await res.json();
      setSession(data.accessToken, {
        userId: data.userId,
        email: data.email,
        fullName: data.fullName,
        activeOrgId: data.activeOrgId,
        activeOrgName: data.activeOrgName,
        memberships: data.memberships
      });

      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: regOrgName,
          fullName: regFullName,
          email: regEmail,
          password: regPassword,
          facilityType: regFacilityType
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'নিবন্ধন ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
      }

      const data = await res.json();
      setSession(data.accessToken, {
        userId: data.userId,
        email: data.email,
        fullName: data.fullName,
        activeOrgId: data.activeOrgId,
        activeOrgName: data.activeOrgName,
        memberships: data.memberships
      });

      // Move straight to equipment setup questionnaire for this new factory!
      setSetupSector(regFacilityType);
      setTab('equipment_setup');
      setSuccessMsg(
        i18n.language === 'bn'
          ? 'প্রতিষ্ঠান সফলভাবে নিবন্ধিত হয়েছে! কারখানার যন্ত্রপাতি ও অবকাঠামো নির্ধারণ করুন।'
          : 'Organization created! Please select the equipment used in your factory.'
      );
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEquipmentSetup(isStandardPreset = false) {
    setSetupSaving(true);
    setError(null);

    const token = localStorage.getItem('carbonbill_token');
    const payload = isStandardPreset
      ? {
          sector: setupSector || 'RMG_Woven',
          hasBoiler: true,
          hasGenset: true,
          hasProductionFloor: true,
          gridElectricity: true,
          buildingOwnership: 'Owned',
          roofAreaSqft: 25000,
          budgetBand: 'Medium'
        }
      : {
          sector: setupSector || 'RMG_Woven',
          hasBoiler: setupHasBoiler,
          hasGenset: setupHasGenset,
          hasProductionFloor: setupHasProductionFloor,
          gridElectricity: true,
          buildingOwnership: setupBuildingOwnership,
          roofAreaSqft: setupRoofAreaSqft > 0 ? setupRoofAreaSqft : null,
          budgetBand: setupBudgetBand
        };

    try {
      const res = await fetch('/api/v1/profile/facility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'যন্ত্রপাতি বিবরণ সংরক্ষণে সমস্যা হয়েছে।');
      }

      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save facility equipment');
    } finally {
      setSetupSaving(false);
    }
  }

  async function handleAcceptInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: inviteToken,
          fullName: inviteFullName,
          password: invitePassword
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'আমন্ত্রণ গ্রহণ ব্যর্থ হয়েছে। লিঙ্কটি সঠিক কি না যাচাই করুন।');
      }

      const data = await res.json();
      setSession(data.accessToken, {
        userId: data.userId,
        email: data.email,
        fullName: data.fullName,
        activeOrgId: data.activeOrgId,
        activeOrgName: data.activeOrgName,
        memberships: data.memberships
      });

      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Invite acceptance failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans text-slate-900">
      <div className={`w-full bg-white rounded-3xl p-6 md:p-8 text-slate-900 shadow-xl border border-slate-200/80 space-y-6 transition-all duration-300 ${tab === 'equipment_setup' ? 'max-w-2xl' : 'max-w-md'}`}>
        {/* Branding & Language */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center p-1.5 shadow-sm">
              <img src="/logo-icon.png" alt="CarbonBill Logo" className="w-9 h-9 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('appName')}</h1>
              <p className="text-xs text-slate-500">{t('tagline')}</p>
            </div>
          </div>

          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'bn' ? 'en' : 'bn')}
            className="text-xs font-bold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition cursor-pointer"
          >
            {i18n.language === 'bn' ? 'English' : 'বাংলা'}
          </button>
        </div>

        {/* Tab Selector or Step Indicator */}
        {tab !== 'equipment_setup' ? (
          <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold border border-slate-200/80">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(null); }}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                tab === 'login' ? 'bg-slate-900 shadow-sm text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {i18n.language === 'bn' ? 'লগইন' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setError(null); }}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                tab === 'register' ? 'bg-slate-900 shadow-sm text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {i18n.language === 'bn' ? 'নতুন প্রতিষ্ঠান' : 'Register Org'}
            </button>
            {inviteToken && (
              <button
                type="button"
                onClick={() => { setTab('invite'); setError(null); }}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  tab === 'invite' ? 'bg-slate-900 shadow-sm text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {i18n.language === 'bn' ? 'আমন্ত্রণ গ্রহণ' : 'Join Org'}
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-2xl text-xs font-bold text-slate-600 border border-slate-200">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-emerald-700 rounded-xl shadow-xs border border-slate-200/60">
              <CheckCircle size={14} className="text-emerald-600" />
              <span>{i18n.language === 'bn' ? '১. প্রতিষ্ঠান সম্পন্ন' : '1. Org Created'}</span>
            </div>
            <ArrowRight size={14} className="text-slate-400" />
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-xl shadow-xs">
              <Settings size={14} />
              <span>{i18n.language === 'bn' ? '২. যন্ত্রপাতি সেটআপ' : '2. Equipment Setup'}</span>
            </div>
          </div>
        )}

        {/* Quick Demo Accounts Helper */}
        {tab === 'login' && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                ⚡ Apex Textiles Demo Team
              </span>
              <span className="text-[10px] text-slate-400">Click to fill</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-left">
              {[
                { name: 'Kabir Ahmed', email: 'owner@apex.local', pass: 'Pass1234!' },
                { name: 'Rahim Mia', email: 'accountant@apex.local', pass: 'Pass1234!' },
                { name: 'Nusrat Jahan', email: 'compliance@apex.local', pass: 'Pass1234!' },
                { name: 'Jahid Hasan', email: 'floor@apex.local', pass: 'Pass1234!' }
              ].map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setLoginIdentifier(acc.email);
                    setPassword(acc.pass);
                    setError(null);
                  }}
                  className={`p-2 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                    loginIdentifier === acc.email
                      ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-slate-900 text-[11px] leading-tight">{acc.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{acc.email}</div>
                </button>
              ))}
            </div>
            <div className="text-[10px] text-slate-500 italic text-center">
              All teammates share identical full access to Apex Textiles.
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
            {successMsg}
          </div>
        )}

        {/* 1. Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {i18n.language === 'bn' ? 'ইমেইল বা ফোন নম্বর' : 'Email or Phone Number'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={e => setLoginIdentifier(e.target.value)}
                  placeholder="owner@apex.local or 01700000000"
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('login.passwordPlaceholder') || 'পাসওয়ার্ড'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-all active:scale-98 cursor-pointer"
            >
              {loading ? (i18n.language === 'bn' ? 'প্রবেশ করা হচ্ছে...' : 'Signing In...') : (i18n.language === 'bn' ? 'প্রবেশ করুন' : 'Sign In')}
            </button>
          </form>
        )}

        {/* 2. Register Organization Form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {i18n.language === 'bn' ? 'প্রতিষ্ঠানের নাম' : 'Organization Name'}
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  value={regOrgName}
                  onChange={e => setRegOrgName(e.target.value)}
                  placeholder={i18n.language === 'bn' ? 'যেমন: বেঙ্গল ফ্যাশন লিমিটেড' : 'e.g. Bengal Fashion Ltd'}
                  className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {i18n.language === 'bn' ? 'আপনার পূর্ণ নাম' : 'Your Full Name'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={e => setRegFullName(e.target.value)}
                  placeholder={i18n.language === 'bn' ? 'যেমন: মোহাম্মদ রফিক' : 'e.g. Rafiqul Islam'}
                  className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {i18n.language === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="rafiq@bengalfashion.com"
                  className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {i18n.language === 'bn' ? 'কারখানার ধরণ' : 'Facility Type'}
              </label>
              <select
                value={regFacilityType}
                onChange={e => setRegFacilityType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
              >
                <option value="RMG_Woven">{i18n.language === 'bn' ? 'ওভেন পোশাক (RMG Woven)' : 'RMG Woven Apparel'}</option>
                <option value="RMG_Knit">{i18n.language === 'bn' ? 'নিটওয়্যার পোশাক (RMG Knit)' : 'RMG Knitwear'}</option>
                <option value="Textile_Dyeing">{i18n.language === 'bn' ? 'ডাইং ও ওয়াশিং (Textile Dyeing)' : 'Textile Dyeing & Finishing'}</option>
                <option value="Jute_Spinning">{i18n.language === 'bn' ? 'পাট শিল্প (Jute Spinning)' : 'Jute & Spinning'}</option>
                <option value="Leather_Tannery">{i18n.language === 'bn' ? 'চামড়া শিল্প (Leather Tannery)' : 'Leather & Tannery'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {i18n.language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder={i18n.language === 'bn' ? 'কমপক্ষে ৮ অক্ষর (যেমন: Pass1234!)' : 'Minimum 8 characters (e.g. Pass1234!)'}
                  className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              {loading ? (i18n.language === 'bn' ? 'নিবন্ধন করা হচ্ছে...' : 'Creating Organization...') : (i18n.language === 'bn' ? 'প্রতিষ্ঠান শুরু করুন' : 'Create Organization')}
            </button>
          </form>
        )}

        {/* 3. Accept Teammate Invitation Form */}
        {tab === 'invite' && (
          <form onSubmit={handleAcceptInvite} className="space-y-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800">
              {i18n.language === 'bn'
                ? 'আপনাকে একটি প্রতিষ্ঠানে যোগদানের আমন্ত্রণ জানানো হয়েছে। আপনার নাম ও পাসওয়ার্ড সেট করুন।'
                : 'You have been invited to join an organization with full access. Set your name and password.'}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {i18n.language === 'bn' ? 'আমন্ত্রণ টোকেন' : 'Invite Token'}
              </label>
              <input
                type="text"
                required
                value={inviteToken}
                onChange={e => setInviteToken(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {i18n.language === 'bn' ? 'আপনার নাম' : 'Your Full Name'}
              </label>
              <input
                type="text"
                required
                value={inviteFullName}
                onChange={e => setInviteFullName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {i18n.language === 'bn' ? 'পাসওয়ার্ড সেট করুন' : 'Set Password'}
              </label>
              <input
                type="password"
                required
                value={invitePassword}
                onChange={e => setInvitePassword(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              {loading ? (i18n.language === 'bn' ? 'যুক্ত হওয়া হচ্ছে...' : 'Joining...') : (i18n.language === 'bn' ? 'দলে যোগ দিন' : 'Join Team')}
            </button>
          </form>
        )}

        {/* 4. Post-Registration Equipment Setup */}
        {tab === 'equipment_setup' && (
          <div className="space-y-5">
            {/* Step header */}
            <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-900 bg-teal-200/60 px-2 py-0.5 rounded-md">
                  {i18n.language === 'bn' ? 'ধাপ ২ / ২: যন্ত্রপাতি নির্বাচন' : 'Step 2 of 2: Equipment Setup'}
                </span>
                <span className="text-[11px] font-semibold text-teal-700 truncate max-w-[180px]">
                  {regOrgName || 'New Facility'}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-800">
                {i18n.language === 'bn'
                  ? 'আপনার কারখানায় কোন কোন যন্ত্রপাতি চালু রয়েছে?'
                  : 'What equipment does your factory operate?'}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                {i18n.language === 'bn'
                  ? 'কার্বনবিল এআই আপনার যন্ত্রপাতির উপর ভিত্তি করে বিদ্যুৎ ও জ্বালানি খরচ কমানোর সুনির্দিষ্ট প্রস্তাবনা এবং আনুমানিক সাশ্রয় হিসাব করবে।'
                  : 'CarbonBill AI uses your equipment profile to identify targeted energy-efficiency projects and calculate annual BDT savings.'}
              </p>
            </div>

            {/* 1-Click Fast Track: RMG Standard Preset */}
            <div className="bg-gradient-to-br from-teal-900 to-slate-900 text-white rounded-2xl p-4 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-amber-400 shrink-0" size={18} />
                  <span className="font-bold text-sm">
                    {i18n.language === 'bn' ? '⚡ দ্রুততম শুরু: স্ট্যান্ডার্ড পোশাক কারখানা প্রিসেট' : '⚡ 1-Click Fast Start: Standard RMG Preset'}
                  </span>
                </div>
                <span className="text-[10px] bg-teal-800/80 text-teal-200 px-2 py-0.5 rounded-full font-medium shrink-0">
                  {i18n.language === 'bn' ? 'প্রস্তাবিত' : 'Recommended'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {i18n.language === 'bn'
                  ? 'বাংলাদেশের বেশিরভাগ পোশাক কারখানার স্ট্যান্ডার্ড সেটআপ: স্টিম বয়লার, ব্যাকআপ ডিজেল জেনারেটর, সেলাই ফ্লোর ও ২৫,০০০ বর্গফুট ছাদ।'
                  : 'Standard Bangladesh RMG setup: Steam Boiler, Diesel Generator, Sewing Floor, Owned Building, and 25,000 sq ft roof.'}
              </p>
              <button
                type="button"
                disabled={setupSaving}
                onClick={() => handleSaveEquipmentSetup(true)}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
              >
                {setupSaving ? (
                  <span>{i18n.language === 'bn' ? 'প্রোফাইল তৈরি হচ্ছে...' : 'Setting up profile...'}</span>
                ) : (
                  <>
                    <span>{i18n.language === 'bn' ? '⚡ স্ট্যান্ডার্ড প্রিসেট প্রয়োগ করে ড্যাশবোর্ডে যান' : '⚡ Apply Standard Preset & Launch Dashboard'}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>

            {/* Or Custom Section */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {i18n.language === 'bn' ? 'অথবা নিজস্ব যন্ত্রপাতি নির্ধারণ করুন' : 'Or Customize Facility Assets'}
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveEquipmentSetup(false); }} className="space-y-3.5">
              {/* Equipment Toggles */}
              <div className="space-y-2">
                {/* 1. Steam Boiler */}
                <div
                  onClick={() => setSetupHasBoiler(!setupHasBoiler)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    setupHasBoiler ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300' : 'bg-slate-50 border-slate-200 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${setupHasBoiler ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      <Flame size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {i18n.language === 'bn' ? 'ইন্ডাস্ট্রিয়াল বাষ্পীয় বয়লার (Steam Boiler)' : 'Industrial Steam Boiler'}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight">
                        {i18n.language === 'bn'
                          ? 'ইস্ত্রি, ওয়াশিং বা ডাইং এর বাষ্প তৈরি (স্টিম ট্র্যাপ মেরামত ও ইকোনোমাইজার)'
                          : 'Steam for ironing, washing, and finishing (enables economizer & trap fixes)'}
                      </div>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 ml-2 ${setupHasBoiler ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {setupHasBoiler ? (i18n.language === 'bn' ? 'আছে' : 'Yes') : (i18n.language === 'bn' ? 'নেই' : 'No')}
                  </div>
                </div>

                {/* 2. Backup Diesel Generator */}
                <div
                  onClick={() => setSetupHasGenset(!setupHasGenset)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    setupHasGenset ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-300' : 'bg-slate-50 border-slate-200 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${setupHasGenset ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      <Zap size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {i18n.language === 'bn' ? 'ডিজেল ব্যাকআপ জেনারেটর (Diesel Generator)' : 'Backup Diesel Generator'}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight">
                        {i18n.language === 'bn'
                          ? 'গ্রিড বিভ্রাটের সময় ব্যাকআপ বিদ্যুৎ (জেনারেটর রাইট-সাইজিং ও জ্বালানি অপ্টিমাইজেশন)'
                          : 'Backup electricity during power cuts (enables generator right-sizing & load match)'}
                      </div>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 ml-2 ${setupHasGenset ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {setupHasGenset ? (i18n.language === 'bn' ? 'আছে' : 'Yes') : (i18n.language === 'bn' ? 'নেই' : 'No')}
                  </div>
                </div>

                {/* 3. Production Floor */}
                <div
                  onClick={() => setSetupHasProductionFloor(!setupHasProductionFloor)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    setupHasProductionFloor ? 'bg-teal-50/70 border-teal-300 ring-1 ring-teal-300' : 'bg-slate-50 border-slate-200 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${setupHasProductionFloor ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      <Factory size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {i18n.language === 'bn' ? 'গার্মেন্টস প্রোডাকশন ফ্লোর (Production Floor)' : 'Sewing & Assembly Production Floor'}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight">
                        {i18n.language === 'bn'
                          ? 'সেলাই ও কাটিং লাইন, এয়ার কম্প্রেসর ও হাই-বে লাইটিং (LED রেট্রোফিট ও ইনভার্টার VFD)'
                          : 'Sewing lines, air compressors & lighting (enables high-bay LED & VFD compressor)'}
                      </div>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 ml-2 ${setupHasProductionFloor ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {setupHasProductionFloor ? (i18n.language === 'bn' ? 'আছে' : 'Yes') : (i18n.language === 'bn' ? 'নেই' : 'No')}
                  </div>
                </div>
              </div>

              {/* Building Ownership & Roof space */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {i18n.language === 'bn' ? 'কারখানা ভবনের মালিকানা' : 'Building Ownership'}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSetupBuildingOwnership('Owned')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                        setupBuildingOwnership === 'Owned'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {i18n.language === 'bn' ? '🏢 নিজস্ব ভবন (Owned)' : '🏢 Owned'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSetupBuildingOwnership('Rented')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                        setupBuildingOwnership === 'Rented'
                          ? 'bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-500'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {i18n.language === 'bn' ? '🏬 ভাড়া ভবন (Rented)' : '🏬 Rented'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {i18n.language === 'bn' ? 'ব্যবহারযোগ্য ছাদের আয়তন (বর্গফুট)' : 'Usable Rooftop Area (sq ft)'}
                  </label>
                  <div className="relative">
                    <Sun className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={setupRoofAreaSqft}
                      onChange={(e) => setSetupRoofAreaSqft(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="25000"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-teal-600"
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {i18n.language === 'bn' ? 'সোলার প্যানেলের ক্ষমতা ও সাশ্রয় নির্ণয়ে আবশ্যক।' : 'Needed to calculate rooftop solar capacity.'}
                  </div>
                </div>
              </div>

              {/* Budget Appetite */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {i18n.language === 'bn' ? 'প্রাথমিক বিনিয়োগ বাজেট প্রস্তুতি' : 'Investment Budget Preference'}
                </label>
                <select
                  value={setupBudgetBand}
                  onChange={(e) => setSetupBudgetBand(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-600"
                >
                  <option value="Low">
                    {i18n.language === 'bn'
                      ? 'স্বল্প বিনিয়োগ (Quick Payback < 1 yr: LED, ট্র্যাপ মেরামত, সেন্সর)'
                      : 'Low Budget (Quick Payback < 1 yr: LED retrofit, trap repairs)'}
                  </option>
                  <option value="Medium">
                    {i18n.language === 'bn'
                      ? 'মাঝারি বাজেট (Balanced 1-3 yrs: VFD কম্প্রেসর, বয়লার ইকোনোমাইজার)'
                      : 'Medium Budget (Balanced 1-3 yrs: VFD compressor, economizer)'}
                  </option>
                  <option value="High">
                    {i18n.language === 'bn'
                      ? 'উচ্চ বিনিয়োগ (Strategic > 3 yrs: রুফটপ সোলার ও পূর্ণ হিট রিকভারি)'
                      : 'High Budget (Strategic > 3 yrs: Rooftop Solar & full heat recovery)'}
                  </option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={setupSaving}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {setupSaving ? (
                    <span>{i18n.language === 'bn' ? 'সংরক্ষণ করা হচ্ছে...' : 'Saving & Recalculating...'}</span>
                  ) : (
                    <>
                      <span>{i18n.language === 'bn' ? 'যন্ত্রপাতি বিবরণ সংরক্ষণ করে ড্যাশবোর্ডে যান' : 'Save Equipment & Launch Dashboard'}</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={onLoginSuccess}
                    className="text-xs text-stone-400 hover:text-stone-600 underline font-medium cursor-pointer"
                  >
                    {i18n.language === 'bn' ? 'এখনই বাদ দিন (পরে প্রোফাইল থেকে সেটআপ করব)' : 'Skip for now (configure later in profile)'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Quick link to Floor capture view */}
        <div className="pt-2 border-t border-slate-200 text-center">
          <button
            onClick={onGoToFloor}
            className="text-xs text-slate-700 hover:text-emerald-700 font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            📱 {i18n.language === 'bn' ? 'ফ্লোর ক্যামেরা ক্যাপচার মোড' : 'Floor Camera Capture Mode'} <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
