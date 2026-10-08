import React from 'react';

export const ReviewPlaceholder: React.FC = () => {
  return React.createElement(
    'div',
    { className: 'p-8 text-center bg-white rounded-2xl border border-slate-200' },
    React.createElement('h2', { className: 'text-lg font-bold text-slate-800' }, 'পর্যালোচনা কিউ (Review Queue)'),
    React.createElement('p', { className: 'text-xs text-slate-500 mt-1' }, 'সবচেয়ে কম আত্মবিশ্বাসী চালানগুলো আগে পর্যালোচনার জন্য সাজানো হবে।')
  );
};

export const reviewRoutes = [
  {
    path: '/review',
    role: 'Accountant',
    component: ReviewPlaceholder,
  },
];
