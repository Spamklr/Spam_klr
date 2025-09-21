/**
 * Home Controller
 * Handles rendering of main pages and application views
 */

const { logger } = require('../config/logger');
const { waitlistService } = require('../services');

class HomeController {
  /**
   * Render the main homepage
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async renderHome(req, res) {
    try {
      // Get waitlist stats for display
      const stats = await waitlistService.getWaitlistStats();
      
      // Prepare data for the view
      const viewData = {
        title: 'SPAMKLR - Advanced AI-Powered Spam Protection',
        description: 'Experience the next generation of call protection with SPAMKLR\'s on-device AI. Real-time speech-to-text and NLP detect fraud attempts instantly.',
        keywords: 'spam protection, AI, call blocking, fraud detection, mobile security',
        stats: {
          totalSignups: stats.totalSignups,
          recentSignups: stats.recentSignups24h,
          detectionRate: '99.9%',
          responseTime: '1s',
          privacyProtection: '100%'
        },
        features: [
          {
            icon: 'fas fa-brain',
            title: 'AI-Powered Detection',
            description: 'Advanced machine learning algorithms analyze call patterns and speech in real-time.'
          },
          {
            icon: 'fas fa-shield-alt',
            title: 'Real-time Protection',
            description: 'Instant blocking of spam calls before they even ring your phone.'
          },
          {
            icon: 'fas fa-user-secret',
            title: 'Privacy First',
            description: 'All processing happens on-device. Your conversations never leave your phone.'
          },
          {
            icon: 'fas fa-chart-line',
            title: 'Smart Learning',
            description: 'The system continuously improves based on new spam patterns and techniques.'
          }
        ],
        testimonials: [
          {
            name: 'Sarah Johnson',
            role: 'Business Owner',
            comment: 'SPAMKLR reduced my spam calls by 99%. I can finally focus on my work without interruptions.',
            rating: 5
          },
          {
            name: 'Michael Chen',
            role: 'Software Developer',
            comment: 'The on-device AI is brilliant. No privacy concerns and incredibly accurate spam detection.',
            rating: 5
          },
          {
            name: 'Emily Rodriguez',
            role: 'Marketing Manager',
            comment: 'Best spam protection app I\'ve ever used. The real-time detection is amazing.',
            rating: 5
          }
        ],
        currentYear: new Date().getFullYear()
      };

      res.render('home', viewData);
    } catch (error) {
      logger.error('Error rendering home page:', error);
      res.status(500).render('error', {
        title: 'Server Error',
        message: 'Unable to load the page. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error : {}
      });
    }
  }

  /**
   * Render the about page
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async renderAbout(req, res) {
    try {
      const viewData = {
        title: 'About SPAMKLR - Our Mission to Stop Spam Calls',
        description: 'Learn about SPAMKLR\'s mission to protect users from spam calls using cutting-edge AI technology.',
        team: [
          {
            name: 'Dr. Alex Kim',
            role: 'CEO & Founder',
            bio: 'Former AI researcher at Google with 10+ years in machine learning and telecommunications.',
            image: '/images/team/alex-kim.jpg'
          },
          {
            name: 'Sarah Martinez',
            role: 'CTO',
            bio: 'Ex-Apple engineer specializing in on-device AI and privacy-preserving technologies.',
            image: '/images/team/sarah-martinez.jpg'
          },
          {
            name: 'David Chen',
            role: 'Head of Product',
            bio: 'Product strategist with experience at Uber and Airbnb, focused on user experience.',
            image: '/images/team/david-chen.jpg'
          }
        ],
        milestones: [
          { year: '2023', event: 'SPAMKLR founded with mission to stop spam calls' },
          { year: '2024', event: 'Developed proprietary on-device AI detection algorithm' },
          { year: '2024', event: 'Completed beta testing with 10,000+ users' },
          { year: '2025', event: 'Preparing for public launch' }
        ]
      };

      res.render('about', viewData);
    } catch (error) {
      logger.error('Error rendering about page:', error);
      res.status(500).render('error', {
        title: 'Server Error',
        message: 'Unable to load the page. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error : {}
      });
    }
  }

  /**
   * Render the help/FAQ page
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async renderHelp(req, res) {
    try {
      const viewData = {
        title: 'Help & FAQ - SPAMKLR Support',
        description: 'Find answers to frequently asked questions about SPAMKLR spam protection.',
        faqs: [
          {
            category: 'General',
            questions: [
              {
                question: 'How does SPAMKLR work?',
                answer: 'SPAMKLR uses advanced on-device AI to analyze incoming calls in real-time, detecting spam patterns and fraudulent behavior without compromising your privacy.'
              },
              {
                question: 'Is my data safe?',
                answer: 'Yes! All processing happens on your device. Your call data never leaves your phone, ensuring complete privacy and security.'
              },
              {
                question: 'How accurate is the spam detection?',
                answer: 'Our AI achieves 99.9% accuracy in detecting spam calls, with continuous learning to improve over time.'
              }
            ]
          },
          {
            category: 'Technical',
            questions: [
              {
                question: 'Which devices are supported?',
                answer: 'SPAMKLR will initially support iOS and Android devices. Specific device requirements will be announced closer to launch.'
              },
              {
                question: 'Does it work with all carriers?',
                answer: 'Yes, SPAMKLR works with all major carriers and most regional providers worldwide.'
              },
              {
                question: 'Will it affect my battery life?',
                answer: 'SPAMKLR is optimized for minimal battery usage, using efficient on-device processing that won\'t significantly impact your battery life.'
              }
            ]
          }
        ]
      };

      res.render('help', viewData);
    } catch (error) {
      logger.error('Error rendering help page:', error);
      res.status(500).render('error', {
        title: 'Server Error',
        message: 'Unable to load the page. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error : {}
      });
    }
  }

  /**
   * Render the privacy policy page
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async renderPrivacy(req, res) {
    try {
      const viewData = {
        title: 'Privacy Policy - SPAMKLR',
        description: 'SPAMKLR privacy policy and data protection information.',
        lastUpdated: 'September 21, 2025'
      };

      res.render('privacy', viewData);
    } catch (error) {
      logger.error('Error rendering privacy page:', error);
      res.status(500).render('error', {
        title: 'Server Error',
        message: 'Unable to load the page. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error : {}
      });
    }
  }

  /**
   * Render the terms of service page
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async renderTerms(req, res) {
    try {
      const viewData = {
        title: 'Terms of Service - SPAMKLR',
        description: 'SPAMKLR terms of service and user agreement.',
        lastUpdated: 'September 21, 2025'
      };

      res.render('terms', viewData);
    } catch (error) {
      logger.error('Error rendering terms page:', error);
      res.status(500).render('error', {
        title: 'Server Error',
        message: 'Unable to load the page. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error : {}
      });
    }
  }

  /**
   * Health check endpoint
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async healthCheck(req, res) {
    try {
      const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        memory: process.memoryUsage(),
        database: 'connected' // TODO: Add actual database connection check
      };

      res.status(200).json(health);
    } catch (error) {
      logger.error('Health check error:', error);
      res.status(500).json({
        status: 'ERROR',
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Render the about page
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async renderAbout(req, res) {
    try {
      const viewData = {
        title: 'About SPAMKLR - Our Mission & Technology',
        description: 'Learn about SPAMKLR\'s mission to protect users from spam calls using cutting-edge AI technology.',
        currentPage: 'about'
      };

      res.render('about', viewData);
    } catch (error) {
      logger.error('Error rendering about page:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Unable to load about page',
        currentPage: 'about'
      });
    }
  }

  /**
   * Render the contact page
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async renderContact(req, res) {
    try {
      const viewData = {
        title: 'Contact SPAMKLR - Get in Touch',
        description: 'Have questions about SPAMKLR? Contact our team for support, partnerships, or general inquiries.',
        currentPage: 'contact'
      };

      res.render('contact', viewData);
    } catch (error) {
      logger.error('Error rendering contact page:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Unable to load contact page',
        currentPage: 'contact'
      });
    }
  }

  /**
   * Render the documentation page
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async renderDocs(req, res) {
    try {
      const viewData = {
        title: 'SPAMKLR Documentation - API & Integration Guide',
        description: 'Complete documentation for SPAMKLR API integration, SDK usage, and developer resources.',
        currentPage: 'docs'
      };

      res.render('docs', viewData);
    } catch (error) {
      logger.error('Error rendering docs page:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Unable to load documentation page',
        currentPage: 'docs'
      });
    }
  }
}

module.exports = new HomeController();