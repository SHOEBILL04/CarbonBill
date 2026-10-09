import React from 'react';

export const RecommendationsPlaceholder: React.FC = () => {
  return React.createElement(
    'div',
    { className: 'p-8 text-center bg-white rounded-2xl border border-slate-200' },
    React.createElement('h2', { className: 'text-lg font-bold text-slate-800' }, 'সুপারিশসমূহ (Recommendations)'),
    React.createElement('p', { className: 'text-xs text-slate-500 mt-1' }, 'প্রমাণভিত্তিক সাশ্রয়ী পদক্ষেপ এবং টাকায় পে-ব্যাক হিসাব।')
  );
};

export const recommendationsRoutes = [
  {
    path: '/recommendations',
    role: 'Owner',
    component: RecommendationsPlaceholder,
  },
];
