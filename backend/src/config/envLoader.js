// Centralized environment loader & validator
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Resolve .env explicitly relative to backend root
const ENV_PATH = path.join(__dirname, '..', '..', '.env');
if (fs.existsSync(ENV_PATH)) {
  dotenv.config({ path: ENV_PATH });
} else {
  console.warn('[envLoader] .env file not found at', ENV_PATH);
}

const REQUIRED = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missing = REQUIRED.filter(k => !process.env[k] || process.env[k].trim() === '');
if (missing.length) {
  console.error('[envLoader] Missing required env vars:', missing.join(', '));
}

// Export sanitized config object
const env = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10)
};

module.exports = { env, missing };
