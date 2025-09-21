/**
 * Security Middleware
 * Additional security middleware beyond basic configuration
 */

const { logger } = require('../config/logger');

// Extract client information for security tracking
const extractClientInfo = (req, res, next) => {
  const userAgent = req.get('User-Agent') || 'unknown';
  const clientIP = req.ip || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                   'unknown';

  // Parse user agent for additional metadata
  const metadata = parseUserAgent(userAgent);

  // Add to request object
  req.clientInfo = {
    ip: clientIP,
    userAgent: userAgent,
    ...metadata
  };

  next();
};

// Parse user agent string for browser, OS, device info
const parseUserAgent = (userAgent) => {
  const metadata = {
    browser: 'unknown',
    os: 'unknown',
    device: 'desktop'
  };

  if (!userAgent || userAgent === 'unknown') {
    return metadata;
  }

  const ua = userAgent.toLowerCase();

  // Browser detection
  if (ua.includes('chrome')) metadata.browser = 'Chrome';
  else if (ua.includes('firefox')) metadata.browser = 'Firefox';
  else if (ua.includes('safari')) metadata.browser = 'Safari';
  else if (ua.includes('edge')) metadata.browser = 'Edge';
  else if (ua.includes('opera')) metadata.browser = 'Opera';

  // OS detection
  if (ua.includes('windows')) metadata.os = 'Windows';
  else if (ua.includes('mac')) metadata.os = 'macOS';
  else if (ua.includes('linux')) metadata.os = 'Linux';
  else if (ua.includes('android')) metadata.os = 'Android';
  else if (ua.includes('ios')) metadata.os = 'iOS';

  // Device detection
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    metadata.device = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    metadata.device = 'tablet';
  }

  return metadata;
};

// Suspicious activity detection
const detectSuspiciousActivity = (req, res, next) => {
  const suspicious = [];
  const userAgent = req.get('User-Agent') || '';

  // Check for common bot patterns
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /requests/i
  ];

  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    suspicious.push('bot-like-user-agent');
  }

  // Check for missing or suspicious headers
  if (!userAgent) {
    suspicious.push('missing-user-agent');
  }

  if (!req.get('Accept-Language')) {
    suspicious.push('missing-accept-language');
  }

  // Check for rapid requests (this would require session/cache storage)
  // For now, we'll just log suspicious activity

  if (suspicious.length > 0) {
    logger.warn(`Suspicious activity detected from ${req.clientInfo?.ip}: ${suspicious.join(', ')}`, {
      ip: req.clientInfo?.ip,
      userAgent: userAgent,
      url: req.originalUrl,
      method: req.method,
      suspiciousFlags: suspicious
    });

    // For now, just add to request object for potential future action
    req.suspiciousActivity = suspicious;
  }

  next();
};

// Content Security Policy for API responses
const apiSecurityHeaders = (req, res, next) => {
  // Prevent content type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent framing (clickjacking protection)
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent information disclosure
  res.removeHeader('X-Powered-By');
  
  next();
};

// Session security enhancements
const sessionSecurity = (req, res, next) => {
  // Track signup attempts in session
  if (!req.session.signupAttempts) {
    req.session.signupAttempts = 0;
  }

  // Add session metadata
  if (!req.session.metadata) {
    req.session.metadata = {
      createdAt: new Date(),
      ip: req.clientInfo?.ip,
      userAgent: req.clientInfo?.userAgent
    };
  }

  // Detect session hijacking attempts
  if (req.session.metadata.ip !== req.clientInfo?.ip) {
    logger.warn(`Potential session hijacking detected`, {
      sessionIP: req.session.metadata.ip,
      requestIP: req.clientInfo?.ip,
      sessionId: req.sessionID
    });
    
    // Regenerate session ID for security
    req.session.regenerate((err) => {
      if (err) {
        logger.error('Error regenerating session:', err);
      }
      next();
    });
    return;
  }

  next();
};

// Request logging for security audit
const securityAuditLog = (req, res, next) => {
  // Log important security events
  const securityEvents = [
    '/join', '/api/join', '/signup', '/register',
    '/admin', '/login', '/auth'
  ];

  if (securityEvents.some(event => req.path.includes(event))) {
    logger.info(`Security event: ${req.method} ${req.path}`, {
      ip: req.clientInfo?.ip,
      userAgent: req.clientInfo?.userAgent,
      sessionId: req.sessionID,
      suspiciousActivity: req.suspiciousActivity || []
    });
  }

  next();
};

module.exports = {
  extractClientInfo,
  detectSuspiciousActivity,
  apiSecurityHeaders,
  sessionSecurity,
  securityAuditLog
};