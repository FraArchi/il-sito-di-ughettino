const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// Main authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    let token = req.header('Authorization');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access denied. No token provided.' 
      });
    }

    // Remove 'Bearer ' from token
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length);
    }

    // Check if token is blacklisted (logout)
    const isBlacklisted = await cache.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token has been invalidated.' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check cache first for performance
    let user = await cache.getWithPattern(`user:${decoded.userId}`);
    
    if (!user) {
      // If not in cache, get from database
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isAdmin: true,
          isVerified: true,
          isActive: true,
          points: true,
          level: true,
          streak: true
        }
      });

      if (user) {
        // Cache user data for 15 minutes
        await cache.setWithPattern(`user:${user.id}`, user, 900);
      }
    }

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not found or inactive.' 
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({ 
        success: false, 
        error: 'Please verify your email address.' 
      });
    }

    // Add user to request object
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token expired.' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Authentication failed.' 
    });
  }
};

// Admin only middleware
const adminOnly = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required.' 
      });
    }

    if (!req.user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: 'Admin access required.' 
      });
    }

    next();
  } catch (error) {
    logger.error('Admin middleware error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Authorization check failed.' 
    });
  }
};

// Optional authentication (user can be null)
const optionalAuth = async (req, res, next) => {
  try {
    let token = req.header('Authorization');
    
    if (!token) {
      req.user = null;
      return next();
    }

    // Remove 'Bearer ' from token
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length);
    }

    // Check if token is blacklisted
    const isBlacklisted = await cache.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      req.user = null;
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from cache or database
    let user = await cache.getWithPattern(`user:${decoded.userId}`);
    
    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isAdmin: true,
          isVerified: true,
          isActive: true,
          points: true,
          level: true,
          streak: true
        }
      });

      if (user) {
        await cache.setWithPattern(`user:${user.id}`, user, 900);
      }
    }

    req.user = (user && user.isActive && user.isVerified) ? user : null;
    req.token = token;
    
    next();
  } catch (error) {
    // If token is invalid, just continue without user
    req.user = null;
    next();
  }
};

// Check if user owns resource or is admin
const ownerOrAdmin = (getResourceUserId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required.' 
        });
      }

      // Admin can access everything
      if (req.user.isAdmin) {
        return next();
      }

      const resourceUserId = typeof getResourceUserId === 'function' 
        ? await getResourceUserId(req) 
        : req.params[getResourceUserId || 'userId'];

      if (req.user.id !== resourceUserId) {
        return res.status(403).json({ 
          success: false, 
          error: 'Access denied. You can only access your own resources.' 
        });
      }

      next();
    } catch (error) {
      logger.error('Owner/Admin middleware error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Authorization check failed.' 
      });
    }
  };
};

// Rate limiting for sensitive operations
const sensitiveOperation = async (req, res, next) => {
  try {
    const key = `sensitive:${req.user.id}:${req.route.path}`;
    const attempts = await cache.increment(key);
    
    if (attempts === 1) {
      // Set expiration for 1 hour
      await cache.expire(key, 3600);
    }
    
    if (attempts > 5) {
      return res.status(429).json({ 
        success: false, 
        error: 'Too many attempts. Please try again later.' 
      });
    }
    
    next();
  } catch (error) {
    logger.error('Sensitive operation middleware error:', error);
    next(); // Continue even if rate limiting fails
  }
};

module.exports = {
  authMiddleware,
  adminOnly,
  optionalAuth,
  ownerOrAdmin,
  sensitiveOperation
};
