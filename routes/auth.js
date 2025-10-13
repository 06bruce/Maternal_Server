// routes/auth.js
// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public

const express = require('express');
const { body, validationResult } = require('express-validator'); // <-- important
const router = express.Router();

// Replace these with your actual paths

const User = require('../models/User'); // e.g. ../models/User
const { validatePregnancyData } = require('../utils/pregnancyUtils'); // e.g. ../utils/pregnancy
const { generateToken } = require('../utils/jwt'); // e.g. ../utils/jwt

// handle validation errors middleware
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
}

router.post(
  '/register',
  [
    body('name')
      .trim()
      .customSanitizer((v) => (v === '' ? undefined : v))
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),

    body('email')
      .customSanitizer((v) => (v === '' ? undefined : v))
      .isEmail()
      .normalizeEmail()
      .withMessage('Please enter a valid email'),

    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),

    body('phone')
      .optional({ nullable: true })
      .customSanitizer((v) => (v === '' ? undefined : v))
      .matches(/^\+?[\d\s-()]+$/)
      .withMessage('Please enter a valid phone number'),

    body('age')
      .optional({ nullable: true })
      .customSanitizer((v) => (v === '' ? undefined : v))
      .isInt({ min: 13, max: 100 })
      .withMessage('Age must be between 13 and 100')
      .bail()
      .toInt(),

    body('gender')
      .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
      .withMessage('Gender is required'),

    body('isPregnant')
      .optional({ nullable: true })
      .customSanitizer((v) => {
        if (typeof v === 'string') {
          if (v === 'on' || v === 'true' || v === '1') return true;
          if (v === 'off' || v === 'false' || v === '0' || v === '') return false;
        }
        return v;
      })
      .toBoolean()
      .isBoolean()
      .withMessage('isPregnant must be a boolean'),

    body('pregnancyStartDate')
      .optional({ nullable: true })
      .customSanitizer((v) => (v === '' ? undefined : v))
      .isISO8601()
      .withMessage('Please enter a valid ISO date')
      .bail()
      .toDate(),

    handleValidationErrors
  ],
  async (req, res) => {
    try {
      if (!User) {
        return res.status(503).json({ success: false, message: 'Database model unavailable.' });
      }

      const {
        name,
        email,
        password,
        phone,
        age,
        gender,
        isPregnant,
        pregnancyStartDate
      } = req.body;

      if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

      const existingUser = typeof User.findByEmail === 'function'
        ? await User.findByEmail(email)
        : await User.findOne({ email });

      if (existingUser) {
        return res.status(400).json({ success: false, message: 'User with this email already exists' });
      }

      const pregnancyValidation = validatePregnancyData({ isPregnant, pregnancyStartDate });
      if (!pregnancyValidation.isValid) {
        return res.status(400).json({ success: false, message: pregnancyValidation.error });
      }
      const { dueDate, currentWeek } = pregnancyValidation.data || {};

      const user = await User.create({
        name,
        email,
        password,
        phone,
        age,
        gender,
        isPregnant,
        pregnancyStartDate,
        dueDate,
        currentWeek
      });

      const token = generateToken(user._id);
      user.lastLogin = new Date();
      await user.save();

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: user.getProfile ? user.getProfile() : { id: user._id, email: user.email }
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error.name === 'MongooseServerSelectionError' || (error.message && error.message.includes('ECONNREFUSED'))) {
        return res.status(503).json({ success: false, message: 'Database service unavailable.' });
      }
      res.status(500).json({ success: false, message: 'Server error during registration' });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please enter a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ],
  async (req, res) => {
    try {
      if (!User) {
        return res.status(503).json({ success: false, message: 'Database model unavailable.' });
      }

      const { email, password } = req.body;

      // Find user with password field (usually excluded by default)
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Verify password using the model's comparePassword method
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = generateToken(user._id);

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: user.getProfile ? user.getProfile() : {
          id: user._id,
          name: user.name,
          email: user.email,
          isPregnant: user.isPregnant,
          currentWeek: user.currentWeek
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      if (error.name === 'MongooseServerSelectionError' || (error.message && error.message.includes('ECONNREFUSED'))) {
        return res.status(503).json({ success: false, message: 'Database service unavailable.' });
      }
      res.status(500).json({
        success: false,
        message: 'Server error during login'
      });
    }
  }
);

module.exports = router;
