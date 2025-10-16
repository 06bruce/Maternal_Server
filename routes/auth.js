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
const { sendWelcomeEmail, sendPasswordResetEmail, sendPasswordResetConfirmation } = require('../utils/emailService');
const crypto = require('crypto');
const { protect } = require('../middleware/auth');

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

      // Send welcome email (don't wait for it to complete)
      sendWelcomeEmail({ to: user.email, name: user.name })
        .then(result => {
          if (result.success) {
            console.log(`✅ Welcome email sent to ${user.email}:`, result.messageId);
          } else {
            console.error(`❌ Failed to send welcome email to ${user.email}:`, result.message);
          }
        })
        .catch(err => {
          console.error('❌ Critical error sending welcome email to', user.email, ':', err.message);
        });

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

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post(
  '/forgot-password',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please enter a valid email'),
    handleValidationErrors
  ],
  async (req, res) => {
    try {
      const { email } = req.body;

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        // Don't reveal if user exists or not for security
        return res.status(200).json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is inactive. Please contact support.'
        });
      }

      // Generate reset token
      const resetToken = user.getResetPasswordToken();
      await user.save({ validateBeforeSave: false });

      // Send password reset email asynchronously (don't wait for it to complete)
      sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetToken
      }).then(result => {
        if (result.success) {
          console.log(`✅ Password reset email sent to ${user.email}:`, result.messageId);
        } else {
          console.error(`❌ Failed to send password reset email to ${user.email}:`, result.message);
        }
      }).catch(err => {
        console.error('❌ Critical error sending password reset email to', user.email, ':', err.message);
        // Note: We don't clear the token here because the user might still use it
        // The token will expire after 1 hour anyway
      });

      // Respond immediately to user
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.'
      });
    }
  }
);

// @route   POST /api/auth/reset-password
// @desc    Reset password using token
// @access  Public
router.post(
  '/reset-password',
  [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    handleValidationErrors
  ],
  async (req, res) => {
    try {
      const { token, password } = req.body;

      // Hash the token from URL to compare with hashed token in database
      const resetPasswordToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with valid reset token that hasn't expired
      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
      }).select('+resetPasswordToken +resetPasswordExpire');

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired password reset token.'
        });
      }

      // Set new password (will be hashed by pre-save hook)
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      // Send confirmation email
      sendPasswordResetConfirmation({ to: user.email, name: user.name })
        .then(result => {
          if (result.success) {
            console.log(`✅ Password reset confirmation sent to ${user.email}:`, result.messageId);
          } else {
            console.error(`❌ Failed to send confirmation email to ${user.email}:`, result.message);
          }
        })
        .catch(err => {
          console.error('❌ Critical error sending confirmation email to', user.email, ':', err.message);
        });

      // Generate new JWT token
      const jwtToken = generateToken(user._id);

      res.status(200).json({
        success: true,
        message: 'Password has been reset successfully.',
        token: jwtToken,
        user: user.getProfile ? user.getProfile() : { id: user._id, email: user.email }
      });

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.'
      });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    // User is already attached by protect middleware
    const user = req.user;

    res.json({
      success: true,
      user: user.getProfile ? user.getProfile() : {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        isPregnant: user.isPregnant,
        pregnancyStartDate: user.pregnancyStartDate,
        dueDate: user.dueDate,
        currentWeek: user.currentWeek,
        emergencyContacts: user.emergencyContacts,
        preferences: user.preferences,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  protect,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),

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

    body('emergencyContacts')
      .optional()
      .isArray()
      .withMessage('Emergency contacts must be an array'),

    body('preferences.language')
      .optional()
      .isIn(['rw', 'en', 'fr'])
      .withMessage('Language must be rw, en, or fr'),

    body('preferences.notifications')
      .optional()
      .isBoolean()
      .withMessage('Notifications preference must be a boolean'),

    handleValidationErrors
  ],
  async (req, res) => {
    try {
      const user = req.user;

      const {
        name,
        phone,
        age,
        isPregnant,
        pregnancyStartDate,
        emergencyContacts,
        preferences
      } = req.body;

      // Update basic fields
      if (name !== undefined) user.name = name;
      if (phone !== undefined) user.phone = phone;
      if (age !== undefined) user.age = age;
      if (emergencyContacts !== undefined) user.emergencyContacts = emergencyContacts;
      
      // Update preferences
      if (preferences) {
        if (preferences.language !== undefined) {
          user.preferences.language = preferences.language;
        }
        if (preferences.notifications !== undefined) {
          user.preferences.notifications = preferences.notifications;
        }
      }

      // Handle pregnancy data update
      if (isPregnant !== undefined || pregnancyStartDate !== undefined) {
        const currentIsPregnant = isPregnant !== undefined ? isPregnant : user.isPregnant;
        const currentStartDate = pregnancyStartDate !== undefined ? pregnancyStartDate : user.pregnancyStartDate;

        const pregnancyValidation = validatePregnancyData({
          isPregnant: currentIsPregnant,
          pregnancyStartDate: currentStartDate
        });

        if (!pregnancyValidation.isValid) {
          return res.status(400).json({
            success: false,
            message: pregnancyValidation.error
          });
        }

        user.isPregnant = currentIsPregnant;
        user.pregnancyStartDate = currentStartDate;
        
        if (pregnancyValidation.data) {
          user.dueDate = pregnancyValidation.data.dueDate;
          user.currentWeek = pregnancyValidation.data.currentWeek;
        }
      }

      await user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: user.getProfile ? user.getProfile() : {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          age: user.age,
          gender: user.gender,
          isPregnant: user.isPregnant,
          pregnancyStartDate: user.pregnancyStartDate,
          dueDate: user.dueDate,
          currentWeek: user.currentWeek,
          emergencyContacts: user.emergencyContacts,
          preferences: user.preferences
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      if (error.name === 'MongooseServerSelectionError' || (error.message && error.message.includes('ECONNREFUSED'))) {
        return res.status(503).json({ success: false, message: 'Database service unavailable.' });
      }
      res.status(500).json({
        success: false,
        message: 'Server error during profile update'
      });
    }
  }
);

module.exports = router;
