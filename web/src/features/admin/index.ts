import React from 'react';

export const AdminPlaceholder: React.FC = () => {
  return React.createElement(
    'div',
    { className: 'p-8 text-center bg-white rounded-2xl border border-slate-200' },
    React.createElement('h2', { className: 'text-lg font-bold text-slate-800' }, 'প্ল্যাটফর্ম অ্যাডমিন (Platform Admin)'),
    React.createElement('p', { className: 'text-xs text-slate-500 mt-1' }, 'ফ্যাক্টর সেট, পরিমাপ লাইব্রেরি এবং টেন্যান্ট ব্যবস্থাপনা।')
  );
};

export const adminRoutes = [
  {
    path: '/admin',
    role: 'PlatformAdmin',
    component: AdminPlaceholder,
  },
];
