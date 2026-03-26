import { RouterProvider } from 'react-router-dom';
import { router } from './routes.tsx';
import { AuthProvider } from './context/AuthContext';
import { ExpenseProvider } from './context/ExpenseContext';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <AuthProvider>
      <ExpenseProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </ExpenseProvider>
    </AuthProvider>
  );
}