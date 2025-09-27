// presentation/presentation.js
// Express server + middleware + handlebars setup + routes

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const { body, validationResult } = require('express-validator');
const exphbs = require('express-handlebars');

const { connectDB } = require('../persistence/persistence');
const { addToWaitlist, getWaitlistStats, addContactSubmission, BusinessError } = require('../business/business');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

// Handlebars setup
app.engine('hbs', exphbs.engine({
  extname: '.hbs',
  layoutsDir: path.join(__dirname, '..', 'views', 'layouts'),
  partialsDir: path.join(__dirname, '..', 'views', 'partials'),
  defaultLayout: 'main'
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '..', 'views'));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(generalLimiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Custom sanitization (only body + params, skip query to avoid crash)
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
});

// Prevent HTTP param pollution
app.use(hpp());

// ✅ Global CORS
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow curl/postman/mobile apps

    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://localhost:8000',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:5000',
          'http://127.0.0.1:8000',
          'https://spamklr.com',
          'https://www.spamklr.com'
        ];

    if (process.env.NODE_ENV !== 'production') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      return callback(null, true);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-this',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600
  }),
  cookie: {
    secure: process.env.SESSION_COOKIE_SECURE === 'true',
    httpOnly: process.env.SESSION_COOKIE_HTTP_ONLY !== 'false',
    maxAge: parseInt(process.env.SESSION_MAX_AGE, 10) || 3600000
  }
}));

// Serve static assets
app.use(express.static(path.join(__dirname, '..', 'public')));

// Route-level signup limiter
const signupLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_SIGNUP_REQUESTS, 10) || 5,
  message: {
    error: "Too many signup attempts, please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Validation middleware for signup
const validateSignup = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s\-'\.]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, apostrophes, and periods')
    .escape(),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Email is too long')
];

// Validation middleware for contact form
const validateContact = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s\-'\.]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, apostrophes, and periods')
    .escape(),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Email is too long'),
  body('subject')
    .trim()
    .isIn(['general', 'support', 'business', 'press', 'feedback'])
    .withMessage('Please select a valid subject')
    .escape(),
  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters')
    .escape()
];

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('🚨 Validation errors:', errors.array());
    console.log('📝 Request body:', req.body);
    const errorMessages = errors.array().map(e => e.msg);
    return res.status(400).json({
      error: 'Validation failed',
      message: errorMessages.join('. '),
      errors: errors.array()
    });
  }
  next();
}

// Homepage
app.get('/', async (req, res, next) => {
  try {
    const stats = await getWaitlistStats();
    res.render('index', { stats });
  } catch (err) {
    next(err);
  }
});

// Health check
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Basic stats
    let stats = null;
    if (dbStatus === 'connected') {
      try {
        stats = await getWaitlistStats();
      } catch (err) {
        console.warn('Health check: Could not fetch stats', err.message);
      }
    }
    
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        mongodb: mongoose.connection.host || 'unknown'
      },
      server: {
        port: PORT,
        nodeVersion: process.version,
        platform: process.platform
      }
    };
    
    if (stats) {
      health.stats = {
        waitlistTotal: stats.totalSignups,
        waitlistRecent24h: stats.recentSignups24h
      };
    }
    
    res.status(200).json(health);
  } catch (err) {
    console.error('Health check error:', err);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  }
});

// Join waitlist
app.post('/join', signupLimiter, validateSignup, handleValidationErrors, async (req, res, next) => {
  try {
    console.log('📝 Waitlist join attempt:', req.body);
    const { name, email } = req.body;
    const clientIP = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    console.log('📍 Client info:', { clientIP, userAgent });
    const result = await addToWaitlist({ name, email, ipAddress: clientIP, userAgent });

    if (req.session) {
      req.session.hasSignedUp = true;
      req.session.signupTime = new Date();
    }

    res.status(201).json({
      success: true,
      message: `🎉 Welcome ${result.entry.name}! You've been added to the waitlist. We'll notify you when SPAMKLR launches!`,
      waitlistPosition: result.position
    });
  } catch (err) {
    console.error('❌ Waitlist error:', err);
    if (err instanceof BusinessError) {
      const statusMap = {
        WAITLIST_FULL: 429,
        IP_RATE_LIMIT: 429,
        DUPLICATE_EMAIL: 409,
        INVALID_EMAIL: 400,
        INVALID_NAME: 400
      };
      const status = statusMap[err.code] || 400;
      return res.status(status).json({ error: err.message });
    }
    if (err.name === 'ValidationError') {
      const errorMessages = Object.values(err.errors).map(v => v.message);
      return res.status(400).json({ error: 'Validation Error', message: errorMessages.join('. ') });
    }
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Duplicate Entry', message: 'This email is already registered on our waitlist!' });
    }
    next(err);
  }
});

// Handle preflight requests for /contact
app.options('/contact', cors(corsOptions));

// Contact form submission
app.post('/contact', signupLimiter, validateContact, handleValidationErrors, async (req, res, next) => {
  try {
    console.log('📧 Contact form submission:', req.body);
    const { name, email, subject, message } = req.body;
    const clientIP = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    console.log('📍 Client info:', { clientIP, userAgent });
    const result = await addContactSubmission({ name, email, subject, message, ipAddress: clientIP, userAgent });

    res.status(201).json({
      success: true,
      message: `Thank you ${result.entry.name}! We've received your message and will reply within 24 hours.`
    });
  } catch (err) {
    console.error('❌ Contact form error:', err);
    if (err instanceof BusinessError) {
      const statusMap = {
        IP_RATE_LIMIT: 429,
        INVALID_EMAIL: 400,
        INVALID_NAME: 400,
        INVALID_SUBJECT: 400,
        INVALID_MESSAGE: 400
      };
      const status = statusMap[err.code] || 400;
      return res.status(status).json({ error: err.message });
    }
    if (err.name === 'ValidationError') {
      const errorMessages = Object.values(err.errors).map(v => v.message);
      return res.status(400).json({ error: 'Validation Error', message: errorMessages.join('. ') });
    }
    next(err);
  }
});

// Waitlist stats
app.get('/waitlist-stats', async (req, res, next) => {
  try {
    const stats = await getWaitlistStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// 404 for API
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'API endpoint not found' });
});

// Global error handler
function globalErrorHandler(err, req, res, next) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  
  console.error(`[${timestamp}] ❌ ${method} ${url} - IP: ${ip}`);
  console.error('Error details:', {
    name: err.name,
    message: err.message,
    code: err.code,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });

  if (err.name === 'ValidationError') {
    const errorMessages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ error: 'Validation Error', message: errorMessages.join('. ') });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate Entry', message: 'This email is already registered on our waitlist!' });
  }
  if (err.message === 'Not allowed by CORS') {
    console.error(`🚫 CORS blocked origin: ${req.get('Origin') || 'unknown'}`);
    return res.status(403).json({ error: 'Access Denied', message: 'Request not allowed by CORS policy' });
  }
  if (err.status === 429) {
    return res.status(429).json({ error: 'Too Many Requests', message: 'Please slow down and try again later' });
  }
  
  // MongoDB connection errors
  if (err.name === 'MongooseServerSelectionError' || err.name === 'MongoServerError') {
    console.error('🔴 Database connection error - check MongoDB URI and network');
    return res.status(503).json({ error: 'Service Unavailable', message: 'Database connection error. Please try again later.' });
  }
  
  res.status(500).json({
    error: 'Server Error',
    message: process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again.'
      : err.message
  });
}
app.use(globalErrorHandler);

// Environment validation
function validateEnvironment() {
  const required = ['MONGODB_URI'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    console.error('💡 Create .env file with required variables');
    return false;
  }
  
  // Warnings for recommended variables
  const recommended = ['SESSION_SECRET', 'ALLOWED_ORIGINS'];
  const missingRecommended = recommended.filter(key => !process.env[key]);
  
  if (missingRecommended.length > 0) {
    console.warn('⚠️  Missing recommended environment variables:', missingRecommended);
    console.warn('💡 Add these to .env file for better security');
  }
  
  return true;
}

// Bootstrap
(async () => {
  try {
    console.log('🚀 Starting SPAMKLR server...');
    console.log('📋 Environment:', process.env.NODE_ENV || 'development');
    
    // Validate environment
    if (!validateEnvironment()) {
      console.error('❌ Environment validation failed');
      process.exit(1);
    }
    
    await connectDB(process.env.MONGODB_URI);
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ ${process.env.APP_NAME || 'SPAMKLR'} running on http://0.0.0.0:${PORT}`);
      console.log(`📁 Serving public from: ${path.join(__dirname, '..', 'public')}`);
      console.log(`🌐 CORS allowed origins: ${process.env.ALLOWED_ORIGINS || 'localhost:5000,localhost:8000'}`);
    });

    async function gracefulShutdown(signal) {
      console.log(`${signal} received, shutting down gracefully`);
      server.close(async () => {
        try {
          await require('mongoose').connection.close();
          console.log('Mongo connection closed.');
          process.exit(0);
        } catch (err) {
          console.error('Error during shutdown:', err);
          process.exit(1);
        }
      });
    }
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
