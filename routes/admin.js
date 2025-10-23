const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Emergency = require('../models/Emergency');

// Middleware to verify admin token
const verifyAdminToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if it's an admin token
    if (decoded.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const admin = await Admin.findById(decoded.id);
    
    if (!admin || !admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin account not found or inactive.'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
};

// Admin Registration (Protected - only super_admin can create new admins)
router.post('/register', verifyAdminToken, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').optional().trim(),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']).withMessage('Invalid gender'),
  body('role').optional().isIn(['super_admin', 'admin', 'moderator']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Only super_admin can create new admins
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can create new admin accounts'
      });
    }

    const { name, email, password, phone, role, gender } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    // Create new admin
    const newAdmin = new Admin({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      gender,
      role: role || 'admin',
      permissions: {
        canViewUsers: true,
        canEditUsers: role === 'super_admin' || role === 'admin',
        canDeleteUsers: role === 'super_admin',
        canViewAnalytics: true,
        canManageHospitals: true,
        canManageContent: role === 'super_admin' || role === 'admin'
      },
      isActive: true,
      createdBy: req.admin._id
    });

    await newAdmin.save();

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: newAdmin.getProfile()
    });

  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Admin Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find admin with password field
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Admin account is inactive'
      });
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, email: admin.email, type: 'admin', role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' } // Admin tokens expire in 8 hours
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: admin.getProfile()
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Get current admin profile
router.get('/me', verifyAdminToken, async (req, res) => {
  try {
    res.json({
      success: true,
      admin: req.admin.getProfile()
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get dashboard analytics
router.get('/analytics', verifyAdminToken, async (req, res) => {
  try {
    if (!req.admin.permissions.canViewAnalytics) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view analytics'
      });
    }

    // Get total users
    const totalUsers = await User.countDocuments();
    
    // Get users by gender
    const maleUsers = await User.countDocuments({ gender: 'male' });
    const femaleUsers = await User.countDocuments({ gender: 'female' });
    const otherGender = await User.countDocuments({ gender: { $in: ['other', 'prefer_not_to_say'] } });
    
    // Get pregnant users
    const pregnantUsers = await User.countDocuments({ isPregnant: true });
    
    // Get users by pregnancy trimester
    const firstTrimester = await User.countDocuments({ isPregnant: true, currentWeek: { $lte: 13 } });
    const secondTrimester = await User.countDocuments({ isPregnant: true, currentWeek: { $gt: 13, $lte: 27 } });
    const thirdTrimester = await User.countDocuments({ isPregnant: true, currentWeek: { $gt: 27 } });
    
    // Get new users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    
    // Get active users (logged in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers = await User.countDocuments({ lastLogin: { $gte: sevenDaysAgo } });

    // Get emergency statistics
    const totalEmergencies = await Emergency.countDocuments();
    const pendingEmergencies = await Emergency.countDocuments({ status: 'pending' });
    const respondedEmergencies = await Emergency.countDocuments({ status: 'responded' });
    const resolvedEmergencies = await Emergency.countDocuments({ status: 'resolved' });
    const cancelledEmergencies = await Emergency.countDocuments({ status: 'cancelled' });
    
    // Get recent emergencies (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const recentEmergencies = await Emergency.countDocuments({ createdAt: { $gte: oneDayAgo } });

    res.json({
      success: true,
      analytics: {
        totalUsers,
        genderDistribution: {
          male: maleUsers,
          female: femaleUsers,
          other: otherGender
        },
        pregnancyStats: {
          total: pregnantUsers,
          firstTrimester,
          secondTrimester,
          thirdTrimester
        },
        userActivity: {
          newUsers,
          activeUsers
        },
        emergencyStats: {
          total: totalEmergencies,
          pending: pendingEmergencies,
          responded: respondedEmergencies,
          resolved: resolvedEmergencies,
          cancelled: cancelledEmergencies,
          last24Hours: recentEmergencies
        }
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching analytics'
    });
  }
});

// Get all users with pagination and filters
router.get('/users', verifyAdminToken, async (req, res) => {
  try {
    if (!req.admin.permissions.canViewUsers) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view users'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.gender) filter.gender = req.query.gender;
    if (req.query.isPregnant) filter.isPregnant = req.query.isPregnant === 'true';
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        usersPerPage: limit
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
});

// Get single user details
router.get('/users/:id', verifyAdminToken, async (req, res) => {
  try {
    if (!req.admin.permissions.canViewUsers) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view users'
      });
    }

    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user'
    });
  }
});

// Update user (except password)
router.put('/users/:id', verifyAdminToken, async (req, res) => {
  try {
    if (!req.admin.permissions.canEditUsers) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit users'
      });
    }

    // Remove password from allowed updates
    const { password, ...allowedUpdates } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      allowedUpdates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user'
    });
  }
});

// Delete user
router.delete('/users/:id', verifyAdminToken, async (req, res) => {
  try {
    if (!req.admin.permissions.canDeleteUsers) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete users'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting user'
    });
  }
});

// Get pregnant users with progress tracking
router.get('/pregnant-users', verifyAdminToken, async (req, res) => {
  try {
    if (!req.admin.permissions.canViewUsers) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view users'
      });
    }

    const pregnantUsers = await User.find({ isPregnant: true })
      .select('-password')
      .sort({ currentWeek: -1 });

    // Calculate additional info for each user
    const usersWithProgress = pregnantUsers.map(user => {
      const userObj = user.toObject();
      
      // Calculate trimester
      if (userObj.currentWeek <= 13) {
        userObj.trimester = 'First';
      } else if (userObj.currentWeek <= 27) {
        userObj.trimester = 'Second';
      } else {
        userObj.trimester = 'Third';
      }

      // Calculate days until due date
      if (userObj.dueDate) {
        const today = new Date();
        const due = new Date(userObj.dueDate);
        const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
        userObj.daysUntilDue = daysUntilDue;
      }

      return userObj;
    });

    res.json({
      success: true,
      count: pregnantUsers.length,
      users: usersWithProgress
    });

  } catch (error) {
    console.error('Get pregnant users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching pregnant users'
    });
  }
});

// Get all appointments with pagination and filters
router.get('/appointments', verifyAdminToken, async (req, res) => {
  try {
    if (!req.admin.permissions.canViewUsers) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view appointments'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.reason) filter.reason = req.query.reason;
    if (req.query.centerId) filter.centerId = req.query.centerId;
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.date) filter.date = req.query.date;

    const appointments = await Appointment.find(filter)
      .populate('userId', 'name email phone')
      .sort({ date: 1, time: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Appointment.countDocuments(filter);

    res.json({
      success: true,
      appointments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalAppointments: total,
        appointmentsPerPage: limit
      }
    });

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching appointments'
    });
  }
});

// Get single appointment details
router.get('/appointments/:id', verifyAdminToken, async (req, res) => {
  try {
    if (!req.admin.permissions.canViewUsers) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view appointments'
      });
    }

    const appointment = await Appointment.findById(req.params.id)
      .populate('userId', 'name email phone');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      appointment
    });

  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching appointment'
    });
  }
});

// Update appointment (admin can reschedule, change status, etc.)
router.put('/appointments/:id', verifyAdminToken, async (req, res) => {
  try {
    if (!req.admin.permissions.canEditUsers) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit appointments'
      });
    }

    const { date, time, reason, notes, status, centerId, centerName } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { date, time, reason, notes, status, centerId, centerName },
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      appointment
    });

  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating appointment'
    });
  }
});

// Delete appointment (admin can cancel any appointment)
router.delete('/appointments/:id', verifyAdminToken, async (req, res) => {
  try {
    if (!req.admin.permissions.canEditUsers) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete appointments'
      });
    }

    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });

  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting appointment'
    });
  }
});

// Get all emergencies with pagination and filters
router.get('/emergencies', verifyAdminToken, async (req, res) => {
  try {
    if (!req.admin.permissions.canViewUsers) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view emergencies'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.userId) filter.userId = req.query.userId;

    const emergencies = await Emergency.find(filter)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Emergency.countDocuments(filter);

    // Get status counts for analytics
    const statusCounts = await Emergency.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      total,
      pending: statusCounts.find(s => s._id === 'pending')?.count || 0,
      responded: statusCounts.find(s => s._id === 'responded')?.count || 0,
      resolved: statusCounts.find(s => s._id === 'resolved')?.count || 0,
      cancelled: statusCounts.find(s => s._id === 'cancelled')?.count || 0
    };

    res.json({
      success: true,
      emergencies,
      stats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalEmergencies: total,
        emergenciesPerPage: limit
      }
    });

  } catch (error) {
    console.error('Get emergencies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching emergencies'
    });
  }
});

// Get single emergency details
router.get('/emergencies/:id', verifyAdminToken, async (req, res) => {
  try {
    if (!req.admin.permissions.canViewUsers) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view emergencies'
      });
    }

    const emergency = await Emergency.findById(req.params.id)
      .populate('userId', 'name email phone gender age');

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency not found'
      });
    }

    res.json({
      success: true,
      emergency
    });

  } catch (error) {
    console.error('Get emergency error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching emergency'
    });
  }
});

// Update emergency status (admin can resolve emergencies)
router.put('/emergencies/:id', verifyAdminToken, async (req, res) => {
  try {
    if (!req.admin.permissions.canEditUsers) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit emergencies'
      });
    }

    const { status, notes } = req.body;

    const emergency = await Emergency.findById(req.params.id);

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency not found'
      });
    }

    if (status) {
      emergency.status = status;
      if (status === 'resolved') {
        emergency.resolvedAt = new Date();
      }
    }

    if (notes) {
      emergency.notes = notes;
    }

    await emergency.save();

    const updatedEmergency = await Emergency.findById(req.params.id)
      .populate('userId', 'name email phone');

    res.json({
      success: true,
      message: 'Emergency updated successfully',
      emergency: updatedEmergency
    });

  } catch (error) {
    console.error('Update emergency error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating emergency'
    });
  }
});

// Delete emergency (admin can delete old/resolved emergencies)
router.delete('/emergencies/:id', verifyAdminToken, async (req, res) => {
  try {
    if (!req.admin.permissions.canDeleteUsers) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete emergencies'
      });
    }

    const emergency = await Emergency.findByIdAndDelete(req.params.id);

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency not found'
      });
    }

    res.json({
      success: true,
      message: 'Emergency deleted successfully'
    });

  } catch (error) {
    console.error('Delete emergency error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting emergency'
    });
  }
});

module.exports = router;
