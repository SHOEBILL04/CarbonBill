import React from 'react';

export const OnboardingPlaceholder: React.FC = () => {
  return React.createElement(
    'div',
    { className: 'p-8 text-center bg-white rounded-2xl border border-slate-200' },
    React.createElement('h2', { className: 'text-lg font-bold text-slate-800' }, 'অনবোর্ডিং উইজার্ড (Onboarding Wizard)'),
    React.createElement('p', { className: 'text-xs text-slate-500 mt-1' }, 'কারখানার সাইট, মিটার, জেনারেটর এবং বয়লার প্রোফাইল সেটআপ।')
  );
};

export const onboardingRoutes = [
  {
    path: '/onboarding',
    role: 'Owner',
    component: OnboardingPlaceholder,
  },
];
