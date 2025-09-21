/**
 * Middleware Index
 * Central export for all middleware modules
 */

const validation = require('./validation');
const errorHandler = require('./errorHandler');
const security = require('./security');

module.exports = {
  ...validation,
  ...errorHandler,
  ...security
};