// Data validation and cleaning utilities

import type { DriftVolumeResponse } from '../core/types';

/**
 * Clean and validate volume data from Drift API
 * Filters out invalid/malformed data entries
 */
export function cleanVolumeData(raw: any): DriftVolumeResponse | null {
  try {
    // Validate required fields
    if (!raw.symbol || typeof raw.symbol !== 'string') {
      console.warn('⚠️ Invalid market: missing symbol');
      return null;
    }
    
    if (typeof raw.volume24h !== 'number' || raw.volume24h < 0) {
      console.warn(`⚠️ Invalid volume for ${raw.symbol}`);
      return null;
    }
    
    return {
      symbol: raw.symbol.trim(),
      marketName: raw.marketName || raw.symbol,
      volume24h: raw.volume24h,
      volumeChange24h: typeof raw.volumeChange24h === 'number' ? raw.volumeChange24h : 0,
      price: typeof raw.price === 'number' ? raw.price : 0,
      priceChange24h: typeof raw.priceChange24h === 'number' ? raw.priceChange24h : 0,
    };
    
  } catch (error) {
    console.warn('⚠️ Error cleaning volume data:', error);
    return null;
  }
}

/**
 * Validate array response structure
 */
export function validateArrayResponse(data: unknown, endpoint: string): any[] {
  if (!Array.isArray(data)) {
    throw new Error(`Invalid response format from ${endpoint}: expected array`);
  }
  return data;
}

/**
 * Validate open interest response
 */
export function validateOpenInterestValue(value: unknown, marketName: string): number {
  if (typeof value !== 'number' || isNaN(value) || value < 0) {
    console.warn(`⚠️ Invalid OI data for ${marketName}`);
    return 0;
  }
  return value;
}