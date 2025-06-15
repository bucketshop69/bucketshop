import { JupiterTokenData, JupiterPoolData, CandleData, TimeInterval, ChartResponse } from '@/types/token';

// Jupiter API endpoints
const JUPITER_POOLS_API = 'https://datapi.jup.ag/v1/pools';
const JUPITER_CHARTS_API = 'https://datapi.jup.ag/v2/charts';

// Rate limiting and caching
const REQUEST_TIMEOUT = 10000; // 10 seconds
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: any; timestamp: number }>();

/**
 * Jupiter API client for token and pool data
 */
export class JupiterClient {


  /**
   * Fetch pool data from Jupiter
   */
  static async fetchPoolData(tokenAddress: string): Promise<JupiterPoolData[]> {
    const cacheKey = `pools_${tokenAddress}`;

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(`${JUPITER_POOLS_API}?assetIds=${tokenAddress}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BucketShop/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Jupiter pools API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.pools || !Array.isArray(data.pools)) {
        // No pools found - cache empty array
        cache.set(cacheKey, { data: [], timestamp: Date.now() });
        return [];
      }

      // Transform Jupiter pool response to our interface
      const poolsData: JupiterPoolData[] = data.pools.map((pool: any) => ({
        id: pool.id,
        dex: pool.dex || pool.type || 'unknown',
        baseAsset: {
          id: pool.baseAsset?.id || tokenAddress,
          symbol: pool.baseAsset?.symbol || 'UNKNOWN',
          name: pool.baseAsset?.name || 'Unknown Token',
          decimals: pool.baseAsset?.decimals || 6,
          icon: pool.baseAsset?.icon || pool.baseAsset?.logoURI,
          mcap: pool.baseAsset?.mcap || pool.baseAsset?.marketCap,
          totalSupply: pool.baseAsset?.totalSupply,
        },
        quoteAsset: pool.quoteAsset || 'So11111111111111111111111111111111111111112', // Default to SOL
        liquidity: pool.liquidity || 0,
      }));

      // Cache the result
      cache.set(cacheKey, { data: poolsData, timestamp: Date.now() });

      return poolsData;

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.warn(`Jupiter pools API timeout for ${tokenAddress}`);
        } else {
          console.warn(`Jupiter pools API error for ${tokenAddress}:`, error.message);
        }
      }
      return [];
    }
  }

  /**
   * Fetch token data from pools (pools contain token metadata)
   * 
   * LEARNING: Jupiter's pools API returns complete token information
   * in the baseAsset field, so we don't need separate token metadata call
   */
  static async fetchTokenAndPools(tokenAddress: string): Promise<{
    tokenData: JupiterTokenData | null;
    poolsData: JupiterPoolData[];
  }> {
    console.log(`🔍 Fetching pools for token: ${tokenAddress}`);
    
    // Only fetch pool data - it contains token metadata
    const poolsData = await this.fetchPoolData(tokenAddress);
    
    if (poolsData.length === 0) {
      console.log(`❌ No pools found for token: ${tokenAddress}`);
      return { tokenData: null, poolsData: [] };
    }
    
    // Extract token metadata from the first pool's baseAsset
    const firstPool = poolsData[0];
    const tokenData: JupiterTokenData = {
      symbol: firstPool.baseAsset.symbol,
      name: firstPool.baseAsset.name,
      decimals: firstPool.baseAsset.decimals,
      icon: firstPool.baseAsset.icon,
      marketCap: firstPool.baseAsset.mcap,
      totalSupply: firstPool.baseAsset.totalSupply,
    };
    
    console.log(`✅ Found token: ${tokenData.symbol} with ${poolsData.length} pools`);
    
    return { tokenData, poolsData };
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  static clearCache(): void {
    cache.clear();
  }

  /**
   * Get cache stats (for debugging)
   */
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: cache.size,
      keys: Array.from(cache.keys()),
    };
  }

  // === OHLC/CHART DATA METHODS ===

  /**
   * Convert timestamp to UTC string
   */
  private static convertToUTC(timestamp: number): string {
    return new Date(timestamp * 1000).toISOString();
  }

  /**
   * Check if candle is closed based on interval
   */
  private static isCandleClosed(timestamp: number, interval: TimeInterval): boolean {
    const now = Math.floor(Date.now() / 1000);
    const intervalInSeconds = this.getIntervalInSeconds(interval);
    return (now - timestamp) >= intervalInSeconds;
  }

  /**
   * Get interval duration in seconds
   */
  private static getIntervalInSeconds(interval: TimeInterval): number {
    switch (interval) {
      case TimeInterval.ONE_MINUTE:
        return 60;
      case TimeInterval.FIVE_MINUTES:
        return 300;
      case TimeInterval.FIFTEEN_MINUTES:
        return 900;
      case TimeInterval.THIRTY_MINUTES:
        return 1800;
      case TimeInterval.ONE_HOUR:
        return 3600;
      case TimeInterval.FOUR_HOURS:
        return 14400;
      case TimeInterval.ONE_DAY:
        return 86400;
      case TimeInterval.ONE_WEEK:
        return 604800;
      default:
        return 900; // default to 15 minutes
    }
  }

  /**
   * Fetch OHLCV data for a token
   */
  static async getTokenOHLCVData(
    tokenAddress: string,
    interval: TimeInterval = TimeInterval.FIFTEEN_MINUTES,
    to: number = Date.now(),
    candles: number = 100,
    type: string = 'price'
  ): Promise<CandleData[]> {
    const cacheKey = `ohlcv_${tokenAddress}_${interval}_${candles}_${Math.floor(to / 60000)}`; // Cache per minute

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const url = `${JUPITER_CHARTS_API}/${tokenAddress}?interval=${interval}&to=${to}&candles=${candles}&type=${type}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BucketShop/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          // No chart data available - cache empty result
          cache.set(cacheKey, { data: [], timestamp: Date.now() });
          return [];
        }
        throw new Error(`Jupiter charts API error: ${response.status} ${response.statusText}`);
      }

      const data: ChartResponse = await response.json();

      // Add UTC time and candle status to each candle
      const candlesWithUTC = data.candles.map(candle => ({
        ...candle,
        utcTime: this.convertToUTC(candle.time),
        isClosed: this.isCandleClosed(candle.time, interval)
      }));

      // Cache the result
      cache.set(cacheKey, { data: candlesWithUTC, timestamp: Date.now() });

      return candlesWithUTC;

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.warn(`Jupiter charts API timeout for ${tokenAddress}`);
        } else {
          console.warn(`Jupiter charts API error for ${tokenAddress}:`, error.message);
        }
      }
      return [];
    }
  }

  /**
   * Get current price from latest candle
   */
  static async getCurrentPrice(tokenAddress: string): Promise<number | null> {
    try {
      const candles = await this.getTokenOHLCVData(tokenAddress, TimeInterval.ONE_MINUTE, Date.now(), 1);
      return candles.length > 0 ? candles[0].close : null;
    } catch (error) {
      console.warn(`Failed to get current price for ${tokenAddress}:`, error);
      return null;
    }
  }

  /**
   * Get closing prices for RSI calculation
   */
  static async getClosingPrices(
    tokenAddress: string,
    interval: TimeInterval = TimeInterval.FIFTEEN_MINUTES,
    candles: number = 100
  ): Promise<number[]> {
    try {
      const ohlcData = await this.getTokenOHLCVData(tokenAddress, interval, Date.now(), candles);
      return ohlcData.map(candle => candle.close);
    } catch (error) {
      console.warn(`Failed to get closing prices for ${tokenAddress}:`, error);
      return [];
    }
  }

}