const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
}));

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const signupLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_SIGNUP_REQUESTS) || 5, // limit each IP to 5 signup attempts per windowMs
  message: {
    error: "Too many signup attempts, please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use(generalLimiter);

// Data sanitization against NoSQL injection attacks
app.use(mongoSanitize());

// Prevent parameter pollution
app.use(hpp());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-this',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600 // lazy session update
  }),
  cookie: {
    secure: process.env.SESSION_COOKIE_SECURE === 'true', // true in production with HTTPS
    httpOnly: process.env.SESSION_COOKIE_HTTP_ONLY !== 'false',
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 3600000 // 1 hour
  }
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5000'];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Built-in Express body parsing middleware (Express 4.x compatible)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname)));

// Connect to MongoDB Atlas using environment variable
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas");
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  });

const db = mongoose.connection;
db.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});

// Define Schema with validation
const WaitlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name must be less than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  joinedAt: { 
    type: Date, 
    default: Date.now 
  },
}, {
  timestamps: true
});

// Add index for better query performance (email index is already created by unique: true)
WaitlistSchema.index({ ipAddress: 1 });

// Model
const Waitlist = mongoose.model("Waitlist", WaitlistSchema);

// Input validation middleware
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

// Error handling middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return res.status(400).json({
      error: 'Validation failed',
      message: errorMessages.join('. '),
      errors: errors.array()
    });
  }
  next();
};

// Global error handler
const globalErrorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errorMessages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      error: 'Validation Error',
      message: errorMessages.join('. ')
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate Entry',
      message: 'This email is already registered on our waitlist!'
    });
  }

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'Access Denied',
      message: 'Request not allowed by CORS policy'
    });
  }

  // Rate limit error
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Please slow down and try again later'
    });
  }

  // Default server error
  res.status(500).json({
    error: 'Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong. Please try again.' : err.message
  });
};

// Serve the main page
app.get("/", (req, res) => {
  try {
    res.sendFile(path.join(__dirname, "index.html"));
  } catch (error) {
    console.error('Error serving index.html:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Unable to load the page. Please try again.'
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API route for joining waitlist with enhanced security
app.post("/join", signupLimiter, validateSignup, handleValidationErrors, async (req, res) => {
  try {
    const { name, email } = req.body;

    // Check current waitlist size
    const currentCount = await Waitlist.countDocuments();
    const maxEntries = parseInt(process.env.MAX_WAITLIST_ENTRIES) || 10000;
    
    if (currentCount >= maxEntries) {
      return res.status(429).json({
        error: 'Waitlist Full',
        message: 'We\'ve reached our waitlist capacity. Please check back later!'
      });
    }

    // Get client information for security tracking
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // Check for suspicious activity (multiple signups from same IP)
    const recentSignupsFromIP = await Waitlist.countDocuments({
      ipAddress: clientIP,
      joinedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // last 24 hours
    });

    if (recentSignupsFromIP >= 3) {
      return res.status(429).json({
        error: 'Too Many Signups',
        message: 'Too many signups from your location. Please try again tomorrow.'
      });
    }

    // Create new waitlist entry
    const newEntry = new Waitlist({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      ipAddress: clientIP,
      userAgent: userAgent
    });

    await newEntry.save();

    // Log successful signup (without sensitive data)
    console.log(`✅ New waitlist signup: ${name} from IP: ${clientIP.substring(0, 8)}...`);

    // Update session to track signup
    req.session.hasSignedUp = true;
    req.session.signupTime = new Date();

    res.status(201).json({
      success: true,
      message: `🎉 Welcome ${name}! You've been added to the waitlist. We'll notify you when SPAMKLR launches!`,
      waitlistPosition: currentCount + 1
    });

  } catch (error) {
    console.error("Signup error:", error);

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'Already Registered',
        message: 'This email is already on our waitlist! We\'ll keep you updated.'
      });
    }

    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Invalid Data',
        message: errorMessages.join('. ')
      });
    }

    res.status(500).json({
      error: 'Signup Failed',
      message: 'Unable to process your signup. Please try again.'
    });
  }
});

// API route to get waitlist statistics (public, limited info)
app.get("/waitlist-stats", async (req, res) => {
  try {
    const count = await Waitlist.countDocuments();
    const recentSignups = await Waitlist.countDocuments({
      joinedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    res.json({
      totalSignups: count,
      recentSignups24h: recentSignups,
      capacity: parseInt(process.env.MAX_WAITLIST_ENTRIES) || 10000,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error getting waitlist stats:", error);
    res.status(500).json({
      error: 'Stats Unavailable',
      message: 'Unable to retrieve waitlist statistics'
    });
  }
});

// 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'API endpoint not found'
  });
});

// Apply global error handler
app.use(globalErrorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 ${process.env.APP_NAME || 'SPAMKLR'} Landing Page Server running on http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${__dirname}`);
  console.log(`🌐 Access your website at: http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🛡️  Security features enabled: Helmet, Rate Limiting, Input Validation, Session Management`);
  console.log(`📊 Max waitlist entries: ${process.env.MAX_WAITLIST_ENTRIES || 10000}`);
});
