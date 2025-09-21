/**
 * Waitlist Service
 * Business logic for waitlist operations
 */

const { Waitlist } = require('../models');
const { logger } = require('../config/logger');
const config = require('../config/app');

class WaitlistService {
  /**
   * Add a new entry to the waitlist
   * @param {Object} data - User data
   * @param {Object} clientInfo - Client information
   * @returns {Object} - Created waitlist entry
   */
  async addToWaitlist(data, clientInfo) {
    try {
      const { name, email, referralCode, source = 'website' } = data;

      // Check if email already exists
      const existingEntry = await Waitlist.findByEmail(email);
      if (existingEntry) {
        throw new Error('EMAIL_EXISTS');
      }

      // Create new waitlist entry
      const waitlistEntry = new Waitlist({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        source: source,
        referralCode: referralCode || null,
        metadata: {
          browser: clientInfo.browser,
          os: clientInfo.os,
          device: clientInfo.device,
          country: clientInfo.country || null,
          timezone: clientInfo.timezone || null
        }
      });

      const savedEntry = await waitlistEntry.save();

      // Log successful signup
      logger.info(`New waitlist signup: ${name} (${email}) from ${clientInfo.ip.substring(0, 8)}...`, {
        position: savedEntry.position,
        source: source,
        device: clientInfo.device,
        browser: clientInfo.browser
      });

      return savedEntry;
    } catch (error) {
      logger.error('Error adding to waitlist:', error);
      throw error;
    }
  }

  /**
   * Get waitlist statistics
   * @returns {Object} - Waitlist statistics
   */
  async getWaitlistStats() {
    try {
      const stats = await Waitlist.getWaitlistStats();
      
      return {
        totalSignups: stats.total,
        pendingSignups: stats.pending,
        confirmedSignups: stats.confirmed,
        recentSignups24h: stats.recent24h,
        capacity: config.database.maxWaitlistEntries,
        percentageFull: Math.round((stats.total / config.database.maxWaitlistEntries) * 100),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting waitlist stats:', error);
      throw error;
    }
  }

  /**
   * Check if an IP has exceeded signup limits
   * @param {string} ipAddress - Client IP address
   * @returns {Object} - Limit check result
   */
  async checkIPSignupLimit(ipAddress) {
    try {
      const recentSignups = await Waitlist.countRecentSignupsFromIP(ipAddress, 24);
      const limit = 3; // Maximum signups per IP per 24 hours
      
      return {
        allowed: recentSignups < limit,
        current: recentSignups,
        limit: limit,
        hoursRemaining: 24
      };
    } catch (error) {
      logger.error('Error checking IP signup limit:', error);
      throw error;
    }
  }

  /**
   * Get waitlist position for an email
   * @param {string} email - Email address
   * @returns {Object} - Position information
   */
  async getWaitlistPosition(email) {
    try {
      const entry = await Waitlist.findByEmail(email);
      
      if (!entry) {
        throw new Error('EMAIL_NOT_FOUND');
      }

      return {
        position: entry.position,
        status: entry.status,
        joinedAt: entry.joinedAt,
        daysSinceJoining: entry.daysSinceJoining
      };
    } catch (error) {
      logger.error('Error getting waitlist position:', error);
      throw error;
    }
  }

  /**
   * Confirm a waitlist entry
   * @param {string} email - Email address
   * @returns {Object} - Updated entry
   */
  async confirmEntry(email) {
    try {
      const entry = await Waitlist.findByEmail(email);
      
      if (!entry) {
        throw new Error('EMAIL_NOT_FOUND');
      }

      if (entry.status === 'confirmed') {
        return entry;
      }

      await entry.confirm();
      
      logger.info(`Waitlist entry confirmed: ${email}`);
      
      return entry;
    } catch (error) {
      logger.error('Error confirming waitlist entry:', error);
      throw error;
    }
  }

  /**
   * Get recent signups for analytics
   * @param {number} days - Number of days to look back
   * @returns {Array} - Recent signups
   */
  async getRecentSignups(days = 7) {
    try {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const signups = await Waitlist.find({
        joinedAt: { $gte: cutoff }
      })
      .select('name email position status source joinedAt metadata.device metadata.browser')
      .sort({ joinedAt: -1 })
      .limit(100);

      return signups;
    } catch (error) {
      logger.error('Error getting recent signups:', error);
      throw error;
    }
  }

  /**
   * Get analytics data
   * @returns {Object} - Analytics data
   */
  async getAnalytics() {
    try {
      const [
        totalStats,
        deviceStats,
        sourceStats,
        dailySignups
      ] = await Promise.all([
        this.getWaitlistStats(),
        this.getDeviceBreakdown(),
        this.getSourceBreakdown(),
        this.getDailySignups(30)
      ]);

      return {
        overview: totalStats,
        devices: deviceStats,
        sources: sourceStats,
        dailyTrend: dailySignups
      };
    } catch (error) {
      logger.error('Error getting analytics:', error);
      throw error;
    }
  }

  /**
   * Get device breakdown statistics
   * @returns {Array} - Device statistics
   */
  async getDeviceBreakdown() {
    try {
      const deviceStats = await Waitlist.aggregate([
        {
          $group: {
            _id: '$metadata.device',
            count: { $sum: 1 },
            percentage: { $multiply: [{ $divide: ['$count', '$total'] }, 100] }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      return deviceStats;
    } catch (error) {
      logger.error('Error getting device breakdown:', error);
      throw error;
    }
  }

  /**
   * Get source breakdown statistics
   * @returns {Array} - Source statistics
   */
  async getSourceBreakdown() {
    try {
      const sourceStats = await Waitlist.aggregate([
        {
          $group: {
            _id: '$source',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      return sourceStats;
    } catch (error) {
      logger.error('Error getting source breakdown:', error);
      throw error;
    }
  }

  /**
   * Get daily signups for the last N days
   * @param {number} days - Number of days
   * @returns {Array} - Daily signup counts
   */
  async getDailySignups(days = 30) {
    try {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const dailyStats = await Waitlist.aggregate([
        {
          $match: {
            joinedAt: { $gte: cutoff }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$joinedAt' },
              month: { $month: '$joinedAt' },
              day: { $dayOfMonth: '$joinedAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
      ]);

      return dailyStats.map(stat => ({
        date: new Date(stat._id.year, stat._id.month - 1, stat._id.day),
        count: stat.count
      }));
    } catch (error) {
      logger.error('Error getting daily signups:', error);
      throw error;
    }
  }
}

module.exports = new WaitlistService();