/**
 * Application Configuration
 * Centralized configuration management with environment variables
 */

require('dotenv').config();

const config = {
  // Application settings
  app: {
    name: process.env.APP_NAME || 'SPAMKLR',
    port: parseInt(process.env.PORT) || 5000,
    env: process.env.NODE_ENV || 'development',
    url: process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`
  },

  // Database settings
  database: {
    uri: process.env.MONGODB_URI,
    maxWaitlistEntries: parseInt(process.env.MAX_WAITLIST_ENTRIES) || 10000
  },

  // Security settings
  security: {
    sessionSecret: process.env.SESSION_SECRET || 'fallback-secret-change-this-in-production',
    cookieSecure: process.env.SESSION_COOKIE_SECURE === 'true',
    cookieHttpOnly: process.env.SESSION_COOKIE_HTTP_ONLY !== 'false',
    sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE) || 3600000, // 1 hour
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5000']
  },

  // Rate limiting settings
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    maxSignupRequests: parseInt(process.env.RATE_LIMIT_MAX_SIGNUP_REQUESTS) || 5
  },

  // Logging settings
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined'
  },

  // Handlebars settings
  handlebars: {
    defaultLayout: 'main',
    layoutsDir: 'views/layouts',
    partialsDir: 'views/partials',
    extname: '.hbs',
    helpers: {}
  }
};

// Validation
const validateConfig = () => {
  const required = [
    'MONGODB_URI'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Warn about insecure defaults in production
  if (config.app.env === 'production') {
    if (config.security.sessionSecret === 'fallback-secret-change-this-in-production') {
      console.warn('⚠️  WARNING: Using default session secret in production!');
    }
    
    if (!config.security.cookieSecure) {
      console.warn('⚠️  WARNING: Cookies are not secure in production!');
    }
  }
};

// Validate configuration on startup
validateConfig();

module.exports = config;