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

// Contact form schema
const ContactSchema = new mongoose.Schema({
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
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [100, 'Subject must be less than 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters'],
    maxlength: [1000, 'Message must be less than 1000 characters']
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['new', 'read', 'replied'],
    default: 'new'
  }
}, {
  timestamps: true
});

ContactSchema.index({ createdAt: -1 });
ContactSchema.index({ status: 1 });

const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);

/**
 * Connect to MongoDB using provided URI.
 */
async function connectDB(uri) {
  if (!uri) {
    console.error('❌ MONGODB_URI not provided');
    process.exit(1);
  }
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      retryWrites: true
    });
    console.log('✅ Connected to MongoDB successfully');
    return true;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    if (err.name === 'MongoServerSelectionError') {
      console.error('💡 Check if MongoDB is running and URI is correct');
    }
    throw err; // Don't exit, let the caller handle it
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
 * Count entries from a specific IP within the last sinceMs milliseconds.
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

/**
 * Insert a new contact form entry.
 */
async function insertContactEntry({ name, email, subject, message, ipAddress, userAgent }) {
  const entry = new Contact({
    name,
    email,
    subject,
    message,
    ipAddress,
    userAgent
  });
  return entry.save();
}

/**
 * Count contact entries from a specific IP within the last sinceMs milliseconds.
 */
async function countContactsByIP(ipAddress, sinceMs = 24 * 60 * 60 * 1000) {
  return Contact.countDocuments({
    ipAddress,
    createdAt: { $gte: new Date(Date.now() - sinceMs) }
  });
}

module.exports = {
  connectDB,
  insertWaitlistEntry,
  countWaitlist,
  countRecentByIP,
  findByEmail,
  getStats,
  insertContactEntry,
  countContactsByIP
};