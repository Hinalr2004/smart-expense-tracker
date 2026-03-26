import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const API_URL = 'http://localhost:5000/api/expenses';

export interface Expense {
  _id: string;
  date: string;
  title: string;
  category: string;
  amount: number;
  notes: string;
}

interface ExpenseContextType {
  expenses: Expense[];
  loading: boolean;
  stats: any;
  addExpense: (expense: Omit<Expense, '_id'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  refreshExpenses: () => Promise<void>;
  getAIChatResponse: (message: string) => Promise<string>;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user, isLoggedIn } = useAuth();

  const getAuthHeader = () => {
    if (user?.token) {
      return { Authorization: `Bearer ${user.token}` };
    }
    return {};
  };

  const refreshExpenses = async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const [expensesRes, statsRes] = await Promise.all([
        axios.get(API_URL, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/stats`, { headers: getAuthHeader() })
      ]);
      
      if (expensesRes.data.success) {
        setExpenses(expensesRes.data.data);
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching expenses or stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshExpenses();
    
    // Set up auto-refresh every 5 seconds
    const interval = setInterval(() => {
      refreshExpenses();
    }, 5000);

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const addExpense = async (expense: Omit<Expense, '_id'>) => {
    try {
      const response = await axios.post(`${API_URL}/add`, expense, { headers: getAuthHeader() });
      if (response.data.success) {
        setExpenses(prev => [response.data.data, ...prev]);
        // Refresh stats after adding
        const statsRes = await axios.get(`${API_URL}/stats`, { headers: getAuthHeader() });
        if (statsRes.data.success) setStats(statsRes.data.data);
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add expense');
    }
  };

  const updateExpense = async (id: string, updatedFields: Partial<Expense>) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, updatedFields, { headers: getAuthHeader() });
      if (response.data.success) {
        setExpenses(prev =>
          prev.map(expense =>
            expense._id === id ? { ...expense, ...response.data.data } : expense
          )
        );
        // Refresh stats
        const statsRes = await axios.get(`${API_URL}/stats`, { headers: getAuthHeader() });
        if (statsRes.data.success) setStats(statsRes.data.data);
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update expense');
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
      if (response.data.success) {
        setExpenses(prev => prev.filter(expense => expense._id !== id));
        // Refresh stats
        const statsRes = await axios.get(`${API_URL}/stats`, { headers: getAuthHeader() });
        if (statsRes.data.success) setStats(statsRes.data.data);
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete expense');
    }
  };

  const getAIChatResponse = async (message: string) => {
    try {
      const response = await axios.post(`${API_URL}/ai-chat`, { message }, { headers: getAuthHeader() });
      return response.data.response;
    } catch (error: any) {
      return "I'm having trouble connecting to my AI brain right now. Please try again later!";
    }
  };

  return (
    <ExpenseContext.Provider value={{ expenses, loading, stats, addExpense, updateExpense, deleteExpense, refreshExpenses, getAIChatResponse }}>
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
}
