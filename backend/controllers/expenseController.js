const Expense = require('../models/Expense');
const User = require('../models/User');

// --- AI SMART CATEGORIZATION UTILITY ---
const getSmartCategory = (title) => {
  const lowerTitle = title.toLowerCase();
  
  // Define keyword mapping for categorization
  const mappings = {
    'Food': ['zomato', 'swiggy', 'restaurant', 'food', 'lunch', 'dinner', 'breakfast', 'pizza', 'burger', 'cafe', 'starbucks', 'grocery', 'blinkit', 'zepto'],
    'Transport': ['uber', 'ola', 'ride', 'taxi', 'metro', 'fuel', 'petrol', 'diesel', 'bus', 'train', 'flight', 'indigo', 'airindia'],
    'Shopping': ['amazon', 'flipkart', 'myntra', 'zudio', 'shopping', 'clothes', 'shoes', 'electronics', 'ajio', 'nykaa'],
    'Bills': ['electricity', 'water', 'gas', 'recharge', 'airtel', 'jio', 'vi', 'bill', 'rent', 'maintenance'],
    'Entertainment': ['netflix', 'prime', 'hotstar', 'movie', 'pvr', 'inox', 'theatre', 'game', 'gaming', 'concert', 'spotify'],
    'Education': ['udemy', 'coursera', 'course', 'book', 'tuition', 'school', 'college', 'exam', 'training']
  };

  for (const [category, keywords] of Object.entries(mappings)) {
    if (keywords.some(keyword => lowerTitle.includes(keyword))) {
      return category;
    }
  }

  return null; // Return null if no match found
};

// @desc    Add new expense
// @route   POST /api/expenses/add
// @access  Private
const addExpense = async (req, res) => {
  try {
    const { title, amount, category, date, notes } = req.body;

    // Validation
    if (!title || !amount || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide required fields (title, amount, date)',
      });
    }

    // --- AI SMART CATEGORIZATION ---
    // If category is not provided or set to 'Auto', detect it from title
    let finalCategory = category;
    if (!category || category === 'Auto' || category === '') {
      const detected = getSmartCategory(title);
      finalCategory = detected || 'Food'; // Default to Food if not detected
    }

    // Create expense
    const expense = await Expense.create({
      title,
      amount,
      category: finalCategory,
      date,
      notes: notes || '',
      userId: req.user._id, // From auth middleware
    });

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: expense,
    });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding expense',
      error: error.message,
    });
  }
};

// @desc    Get all expenses for logged-in user
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    // Get all expenses for the logged-in user, sorted by date (newest first)
    const expenses = await Expense.find({ userId: req.user._id })
      .sort({ date: -1 })
      .populate('userId', 'name email'); // Optionally populate user info

    // Calculate total
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    res.status(200).json({
      success: true,
      count: expenses.length,
      total: total,
      data: expenses,
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expenses',
      error: error.message,
    });
  }
};

// @desc    Get single expense by ID
// @route   GET /api/expenses/:id
// @access  Private
const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    // Check if expense belongs to logged-in user
    if (expense.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this expense',
      });
    }

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error('Get expense by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expense',
      error: error.message,
    });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  try {
    let expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    // Check if expense belongs to logged-in user
    if (expense.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this expense',
      });
    }

    // Update expense
    expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true, // Return updated document
        runValidators: true, // Run schema validators
      }
    );

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: expense,
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating expense',
      error: error.message,
    });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    // Check if expense belongs to logged-in user
    if (expense.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this expense',
      });
    }

    await expense.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting expense',
      error: error.message,
    });
  }
};

// @desc    Get expense statistics
// @route   GET /api/expenses/stats
// @access  Private
const getExpenseStats = async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user._id }).sort({ date: 1 }) || [];
    const user = await User.findById(req.user._id);
    const monthlyBudget = user?.monthlyBudget || 25000;

    // Default response structure to prevent crashes
    const defaultStats = {
      totalSpent: 0,
      currentMonthSpent: 0,
      monthlyBudget,
      remainingBudget: monthlyBudget,
      budgetUsagePercent: 0,
      avgExpense: 0,
      monthlyData: [],
      categoryBreakdown: {},
      highestSpendingCategory: 'None',
      highestSpendingAmount: 0,
      predictedNextMonth: monthlyBudget,
      alerts: [],
      aiTip: "Start adding expenses to see your AI financial health report."
    };

    if (!expenses || expenses.length === 0) {
      return res.status(200).json({
        success: true,
        data: defaultStats
      });
    }

    // 1. Basic Totals (with safety check)
    const totalSpent = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const avgExpense = totalSpent / expenses.length;
    
    // 2. Current Month Spending
    const now = new Date();
    const currentMonthExpenses = expenses.filter(exp => {
      if (!exp.date) return false;
      const expDate = new Date(exp.date);
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    });
    const currentMonthSpent = currentMonthExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // 3. Dynamic Monthly Aggregation
    const monthlyMap = expenses.reduce((acc, exp) => {
      if (!exp.date) return acc;
      const date = new Date(exp.date);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      acc[monthYear] = (acc[monthYear] || 0) + (exp.amount || 0);
      return acc;
    }, {});

    const monthlyData = Object.entries(monthlyMap).map(([month, amount]) => ({
      month,
      amount
    }));

    // 4. Category Breakdown
    const categoryTotals = expenses.reduce((acc, exp) => {
      if (!exp.category) return acc;
      acc[exp.category] = (acc[exp.category] || 0) + (exp.amount || 0);
      return acc;
    }, {});

    // 5. AI-Based Insights & Anomaly Detection
    const highestCategory = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0];
    const anomalies = expenses.filter(exp => (exp.amount || 0) > (avgExpense * 3) && (exp.amount || 0) > 1000);
    
    // 6. Expense Prediction
    const last3Months = monthlyData.slice(-3);
    const predictedNextMonth = last3Months.length > 0 
      ? last3Months.reduce((sum, m) => sum + m.amount, 0) / last3Months.length 
      : avgExpense * 30;

    // 7. Overspending Alerts & Budget Tracking
    const alerts = [];
    if (currentMonthSpent > monthlyBudget) {
      alerts.push(`🚨 Budget Exceeded! Spent ₹${currentMonthSpent.toLocaleString()} (Limit: ₹${monthlyBudget.toLocaleString()})`);
    } else if (currentMonthSpent > (monthlyBudget * 0.8)) {
      alerts.push(`⚠️ Budget Warning: Used ${Math.round((currentMonthSpent / monthlyBudget) * 100)}% of your ₹${monthlyBudget.toLocaleString()} budget.`);
    }
    anomalies.forEach(a => {
      alerts.push(`⚠️ Unusual spending: ₹${a.amount.toLocaleString()} for "${a.title || 'Unknown'}"`);
    });

    const insights = {
      totalSpent,
      currentMonthSpent,
      monthlyBudget,
      remainingBudget: Math.max(0, monthlyBudget - currentMonthSpent),
      budgetUsagePercent: Math.min(100, Math.round((currentMonthSpent / monthlyBudget) * 100)),
      avgExpense,
      monthlyData,
      categoryBreakdown: categoryTotals,
      highestSpendingCategory: highestCategory ? highestCategory[0] : 'None',
      highestSpendingAmount: highestCategory ? highestCategory[1] : 0,
      predictedNextMonth: Math.round(predictedNextMonth),
      alerts,
      aiTip: highestCategory 
        ? `You spend most on ${highestCategory[0]}. Try setting a budget to save ~₹${Math.round(highestCategory[1] * 0.1)} next month!` 
        : defaultStats.aiTip
    };

    res.status(200).json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('❌ GET STATS ERROR:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics',
      error: error.message,
      data: { // Return safe defaults on error
        totalSpent: 0,
        monthlyData: [],
        categoryBreakdown: {},
        alerts: []
      }
    });
  }
};

// --- ADVANCED AI CHAT WITH INTENT DETECTION (Simulated NLP) ---
const getAIChatResponse = async (req, res) => {
  try {
    const { message, context = [] } = req.body;
    const userId = req.user._id;
    const expenses = await Expense.find({ userId }).sort({ date: -1 });
    const lowerMsg = message.toLowerCase();

    // Intent detection logic
    let intent = 'unknown';
    if (lowerMsg.includes('total') || lowerMsg.includes('spend') || lowerMsg.includes('kharcha')) intent = 'total_spending';
    if (lowerMsg.includes('highest') || lowerMsg.includes('sabse zyada')) intent = 'highest_expense';
    if (lowerMsg.includes('category') || lowerMsg.includes('kis cheez pe')) intent = 'category_spending';
    if (lowerMsg.includes('predict') || lowerMsg.includes('agla mahina') || lowerMsg.includes('future')) intent = 'prediction';
    if (lowerMsg.includes('advice') || lowerMsg.includes('tip') || lowerMsg.includes('salah')) intent = 'advice';

    let response = "I'm your AI Financial Advisor. I can tell you about your spending, predict future costs, or give you saving tips. Try asking 'What's my total spend?' or 'Predict my next month'.";

    switch (intent) {
      case 'total_spending':
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        response = `Aapne ab tak ₹${total.toLocaleString('en-IN')} kharch kiye hain. (Total spending: ₹${total.toLocaleString()})`;
        break;
      
      case 'highest_expense':
        const highest = expenses[0]; // Already sorted by date, but let's find max amount
        const maxExp = [...expenses].sort((a, b) => b.amount - a.amount)[0];
        response = maxExp 
          ? `Aapka sabse bada kharcha ₹${maxExp.amount.toLocaleString()} tha "${maxExp.title}" ke liye.`
          : "Abhi tak koi transaction nahi mila.";
        break;

      case 'prediction':
        const totalForPred = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const avg = expenses.length > 0 ? totalForPred / expenses.length : 0;
        const pred = Math.round(avg * 25); // Simple logic
        response = `Based on your history, I predict you'll spend around ₹${pred.toLocaleString()} next month. Try to keep it under ₹${Math.round(pred * 0.9)}!`;
        break;

      case 'advice':
        const catTotals = expenses.reduce((acc, exp) => {
          acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
          return acc;
        }, {});
        const top = Object.entries(catTotals).sort(([, a], [, b]) => b - a)[0];
        response = top 
          ? `You're spending heavily on ${top[0]} (₹${top[1].toLocaleString()}). Switching to a budget plan could save you ₹${Math.round(top[1] * 0.15)} monthly.`
          : "Keep tracking for a few more days so I can give you personalized advice!";
        break;
    }

    res.status(200).json({
      success: true,
      response
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during AI chat processing'
    });
  }
};

// ✅ EXPORT ALL FUNCTIONS CORRECTLY
module.exports = {
  addExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  getAIChatResponse
};
