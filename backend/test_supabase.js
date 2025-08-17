require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key length:', supabaseKey.length);

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    console.log('Attempting to list buckets...');
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('Error listing buckets:', error);
      return;
    }
    console.log('Successfully listed buckets:', data);
  } catch (e) {
    console.error('Caught exception:', e);
  }
}

test();
