/**
 * Security Configuration
 * Centralized security settings and middleware configuration
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./app');

// Helmet configuration
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://fonts.googleapis.com", 
        "https://cdnjs.cloudflare.com"
      ],
      fontSrc: [
        "'self'", 
        "https://fonts.gstatic.com", 
        "https://cdnjs.cloudflare.com"
      ],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://cdnjs.cloudflare.com"
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https:"
      ],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false // Allow embedding for certain use cases
};

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Signup-specific rate limiter (more restrictive)
const signupLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxSignupRequests,
  message: {
    error: "Too many signup attempts, please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too Many Signup Attempts',
      message: 'Too many signup attempts from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (config.security.allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ]
};

// Session configuration
const sessionConfig = {
  secret: config.security.sessionSecret,
  resave: false,
  saveUninitialized: false,
  name: 'spamklr_session', // Change default session name
  cookie: {
    secure: config.security.cookieSecure,
    httpOnly: config.security.cookieHttpOnly,
    maxAge: config.security.sessionMaxAge,
    sameSite: 'lax' // CSRF protection
  }
};

module.exports = {
  helmetConfig,
  generalLimiter,
  signupLimiter,
  corsOptions,
  sessionConfig
};