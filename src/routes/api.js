/**
 * API Routes
 * RESTful API endpoints for waitlist and other operations
 */

const express = require('express');
const router = express.Router();
const { waitlistController } = require('../controllers');
const { 
  asyncHandler,
  validateSignup,
  handleValidationErrors,
  validateWaitlistCapacity,
  validateIPSignupLimit,
  extractClientInfo,
  detectSuspiciousActivity,
  apiSecurityHeaders
} = require('../middleware');
const { signupLimiter } = require('../config/security');

// Apply security headers to all API routes
router.use(apiSecurityHeaders);

// Apply client info extraction to all API routes
router.use(extractClientInfo);

// Apply suspicious activity detection to all API routes
router.use(detectSuspiciousActivity);

// Join waitlist endpoint
router.post('/waitlist/join',
  signupLimiter,
  validateSignup,
  handleValidationErrors,
  validateWaitlistCapacity,
  validateIPSignupLimit,
  asyncHandler(waitlistController.joinWaitlist)
);

// Alternative endpoint for backwards compatibility
router.post('/join',
  signupLimiter,
  validateSignup,
  handleValidationErrors,
  validateWaitlistCapacity,
  validateIPSignupLimit,
  asyncHandler(waitlistController.joinWaitlist)
);

// Get waitlist statistics
router.get('/waitlist/stats', asyncHandler(waitlistController.getWaitlistStats));

// Alternative endpoint for backwards compatibility
router.get('/waitlist-stats', asyncHandler(waitlistController.getWaitlistStats));

// Check waitlist position
router.post('/waitlist/position', asyncHandler(waitlistController.checkPosition));

// Confirm waitlist entry
router.post('/waitlist/confirm', asyncHandler(waitlistController.confirmEntry));

// Get analytics (admin only - TODO: add authentication)
router.get('/analytics', asyncHandler(waitlistController.getAnalytics));

// Unsubscribe endpoint
router.get('/unsubscribe', asyncHandler(waitlistController.unsubscribe));

module.exports = router;