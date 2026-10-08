import React, { lazy } from 'react';

export const LoginView = lazy(() => import('../../routes/main/LoginView'));

export const authRoutes = [
  {
    path: '/login',
    component: LoginView,
  },
];
