const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 5000,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "replace_this_secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  ADMIN_SYNC_KEY: process.env.ADMIN_SYNC_KEY || "change_this_sync_key",
};
