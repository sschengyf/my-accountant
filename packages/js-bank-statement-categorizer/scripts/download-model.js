const { pipeline, env } = require('@xenova/transformers');

env.cacheDir = '/app/.cache';

console.log('Downloading Xenova/all-MiniLM-L6-v2...');
pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
  .then(() => {
    console.log('Model downloaded successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed to download model:', err);
    process.exit(1);
  });
