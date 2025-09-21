/**
 * Common Utilities
 * Shared utility functions used across the application
 */

const crypto = require('crypto');

/**
 * Generate a random string of specified length
 * @param {number} length - Length of the string
 * @returns {string} - Random string
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a secure random token
 * @param {number} length - Length of the token
 * @returns {string} - Secure token
 */
const generateSecureToken = (length = 64) => {
  return crypto.randomBytes(length).toString('base64url');
};

/**
 * Hash a string using SHA-256
 * @param {string} input - Input string
 * @returns {string} - Hashed string
 */
const hashString = (input) => {
  return crypto.createHash('sha256').update(input).digest('hex');
};

/**
 * Sleep for a specified number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after sleep
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Validate email address format
 * @param {string} email - Email address
 * @returns {boolean} - True if valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitize input string
 * @param {string} input - Input string
 * @returns {string} - Sanitized string
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .substring(0, 1000); // Limit length
};

/**
 * Format phone number
 * @param {string} phone - Phone number
 * @returns {string} - Formatted phone number
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format US phone numbers
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }
  
  // Format international numbers (basic)
  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }
  
  return phone;
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @param {string} suffix - Suffix to append
 * @returns {string} - Truncated text
 */
const truncateText = (text, length = 100, suffix = '...') => {
  if (!text) return '';
  if (text.length <= length) return text;
  
  return text.substring(0, length) + suffix;
};

/**
 * Get client IP address from request
 * @param {Object} req - Express request object
 * @returns {string} - Client IP address
 */
const getClientIP = (req) => {
  return req.ip ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         'unknown';
};

/**
 * Parse user agent string for basic info
 * @param {string} userAgent - User agent string
 * @returns {Object} - Parsed information
 */
const parseUserAgent = (userAgent) => {
  if (!userAgent) return { browser: 'unknown', os: 'unknown', device: 'unknown' };
  
  const ua = userAgent.toLowerCase();
  
  const browser = ua.includes('chrome') ? 'Chrome' :
                  ua.includes('firefox') ? 'Firefox' :
                  ua.includes('safari') ? 'Safari' :
                  ua.includes('edge') ? 'Edge' :
                  ua.includes('opera') ? 'Opera' : 'unknown';
  
  const os = ua.includes('windows') ? 'Windows' :
             ua.includes('mac') ? 'macOS' :
             ua.includes('linux') ? 'Linux' :
             ua.includes('android') ? 'Android' :
             ua.includes('ios') ? 'iOS' : 'unknown';
  
  const device = ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') ? 'mobile' :
                 ua.includes('tablet') || ua.includes('ipad') ? 'tablet' : 'desktop';
  
  return { browser, os, device };
};

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
const formatNumber = (num) => {
  if (!num) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Convert string to slug
 * @param {string} text - Text to convert
 * @returns {string} - Slug
 */
const createSlug = (text) => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} - Cloned object
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
  return obj;
};

/**
 * Check if value is empty
 * @param {*} value - Value to check
 * @returns {boolean} - True if empty
 */
const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} - Promise that resolves with function result
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
  
  throw lastError;
};

module.exports = {
  generateRandomString,
  generateSecureToken,
  hashString,
  sleep,
  isValidEmail,
  sanitizeInput,
  formatPhoneNumber,
  truncateText,
  getClientIP,
  parseUserAgent,
  formatNumber,
  createSlug,
  deepClone,
  isEmpty,
  retryWithBackoff
};