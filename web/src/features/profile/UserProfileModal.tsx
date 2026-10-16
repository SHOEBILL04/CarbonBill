import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AuthUser,
  TeamUser,
  fetchTeamUsers,
  updateMyProfile,
  updateUserRole,
  setSession,
  getStoredToken,
} from '../../lib/apiClient';
import {
  User,
  Shield,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  Briefcase,
  Phone,
  Mail,
  Building,
  RefreshCw,
  Sparkles,
  Award,
  Check,
  FileCheck,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  onUserUpdated: (updatedUser: AuthUser) => void;
}

export interface RoleDefinition {
  key: string;
  nameEn: string;
  nameBn: string;
  descEn: string;
  descBn: string;
  badgeBg: string;
  badgeText: string;
}

export const SYSTEM_ROLES: RoleDefinition[] = [
  {
    key: 'Owner',
    nameEn: 'Factory Owner / Managing Director',
    nameBn: 'কারখানা মালিক / ব্যবস্থাপনা পরিচালক',
    descEn: 'Full organization authority, final report authorization, and company signatory.',
    descBn: 'সর্বোচ্চ প্রশাসনিক কর্তৃত্ব, চূড়ান্ত কার্বন রিপোর্ট অনুমোদন ও ডিজিটাল স্বাক্ষরকারী।',
    badgeBg: 'bg-emerald-100 border-emerald-300',
    badgeText: 'text-emerald-900',
  },
  {
    key: 'Accountant',
    nameEn: 'Accountant / Financial Officer',
    nameBn: 'প্রধান হিসাবরক্ষক / ফিন্যান্স অফিসার',
    descEn: 'Validates utility tariffs, reviews invoices, and confirms ledger figures.',
    descBn: 'ইউটিলিটি বিল যাচাই, চালান পর্যালোচনা ও হিসাব খতিয়ান নিশ্চিতকরণ।',
    badgeBg: 'bg-blue-100 border-blue-300',
    badgeText: 'text-blue-900',
  },
  {
    key: 'Compliance',
    nameEn: 'Compliance Manager',
    nameBn: 'কমপ্লায়েন্স ও অডিট ম্যানেজার',
    descEn: 'Manages emission standards, buyer audit readiness, and factor verification.',
    descBn: 'আন্তর্জাতিক ক্রেতা কমপ্লায়েন্স, পরিবেশ মানদণ্ড ও নির্গমন ফ্যাক্টর যাচাই।',
    badgeBg: 'bg-purple-100 border-purple-300',
    badgeText: 'text-purple-900',
  },
  {
    key: 'SustainabilityLead',
    nameEn: 'Sustainability & ESG Lead',
    nameBn: 'সাসটেইনেবিলিটি ও ডিকার্বনাইজেশন প্রধান',
    descEn: 'Oversees decarbonization targets, GHG protocol compliance, and emissions trends.',
    descBn: 'গ্রিনহাউস গ্যাস লক্ষ্যমাত্রা পর্যবেক্ষণ এবং টেকসই রূপান্তর পরিকল্পনা।',
    badgeBg: 'bg-teal-100 border-teal-300',
    badgeText: 'text-teal-900',
  },
  {
    key: 'FloorStaff',
    nameEn: 'Floor Operator / Data Collector',
    nameBn: 'ফ্লোর স্টাফ / ডাটা সংগ্রাহক',
    descEn: 'Captures generator slips, electric meters, and daily floor activity.',
    descBn: 'জেনারেটর ডিজেল স্লিপ ও ফ্লোর ডাটা সরাসরি ক্যামেরা দিয়ে সংগ্রহ।',
    badgeBg: 'bg-amber-100 border-amber-300',
    badgeText: 'text-amber-900',
  },
  {
    key: 'Auditor',
    nameEn: 'External GHG Auditor',
    nameBn: 'বহিরাগত পরিবেশ ও কার্বন নিরীক্ষক',
    descEn: 'Third-party verifier assessing calculation methodology and primary evidence.',
    descBn: 'নিরপেক্ষ তৃতীয় পক্ষ কার্বন অডিটর এবং প্রমাণক যাচাইকারী।',
    badgeBg: 'bg-slate-100 border-slate-300',
    badgeText: 'text-slate-800',
  },
];

export function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
}: UserProfileModalProps) {
  const { i18n } = useTranslation();
  const isBangla = i18n.language === 'bn';

  const [activeTab, setActiveTab] = useState<'profile' | 'team'>('profile');
  const [fullName, setFullName] = useState<string>(currentUser.fullName || '');
  const [phone, setPhone] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>(currentUser.role || 'Accountant');

  const [teamMembers, setTeamMembers] = useState<TeamUser[]>([]);
  const [loadingTeam, setLoadingTeam] = useState<boolean>(false);
  const [savingSelf, setSavingSelf] = useState<boolean>(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFullName(currentUser.fullName || '');
      setSelectedRole(currentUser.role || 'Accountant');
      loadTeam();
    }
  }, [isOpen, currentUser]);

  async function loadTeam() {
    setLoadingTeam(true);
    try {
      const users = await fetchTeamUsers();
      setTeamMembers(users);
      const me = users.find((u) => u.id.toLowerCase() === currentUser.userId.toLowerCase());
      if (me) {
        if (me.phoneNumber) setPhone(me.phoneNumber);
        if (me.role) setSelectedRole(me.role);
      }
    } finally {
      setLoadingTeam(false);
    }
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  async function handleSaveSelfProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingSelf(true);
    try {
      const res = await updateMyProfile({
        userId: currentUser.userId,
        fullName: fullName.trim(),
        phoneNumber: phone.trim() || undefined,
        role: selectedRole,
      });

      const updatedAuthUser: AuthUser = {
        ...currentUser,
        fullName: fullName.trim(),
        role: selectedRole,
      };

      const token = getStoredToken();
      if (token) {
        setSession(token, updatedAuthUser);
      }
      onUserUpdated(updatedAuthUser);

      // Dispatch global event so reports & dashboard update their reviewer tags
      window.dispatchEvent(
        new CustomEvent('carbonbill:user-updated', {
          detail: { userId: currentUser.userId, role: selectedRole, fullName: fullName.trim() },
        })
      );

      // Update in team members list too
      setTeamMembers((prev) =>
        prev.map((m) =>
          m.id.toLowerCase() === currentUser.userId.toLowerCase()
            ? { ...m, fullName: fullName.trim(), phoneNumber: phone.trim(), role: selectedRole }
            : m
        )
      );

      showToast(
        isBangla
          ? 'আপনার প্রোফাইল ও ভূমিকা সফলভাবে সংরক্ষিত হয়েছে!'
          : 'Your profile and role have been updated successfully!'
      );
    } catch (err: any) {
      showToast(
        isBangla
          ? 'প্রোফাইল সংরক্ষণ ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
          : `Failed to update profile: ${err?.message || 'Error'}`
      );
    } finally {
      setSavingSelf(false);
    }
  }

  async function handleRoleChangeForTeammate(userId: string, newRole: string) {
    setUpdatingUserId(userId);
    try {
      await updateUserRole(userId, newRole);

      setTeamMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m))
      );

      // If user updated their own role in the team table
      if (userId.toLowerCase() === currentUser.userId.toLowerCase()) {
        setSelectedRole(newRole);
        const updatedAuthUser: AuthUser = {
          ...currentUser,
          role: newRole,
        };
        const token = getStoredToken();
        if (token) setSession(token, updatedAuthUser);
        onUserUpdated(updatedAuthUser);
      }

      window.dispatchEvent(
        new CustomEvent('carbonbill:user-updated', {
          detail: { userId, role: newRole },
        })
      );

      const target = teamMembers.find((m) => m.id === userId);
      showToast(
        isBangla
          ? `${target?.fullName || 'সদস্যের'} ভূমিকা সফলভাবে "${newRole}" হিসেবে নির্ধারণ করা হয়েছে!`
          : `Role for ${target?.fullName || 'Member'} updated to "${newRole}"!`
      );
    } catch (err: any) {
      showToast(
        isBangla
          ? 'ভূমিকা পরিবর্তন ব্যর্থ হয়েছে।'
          : `Failed to update role: ${err?.message || 'Error'}`
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  if (!isOpen) return null;

  const currentRoleDef =
    SYSTEM_ROLES.find((r) => r.key === selectedRole) || SYSTEM_ROLES[1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900 p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-teal-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title={isBangla ? 'বন্ধ করুন' : 'Close'}
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl font-black text-white shadow-inner">
              {currentUser.fullName
                ? currentUser.fullName.slice(0, 2).toUpperCase()
                : 'CB'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-white">
                  {currentUser.fullName}
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-400 text-teal-950 shadow-2xs">
                  {currentRoleDef ? (isBangla ? currentRoleDef.nameBn : currentRoleDef.nameEn) : selectedRole}
                </span>
              </div>
              <p className="text-xs text-teal-200 flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1">
                  <Mail size={12} /> {currentUser.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-semibold">
                  <Building size={12} /> {currentUser.activeOrgName || 'Apex Textile & Garments Ltd.'}
                </span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 border-b border-white/10 pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-white text-teal-950 border-white'
                  : 'text-teal-200 hover:text-white hover:bg-white/5 border-transparent'
              }`}
            >
              <User size={15} />
              {isBangla ? 'আমার প্রোফাইল ও ভূমিকা' : 'My Profile & Role'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('team')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'team'
                  ? 'bg-white text-teal-950 border-white'
                  : 'text-teal-200 hover:text-white hover:bg-white/5 border-transparent'
              }`}
            >
              <Users size={15} />
              {isBangla ? 'টিম সদস্য ও দায়িত্ব নির্ধারণ' : 'Team Roles Management'}
              <span className="px-1.5 py-0.2 bg-teal-700 text-teal-100 rounded-full text-[10px]">
                {teamMembers.length}
              </span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* Toast Notification Alert */}
          {toastMessage && (
            <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm">
              <CheckCircle2 size={16} className="text-teal-700 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* TAB 1: MY PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveSelfProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isBangla ? 'পূর্ণ নাম' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                    placeholder="e.g. Rahim Mia"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isBangla ? 'মোবাইল নম্বর' : 'Phone Number'}
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                      placeholder="e.g. 01712345678"
                    />
                  </div>
                </div>
              </div>

              {/* Role Selection Section */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shield size={14} className="text-teal-700" />
                  {isBangla ? 'আপনার সিস্টেম ভূমিকা নির্ধারণ করুন:' : 'Select Your Operational Role:'}
                </label>
                <p className="text-xs text-slate-500 mb-4">
                  {isBangla
                    ? 'এখানে নির্বাচিত ভূমিকাটি আপনার ভেরিফাই করা সকল চালান, অডিট খতিয়ান এবং কার্বন রিপোর্টে প্রদর্শিত হবে।'
                    : 'The role selected below is directly stamped on all reports and verified invoices as the official reviewer.'}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SYSTEM_ROLES.map((role) => {
                    const isSelected = selectedRole === role.key;
                    return (
                      <div
                        key={role.key}
                        onClick={() => setSelectedRole(role.key)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-teal-700 bg-teal-50/70 shadow-sm ring-1 ring-teal-700'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">
                              {isBangla ? role.nameBn : role.nameEn}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 font-semibold">
                              Code: {role.key}
                            </span>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition ${
                              isSelected
                                ? 'bg-teal-700 text-white'
                                : 'border border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {isBangla ? role.descBn : role.descBn ? role.descEn : role.descEn}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Report Stamp Preview */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 border border-slate-800 shadow-md">
                <div className="flex items-center justify-between text-xs font-bold text-teal-300">
                  <span className="flex items-center gap-1.5">
                    <FileCheck size={14} className="text-emerald-400" />
                    {isBangla
                      ? 'রিপোর্টে রিভিউয়ার হিসেবে প্রদর্শনের লাইভ প্রিভিউ:'
                      : 'Live Preview on GHG Audit Report:'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-teal-950 text-emerald-400 font-mono text-[10px] border border-emerald-500/30">
                    Live Sync Active
                  </span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      {isBangla ? 'চালান যাচাইকারী (Reviewer)' : 'Verified & Confirmed By'}
                    </span>
                    <span className="text-sm font-black text-emerald-300">
                      {fullName || 'Jahid Hasan'}{' '}
                      <span className="text-slate-300 font-medium text-xs">
                        ({selectedRole})
                      </span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      {isBangla ? 'আইনগত মর্যাদা' : 'Legal Provenance'}
                    </span>
                    <span className="text-xs text-teal-200 font-mono">
                      ISO 14064-1 / GHG Protocol Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  {isBangla ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={savingSelf}
                  className="px-6 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {savingSelf ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  {isBangla ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: TEAM MEMBERS & ROLE ASSIGNMENT */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-teal-50/70 border border-teal-200/80 p-4 rounded-2xl">
                <div>
                  <h3 className="text-xs font-black text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={15} className="text-teal-800" />
                    {isBangla
                      ? 'অর্গানাইজেশনের টিম মেম্বারদের ভূমিকা নির্ধারণ'
                      : 'Organization Team Roles Management'}
                  </h3>
                  <p className="text-xs text-teal-800/90 mt-0.5">
                    {isBangla
                      ? 'যেকোনো সদস্যের ভূমিকা পরিবর্তন করলে তা অবিলম্বে কার্বন অডিট রিপোর্ট ও পর্যালোচনায় আপডেট হয়ে যাবে।'
                      : 'Changing any teammate’s role here immediately reflects who reviewed reports and verified invoices.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadTeam}
                  disabled={loadingTeam}
                  className="self-start sm:self-auto px-3 py-1.5 bg-white border border-teal-300 rounded-xl text-xs font-bold text-teal-800 hover:bg-teal-100 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RefreshCw size={12} className={loadingTeam ? 'animate-spin' : ''} />
                  {isBangla ? 'রিফ্রেশ' : 'Refresh'}
                </button>
              </div>

              {/* Team Members Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">{isBangla ? 'সদস্যের নাম ও ইমেইল' : 'Member Name & Email'}</th>
                      <th className="py-3 px-4">{isBangla ? 'ফোন' : 'Phone'}</th>
                      <th className="py-3 px-4">{isBangla ? 'বর্তমান ভূমিকা' : 'Current Role'}</th>
                      <th className="py-3 px-4 text-right">{isBangla ? 'ভূমিকা পরিবর্তন' : 'Assign New Role'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teamMembers.map((member) => {
                      const isMe = member.id.toLowerCase() === currentUser.userId.toLowerCase();
                      const currentDef =
                        SYSTEM_ROLES.find((r) => r.key === member.role) || SYSTEM_ROLES[1];

                      return (
                        <tr
                          key={member.id}
                          className={`hover:bg-slate-50/80 transition ${
                            isMe ? 'bg-teal-50/30' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                                {member.fullName.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                                  {member.fullName}
                                  {isMe && (
                                    <span className="text-[9px] font-bold bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded-md">
                                      {isBangla ? 'আপনি' : 'You'}
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-slate-500 font-mono truncate">
                                  {member.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono text-slate-600">
                            {member.phoneNumber || '—'}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${currentDef.badgeBg} ${currentDef.badgeText}`}
                            >
                              <Shield size={11} />
                              {isBangla ? currentDef.nameBn : currentDef.nameEn}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <select
                              value={member.role}
                              disabled={updatingUserId === member.id}
                              onChange={(e) =>
                                handleRoleChangeForTeammate(member.id, e.target.value)
                              }
                              className="px-2.5 py-1.5 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 transition cursor-pointer disabled:opacity-50"
                            >
                              {SYSTEM_ROLES.map((r) => (
                                <option key={r.key} value={r.key}>
                                  {isBangla ? r.nameBn : r.nameEn} ({r.key})
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Informative Footer Card */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
                <AlertCircle size={16} className="text-amber-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {isBangla
                    ? 'টিমের যেকোনো সদস্যের ভূমিকা এখান থেকে পরিবর্তন করলে, তাঁর পর্যালোচিত বিলসমূহ ও অনুমোদিত কার্বন রিপোর্টে তাঁর নতুন পদবী তাৎক্ষণিকভাবে সংযুক্ত হয়ে যাবে।'
                    : 'When you update any teammate’s role here, their newly assigned role will immediately be credited as the reviewer and auditor on all corresponding CarbonBill GHG reports.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
