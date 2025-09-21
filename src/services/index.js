/**
 * Service Index
 * Central export for all service modules
 */

const waitlistService = require('./waitlistService');
const emailService = require('./emailService');

module.exports = {
  waitlistService,
  emailService
};