import { ProcessedCandleData } from './DataProcessor';

/**
 * CandleBuffer - Circular buffer for efficient candle data management
 * 
 * This class manages candle data in memory using a circular buffer pattern
 * to ensure constant memory usage regardless of data stream length.
 * 
 * Key benefits:
 * - Fixed memory footprint (no memory leaks)
 * - O(1) insertion and updates
 * - Efficient viewport-based data retrieval
 * - Automatic old data eviction
 */
export class CandleBuffer {
  private buffer: ProcessedCandleData[];
  private head: number = 0;
  private size: number = 0;
  private readonly maxSize: number;

  constructor(maxSize: number = 10000) {
    this.maxSize = maxSize;
    this.buffer = new Array(maxSize);
  }

  /**
   * Add a new candle to the buffer
   */
  addCandle(candle: ProcessedCandleData): void {
    const index = (this.head + this.size) % this.maxSize;
    this.buffer[index] = { ...candle };

    if (this.size < this.maxSize) {
      this.size++;
    } else {
      // Buffer is full, move head forward (circular behavior)
      this.head = (this.head + 1) % this.maxSize;
    }
  }

  /**
   * Update the most recent candle (for real-time updates)
   */
  updateLastCandle(candle: ProcessedCandleData): void {
    if (this.size === 0) {
      this.addCandle(candle);
      return;
    }

    const lastIndex = (this.head + this.size - 1) % this.maxSize;
    const existingCandle = this.buffer[lastIndex];

    // Only update if it's the same timestamp
    if (existingCandle && existingCandle.time === candle.time) {
      this.buffer[lastIndex] = { ...candle };
    } else {
      // Different timestamp, add as new candle
      this.addCandle(candle);
    }
  }

  /**
   * Get all candles in chronological order
   */
  getAllCandles(): ProcessedCandleData[] {
    const result: ProcessedCandleData[] = [];
    
    for (let i = 0; i < this.size; i++) {
      const index = (this.head + i) % this.maxSize;
      result.push({ ...this.buffer[index] });
    }

    return result;
  }

  /**
   * Get candles within a specific time range
   */
  getCandlesInRange(fromTime: number, toTime: number): ProcessedCandleData[] {
    const result: ProcessedCandleData[] = [];
    
    for (let i = 0; i < this.size; i++) {
      const index = (this.head + i) % this.maxSize;
      const candle = this.buffer[index];
      
      if (candle.time >= fromTime && candle.time <= toTime) {
        result.push({ ...candle });
      }
    }

    return result;
  }

  /**
   * Get the most recent N candles
   */
  getRecentCandles(count: number): ProcessedCandleData[] {
    const actualCount = Math.min(count, this.size);
    const result: ProcessedCandleData[] = [];
    
    for (let i = this.size - actualCount; i < this.size; i++) {
      const index = (this.head + i) % this.maxSize;
      result.push({ ...this.buffer[index] });
    }

    return result;
  }

  /**
   * Get the latest candle
   */
  getLatestCandle(): ProcessedCandleData | null {
    if (this.size === 0) return null;
    
    const lastIndex = (this.head + this.size - 1) % this.maxSize;
    return { ...this.buffer[lastIndex] };
  }

  /**
   * Get candles optimized for viewport rendering
   * Implements data decimation for performance
   */
  getViewportCandles(
    fromTime: number, 
    toTime: number, 
    maxPoints: number = 1000
  ): ProcessedCandleData[] {
    const rangeCandles = this.getCandlesInRange(fromTime, toTime);
    
    // If we have fewer candles than max points, return all
    if (rangeCandles.length <= maxPoints) {
      return rangeCandles;
    }

    // Implement simple decimation - take every nth candle
    const step = Math.ceil(rangeCandles.length / maxPoints);
    const decimated: ProcessedCandleData[] = [];
    
    for (let i = 0; i < rangeCandles.length; i += step) {
      decimated.push(rangeCandles[i]);
    }

    // Always include the last candle for accuracy
    const lastCandle = rangeCandles[rangeCandles.length - 1];
    if (decimated[decimated.length - 1]?.time !== lastCandle.time) {
      decimated.push(lastCandle);
    }

    return decimated;
  }

  /**
   * Check if a candle with given timestamp exists
   */
  hasCandle(timestamp: number): boolean {
    for (let i = 0; i < this.size; i++) {
      const index = (this.head + i) % this.maxSize;
      if (this.buffer[index].time === timestamp) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get buffer statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    utilizationPercent: number;
    oldestTime: number | null;
    newestTime: number | null;
  } {
    const oldestCandle = this.size > 0 ? this.buffer[this.head] : null;
    const newestCandle = this.getLatestCandle();

    return {
      size: this.size,
      maxSize: this.maxSize,
      utilizationPercent: (this.size / this.maxSize) * 100,
      oldestTime: oldestCandle?.time || null,
      newestTime: newestCandle?.time || null,
    };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.head = 0;
    this.size = 0;
  }

  /**
   * Get the current size
   */
  getSize(): number {
    return this.size;
  }

  /**
   * Check if buffer is empty
   */
  isEmpty(): boolean {
    return this.size === 0;
  }

  /**
   * Check if buffer is full
   */
  isFull(): boolean {
    return this.size === this.maxSize;
  }
}