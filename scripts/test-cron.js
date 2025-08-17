#!/usr/bin/env node

// Script to test the cron endpoint manually
// Run with: node scripts/test-cron.js

const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.join(__dirname, '..', '.env.local') });

async function testCronEndpoint() {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
    
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('❌ CRON_SECRET not found in environment variables');
    return;
  }
  
  const url = `${baseUrl}/api/drift/cron/update-markets`;
  
  console.log('🧪 Testing cron endpoint...');
  console.log(`📍 URL: ${url}`);
  console.log(`🔐 Secret: ${cronSecret.substring(0, 8)}...`);
  console.log('');
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log(`📊 Status: ${response.status} ${response.ok ? '✅' : '❌'}`);
    console.log('📋 Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('');
      console.log('🎉 Cron endpoint test successful!');
      console.log(`📈 Markets updated: ${data.marketsUpdated || 0}`);
      console.log(`⏱️  Duration: ${data.duration || 0}ms`);
    } else {
      console.log('');
      console.log('❌ Cron endpoint test failed');
      console.log(`🔍 Error: ${data.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('');
    console.log('💡 Make sure:');
    console.log('   1. Your development server is running (npm run dev)');
    console.log('   2. Redis credentials are configured in .env.local');
    console.log('   3. CRON_SECRET is set correctly');
  }
}

// Test health endpoint as well
async function testHealthEndpoint() {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
    
  const url = `${baseUrl}/api/drift/cron/update-markets`;
  
  console.log('');
  console.log('🩺 Testing health endpoint...');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log(`📊 Health Status: ${response.status} ${data.healthy ? '✅' : '❌'}`);
    console.log('🔍 Components:');
    
    if (data.components) {
      console.log(`   Redis: ${data.components.redis ? '✅' : '❌'}`);
      console.log(`   Drift API: ${data.components.driftApi ? '✅' : '❌'}`);
      console.log(`   Last Update: ${data.components.lastUpdate ? new Date(data.components.lastUpdate).toLocaleString() : 'Never'}`);
    }
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
}

async function main() {
  await testCronEndpoint();
  await testHealthEndpoint();
}

if (require.main === module) {
  main();
}