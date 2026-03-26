const express = require('express');
const router = express.Router();
const {
  addExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  getAIChatResponse
} = require('../controllers/expenseController'); // ✅ use proper controller functions
const { protect } = require('../middleware/auth'); // ✅ import protect

// All routes are protected (require authentication)
router.get('/stats', protect, getExpenseStats);
router.post('/ai-chat', protect, getAIChatResponse);
router.post('/add', protect, addExpense);
router.get('/', protect, getExpenses);
router.get('/:id', protect, getExpenseById);
router.put('/:id', protect, updateExpense);
router.delete('/:id', protect, deleteExpense);

module.exports = router;