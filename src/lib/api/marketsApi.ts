/**
 * Markets API Client - Browser-safe client for consuming Drift market data
 * 
 * This client provides type-safe access to server-side Drift Protocol data
 * through Next.js API routes. All operations are browser-compatible.
 * 
 * Features:
 * - Type-safe API calls to /api/markets
 * - Error handling and retry logic
 * - Caching and data management
 * - Optimistic updates
 */

import { PerpMarketConfig } from '@/components/TradingChart/data/MarketConfig';

/**
 * API Response interfaces
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
  source?: 'cache' | 'api';
  count?: number;
}

export interface HealthCheckData {
  status: 'healthy' | 'unhealthy';
  connection: boolean;
  driftClient: boolean;
  cache: boolean;
  timestamp: number;
}

export interface CacheInfo {
  hasData: boolean;
  timestamp: number;
  age: number;
  timeout: number;
}

/**
 * Extended market data from server
 */
export interface ExtendedMarketData {
  config: PerpMarketConfig;
  displayName: string;
  channelSuffix: string;
  quoteSymbol: string;
  isActive: boolean;
}

/**
 * API Client configuration
 */
interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ApiClientConfig = {
  baseUrl: '/api',
  timeout: 10000, // 10 seconds
  retries: 3,
};

/**
 * Markets API Client
 */
export class MarketsApiClient {
  private config: ApiClientConfig;

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Make API request with error handling and retries
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ApiResponse<T> = await response.json();
      return data;

    } catch (error) {
      console.error(`API request failed (attempt ${retryCount + 1}):`, error);

      // Retry logic
      if (retryCount < this.config.retries && !this.isAbortError(error)) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        await this.delay(delay);
        return this.makeRequest(endpoint, options, retryCount + 1);
      }

      // Return error response
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Check if error is from AbortController
   */
  private isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError';
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get all perpetual markets
   */
  public async getAllMarkets(bypassCache = false): Promise<ApiResponse<PerpMarketConfig[]>> {
    const params = bypassCache ? '?cache=false' : '';
    return this.makeRequest<PerpMarketConfig[]>(`/markets${params}`);
  }

  /**
   * Get specific market by symbol
   */
  public async getMarket(symbol: string): Promise<ApiResponse<PerpMarketConfig>> {
    return this.makeRequest<PerpMarketConfig>(`/markets?symbol=${encodeURIComponent(symbol)}`);
  }

  /**
   * Get extended market data with UI information
   */
  public async getExtendedMarkets(bypassCache = false): Promise<ApiResponse<ExtendedMarketData[]>> {
    const params = new URLSearchParams();
    params.set('extended', 'true');
    if (bypassCache) params.set('cache', 'false');
    
    return this.makeRequest<ExtendedMarketData[]>(`/markets?${params.toString()}`);
  }

  /**
   * Clear server-side cache
   */
  public async clearCache(): Promise<ApiResponse<{ message: string }>> {
    return this.makeRequest<{ message: string }>('/markets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear-cache' }),
    });
  }

  /**
   * Get health check status
   */
  public async healthCheck(): Promise<ApiResponse<HealthCheckData>> {
    return this.makeRequest<HealthCheckData>('/markets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'health-check' }),
    });
  }

  /**
   * Get cache information
   */
  public async getCacheInfo(): Promise<ApiResponse<CacheInfo>> {
    return this.makeRequest<CacheInfo>('/markets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cache-info' }),
    });
  }

  /**
   * Batch operations - get multiple markets efficiently
   */
  public async getMarketsBatch(symbols: string[]): Promise<{ [symbol: string]: PerpMarketConfig | null }> {
    const results: { [symbol: string]: PerpMarketConfig | null } = {};
    
    // For now, make individual requests. Could be optimized with batch endpoint
    const promises = symbols.map(async (symbol) => {
      const response = await this.getMarket(symbol);
      results[symbol] = response.success && response.data ? response.data : null;
    });
    
    await Promise.all(promises);
    return results;
  }

  /**
   * Validate market symbol format
   */
  public isValidSymbol(symbol: string): boolean {
    // Basic validation for Drift perpetual symbols
    const pattern = /^[A-Z0-9]+(-PERP)?$/;
    return pattern.test(symbol.toUpperCase());
  }

  /**
   * Normalize symbol to standard format
   */
  public normalizeSymbol(symbol: string): string {
    const normalized = symbol.toUpperCase();
    return normalized.endsWith('-PERP') ? normalized : `${normalized}-PERP`;
  }
}

/**
 * Singleton API client instance
 */
export const marketsApi = new MarketsApiClient();

/**
 * React hook for markets data (to be implemented)
 */
export interface UseMarketsOptions {
  symbol?: string;
  extended?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * Convenience functions for common operations
 */
export const marketOperations = {
  /**
   * Get BTC-PERP market (most commonly used)
   */
  getBTCPerp: () => marketsApi.getMarket('BTC-PERP'),
  
  /**
   * Get all major markets (BTC, ETH, SOL)
   */
  getMajorMarkets: () => marketsApi.getMarketsBatch(['BTC-PERP', 'ETH-PERP', 'SOL-PERP']),
  
  /**
   * Quick health check
   */
  isHealthy: async (): Promise<boolean> => {
    const response = await marketsApi.healthCheck();
    return response.success && response.data?.status === 'healthy';
  },
  
  /**
   * Get market count
   */
  getMarketCount: async (): Promise<number> => {
    const response = await marketsApi.getAllMarkets();
    return response.count || 0;
  },
};