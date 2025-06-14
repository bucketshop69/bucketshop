/**
 * Simple test script to verify Jupiter API integration
 * Run this to test token fetching without starting the full app
 */

import { TokenService } from '../services/token.service';
import { WatchlistService } from '../services/watchlist.service';

// Test token addresses
const TEST_TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  FARTCOIN: '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump', // From your example
};

async function testJupiterIntegration() {
  console.log('🚀 Testing Jupiter API Integration...\n');

  for (const [symbol, address] of Object.entries(TEST_TOKENS)) {
    console.log(`\n--- Testing ${symbol} (${address}) ---`);
    
    try {
      // Test fetching from Jupiter
      console.log('1. Fetching from Jupiter API...');
      const jupiterData = await TokenService.fetchFromJupiter(address);
      
      if (jupiterData) {
        console.log('✅ Jupiter data received:');
        console.log(`   Token: ${jupiterData.tokenData.symbol} - ${jupiterData.tokenData.name}`);
        console.log(`   Decimals: ${jupiterData.tokenData.decimals}`);
        console.log(`   Pools found: ${jupiterData.poolsData.length}`);
        
        if (jupiterData.poolsData.length > 0) {
          const primaryPool = jupiterData.poolsData[0];
          console.log(`   Primary pool: ${primaryPool.dex} (${primaryPool.id})`);
        }
      } else {
        console.log('❌ No data from Jupiter API');
      }

      // Test storing in our database
      console.log('2. Testing database storage...');
      const token = await TokenService.getOrFetchToken(address);
      console.log(`✅ Token stored: ${token.symbol} - ${token.name}`);
      
      // Test pools
      const pools = await TokenService.getTokenPools(address);
      console.log(`✅ Pools stored: ${pools.length} pools`);

      // Test adding to watchlist
      console.log('3. Testing watchlist integration...');
      try {
        const watchlistItem = await WatchlistService.addTokenToWatchlist({
          tokenAddress: address,
          walletAddress: 'DEMO_WALLET_ADDRESS',
          userNotes: `Test token ${symbol}`,
        });
        console.log(`✅ Added to watchlist: ${watchlistItem.tokenInfo.symbol}`);
      } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
          console.log(`⚠️  Already in watchlist: ${symbol}`);
        } else {
          throw error;
        }
      }

    } catch (error) {
      console.log(`❌ Error testing ${symbol}:`, error instanceof Error ? error.message : error);
    }
  }

  // Test getting full watchlist
  console.log('\n--- Testing Full Watchlist ---');
  try {
    const watchlist = await WatchlistService.getUserWatchlist();
    console.log(`✅ Watchlist retrieved: ${watchlist.length} tokens`);
    
    watchlist.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.tokenInfo.symbol} - ${item.tokenInfo.name}`);
      console.log(`      Pools: ${item.pools.length}, Added: ${item.dateAdded.toLocaleDateString()}`);
    });
  } catch (error) {
    console.log('❌ Error getting watchlist:', error instanceof Error ? error.message : error);
  }

  console.log('\n🎉 Jupiter API integration test complete!');
}

// Export for manual testing
export { testJupiterIntegration };

// If running directly with Node.js
if (require.main === module) {
  testJupiterIntegration().catch(console.error);
}