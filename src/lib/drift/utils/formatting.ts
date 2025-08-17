// Data formatting and transformation utilities

import type { DriftVolumeResponse, DriftMarketData } from '../core/types';

/**
 * Create market data object by combining volume and OI data
 */
export function createMarketData(
  volumeData: DriftVolumeResponse,
  openInterest: number
): DriftMarketData {
  // Convert volume strings to numbers
  const quoteVolumeNum = parseFloat(volumeData.quoteVolume) || 0;
  const baseVolumeNum = parseFloat(volumeData.baseVolume) || 0;
  
  return {
    symbol: volumeData.symbol,
    displayName: volumeData.symbol, // Use symbol as display name for now
    price: null, // Will be null until we get price source
    priceChange24h: null, // Will be null until we get price source
    quoteVolume: quoteVolumeNum,
    baseVolume: baseVolumeNum,
    marketIndex: volumeData.marketIndex,
    marketType: volumeData.marketType,
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