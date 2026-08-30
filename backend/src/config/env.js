const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/challaa',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'challaa_jwt_access_secret_default_key',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'challaa_jwt_refresh_secret_default_key',
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
