// Data formatting and transformation utilities

import type { DriftVolumeResponse, DriftMarketData } from '../core/types';

/**
 * Create market data object by combining volume and OI data
 */
export function createMarketData(
  volumeData: DriftVolumeResponse,
  openInterest: number
): DriftMarketData {
  return {
    symbol: volumeData.symbol,
    displayName: volumeData.marketName || volumeData.symbol,
    price: volumeData.price || 0,
    priceChange24h: volumeData.priceChange24h || 0,
    volume24h: volumeData.volume24h,
    openInterest,
    lastUpdated: Date.now()
  };
}

/**
 * Create market data with fallback OI (when OI fetch fails)
 */
export function createMarketDataWithFallback(
  volumeData: DriftVolumeResponse,
  error?: Error
): DriftMarketData {
  if (error) {
    console.error(`❌ Failed to get OI for ${volumeData.symbol}:`, error);
  }
  
  return createMarketData(volumeData, 0);
}

/**
 * Format timestamp for API queries
 */
export function formatTimestamp(date: Date = new Date()): number {
  return Math.floor(date.getTime() / 1000);
}

/**
 * Calculate time range for OI queries
 */
export function calculateTimeRange(hoursBack: number = 1): { start: number; end: number } {
  const endTime = formatTimestamp();
  const startTime = endTime - (hoursBack * 3600);
  
  return { start: startTime, end: endTime };
}