import React from 'react';

export const FlagsPlaceholder: React.FC = () => {
  return React.createElement(
    'div',
    { className: 'p-8 text-center bg-white rounded-2xl border border-slate-200' },
    React.createElement('h2', { className: 'text-lg font-bold text-slate-800' }, 'কার্বন ফ্ল্যাগস (Carbon Flags)'),
    React.createElement('p', { className: 'text-xs text-slate-500 mt-1' }, 'ডেটা কোয়ালিটি, অস্বাভাবিক স্পাইক এবং অডিট প্রস্তুতির সতর্কতা।')
  );
};

export const flagsRoutes = [
  {
    path: '/flags',
    role: 'Compliance',
    component: FlagsPlaceholder,
  },
];
