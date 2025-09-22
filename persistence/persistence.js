// persistence/persistence.js
// MongoDB connection + Mongoose Waitlist model + DB helpers

const mongoose = require('mongoose');

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
  }
}, {
  timestamps: true
});

WaitlistSchema.index({ ipAddress: 1 });

const Waitlist = mongoose.models.Waitlist || mongoose.model('Waitlist', WaitlistSchema);

/**
 * Connect to MongoDB using provided URI.
 */
async function connectDB(uri) {
  if (!uri) {
    console.error('MONGODB_URI not provided');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

/**
 * Insert a new waitlist entry.
 */
async function insertWaitlistEntry({ name, email, ipAddress, userAgent }) {
  const entry = new Waitlist({
    name,
    email,
    ipAddress,
    userAgent
  });
  return entry.save();
}

/**
 * Count total waitlist entries.
 */
async function countWaitlist() {
  return Waitlist.countDocuments();
}

/**
 * Count entries from a specific IP within the last `sinceMs` milliseconds.
 */
async function countRecentByIP(ipAddress, sinceMs = 24 * 60 * 60 * 1000) {
  return Waitlist.countDocuments({
    ipAddress,
    joinedAt: { $gte: new Date(Date.now() - sinceMs) }
  });
}

/**
 * Find an entry by email.
 */
async function findByEmail(email) {
  return Waitlist.findOne({ email: (email || '').toLowerCase().trim() });
}

/**
 * Get basic stats: total & recent (24h)
 */
async function getStats() {
  const total = await Waitlist.countDocuments();
  const recent = await Waitlist.countDocuments({
    joinedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });
  return { total, recent };
}

module.exports = {
  connectDB,
  insertWaitlistEntry,
  countWaitlist,
  countRecentByIP,
  findByEmail,
  getStats
};
