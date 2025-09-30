// Deprecated: BullMQ worker replaced by n8n workflow. This module is kept for reference and should not be used.
import { processSubtitleJob } from './processSubtitleJob';

// Validate required environment variables
function validateEnv() {
  const required = [
    'REDIS_URL',
    'R2_ENDPOINT',
    'R2_BUCKET_NAME', 
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'OPENAI_API_KEY',
    'DATABASE_URL'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`WORKER_ENV_MISSING: Missing required environment variables: ${missing.join(', ')}`);
  }
}

async function startWorker() {
  try {
    // Validate environment
    validateEnv();
    
    console.log('[WORKER] Deprecated: BullMQ worker disabled. Use n8n workflow instead.');
    
  } catch (error) {
    console.error('[WORKER] Failed to start worker:', error);
    process.exit(1);
  }
}

// Start worker if this file is run directly
if (require.main === module) {
  // No-op
}

export { startWorker };
