// business/business.js
// Business rules & domain logic. Uses persistence layer.

const {
  insertWaitlistEntry,
  countWaitlist,
  countRecentByIP,
  findByEmail,
  getStats,
  insertContactEntry,
  countContactsByIP
} = require('../persistence/persistence');

class BusinessError extends Error {
  constructor(message, code = 'BUSINESS_ERROR') {
    super(message);
    this.name = 'BusinessError';
    this.code = code;
  }
}

/**
 * Add a user to the waitlist enforcing business rules:
 * - Name/email sanity checks
 * - waitlist capacity
 * - duplicate email prevention
 * - per-IP signup limit
 */
async function addToWaitlist({ name, email, ipAddress = 'unknown', userAgent = 'unknown' }) {
  if (!name || String(name).trim().length < 2) {
    throw new BusinessError('Name must be at least 2 characters', 'INVALID_NAME');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BusinessError('Please enter a valid email address', 'INVALID_EMAIL');
  }

  const maxEntries = parseInt(process.env.MAX_WAITLIST_ENTRIES, 10) || 10000;
  const currentCount = await countWaitlist();
  if (currentCount >= maxEntries) {
    throw new BusinessError('Waitlist Full: Capacity reached.', 'WAITLIST_FULL');
  }

  // duplicate check
  const existing = await findByEmail(email);
  if (existing) {
    throw new BusinessError('This email is already on our waitlist. We will notify you.', 'DUPLICATE_EMAIL');
  }

  // per-IP throttle (default 3 per 24h)
  const ipLimit = parseInt(process.env.MAX_SIGNUPS_PER_IP_24H, 10) || 3;
  const recentFromIP = await countRecentByIP(ipAddress);
  if (recentFromIP >= ipLimit) {
    throw new BusinessError('Too many signups from your location. Please try again tomorrow.', 'IP_RATE_LIMIT');
  }

  try {
    const entry = await insertWaitlistEntry({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      ipAddress,
      userAgent
    });
    return { entry, position: currentCount + 1 };
  } catch (err) {
    // Handle race-condition duplicate key
    if (err && (err.code === 11000 || (err.name === 'MongoServerError' && err.code === 11000))) {
      throw new BusinessError('This email is already on our waitlist.', 'DUPLICATE_EMAIL');
    }
    throw err;
  }
}

async function getWaitlistStats() {
  const raw = await getStats();
  return {
    totalSignups: raw.total,
    recentSignups24h: raw.recent,
    capacity: parseInt(process.env.MAX_WAITLIST_ENTRIES, 10) || 10000,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Add a contact form submission with business rules:
 * - Input validation
 * - per-IP rate limiting
 */
async function addContactSubmission({ name, email, subject, message, ipAddress = 'unknown', userAgent = 'unknown' }) {
  if (!name || String(name).trim().length < 2) {
    throw new BusinessError('Name must be at least 2 characters', 'INVALID_NAME');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BusinessError('Please enter a valid email address', 'INVALID_EMAIL');
  }
  if (!subject || String(subject).trim().length < 3) {
    throw new BusinessError('Subject must be at least 3 characters', 'INVALID_SUBJECT');
  }
  if (!message || String(message).trim().length < 10) {
    throw new BusinessError('Message must be at least 10 characters', 'INVALID_MESSAGE');
  }

  // per-IP throttle for contact form (default 5 per 24h)
  const ipLimit = parseInt(process.env.MAX_CONTACTS_PER_IP_24H, 10) || 5;
  const recentFromIP = await countContactsByIP(ipAddress);
  if (recentFromIP >= ipLimit) {
    throw new BusinessError('Too many contact submissions from your location. Please try again tomorrow.', 'IP_RATE_LIMIT');
  }

  try {
    const entry = await insertContactEntry({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      subject: subject.trim(),
      message: message.trim(),
      ipAddress,
      userAgent
    });
    return { entry };
  } catch (err) {
    throw err;
  }
}

module.exports = { addToWaitlist, getWaitlistStats, addContactSubmission, BusinessError };
