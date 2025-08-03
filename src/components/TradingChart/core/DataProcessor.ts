import { CandleData } from './ChartEngine';

export interface RawCandleData {
  timestamp: string | number;
  open: string | number;
  high: string | number;
  low: string | number;
  close: string | number;
  volume?: string | number;
}

export interface ProcessedCandleData extends CandleData {
  volume: number;
}

/**
 * DataProcessor - Normalizes and validates OHLCV data from various sources
 * 
 * This class handles the complex task of converting raw data from different
 * sources (CSV, WebSocket, APIs) into a standardized format for the chart.
 * 
 * Key responsibilities:
 * - Data type conversion and validation
 * - Timestamp normalization
 * - Price precision handling
 * - Data quality checks and filtering
 * - Missing data interpolation
 */
export class DataProcessor {
  private static readonly PRICE_PRECISION = 8;
  private static readonly VOLUME_PRECISION = 6;

  /**
   * Process a single raw candle into standardized format
   */
  static processSingleCandle(raw: RawCandleData): ProcessedCandleData | null {
    try {
      // Convert and validate timestamp
      const timestamp = this.normalizeTimestamp(raw.timestamp);
      if (!timestamp) return null;

      // Convert and validate prices
      const open = this.normalizePrice(raw.open);
      const high = this.normalizePrice(raw.high);
      const low = this.normalizePrice(raw.low);
      const close = this.normalizePrice(raw.close);

      if (open === null || high === null || low === null || close === null) {
        return null;
      }

      // Validate OHLC relationships
      if (!this.validateOHLC(open, high, low, close)) {
        return null;
      }

      // Convert volume (optional)
      const volume = this.normalizeVolume(raw.volume || 0);

      return {
        time: timestamp,
        open: this.roundToPrecision(open, this.PRICE_PRECISION),
        high: this.roundToPrecision(high, this.PRICE_PRECISION),
        low: this.roundToPrecision(low, this.PRICE_PRECISION),
        close: this.roundToPrecision(close, this.PRICE_PRECISION),
        volume: this.roundToPrecision(volume, this.VOLUME_PRECISION),
      };
    } catch (error) {
      console.warn('Failed to process candle:', error, raw);
      return null;
    }
  }

  /**
   * Process an array of raw candles
   */
  static processCandles(rawCandles: RawCandleData[]): ProcessedCandleData[] {
    const processed: ProcessedCandleData[] = [];
    
    for (const raw of rawCandles) {
      const candle = this.processSingleCandle(raw);
      if (candle) {
        processed.push(candle);
      }
    }

    // Sort by timestamp to ensure chronological order
    processed.sort((a, b) => a.time - b.time);

    // Remove duplicates (same timestamp)
    return this.removeDuplicates(processed);
  }

  /**
   * Parse CSV data from Drift S3
   */
  static parseDriftCSV(csvData: string): ProcessedCandleData[] {
    const lines = csvData.split('\n');
    
    if (lines.length < 2) return [];
    
    // Parse header to understand format
    const header = lines[0].toLowerCase();
    const isNewFormat = header.includes('fillopen') || header.includes('start');
    
    console.log('CSV format detected:', isNewFormat ? 'new format' : 'old format');
    console.log('Header:', lines[0]);
    
    // Skip header and get only recent data (last 500 lines for performance)
    const dataLines = lines.slice(1)
      .filter(line => line.trim())
      .slice(-500); // Only take last 500 candles for performance
    
    console.log(`Processing ${dataLines.length} lines from CSV`);
    
    const rawCandles: RawCandleData[] = dataLines.map(line => {
      const parts = line.split(',');
      
      if (isNewFormat) {
        // New format: start,fillOpen,fillClose,fillHigh,fillLow,oracleOpen,oracleClose,oracleHigh,oracleLow,quoteVolume,baseVolume,resolution
        const [timestamp, fillOpen, fillClose, fillHigh, fillLow, , , , , , baseVolume] = parts;
        return {
          timestamp,
          open: fillOpen,
          high: fillHigh,
          low: fillLow,
          close: fillClose,
          volume: baseVolume || '0',
        };
      } else {
        // Old format: timestamp,open,high,low,close,volume
        const [timestamp, open, high, low, close, volume] = parts;
        return {
          timestamp,
          open,
          high,
          low,
          close,
          volume: volume || '0',
        };
      }
    });

    return this.processCandles(rawCandles);
  }

  /**
   * Process WebSocket trade data into candle updates
   */
  static processTradeData(
    tradePrice: number,
    tradeTimestamp: number,
    currentCandle: ProcessedCandleData | null,
    candleInterval: number = 60 // 1 minute default
  ): ProcessedCandleData | null {
    if (!this.isValidPrice(tradePrice) || !this.isValidTimestamp(tradeTimestamp)) {
      return null;
    }

    // Calculate candle timestamp (round down to interval)
    const candleTime = Math.floor(tradeTimestamp / candleInterval) * candleInterval;

    // If no current candle or different time period, create new candle
    if (!currentCandle || currentCandle.time !== candleTime) {
      return {
        time: candleTime,
        open: tradePrice,
        high: tradePrice,
        low: tradePrice,
        close: tradePrice,
        volume: 0, // Volume will be updated separately if available
      };
    }

    // Update existing candle with new trade
    return {
      ...currentCandle,
      high: Math.max(currentCandle.high, tradePrice),
      low: Math.min(currentCandle.low, tradePrice),
      close: tradePrice,
    };
  }

  /**
   * Normalize timestamp to Unix seconds
   */
  private static normalizeTimestamp(timestamp: string | number): number | null {
    if (typeof timestamp === 'number') {
      // Handle both seconds and milliseconds
      return timestamp > 1e10 ? Math.floor(timestamp / 1000) : timestamp;
    }

    if (typeof timestamp === 'string') {
      const parsed = parseInt(timestamp, 10);
      if (isNaN(parsed)) return null;
      return parsed > 1e10 ? Math.floor(parsed / 1000) : parsed;
    }

    return null;
  }

  /**
   * Normalize price values
   */
  private static normalizePrice(price: string | number): number | null {
    if (typeof price === 'number') {
      return this.isValidPrice(price) ? price : null;
    }

    if (typeof price === 'string') {
      const parsed = parseFloat(price);
      return this.isValidPrice(parsed) ? parsed : null;
    }

    return null;
  }

  /**
   * Normalize volume values
   */
  private static normalizeVolume(volume: string | number): number {
    if (typeof volume === 'number') {
      return volume >= 0 ? volume : 0;
    }

    if (typeof volume === 'string') {
      const parsed = parseFloat(volume);
      return !isNaN(parsed) && parsed >= 0 ? parsed : 0;
    }

    return 0;
  }

  /**
   * Validate OHLC price relationships
   */
  private static validateOHLC(open: number, high: number, low: number, close: number): boolean {
    // High should be the highest price
    if (high < open || high < close || high < low) return false;
    
    // Low should be the lowest price
    if (low > open || low > close || low > high) return false;
    
    // All prices should be positive
    if (open <= 0 || high <= 0 || low <= 0 || close <= 0) return false;
    
    return true;
  }

  /**
   * Check if price is valid
   */
  private static isValidPrice(price: number): boolean {
    return !isNaN(price) && isFinite(price) && price > 0;
  }

  /**
   * Check if timestamp is valid
   */
  private static isValidTimestamp(timestamp: number): boolean {
    return !isNaN(timestamp) && isFinite(timestamp) && timestamp > 0;
  }

  /**
   * Round number to specified precision
   */
  private static roundToPrecision(value: number, precision: number): number {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  }

  /**
   * Remove duplicate candles (same timestamp)
   */
  private static removeDuplicates(candles: ProcessedCandleData[]): ProcessedCandleData[] {
    const seen = new Set<number>();
    return candles.filter(candle => {
      if (seen.has(candle.time)) {
        return false;
      }
      seen.add(candle.time);
      return true;
    });
  }

  /**
   * Fill gaps in candle data with interpolated values
   */
  static fillGaps(
    candles: ProcessedCandleData[], 
    intervalSeconds: number = 60
  ): ProcessedCandleData[] {
    if (candles.length < 2) return candles;

    const filled: ProcessedCandleData[] = [];
    
    for (let i = 0; i < candles.length - 1; i++) {
      filled.push(candles[i]);
      
      const current = candles[i];
      const next = candles[i + 1];
      const gap = next.time - current.time;
      
      // If gap is larger than interval, fill with interpolated candles
      if (gap > intervalSeconds * 1.5) {
        const gapCount = Math.floor(gap / intervalSeconds) - 1;
        
        for (let j = 1; j <= gapCount; j++) {
          const interpolatedTime = current.time + (j * intervalSeconds);
          const interpolatedCandle: ProcessedCandleData = {
            time: interpolatedTime,
            open: current.close,
            high: current.close,
            low: current.close,
            close: current.close,
            volume: 0,
          };
          filled.push(interpolatedCandle);
        }
      }
    }
    
    // Add the last candle
    filled.push(candles[candles.length - 1]);
    
    return filled;
  }

  /**
   * Get data quality metrics
   */
  static getQualityMetrics(candles: ProcessedCandleData[]): {
    totalCandles: number;
    validCandles: number;
    qualityPercent: number;
    timespan: { start: number; end: number } | null;
    averageGap: number;
  } {
    if (candles.length === 0) {
      return {
        totalCandles: 0,
        validCandles: 0,
        qualityPercent: 0,
        timespan: null,
        averageGap: 0,
      };
    }

    const validCandles = candles.filter(candle => 
      this.isValidPrice(candle.open) &&
      this.isValidPrice(candle.high) &&
      this.isValidPrice(candle.low) &&
      this.isValidPrice(candle.close)
    );

    let totalGap = 0;
    for (let i = 1; i < candles.length; i++) {
      totalGap += candles[i].time - candles[i - 1].time;
    }

    return {
      totalCandles: candles.length,
      validCandles: validCandles.length,
      qualityPercent: (validCandles.length / candles.length) * 100,
      timespan: {
        start: candles[0].time,
        end: candles[candles.length - 1].time,
      },
      averageGap: candles.length > 1 ? totalGap / (candles.length - 1) : 0,
    };
  }
}