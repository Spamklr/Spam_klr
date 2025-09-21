/**
 * Database Configuration
 * Handles MongoDB connection with proper error handling and logging
 */

const mongoose = require('mongoose');

class DatabaseConfig {
  constructor() {
    this.connection = null;
    this.connectionOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    };
  }

  async connect() {
    try {
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not defined');
      }

      this.connection = await mongoose.connect(
        process.env.MONGODB_URI,
        this.connectionOptions
      );

      console.log('✅ Connected to MongoDB Atlas successfully');
      
      // Set up connection event listeners
      this.setupEventListeners();
      
      return this.connection;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  setupEventListeners() {
    const db = mongoose.connection;

    db.on('error', (error) => {
      console.error('MongoDB connection error:', error);
    });

    db.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    db.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  async disconnect() {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed gracefully');
    } catch (error) {
      console.error('Error during MongoDB disconnection:', error);
    }
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }

  getConnectionState() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    return states[mongoose.connection.readyState] || 'unknown';
  }
}

module.exports = new DatabaseConfig();