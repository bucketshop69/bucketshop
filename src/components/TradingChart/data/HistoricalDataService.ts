import { DataProcessor, ProcessedCandleData } from '../core/DataProcessor';
import { Timeframe, TIMEFRAME_CONFIG } from './chartStore';

export interface DataSource {
  url: string;
  market: string;
  interval: string;
  limit: number;
}

export interface FetchOptions {
  maxCandles?: number;
  timeout?: number;
  retries?: number;
  timeframe?: Timeframe;
}

export interface FetchResult {
  success: boolean;
  data: ProcessedCandleData[];
  source: DataSource;
  error?: string;
  fetchTime: number;
  dataQuality: number;
}

/**
 * Drift API candle record interface
 */
interface DriftCandleRecord {
  ts: number;
  fillOpen: number;
  fillHigh: number;
  fillClose: number;
  fillLow: number;
  oracleOpen: number;
  oracleHigh: number;
  oracleClose: number;
  oracleLow: number;
  quoteVolume: number;
  baseVolume: number;
}

/**
 * Drift API response interface
 */
interface DriftAPIResponse {
  success: boolean;
  records: DriftCandleRecord[];
}

/**
 * Drift API interval mapping for different timeframes
 */
const DRIFT_INTERVAL_MAP: Record<Timeframe, string> = {
  '1m': '1',
  '5m': '5', 
  '15m': '15',
  '1h': '60',
  '4h': '240',
  '1d': '1440', // Temporarily disabled in UI but kept for future use
};

/**
 * HistoricalDataService - Fetches historical data from Drift REST API
 * 
 * This service fetches historical candle data from Drift's modern REST API
 * with robust error handling and caching strategies.
 * 
 * Key features:
 * - Direct REST API integration (no CSV parsing)
 * - Automatic retry logic with exponential backoff
 * - Data validation and quality metrics
 * - Memory-efficient processing with configurable limits
 * - Caching for performance optimization
 * - Support for all Drift perpetual markets
 */
export class HistoricalDataService {
  private static readonly BASE_URL = 'https://data.api.drift.trade';
  private static readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private static readonly DEFAULT_RETRIES = 3;
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Simple in-memory cache
  private static cache = new Map<string, { data: ProcessedCandleData[]; timestamp: number }>();

  /**
   * Fetch historical data for any market using Drift REST API
   */
  static async fetchMarketData(market: string, options: FetchOptions = {}): Promise<FetchResult> {
    const {
      maxCandles = 200,
      timeout = this.DEFAULT_TIMEOUT,
      retries = this.DEFAULT_RETRIES,
      timeframe = '1h', // Default to 1h if not specified
    } = options;

    // Get Drift API interval for the timeframe
    const interval = DRIFT_INTERVAL_MAP[timeframe];
    if (!interval) {
      throw new Error(`Unsupported timeframe: ${timeframe}`);
    }

    const startTime = Date.now();
    const source: DataSource = {
      url: `${this.BASE_URL}/market/${market}/candles/${interval}?limit=${maxCandles}`,
      market,
      interval,
      limit: maxCandles,
    };

    // Check cache first (include timeframe in cache key)
    const cacheKey = `${market}_${interval}_${maxCandles}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`Returning cached data for ${market} ${timeframe}`);
      return {
        success: true,
        data: cached.data,
        source,
        fetchTime: 0,
        dataQuality: 100,
      };
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Fetching ${market} data from Drift API (attempt ${attempt}/${retries})`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(source.url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const jsonData: DriftAPIResponse = await response.json();
        console.log(`Fetched ${jsonData.records?.length || 0} candles from Drift API`);
        
        if (!jsonData.success || !jsonData.records || !Array.isArray(jsonData.records)) {
          throw new Error('Invalid response format from Drift API');
        }

        const processedData = this.processDriftAPIData(jsonData.records);
        console.log(`Processed ${processedData.length} valid candles`);
        
        const quality = DataProcessor.getQualityMetrics(processedData);
        console.log(`Data quality: ${quality.qualityPercent.toFixed(1)}%`);

        if (processedData.length === 0) {
          throw new Error('No valid candles found in API response');
        }

        // Cache successful results
        this.cache.set(cacheKey, {
          data: processedData,
          timestamp: Date.now(),
        });

        return {
          success: true,
          data: processedData,
          source,
          fetchTime: Date.now() - startTime,
          dataQuality: quality.qualityPercent,
        };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (attempt === retries) {
          return {
            success: false,
            data: [],
            source,
            error: errorMessage,
            fetchTime: Date.now() - startTime,
            dataQuality: 0,
          };
        }

        // Exponential backoff for retries
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, errorMessage);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // This should never be reached, but TypeScript requires it
    return {
      success: false,
      data: [],
      source,
      error: 'Unexpected error',
      fetchTime: Date.now() - startTime,
      dataQuality: 0,
    };
  }

  /**
   * Process raw data from Drift API into ProcessedCandleData format
   */
  private static processDriftAPIData(records: DriftCandleRecord[]): ProcessedCandleData[] {
    return records
      .filter(record => record && record.ts > 0)
      .map(record => {
        // Use fill data (actual trade data) if available, fallback to oracle data
        const open = record.fillOpen || record.oracleOpen || 0;
        const high = record.fillHigh || record.oracleHigh || 0;
        const low = record.fillLow || record.oracleLow || 0;
        const close = record.fillClose || record.oracleClose || 0;
        const volume = record.baseVolume || 0;

        return {
          time: record.ts,
          open,
          high,
          low,
          close,
          volume,
        };
      })
      .filter(candle => 
        candle.time > 0 && 
        candle.open > 0 && 
        candle.high > 0 && 
        candle.low > 0 && 
        candle.close > 0
      )
      .sort((a, b) => a.time - b.time); // Ensure chronological order
  }

  /**
   * Legacy method for BTC-PERP (backward compatibility)
   */
  static async fetchBTCPerpData(options: FetchOptions = {}): Promise<FetchResult> {
    return this.fetchMarketData('BTC-PERP', options);
  }

  /**
   * Fetch data for multiple markets simultaneously
   */
  static async fetchMultipleMarkets(
    markets: string[],
    options: FetchOptions = {}
  ): Promise<Record<string, FetchResult>> {
    const promises = markets.map(async market => {
      try {
        const result = await this.fetchMarketData(market, options);
        return { market, result };
      } catch (error) {
        return {
          market,
          result: {
            success: false,
            data: [],
            source: { 
              url: `${this.BASE_URL}/market/${market}/candles/60`, 
              market, 
              interval: '60',
              limit: options.maxCandles || 200
            },
            error: error instanceof Error ? error.message : 'Unknown error',
            fetchTime: 0,
            dataQuality: 0,
          },
        };
      }
    });

    const results = await Promise.all(promises);
    
    return results.reduce((acc, { market, result }) => {
      acc[market] = result;
      return acc;
    }, {} as Record<string, FetchResult>);
  }

  /**
   * Clear the cache
   */
  static clearCache(): void {
    this.cache.clear();
    console.log('HistoricalDataService cache cleared');
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    size: number;
    keys: string[];
    totalMemory: number;
  } {
    let totalMemory = 0;
    const keys: string[] = [];

    for (const [key, value] of this.cache.entries()) {
      keys.push(key);
      totalMemory += value.data.length * 64; // Rough estimate: 64 bytes per candle
    }

    return {
      size: this.cache.size,
      keys,
      totalMemory,
    };
  }

  /**
   * Check if data is available for a specific market
   */
  static async checkDataAvailability(market: string): Promise<boolean> {
    const url = `${this.BASE_URL}/market/${market}/candles/60?limit=1`;
    
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get available timeframes for a market (future enhancement)
   */
  static getSupportedTimeframes(): string[] {
    return ['60']; // Currently only 1-hour candles are supported
  }

  /**
   * Get market info from URL (helper for debugging)
   */
  static parseMarketFromUrl(url: string): string | null {
    const match = url.match(/\/market\/([^\/]+)\/candles/);
    return match ? match[1] : null;
  }
}