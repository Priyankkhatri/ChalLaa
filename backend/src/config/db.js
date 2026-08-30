const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Error] ${error.message}`);
    // Allow app to run in offline/mock mode if DB is not active during unit scaffolding
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
