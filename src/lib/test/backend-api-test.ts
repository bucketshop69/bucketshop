/**
 * Backend API Integration Test
 * Test with real wallet and token data
 */

import { TokenService } from '../services/token.service';
import { WatchlistService } from '../services/watchlist.service';
import { JupiterClient } from '../api/jupiter.client';
import { TimeInterval } from '@/types/token';

// Real test data
const TEST_WALLET = '7EHgQpahjYzu8qCShiSW3jFpLnmoZNosMi9hVQp1mEsj';
const TEST_TOKEN = 'CDBdbNqmrLu1PcgjrFG52yxg71QnFhBZcUE6PSFdbonk';

async function testBackendSystem() {
  console.log('🚀 Testing Backend System with Real Data...\n');
  console.log(`Wallet: ${TEST_WALLET}`);
  console.log(`Token: ${TEST_TOKEN}\n`);

  try {
    // === TEST 1: Jupiter API Integration ===
    console.log('--- Test 1: Jupiter API Integration ---');
    
    console.log('1.1 Testing Jupiter token metadata...');
    const tokenMetadata = await JupiterClient.fetchTokenMetadata(TEST_TOKEN);
    if (tokenMetadata) {
      console.log('✅ Token metadata:', {
        symbol: tokenMetadata.symbol,
        name: tokenMetadata.name,
        decimals: tokenMetadata.decimals,
        hasIcon: !!tokenMetadata.icon
      });
    } else {
      console.log('❌ No token metadata found');
    }

    console.log('\n1.2 Testing Jupiter pool data...');
    const poolData = await JupiterClient.fetchPoolData(TEST_TOKEN);
    console.log(`✅ Found ${poolData.length} pools`);
    if (poolData.length > 0) {
      const firstPool = poolData[0];
      console.log(`   Primary pool: ${firstPool.dex} (ID: ${firstPool.id})`);
      console.log(`   Liquidity: $${firstPool.liquidity?.toLocaleString()}`);
    }

    // === TEST 2: Token Service Integration ===
    console.log('\n--- Test 2: Token Service Integration ---');
    
    console.log('2.1 Testing getOrFetchToken...');
    const token = await TokenService.getOrFetchToken(TEST_TOKEN);
    console.log('✅ Token stored:', {
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      lastUpdated: token.lastUpdated.toISOString()
    });

    console.log('\n2.2 Testing token pools storage...');
    const pools = await TokenService.getTokenPools(TEST_TOKEN);
    console.log(`✅ Stored ${pools.length} pools`);
    pools.forEach((pool, index) => {
      console.log(`   ${index + 1}. ${pool.dex} - ${pool.isPrimary ? 'PRIMARY' : 'SECONDARY'}`);
    });

    // === TEST 3: Price Data ===
    console.log('\n--- Test 3: Price Data & OHLC ---');
    
    console.log('3.1 Testing current price...');
    const currentPrice = await TokenService.getCurrentPrice(TEST_TOKEN);
    if (currentPrice) {
      console.log(`✅ Current price: $${currentPrice.toFixed(6)}`);
    } else {
      console.log('❌ No current price available');
    }

    console.log('\n3.2 Testing OHLC data...');
    const ohlcData = await TokenService.getTokenOHLCVData(TEST_TOKEN, TimeInterval.ONE_HOUR, 24);
    console.log(`✅ Retrieved ${ohlcData.length} hourly candles`);
    if (ohlcData.length > 0) {
      const latest = ohlcData[0];
      console.log(`   Latest candle: O:$${latest.open.toFixed(6)} H:$${latest.high.toFixed(6)} L:$${latest.low.toFixed(6)} C:$${latest.close.toFixed(6)}`);
      console.log(`   Volume: ${latest.volume.toLocaleString()}`);
      console.log(`   Time: ${latest.utcTime}`);
    }

    // === TEST 4: RSI Calculation ===
    console.log('\n--- Test 4: RSI Calculation ---');
    
    console.log('4.1 Testing RSI calculation...');
    const rsiData = await TokenService.calculateRSI(TEST_TOKEN, 14, TimeInterval.ONE_HOUR);
    if (rsiData) {
      console.log(`✅ RSI calculated with ${rsiData.values.length} values`);
      const currentRSI = rsiData.values[rsiData.values.length - 1];
      console.log(`   Current RSI(14): ${currentRSI.toFixed(2)}`);
      
      // Interpret RSI
      let interpretation = 'Neutral';
      if (currentRSI >= 70) interpretation = currentRSI >= 80 ? 'Strongly Overbought' : 'Overbought';
      else if (currentRSI <= 30) interpretation = currentRSI <= 20 ? 'Strongly Oversold' : 'Oversold';
      console.log(`   Interpretation: ${interpretation}`);
    } else {
      console.log('❌ RSI calculation failed');
    }

    console.log('\n4.2 Testing quick RSI...');
    const quickRSI = await TokenService.getCurrentRSI(TEST_TOKEN);
    if (quickRSI !== null) {
      console.log(`✅ Quick RSI: ${quickRSI.toFixed(2)}`);
    } else {
      console.log('❌ Quick RSI failed');
    }

    // === TEST 5: Watchlist Operations ===
    console.log('\n--- Test 5: Watchlist Operations ---');
    
    console.log('5.1 Testing add to watchlist...');
    try {
      const watchlistItem = await WatchlistService.addTokenToWatchlist({
        tokenAddress: TEST_TOKEN,
        walletAddress: TEST_WALLET,
        userNotes: 'Test token added via backend test'
      });
      console.log('✅ Added to watchlist:', {
        id: watchlistItem.id,
        symbol: watchlistItem.tokenInfo.symbol,
        dateAdded: watchlistItem.dateAdded.toISOString(),
        poolsCount: watchlistItem.pools.length
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        console.log('⚠️  Token already in watchlist');
      } else {
        console.log('❌ Error adding to watchlist:', error);
      }
    }

    console.log('\n5.2 Testing get user watchlist...');
    const watchlist = await WatchlistService.getUserWatchlist(TEST_WALLET);
    console.log(`✅ Retrieved watchlist: ${watchlist.length} tokens`);
    watchlist.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.tokenInfo.symbol} - ${item.tokenInfo.name}`);
      console.log(`      Added: ${item.dateAdded.toLocaleDateString()}`);
      console.log(`      Pools: ${item.pools.length}`);
      console.log(`      Notes: ${item.userNotes || 'None'}`);
    });

    // === TEST 6: Market Data Integration ===
    console.log('\n--- Test 6: Market Data Integration ---');
    
    console.log('6.1 Testing comprehensive token data...');
    const tokenWithMarketData = await TokenService.getTokenWithMarketData(TEST_TOKEN);
    if (tokenWithMarketData) {
      console.log('✅ Comprehensive data:', {
        symbol: tokenWithMarketData.symbol,
        name: tokenWithMarketData.name,
        currentPrice: tokenWithMarketData.currentPrice?.toFixed(6),
        rsi14: tokenWithMarketData.rsi14?.toFixed(2),
        marketCap: tokenWithMarketData.marketCap?.toLocaleString()
      });
    } else {
      console.log('❌ Failed to get comprehensive data');
    }

    console.log('\n6.2 Testing bulk market data...');
    const watchlistTokens = watchlist.map(item => item.tokenAddress);
    if (watchlistTokens.length > 0) {
      const bulkData = await TokenService.getBulkMarketData(watchlistTokens);
      console.log(`✅ Bulk data for ${Object.keys(bulkData).length} tokens`);
      Object.entries(bulkData).forEach(([address, data]) => {
        const token = watchlist.find(item => item.tokenAddress === address);
        console.log(`   ${token?.tokenInfo.symbol}: Price: $${data.currentPrice?.toFixed(6) || 'N/A'}, RSI: ${data.rsi14?.toFixed(2) || 'N/A'}`);
      });
    } else {
      console.log('⚠️  No tokens in watchlist for bulk test');
    }

    // === TEST 7: Cache Performance ===
    console.log('\n--- Test 7: Cache Performance ---');
    
    console.log('7.1 Testing cache stats...');
    const cacheStats = JupiterClient.getCacheStats();
    console.log(`✅ Cache contains ${cacheStats.size} entries`);
    console.log(`   Cache keys: ${cacheStats.keys.slice(0, 3).join(', ')}${cacheStats.keys.length > 3 ? '...' : ''}`);

    console.log('\n7.2 Testing cached vs fresh call...');
    const start1 = Date.now();
    await TokenService.getCurrentPrice(TEST_TOKEN);
    const cached = Date.now() - start1;
    
    JupiterClient.clearCache();
    const start2 = Date.now();
    await TokenService.getCurrentPrice(TEST_TOKEN);
    const fresh = Date.now() - start2;
    
    console.log(`✅ Cached call: ${cached}ms, Fresh call: ${fresh}ms`);
    console.log(`   Performance improvement: ${fresh > cached ? `${((fresh - cached) / fresh * 100).toFixed(1)}%` : 'N/A'}`);

    console.log('\n🎉 Backend system test complete!');
    console.log('\n📊 Summary:');
    console.log(`   ✅ Jupiter API integration working`);
    console.log(`   ✅ Token registry with ${pools.length} pools`);
    console.log(`   ✅ Price data: $${currentPrice?.toFixed(6) || 'N/A'}`);
    console.log(`   ✅ RSI calculation: ${quickRSI?.toFixed(2) || 'N/A'}`);
    console.log(`   ✅ Watchlist: ${watchlist.length} tokens`);
    console.log(`   ✅ Cache: ${cacheStats.size} entries`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for manual testing
export { testBackendSystem };

// If running directly with Node.js
if (require.main === module) {
  testBackendSystem().catch(console.error);
}