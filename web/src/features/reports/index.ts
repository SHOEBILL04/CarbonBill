import React from 'react';

export const ReportsPlaceholder: React.FC = () => {
  return React.createElement(
    'div',
    { className: 'p-8 text-center bg-white rounded-2xl border border-slate-200' },
    React.createElement('h2', { className: 'text-lg font-bold text-slate-800' }, 'প্রতিবেদনসমূহ (Buyer Reports)'),
    React.createElement('p', { className: 'text-xs text-slate-500 mt-1' }, 'GHG প্রোটোকল সম্মত পিডিএফ ও এক্সেল রিপোর্ট ডাউনলোড এবং অডিটর লিঙ্ক।')
  );
};

export const reportsRoutes = [
  {
    path: '/reports',
    role: 'Compliance',
    component: ReportsPlaceholder,
  },
];
