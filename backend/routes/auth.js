const express = require('express');
const router = express.Router();

const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserBudget
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');

// 🔍 Global debug middleware for all auth routes
router.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.originalUrl}`);
  next();
});

// PUBLIC ROUTES
router.post('/register', registerUser);
router.post('/login', loginUser);

// PROTECTED ROUTES
router.get('/profile', protect, getUserProfile);
router.put('/update-budget', protect, updateUserBudget);

module.exports = router;