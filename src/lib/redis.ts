import { Redis } from '@upstash/redis';

// Redis client for serverless deployment
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Redis key naming conventions for organized data structure
export const redisKeys = {
  // Market data keys
  market: (symbol: string) => `drift:market:${symbol}`,
  allMarkets: 'drift:markets:all',
  
  // Metadata keys
  lastUpdate: 'drift:last_update',
  updateStatus: 'drift:update_status',
  
  // Volume data keys
  volume24h: 'drift:volume:24h',
  volume1h: 'drift:volume:1h',
  
  // Open interest keys
  openInterest: (symbol: string) => `drift:oi:${symbol}`,
  
  // Health check keys
  healthCheck: 'drift:health',
} as const;

// TypeScript interfaces for type safety
export interface MarketData {
  symbol: string;
  displayName: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  openInterest: number;
  lastUpdated: number;
}

export interface VolumeData {
  symbol: string;
  volume24h: number;
  volume1h: number;
  volumeChange24h: number;
}

export interface OpenInterestData {
  symbol: string;
  openInterest: number;
  timestamp: number;
}

export interface UpdateStatus {
  isUpdating: boolean;
  lastAttempt: number;
  lastSuccess: number;
  errorCount: number;
  lastError?: string;
}

// Redis helper functions for common operations
export const redisHelpers = {
  // Set market data with TTL (2 minutes safety buffer)
  setMarketData: async (symbol: string, data: MarketData) => {
    return redis.setex(redisKeys.market(symbol), 120, JSON.stringify(data));
  },

  // Get single market data
  getMarketData: async (symbol: string): Promise<MarketData | null> => {
    const data = await redis.get(redisKeys.market(symbol));
    return data ? JSON.parse(data as string) : null;
  },

  // Get all market data
  getAllMarketData: async (): Promise<MarketData[]> => {
    const keys = await redis.keys('drift:market:*');
    if (keys.length === 0) return [];
    
    const marketDataArray = await redis.mget(...keys);
    return marketDataArray
      .map(data => data ? JSON.parse(data as string) : null)
      .filter((data): data is MarketData => data !== null);
  },

  // Set update status
  setUpdateStatus: async (status: UpdateStatus) => {
    return redis.setex(redisKeys.updateStatus, 300, JSON.stringify(status));
  },

  // Get update status
  getUpdateStatus: async (): Promise<UpdateStatus | null> => {
    const data = await redis.get(redisKeys.updateStatus);
    return data ? JSON.parse(data as string) : null;
  },

  // Set last update timestamp
  setLastUpdate: async (timestamp: number = Date.now()) => {
    return redis.set(redisKeys.lastUpdate, timestamp);
  },

  // Get last update timestamp
  getLastUpdate: async (): Promise<number | null> => {
    const timestamp = await redis.get(redisKeys.lastUpdate);
    return timestamp ? parseInt(timestamp as string) : null;
  },

  // Health check - test Redis connectivity
  healthCheck: async (): Promise<boolean> => {
    try {
      await redis.setex(redisKeys.healthCheck, 60, Date.now());
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  },

  // Clear all market data (useful for development/testing)
  clearAllMarketData: async () => {
    const keys = await redis.keys('drift:market:*');
    if (keys.length > 0) {
      return redis.del(...keys);
    }
    return 0;
  },
} as const;