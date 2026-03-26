const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token valid for 30 days
  });
};

// REGISTER USER
const registerUser = async (req, res) => {
  try {
    console.log("🔥 Register API HIT");
    console.log("📦 Incoming data:", req.body);

    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    console.log("👀 Existing user:", userExists);

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password, // will be hashed by pre-save hook in User model
    });

    console.log("✅ User saved to DB:", user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        monthlyBudget: user.monthlyBudget,
        token: generateToken(user._id),
      },
    });

  } catch (error) {
    console.error("❌ REGISTER ERROR:", error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// LOGIN USER
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        monthlyBudget: user.monthlyBudget,
        token: generateToken(user._id),
      },
    });

  } catch (error) {
    console.error("❌ LOGIN ERROR:", error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

// GET USER PROFILE (Protected)
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        monthlyBudget: user.monthlyBudget,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ GET PROFILE ERROR:", error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// UPDATE USER BUDGET
const updateUserBudget = async (req, res) => {
  try {
    const { monthlyBudget } = req.body;

    if (monthlyBudget === undefined || monthlyBudget < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid budget',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { monthlyBudget },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      data: {
        monthlyBudget: user.monthlyBudget,
      },
    });
  } catch (error) {
    console.error("❌ UPDATE BUDGET ERROR:", error);
    res.status(500).json({
      success: false,
      message: 'Server error during budget update',
      error: error.message,
    });
  }
};

// ✅ EXPORT ALL FUNCTIONS CORRECTLY
module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserBudget,
};