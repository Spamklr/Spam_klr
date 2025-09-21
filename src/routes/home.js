/**
 * Home Routes
 * Routes for main pages and application views
 */

const express = require('express');
const router = express.Router();
const { homeController } = require('../controllers');
const { asyncHandler } = require('../middleware');

// Home page
router.get('/', asyncHandler(homeController.renderHome));

// About page
router.get('/about', asyncHandler(homeController.renderAbout));

// Contact page
router.get('/contact', asyncHandler(homeController.renderContact));

// Documentation page
router.get('/docs', asyncHandler(homeController.renderDocs));

// Help/FAQ page
router.get('/help', asyncHandler(homeController.renderHelp));

// Privacy policy page
router.get('/privacy', asyncHandler(homeController.renderPrivacy));

// Terms of service page
router.get('/terms', asyncHandler(homeController.renderTerms));

// Health check endpoint
router.get('/health', asyncHandler(homeController.healthCheck));

module.exports = router;