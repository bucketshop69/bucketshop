#!/usr/bin/env node

// Script to generate a secure CRON_SECRET for Vercel cron authentication
// Run with: node scripts/generate-cron-secret.js

const crypto = require('crypto');

function generateSecureSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function main() {
  const secret = generateSecureSecret();
  
  console.log('🔐 Generated secure CRON_SECRET:');
  console.log('');
  console.log(`CRON_SECRET=${secret}`);
  console.log('');
  console.log('📝 Instructions:');
  console.log('1. Add this to your .env.local file');
  console.log('2. Add this to your Vercel dashboard environment variables');
  console.log('3. Redeploy your application');
  console.log('');
  console.log('🚀 Vercel Dashboard:');
  console.log('   Settings > Environment Variables > Add New');
  console.log('   Key: CRON_SECRET');
  console.log(`   Value: ${secret}`);
  console.log('');
}

if (require.main === module) {
  main();
}