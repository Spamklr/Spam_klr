/**
 * Routes Index
 * Central configuration for all application routes
 */

const express = require('express');
const homeRoutes = require('./home');
const apiRoutes = require('./api');
const { apiNotFoundHandler } = require('../middleware');

const configureRoutes = (app) => {
  // Home and page routes
  app.use('/', homeRoutes);
  
  // API routes
  app.use('/api', apiRoutes);
  
  // Handle 404 for API routes
  app.use('/api', apiNotFoundHandler);
  
  return app;
};

module.exports = configureRoutes;