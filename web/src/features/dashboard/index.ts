import React, { lazy } from 'react';

export const DashboardView = lazy(() => import('../../routes/main/DashboardView'));

export const dashboardRoutes = [
  {
    path: '/dashboard',
    role: 'Owner',
    component: DashboardView,
  },
];
