import React from 'react';

export const ConsultantPlaceholder: React.FC = () => {
  return React.createElement(
    'div',
    { className: 'p-8 text-center bg-white rounded-2xl border border-slate-200' },
    React.createElement('h2', { className: 'text-lg font-bold text-slate-800' }, 'পরামর্শক কর্মক্ষেত্র (Consultant Workspace)'),
    React.createElement('p', { className: 'text-xs text-slate-500 mt-1' }, 'একাধিক ক্লায়েন্ট কারখানা পরিচালনা ও ফ্যাক্টর ওভাররাইড অনুরোধ।')
  );
};

export const consultantRoutes = [
  {
    path: '/consultant',
    role: 'Consultant',
    component: ConsultantPlaceholder,
  },
];
