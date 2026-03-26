import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { Dashboard } from './pages/Dashboard';
import { AddExpense } from './pages/AddExpense';
import { Transactions } from './pages/Transactions';
import { Analytics } from './pages/Analytics';
import { Profile } from './pages/Profile';
import { Layout } from './components/Layout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />
  },
  {
    path: '/login',
    Component: Login
  },
  {
    path: '/signup',
    Component: SignUp
  },
  {
    path: '/',
    Component: Layout,
    children: [
      {
        path: 'dashboard',
        Component: Dashboard
      },
      {
        path: 'add-expense',
        Component: AddExpense
      },
      {
        path: 'transactions',
        Component: Transactions
      },
      {
        path: 'analytics',
        Component: Analytics
      },
      {
        path: 'profile',
        Component: Profile
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />
  }
]);