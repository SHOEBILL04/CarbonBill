import React, { lazy } from 'react';

export const FloorStaffView = lazy(() => import('../../routes/floor/FloorStaffView'));

export const captureRoutes = [
  {
    path: '/floor',
    role: 'FloorStaff',
    component: FloorStaffView,
  },
];
