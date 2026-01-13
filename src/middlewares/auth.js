const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No token provided. Authorization denied.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'User not found or inactive',
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    next(error);
  }
};

// Optional auth - doesn't fail if no token, but attaches user if valid
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
      }
    }
    
    next();
  } catch (error) {
    // Token invalid, but continue anyway
    next();
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authenticated',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Not authorized to access this resource',
      });
    }

    next();
  };
};

module.exports = { auth, optionalAuth, authorize };
