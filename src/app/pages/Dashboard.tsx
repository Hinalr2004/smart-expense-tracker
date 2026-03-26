import { useState, useEffect } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import { Wallet, TrendingUp, TrendingDown, IndianRupee, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export function Dashboard() {
  const { expenses, stats, loading: contextLoading, getAIChatResponse } = useExpenses();
  const { user, updateBudget } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState(user?.monthlyBudget?.toString() || '25000');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    // Sync local loading state with context loading
    if (!contextLoading && stats) {
      setLoading(false);
    }
  }, [contextLoading, stats]);

  // Calculate statistics
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const monthlyBudget = user?.monthlyBudget || 25000;
  const currentMonthSpent = stats?.currentMonthSpent || 0;
  const remainingBalance = monthlyBudget - currentMonthSpent;
  const budgetUsagePercent = stats?.budgetUsagePercent || 0;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage.trim();
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatMessage('');
    setIsChatLoading(true);

    try {
      const aiResponse = await getAIChatResponse(userMsg);
      setChatHistory(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error) {
      toast.error('Failed to get AI response');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleUpdateBudget = async () => {
    const budgetNum = parseFloat(newBudget);
    if (isNaN(budgetNum) || budgetNum < 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }

    try {
      await updateBudget(budgetNum);
      setIsEditingBudget(false);
      toast.success('Budget updated successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Recent transactions (last 5)
  const recentTransactions = expenses.slice(0, 5);

  // Category spending
  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Analyzing your finances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Track your spending and manage your budget</p>
          </div>
          {loading && <div className="text-xs text-indigo-600 font-medium animate-pulse">Syncing...</div>}
        </div>

        {/* AI Insights & Alerts Section */}
        {stats ? (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Insight Card */}
            <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg">
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                ✨ AI Insight
              </h2>
              <p className="text-indigo-100">{stats.aiTip || "Add some expenses to get AI-powered insights!"}</p>
              <div className="mt-4 flex items-center gap-4 flex-wrap">
                <div className="bg-indigo-500/50 rounded-lg p-3 min-w-[120px]">
                  <p className="text-xs text-indigo-200">Top Category</p>
                  <p className="font-bold">{stats.highestSpendingCategory || 'N/A'}</p>
                </div>
                <div className="bg-indigo-500/50 rounded-lg p-3 min-w-[120px]">
                  <p className="text-xs text-indigo-200">Total Spent</p>
                  <p className="font-bold">₹{(stats.totalSpent || 0).toLocaleString()}</p>
                </div>
                <div className="bg-green-500/50 rounded-lg p-3 min-w-[120px]">
                  <p className="text-xs text-green-100">Next Month Est.</p>
                  <p className="font-bold">₹{(stats.predictedNextMonth || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Overspending Alerts */}
            <div className="bg-white rounded-2xl p-6 border border-red-100 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                🚨 Alerts
              </h2>
              <div className="space-y-3 max-h-[160px] overflow-y-auto">
                {stats.alerts && stats.alerts.length > 0 ? (
                  stats.alerts.map((alert: string, idx: number) => (
                    <div key={idx} className="p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                      {alert}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    No overspending alerts. Great job!
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 p-6 bg-white rounded-2xl border border-gray-100 text-center text-gray-500">
            Unable to load AI insights at the moment.
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Expenses (This Month) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-50 rounded-xl">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Spent This Month</h3>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(currentMonthSpent)}</p>
            <p className="text-sm text-gray-500 mt-2">Current billing cycle</p>
          </div>

          {/* Monthly Budget Tracking */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              {!isEditingBudget ? (
                <button 
                  onClick={() => {
                    setNewBudget(monthlyBudget.toString());
                    setIsEditingBudget(true);
                  }}
                  className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-400 hover:text-indigo-600"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex gap-1">
                  <button 
                    onClick={handleUpdateBudget}
                    className="p-2 hover:bg-green-50 rounded-lg transition-colors text-green-600"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setIsEditingBudget(false)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Monthly Budget</h3>
            {isEditingBudget ? (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-bold">₹</span>
                </div>
                <input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateBudget()}
                  className="w-full pl-7 pr-3 py-1 text-2xl font-bold text-gray-900 border-b-2 border-indigo-600 focus:outline-none bg-transparent"
                  autoFocus
                />
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(monthlyBudget)}</p>
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Usage</span>
                    <span className={`font-medium ${budgetUsagePercent > 90 ? 'text-red-600' : 'text-gray-700'}`}>
                      {budgetUsagePercent}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        budgetUsagePercent > 100 ? 'bg-red-600' : 
                        budgetUsagePercent > 80 ? 'bg-orange-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${budgetUsagePercent}%` }}
                    ></div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Remaining Balance */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${remainingBalance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <TrendingUp className={`w-6 h-6 ${remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Remaining Balance</h3>
            <p className={`text-3xl font-bold ${remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(remainingBalance)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {remainingBalance < 0 ? 'Budget exceeded!' : 'Safe to spend'}
            </p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h2>
            <div className="space-y-4">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((expense) => (
                  <div key={expense._id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <IndianRupee className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{expense.title}</p>
                        <p className="text-sm text-gray-500">{expense.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(expense.amount)}</p>
                      <p className="text-sm text-gray-500">{new Date(expense.date).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No transactions yet.</p>
              )}
            </div>
          </div>

          {/* Top Spending Categories */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Spending Categories</h2>
            <div className="space-y-4">
              {topCategories.length > 0 ? (
                topCategories.map(([category, amount], index) => {
                  const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                  const colors = ['bg-indigo-600', 'bg-purple-600', 'bg-pink-600'];
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{category}</span>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(amount)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div
                          className={`${colors[index % colors.length]} h-2.5 rounded-full transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% of total</p>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 py-8">No data available.</p>
              )}
            </div>
          </div>
        </div>

        {/* AI Chat Feature Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            💬 AI Financial Assistant
          </h2>
          <div className="h-[300px] flex flex-col">
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 bg-gray-50 rounded-xl">
              {chatHistory.length === 0 && (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                  Ask me: "How much did I spend?" or "What's my highest expense?"
                </div>
              )}
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask your financial assistant..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <button
                type="submit"
                disabled={isChatLoading || !chatMessage.trim()}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
