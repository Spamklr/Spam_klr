/**
 * Controller Index
 * Central export for all controller modules
 */

const homeController = require('./homeController');
const waitlistController = require('./waitlistController');

module.exports = {
  homeController,
  waitlistController
};