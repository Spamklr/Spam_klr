/**
 * Waitlist Model
 * Mongoose schema for waitlist entries with validation and security features
 */

const mongoose = require('mongoose');

const WaitlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name must be less than 50 characters'],
    match: [/^[a-zA-Z\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: [254, 'Email is too long'],
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
  },
  ipAddress: {
    type: String,
    required: true,
    trim: true
  },
  userAgent: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'User agent string too long']
  },
  position: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'notified', 'converted'],
    default: 'pending'
  },
  source: {
    type: String,
    default: 'website',
    enum: ['website', 'referral', 'social', 'direct']
  },
  referralCode: {
    type: String,
    sparse: true, // Allows multiple null values
    maxlength: [20, 'Referral code too long'],
    index: true
  },
  joinedAt: { 
    type: Date, 
    default: Date.now 
  },
  confirmedAt: {
    type: Date
  },
  lastNotified: {
    type: Date
  },
  metadata: {
    browser: String,
    os: String,
    device: String,
    country: String,
    timezone: String
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      // Remove sensitive information when converting to JSON
      delete ret.ipAddress;
      delete ret.userAgent;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better query performance
WaitlistSchema.index({ ipAddress: 1 });
WaitlistSchema.index({ joinedAt: -1 });
WaitlistSchema.index({ status: 1 });
WaitlistSchema.index({ position: 1 });

// Pre-save middleware to set position
WaitlistSchema.pre('save', async function(next) {
  if (this.isNew && this.position === 0) {
    try {
      const count = await this.constructor.countDocuments();
      this.position = count + 1;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Static methods
WaitlistSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

WaitlistSchema.statics.getWaitlistStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
        recent24h: {
          $sum: {
            $cond: [
              { $gte: ['$joinedAt', new Date(Date.now() - 24 * 60 * 60 * 1000)] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  return stats.length > 0 ? stats[0] : {
    total: 0,
    pending: 0,
    confirmed: 0,
    recent24h: 0
  };
};

WaitlistSchema.statics.countRecentSignupsFromIP = function(ipAddress, hours = 24) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.countDocuments({
    ipAddress: ipAddress,
    joinedAt: { $gte: cutoff }
  });
};

// Instance methods
WaitlistSchema.methods.confirm = function() {
  this.status = 'confirmed';
  this.confirmedAt = new Date();
  return this.save();
};

WaitlistSchema.methods.notify = function() {
  this.lastNotified = new Date();
  if (this.status === 'confirmed') {
    this.status = 'notified';
  }
  return this.save();
};

WaitlistSchema.methods.getSafeData = function() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    position: this.position,
    status: this.status,
    source: this.source,
    joinedAt: this.joinedAt,
    confirmedAt: this.confirmedAt
  };
};

// Virtual for days since joining
WaitlistSchema.virtual('daysSinceJoining').get(function() {
  return Math.floor((Date.now() - this.joinedAt) / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Waitlist', WaitlistSchema);