import React from 'react';

export const AuditorPlaceholder: React.FC = () => {
  return React.createElement(
    'div',
    { className: 'p-8 text-center bg-white rounded-2xl border border-slate-200' },
    React.createElement('h2', { className: 'text-lg font-bold text-slate-800' }, 'অডিটর পোর্টাল (Auditor Read-Only Portal)'),
    React.createElement('p', { className: 'text-xs text-slate-500 mt-1' }, 'প্রতিটি পরিসংখ্যানের মূল চালান ও নির্গমন ফ্যাক্টর ট্র্যাকিং।')
  );
};

export const auditorRoutes = [
  {
    path: '/auditor',
    role: 'AuditorLink',
    component: AuditorPlaceholder,
  },
];
