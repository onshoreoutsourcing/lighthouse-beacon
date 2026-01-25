/**
 * Download and cache the embedding model for Transformers.js
 * This ensures the model is available for tests and runtime without network delays
 */

import { pipeline, env } from '@xenova/transformers';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure cache directory (same as EmbeddingService)
const cacheDir = join(homedir(), '.cache', 'lighthouse-beacon', 'models');
env.cacheDir = cacheDir;

console.log('🔽 Downloading all-MiniLM-L6-v2 embedding model...');
console.log(`📁 Cache directory: ${cacheDir}`);
console.log('');

async function downloadModel() {
  try {
    console.log('⏳ Initializing pipeline (this will download the model)...');

    // Create a feature-extraction pipeline with the model
    // This will trigger the download
    const extractor = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );

    console.log('✅ Model downloaded successfully!');
    console.log('');
    console.log('🧪 Testing embedding generation...');

    // Test it works
    const testText = 'Hello, world!';
    const embedding = await extractor(testText, {
      pooling: 'mean',
      normalize: true
    });

    console.log(`✅ Generated test embedding: ${embedding.data.length} dimensions`);
    console.log('');
    console.log('✨ Model is ready for use!');
    console.log(`📦 Model cached at: ${cacheDir}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to download model:', error);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Check your internet connection');
    console.error('2. Verify HuggingFace CDN is accessible');
    console.error('3. Try again in a few minutes');
    process.exit(1);
  }
}

downloadModel();
