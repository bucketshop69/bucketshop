import { DataProcessor, ProcessedCandleData } from '../core/DataProcessor';

export interface DataSource {
  url: string;
  year: number;
  market: string;
  interval: string;
}

export interface FetchOptions {
  maxCandles?: number;
  fromYear?: number;
  toYear?: number;
  timeout?: number;
  retries?: number;
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
 * HistoricalDataService - Fetches and processes historical data from Drift S3
 * 
 * This service handles the complex task of fetching historical candle data
 * from Drift's S3 buckets with robust error handling and fallback strategies.
 * 
 * ⚠️ PRODUCTION CONSIDERATION:
 * Currently fetches entire CSV files (~1MB) but only uses last 500 candles.
 * For production, consider implementing:
 * 1. Server-side API that returns only recent candles
 * 2. Streaming/chunked reading of CSV files
 * 3. CDN caching of processed candle data
 * 
 * Key features:
 * - Multi-year data fetching with fallbacks
 * - Automatic retry logic with exponential backoff
 * - Data validation and quality metrics
 * - Memory-efficient processing (only last 500 candles)
 * - Caching for performance optimization
 */
export class HistoricalDataService {
  private static readonly BASE_URL = 'https://drift-historical-data-v2.s3.eu-west-1.amazonaws.com';
  private static readonly PROGRAM_ID = 'dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH';
  private static readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private static readonly DEFAULT_RETRIES = 3;
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Simple in-memory cache
  private static cache = new Map<string, { data: ProcessedCandleData[]; timestamp: number }>();

  /**
   * Fetch historical data for BTC-PERP with multiple fallback strategies
   */
  static async fetchBTCPerpData(options: FetchOptions = {}): Promise<FetchResult> {
    const {
      maxCandles = 200,  // Reduced from 1000 for better performance
      fromYear = new Date().getFullYear(),  // Only try current year first
      toYear = new Date().getFullYear(),
      timeout = this.DEFAULT_TIMEOUT,
      retries = this.DEFAULT_RETRIES,
    } = options;

    const startTime = Date.now();
    const results: FetchResult[] = [];

    // Generate years to try (current year first, then backwards)
    const years = this.generateYearRange(fromYear, toYear);

    for (const year of years) {
      try {
        const result = await this.fetchYearData('BTC-PERP', year, '60', {
          timeout,
          retries,
        });

        results.push(result);

        if (result.success && result.data.length > 0) {
          // Get the most recent candles
          const recentCandles = result.data
            .slice(-maxCandles)
            .filter(candle => candle && candle.time > 0);

          if (recentCandles.length > 0) {
            const quality = DataProcessor.getQualityMetrics(recentCandles);
            
            return {
              success: true,
              data: recentCandles,
              source: result.source,
              fetchTime: Date.now() - startTime,
              dataQuality: quality.qualityPercent,
            };
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`Failed to fetch data for year ${year}:`, errorMessage);
        
        results.push({
          success: false,
          data: [],
          source: {
            url: 'failed',
            year,
            market: 'BTC-PERP',
            interval: '60',
          },
          error: errorMessage,
          fetchTime: Date.now() - startTime,
          dataQuality: 0,
        });
      }
    }

    // If we get here, all attempts failed
    const errorSummary = results.length > 0 
      ? results.map(r => `${r.source.year}: ${r.error}`).join('; ')
      : 'No data sources available';

    console.error('All data fetch attempts failed:', results);

    return {
      success: false,
      data: [],
      source: {
        url: 'failed',
        year: 0,
        market: 'BTC-PERP',
        interval: '60',
      },
      error: `Failed to fetch from all sources. Attempted years: ${errorSummary}`,
      fetchTime: Date.now() - startTime,
      dataQuality: 0,
    };
  }

  /**
   * Fetch data for a specific year
   */
  private static async fetchYearData(
    market: string,
    year: number,
    interval: string,
    options: { timeout: number; retries: number }
  ): Promise<FetchResult> {
    // Map market symbols to Drift perp indices
    const marketIndex = this.getMarketIndex(market);
    if (marketIndex === null) {
      throw new Error(`Unsupported market: ${market}`);
    }

    const source: DataSource = {
      url: `${this.BASE_URL}/program/${this.PROGRAM_ID}/candle-history/${year}/perp_${marketIndex}/${interval}.csv`,
      year,
      market,
      interval,
    };

    // Check cache first
    const cacheKey = `${market}_${year}_${interval}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return {
        success: true,
        data: cached.data,
        source,
        fetchTime: 0,
        dataQuality: 100,
      };
    }

    const startTime = Date.now();

    for (let attempt = 1; attempt <= options.retries; attempt++) {
      try {
        console.log(`Fetching ${market} data for ${year} (attempt ${attempt}/${options.retries})`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);

        const response = await fetch(source.url, {
          signal: controller.signal,
          headers: {
            'Accept': 'text/csv',
            'Cache-Control': 'no-cache',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const csvData = await response.text();
        console.log(`Raw CSV data length: ${csvData.length}, first 200 chars:`, csvData.substring(0, 200));
        
        const processedData = DataProcessor.parseDriftCSV(csvData);
        console.log(`Processed ${processedData.length} candles from CSV`);
        
        const quality = DataProcessor.getQualityMetrics(processedData);
        console.log(`Data quality: ${quality.qualityPercent.toFixed(1)}%`);

        if (processedData.length === 0) {
          throw new Error('No valid candles found in CSV data');
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
        
        if (attempt === options.retries) {
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
   * Map market symbols to Drift perp indices
   */
  private static getMarketIndex(market: string): number | null {
    const marketMap: Record<string, number> = {
      'BTC-PERP': 0,  // BTC-PERP is perp_0, not perp_1
      'SOL-PERP': 1,
      'ETH-PERP': 2,
      'APT-PERP': 3,
      'MATIC-PERP': 4,
      // Add more markets as needed
    };

    return marketMap[market] ?? null;
  }

  /**
   * Generate array of years to try (newest first)
   */
  private static generateYearRange(fromYear: number, toYear: number): number[] {
    const years: number[] = [];
    
    // Start from the most recent year and work backwards
    for (let year = toYear; year >= fromYear; year--) {
      years.push(year);
    }

    return years;
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
            source: { url: 'failed', year: 0, market, interval: '60' },
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
   * Fetch data for any supported market
   */
  static async fetchMarketData(market: string, options: FetchOptions = {}): Promise<FetchResult> {
    // For now, only BTC-PERP is implemented
    if (market === 'BTC-PERP') {
      return this.fetchBTCPerpData(options);
    }

    throw new Error(`Market ${market} not yet supported`);
  }

  /**
   * Clear the cache
   */
  static clearCache(): void {
    this.cache.clear();
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
   * Check if data is available for a specific market and year
   */
  static async checkDataAvailability(market: string, year: number): Promise<boolean> {
    const marketIndex = this.getMarketIndex(market);
    if (marketIndex === null) return false;

    const url = `${this.BASE_URL}/program/${this.PROGRAM_ID}/candle-history/${year}/perp_${marketIndex}/60.csv`;
    
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }
}