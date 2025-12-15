const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require authentication
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        console.error(`[AUTH] User not found for ID: ${decoded.id}`);
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.isActive) {
        console.error(`[AUTH] Account deactivated for user: ${user.email}`);
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      console.log(`[AUTH] ✅ Token verified for user: ${user.email} (${user.id})`);
      req.user = user;
      next();
    } catch (error) {
      console.error(`[AUTH] ❌ Token verification failed:`, error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
        error: error.message
      });
    }
  }

  if (!token) {
    console.error(`[AUTH] ❌ No token provided. Authorization header: ${req.headers.authorization || 'MISSING'}`);
    console.error(`[AUTH] Request URL: ${req.method} ${req.url}`);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token',
      details: 'Please include Authorization: Bearer <token> in headers'
    });
  }
};

// Optional auth - doesn't require authentication but adds user if available
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Token is invalid, but we don't fail the request
      console.log('Optional auth token invalid:', error.message);
    }
  }

  next();
};

// Admin only middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

module.exports = {
  protect,
  optionalAuth,
  admin
};
