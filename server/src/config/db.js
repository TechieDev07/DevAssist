'use strict';

const mongoose = require('mongoose');

let isConnected = false;

const connect = async () => {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set.');
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  isConnected = true;
  console.log(`[db] Connected to MongoDB: ${mongoose.connection.host}`);
};

mongoose.connection.on('disconnected', () => {
  console.warn('[db] MongoDB disconnected');
  isConnected = false;
});

mongoose.connection.on('error', (err) => {
  console.error('[db] MongoDB error:', err.message);
});

module.exports = { connect };
