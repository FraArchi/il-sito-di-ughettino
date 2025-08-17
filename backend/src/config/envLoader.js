// Centralized environment loader & validator
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Resolve .env file based on NODE_ENV
const envFileName = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
const envPath = path.resolve(__dirname, '..', '..', envFileName);

if (fs.existsSync(envPath)) {
  console.log(`[envLoader] Loading environment variables from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.warn(`[envLoader] Environment file not found at ${envPath}`);
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
