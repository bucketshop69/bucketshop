// Client API endpoint for market data
// This is called by React components to get fresh market data from Redis cache

import { NextRequest, NextResponse } from 'next/server';
import { redis, redisHelpers, type MarketData } from '@/lib/redis';

// Response interface for type safety
interface MarketsResponse {
  success: boolean;
  markets: MarketData[];
  lastUpdated: number | null;
  count: number;
  cacheAge?: number;
  message?: string;
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
  
  const market = data as any;
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

// Main GET handler
export async function GET(request: NextRequest): Promise<NextResponse<MarketsResponse | ErrorResponse>> {
  const startTime = Date.now();
  
  try {
    // Get all market data from Redis
    const marketData = await redisHelpers.getAllMarketData();
    
    // Get last update timestamp
    const lastUpdated = await redisHelpers.getLastUpdate();
    
    // Validate data quality
    const validMarkets = marketData.filter(validateMarketData);
    
    if (validMarkets.length !== marketData.length) {
      const invalidCount = marketData.length - validMarkets.length;
      console.warn(`⚠️ Filtered out ${invalidCount} invalid market records`);
    }
    
    // Check if data is reasonably fresh (within 5 minutes)
    const cacheAge = calculateCacheAge(lastUpdated);
    const isStale = cacheAge && cacheAge > 300; // 5 minutes
    
    if (isStale) {
      console.warn(`⚠️ Market data is ${cacheAge} seconds old`);
    }
    
    // Sort markets by volume (most active first)
    const sortedMarkets = validMarkets.sort((a, b) => b.quoteVolume - a.quoteVolume);
    
    const duration = Date.now() - startTime;
    
    // Step 6: Create response
    const response: MarketsResponse = {
      success: true,
      markets: sortedMarkets,
      lastUpdated,
      count: sortedMarkets.length,
      cacheAge,
      message: sortedMarkets.length > 0 
        ? `${sortedMarkets.length} markets loaded successfully`
        : 'No market data available'
    };
    
    // Step 7: Set cache headers for client-side caching
    const headers = new Headers({
      'Content-Type': 'application/json',
      // Cache for 30 seconds on client, background refresh for 60 seconds
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      'X-Markets-Count': sortedMarkets.length.toString(),
      'X-Last-Updated': lastUpdated?.toString() || '0',
      'X-Response-Time': `${duration}ms`
    });
    
    return NextResponse.json(response, { headers });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('❌ Failed to fetch market data:', error);
    
    // Return error response but don't crash
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
      // Don't cache error responses
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    
    return NextResponse.json(errorResponse, { 
      status: 500,
      headers 
    });
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
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
export async function POST(request: NextRequest) {
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