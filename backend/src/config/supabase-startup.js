const supabase = require('./supabase');
const logger = require('../utils/logger');

const BUCKET_NAME = 'uploads';

async function verifySupabaseBucket() {
  try {
    logger.info('[supabase] Verifying storage buckets...');
    // The listBuckets method is deprecated. Use from('*').list() instead.
    const { data: buckets, error: listError } = await supabase.storage.from('*').list();

    if (listError) {
      const errorMessage = `[supabase] FATAL: Could not list storage buckets. Is the service key correct and the service running? ${listError.message}`;
      logger.error(errorMessage);
      if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
      } else {
        throw new Error(errorMessage);
      }
    }
    
    logger.info('[supabase] Buckets listed successfully.');

    const bucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME);

    if (bucketExists) {
      logger.info(`[supabase] Storage bucket "${BUCKET_NAME}" is ready.`);
    } else {
      logger.warn(`[supabase] Storage bucket "${BUCKET_NAME}" not found. Attempting to create it...`);
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
      });

      if (createError) {
        const errorMessage = `[supabase] FATAL: Failed to create bucket "${BUCKET_NAME}": ${createError.message}`;
        logger.error(errorMessage);
        if (process.env.NODE_ENV !== 'test') {
          process.exit(1);
        } else {
          throw new Error(errorMessage);
        }
      }
      logger.info(`[supabase] Bucket "${BUCKET_NAME}" created successfully.`);
    }
    logger.info('[supabase] Bucket verification complete.');
  } catch (err) {
    const errorMessage = `[supabase] FATAL: A critical error occurred during Supabase initialization: ${err}`;
    logger.error(errorMessage);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    } else {
      throw new Error(errorMessage);
    }
  }
}

module.exports = { verifySupabaseBucket };
