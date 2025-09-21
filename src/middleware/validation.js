/**
 * Validation Middleware
 * Express-validator based input validation middleware
 */

const { body, validationResult } = require('express-validator');
const { logger } = require('../config/logger');

// Input validation rules for waitlist signup
const validateSignup = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s\-'\.]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, apostrophes, and periods')
    .escape(),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Email is too long'),

  body('referralCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Referral code is too long')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Referral code can only contain letters, numbers, hyphens, and underscores')
];

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    const firstError = errors.array()[0];
    
    logger.warn(`Validation failed for ${req.ip}: ${errorMessages.join(', ')}`);
    
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: errorMessages.join('. '),
      field: firstError.param,
      errors: errors.array()
    });
  }
  
  next();
};

// Custom validation middleware for specific business rules
const validateWaitlistCapacity = async (req, res, next) => {
  try {
    const { Waitlist } = require('../models');
    const config = require('../config/app');
    
    const currentCount = await Waitlist.countDocuments();
    
    if (currentCount >= config.database.maxWaitlistEntries) {
      return res.status(429).json({
        success: false,
        error: 'Waitlist Full',
        message: 'We\'ve reached our waitlist capacity. Please check back later!',
        capacity: config.database.maxWaitlistEntries,
        current: currentCount
      });
    }
    
    // Add current count to request for use in controller
    req.waitlistCount = currentCount;
    next();
  } catch (error) {
    logger.error('Error checking waitlist capacity:', error);
    next(error);
  }
};

// Validate IP-based signup limits
const validateIPSignupLimit = async (req, res, next) => {
  try {
    const { Waitlist } = require('../models');
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    const recentSignupsFromIP = await Waitlist.countRecentSignupsFromIP(clientIP, 24);
    
    if (recentSignupsFromIP >= 3) {
      logger.warn(`Too many signups from IP: ${clientIP}`);
      return res.status(429).json({
        success: false,
        error: 'Too Many Signups',
        message: 'Too many signups from your location. Please try again tomorrow.',
        retryAfter: '24 hours'
      });
    }
    
    next();
  } catch (error) {
    logger.error('Error checking IP signup limit:', error);
    next(error);
  }
};

module.exports = {
  validateSignup,
  handleValidationErrors,
  validateWaitlistCapacity,
  validateIPSignupLimit
};