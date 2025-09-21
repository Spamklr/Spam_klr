/**
 * SPAMKLR Landing Page Server
 * Professional layered architecture with Node.js, Express, and Handlebars
 * 
 * Features:
 * - Professional MVC architecture
 * - Advanced security middleware
 * - Handlebars templating engine
 * - MongoDB integration
 * - Rate limiting and input validation
 * - Comprehensive error handling
 * - Logging and monitoring
 */

const express = require('express');
const { create } = require('express-handlebars');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

// Import configuration
const config = require('./src/config/app');
const databaseConfig = require('./src/config/database');
const { 
  helmetConfig, 
  generalLimiter, 
  corsOptions, 
  sessionConfig 
} = require('./src/config/security');
const { logger, httpLogger } = require('./src/config/logger');

// Import utilities and middleware
const { handlebarsHelpers } = require('./src/utils');
const { 
  globalErrorHandler, 
  notFoundHandler,
  sessionSecurity,
  securityAuditLog,
  requestTimeout
} = require('./src/middleware');

// Import routes
const configureRoutes = require('./src/routes');

// Create Express application
const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

/**
 * Security Configuration
 */

// Apply helmet security headers
const helmet = require('helmet');
app.use(helmet(helmetConfig));

// Rate limiting
app.use(generalLimiter);

// Data sanitization against NoSQL injection attacks
app.use(mongoSanitize());

// Prevent parameter pollution
app.use(hpp());

// Request timeout
app.use(requestTimeout(30000)); // 30 seconds

/**
 * View Engine Configuration
 */

// Configure Handlebars
const hbs = create({
  defaultLayout: config.handlebars.defaultLayout,
  layoutsDir: path.join(__dirname, config.handlebars.layoutsDir),
  partialsDir: path.join(__dirname, config.handlebars.partialsDir),
  extname: config.handlebars.extname,
  helpers: handlebarsHelpers,
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  }
});

// Set view engine
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

/**
 * Middleware Configuration
 */

// HTTP request logging
app.use(httpLogger);

// CORS configuration
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Static files middleware
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1y' : '0',
  etag: true,
  lastModified: true
}));

/**
 * Session Configuration
 */

// Configure session with MongoDB store
const sessionMiddleware = session({
  ...sessionConfig,
  store: MongoStore.create({
    mongoUrl: config.database.uri,
    touchAfter: 24 * 3600, // Lazy session update
    crypto: {
      secret: config.security.sessionSecret
    }
  })
});

app.use(sessionMiddleware);

// Additional session security
app.use(sessionSecurity);

// Security audit logging
app.use(securityAuditLog);

/**
 * Routes Configuration
 */

// Configure all routes
configureRoutes(app);

/**
 * Error Handling
 */

// 404 handler for non-API routes
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

/**
 * Server Initialization
 */

const startServer = async () => {
  try {
    // Connect to database
    await databaseConfig.connect();
    
    // Start HTTP server
    const server = app.listen(config.app.port, () => {
      logger.info(`🚀 ${config.app.name} Landing Page Server running on http://localhost:${config.app.port}`);
      logger.info(`📁 Serving static files from: ${path.join(__dirname, 'public')}`);
      logger.info(`🎨 Using Handlebars templates from: ${path.join(__dirname, 'views')}`);
      logger.info(`🌐 Access your website at: ${config.app.url}`);
      logger.info(`🔧 Environment: ${config.app.env}`);
      logger.info(`🛡️  Security features: Helmet, Rate Limiting, Input Validation, Session Management`);
      logger.info(`📊 Max waitlist entries: ${config.database.maxWaitlistEntries}`);
      logger.info(`🗄️  Database: ${databaseConfig.isConnected() ? 'Connected' : 'Disconnected'}`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      
      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          // Close database connection
          await databaseConfig.disconnect();
          logger.info('Database connection closed');
          
          // Exit process
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      // Force close after timeout
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Handle process signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

// Export for testing
module.exports = { app, startServer };

