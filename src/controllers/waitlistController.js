/**
 * Waitlist Controller
 * Handles waitlist-related operations and API endpoints
 */

const { logger } = require('../config/logger');
const { waitlistService, emailService } = require('../services');

class WaitlistController {
  /**
   * Join the waitlist
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async joinWaitlist(req, res) {
    try {
      const { name, email, referralCode } = req.body;
      const clientInfo = req.clientInfo;

      // Add to waitlist
      const waitlistEntry = await waitlistService.addToWaitlist(
        { name, email, referralCode },
        clientInfo
      );

      // Track signup in session
      req.session.hasSignedUp = true;
      req.session.signupTime = new Date();
      req.session.userEmail = email;

      // Send welcome email (async, don't wait for completion)
      emailService.sendWelcomeEmail({
        name: waitlistEntry.name,
        email: waitlistEntry.email,
        position: waitlistEntry.position
      }).catch(error => {
        logger.error('Failed to send welcome email:', error);
      });

      // Success response
      const response = {
        success: true,
        message: `🎉 Welcome ${name}! You've been added to the waitlist. We'll notify you when SPAMKLR launches!`,
        data: {
          position: waitlistEntry.position,
          status: waitlistEntry.status,
          joinedAt: waitlistEntry.joinedAt,
          estimatedLaunch: WaitlistController.getEstimatedLaunchDate()
        }
      };

      logger.info(`Waitlist signup successful: ${name} (${email}) - Position #${waitlistEntry.position}`);
      
      res.status(201).json(response);
    } catch (error) {
      logger.error('Waitlist signup error:', error);

      // Handle specific error types
      if (error.message === 'EMAIL_EXISTS') {
        return res.status(409).json({
          success: false,
          error: 'Already Registered',
          message: 'This email is already on our waitlist! We\'ll keep you updated.',
          action: 'check_position'
        });
      }

      if (error.name === 'ValidationError') {
        const errorMessages = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          error: 'Invalid Data',
          message: errorMessages.join('. '),
          errors: error.errors
        });
      }

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          error: 'Already Registered',
          message: 'This email is already on our waitlist! We\'ll keep you updated.'
        });
      }

      // Generic error response
      res.status(500).json({
        success: false,
        error: 'Signup Failed',
        message: 'Unable to process your signup. Please try again.',
        supportEmail: 'support@spamklr.com'
      });
    }
  }

  /**
   * Get waitlist statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getWaitlistStats(req, res) {
    try {
      const stats = await waitlistService.getWaitlistStats();
      
      const response = {
        success: true,
        data: {
          totalSignups: stats.totalSignups,
          recentSignups24h: stats.recentSignups24h,
          capacity: stats.capacity,
          percentageFull: stats.percentageFull,
          lastUpdated: stats.lastUpdated,
          estimatedLaunch: WaitlistController.getEstimatedLaunchDate(),
          milestones: WaitlistController.getProgressMilestones(stats.totalSignups)
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Error getting waitlist stats:', error);
      res.status(500).json({
        success: false,
        error: 'Stats Unavailable',
        message: 'Unable to retrieve waitlist statistics'
      });
    }
  }

  /**
   * Check waitlist position for an email
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async checkPosition(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email Required',
          message: 'Please provide an email address'
        });
      }

      const position = await waitlistService.getWaitlistPosition(email);
      
      const response = {
        success: true,
        data: {
          position: position.position,
          status: position.status,
          joinedAt: position.joinedAt,
          daysSinceJoining: position.daysSinceJoining,
          estimatedLaunch: WaitlistController.getEstimatedLaunchDate()
        }
      };

      res.json(response);
    } catch (error) {
      if (error.message === 'EMAIL_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'This email is not on our waitlist. Would you like to join?',
          action: 'join_waitlist'
        });
      }

      logger.error('Error checking waitlist position:', error);
      res.status(500).json({
        success: false,
        error: 'Check Failed',
        message: 'Unable to check position. Please try again.'
      });
    }
  }

  /**
   * Confirm waitlist entry (for email confirmation)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async confirmEntry(req, res) {
    try {
      const { email, token } = req.body; // In a real app, you'd validate the token

      const entry = await waitlistService.confirmEntry(email);
      
      const response = {
        success: true,
        message: 'Your waitlist entry has been confirmed!',
        data: {
          position: entry.position,
          status: entry.status,
          confirmedAt: entry.confirmedAt
        }
      };

      res.json(response);
    } catch (error) {
      if (error.message === 'EMAIL_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Unable to find this email on our waitlist.'
        });
      }

      logger.error('Error confirming waitlist entry:', error);
      res.status(500).json({
        success: false,
        error: 'Confirmation Failed',
        message: 'Unable to confirm entry. Please try again.'
      });
    }
  }

  /**
   * Get analytics data (for admin use)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAnalytics(req, res) {
    try {
      // TODO: Add authentication check for admin routes
      const analytics = await waitlistService.getAnalytics();
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Error getting analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Analytics Unavailable',
        message: 'Unable to retrieve analytics data'
      });
    }
  }

  /**
   * Unsubscribe from waitlist
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async unsubscribe(req, res) {
    try {
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).render('error', {
          title: 'Invalid Request',
          message: 'Email parameter is required for unsubscribing.'
        });
      }

      // TODO: Implement unsubscribe logic
      // For now, just render a confirmation page
      res.render('unsubscribe', {
        title: 'Unsubscribe - SPAMKLR',
        email: email,
        message: 'You have been successfully unsubscribed from our waitlist updates.'
      });
    } catch (error) {
      logger.error('Error processing unsubscribe:', error);
      res.status(500).render('error', {
        title: 'Server Error',
        message: 'Unable to process unsubscribe request. Please contact support.'
      });
    }
  }

  /**
   * Get estimated launch date based on current progress
   * @returns {string} - Estimated launch date
   */
  static getEstimatedLaunchDate() {
    // Simple logic - adjust based on your actual launch plans
    const now = new Date();
    const launchDate = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 days from now
    return launchDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  /**
   * Get progress milestones based on signup count
   * @param {number} signupCount - Current signup count
   * @returns {Array} - Array of milestones
   */
  static getProgressMilestones(signupCount) {
    const milestones = [
      { target: 100, label: 'Early Adopters', achieved: signupCount >= 100 },
      { target: 500, label: 'Beta Community', achieved: signupCount >= 500 },
      { target: 1000, label: 'Launch Ready', achieved: signupCount >= 1000 },
      { target: 5000, label: 'Viral Growth', achieved: signupCount >= 5000 },
      { target: 10000, label: 'Maximum Capacity', achieved: signupCount >= 10000 }
    ];

    return milestones;
  }
}

module.exports = new WaitlistController();