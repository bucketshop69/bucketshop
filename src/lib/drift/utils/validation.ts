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
    
    if (!raw.quoteVolume || typeof raw.quoteVolume !== 'string') {
      console.warn(`⚠️ Invalid quoteVolume for ${raw.symbol}`);
      return null;
    }
    
    if (!raw.baseVolume || typeof raw.baseVolume !== 'string') {
      console.warn(`⚠️ Invalid baseVolume for ${raw.symbol}`);
      return null;
    }
    
    if (typeof raw.marketIndex !== 'number') {
      console.warn(`⚠️ Invalid marketIndex for ${raw.symbol}`);
      return null;
    }
    
    return {
      symbol: raw.symbol.trim(),
      quoteVolume: raw.quoteVolume,
      baseVolume: raw.baseVolume,
      marketIndex: raw.marketIndex,
      marketType: raw.marketType || 'unknown',
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