// Client API endpoint for market data
// This is called by React components to get fresh market data from Redis cache
// If cache is empty, automatically fetches fresh data from Drift API

import { NextResponse } from 'next/server';
import { redis, redisHelpers, type MarketData } from '@/lib/redis';
import { driftApiService } from '@/lib/drift/api-service';

// Response interface for type safety
interface MarketsResponse {
  success: boolean;
  markets: MarketData[];
  lastUpdated: number | null;
  count: number;
  cacheAge?: number;
  message?: string;
  refreshed?: boolean; // Indicates if data was freshly fetched from Drift API
}

interface ErrorResponse {
  success: false;
  error: string;
  markets: [];
  count: 0;
  lastUpdated: null;
  message: string;
}

// Validate market data structure
function validateMarketData(data: unknown): data is MarketData {
  if (!data || typeof data !== 'object') return false;
  
  const market = data as Record<string, unknown>;
  return (
    typeof market.symbol === 'string' &&
    typeof market.displayName === 'string' &&
    (market.price === null || typeof market.price === 'number') &&
    (market.priceChange24h === null || typeof market.priceChange24h === 'number') &&
    typeof market.quoteVolume === 'number' &&
    typeof market.baseVolume === 'number' &&
    typeof market.marketIndex === 'number' &&
    typeof market.marketType === 'string' &&
    typeof market.openInterest === 'number' &&
    typeof market.lastUpdated === 'number'
  );
}

// Calculate data freshness in seconds
function calculateCacheAge(lastUpdated: number | null): number | undefined {
  if (!lastUpdated) return undefined;
  return Math.floor((Date.now() - lastUpdated) / 1000);
}

// Auto-refresh market data from Drift API when Redis is empty
async function fetchAndCacheMarkets(): Promise<MarketData[]> {
  console.log('🔄 Redis cache empty - fetching fresh data from Drift API...');
  
  try {
    // Health check Drift API first
    const isHealthy = await driftApiService.healthCheck();
    if (!isHealthy) {
      throw new Error('Drift API health check failed');
    }
    
    // Fetch fresh market data
    const marketData = await driftApiService.getAllMarketData();
    
    if (marketData.length === 0) {
      console.warn('⚠️ Drift API returned no market data');
      return [];
    }
    
    // Store fresh data in Redis using pipeline
    const pipeline = redis.pipeline();
    const timestamp = Date.now();
    
    // Store each market's data with 5-minute TTL
    for (const market of marketData) {
      const marketKey = `drift:market:${market.symbol}`;
      pipeline.setex(marketKey, 300, JSON.stringify(market));
    }
    
    // Store metadata
    pipeline.set('drift:last_update', timestamp);
    pipeline.setex('drift:markets_count', 300, marketData.length);
    
    // Execute all Redis operations
    await pipeline.exec();
    
    console.log(`✅ Fresh market data cached - ${marketData.length} markets updated`);
    
    return marketData;
    
  } catch (error) {
    console.error('❌ Failed to fetch fresh market data:', error);
    throw error;
  }
}

// Main GET handler with backend-first auto-refresh logic
export async function GET(): Promise<NextResponse<MarketsResponse | ErrorResponse>> {
  const startTime = Date.now();
  let refreshed = false;
  
  try {
    // Step 1: Try to get market data from Redis
    let marketData = await redisHelpers.getAllMarketData();
    let lastUpdated = await redisHelpers.getLastUpdate();
    
    // Step 2: Backend-first logic - if cache is empty, auto-refresh
    if (marketData.length === 0) {
      try {
        console.log('🔄 Auto-refreshing market data (Redis cache empty)');
        marketData = await fetchAndCacheMarkets();
        lastUpdated = Date.now(); // Fresh timestamp
        refreshed = true;
      } catch (refreshError) {
        console.error('❌ Auto-refresh failed:', refreshError);
        // Continue with empty data rather than crash
        // GitHub Actions will eventually populate the cache
      }
    }
    
    // Step 3: Validate data quality
    const validMarkets = marketData.filter(validateMarketData);
    
    if (validMarkets.length !== marketData.length) {
      const invalidCount = marketData.length - validMarkets.length;
      console.warn(`⚠️ Filtered out ${invalidCount} invalid market records`);
    }
    
    // Step 4: Check data freshness
    const cacheAge = calculateCacheAge(lastUpdated);
    const isStale = cacheAge && cacheAge > 300; // 5 minutes
    
    if (isStale && !refreshed) {
      console.warn(`⚠️ Market data is ${cacheAge} seconds old`);
    }
    
    // Step 5: Sort markets by volume (most active first)
    const sortedMarkets = validMarkets.sort((a, b) => b.quoteVolume - a.quoteVolume);
    
    const duration = Date.now() - startTime;
    
    // Step 6: Create success response
    const response: MarketsResponse = {
      success: true,
      markets: sortedMarkets,
      lastUpdated,
      count: sortedMarkets.length,
      cacheAge,
      refreshed,
      message: refreshed 
        ? `${sortedMarkets.length} markets fetched fresh from Drift API`
        : sortedMarkets.length > 0 
          ? `${sortedMarkets.length} markets loaded from cache`
          : 'No market data available'
    };
    
    // Step 7: Set appropriate cache headers
    const headers = new Headers({
      'Content-Type': 'application/json',
      // Shorter cache time if data was refreshed to encourage real-time updates
      'Cache-Control': refreshed 
        ? 'public, s-maxage=10, stale-while-revalidate=30'
        : 'public, s-maxage=30, stale-while-revalidate=60',
      'X-Markets-Count': sortedMarkets.length.toString(),
      'X-Last-Updated': lastUpdated?.toString() || '0',
      'X-Response-Time': `${duration}ms`,
      'X-Data-Source': refreshed ? 'drift-api' : 'redis-cache'
    });
    
    return NextResponse.json(response, { headers });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('❌ Failed to fetch market data:', error);
    
    // Return error response
    const errorResponse: ErrorResponse = {
      success: false,
      error: errorMessage,
      markets: [],
      count: 0,
      lastUpdated: null,
      message: 'Failed to load market data'
    };
    
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Error': 'true',
      'X-Response-Time': `${duration}ms`,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    
    return NextResponse.json(errorResponse, { 
      status: 500,
      headers 
    });
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}

// Development helper - GET with query params for debugging
export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoint not available in production' },
      { status: 404 }
    );
  }
  
  try {
    // Get debug info
    const updateStatus = await redisHelpers.getUpdateStatus();
    const lastUpdate = await redisHelpers.getLastUpdate();
    const healthCheck = await redisHelpers.healthCheck();
    
    // Get sample market data
    const allMarkets = await redisHelpers.getAllMarketData();
    const sampleMarket = allMarkets[0] || null;
    
    const debugInfo = {
      redis: {
        healthy: healthCheck,
        connected: true
      },
      data: {
        lastUpdate,
        updateStatus,
        totalMarkets: allMarkets.length,
        sampleMarket
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasRedisUrl: !!process.env.UPSTASH_REDIS_REST_URL,
        hasRedisToken: !!process.env.UPSTASH_REDIS_REST_TOKEN
      },
      timestamp: Date.now()
    };
    
    return NextResponse.json(debugInfo, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Debug info failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}