// Market data aggregation service

import type { DriftMarketData } from '../core/types';
import { getVolume24h } from './volume';
import { getOpenInterest } from './openInterest';
import { createMarketData, createMarketDataWithFallback } from '../utils/formatting';

/**
 * Fetch complete market data by combining volume and OI data
 * This is the main aggregation function that combines all data sources
 */
export async function getAllMarketData(): Promise<DriftMarketData[]> {
  console.log('🚀 Starting complete market data fetch...');
  
  try {
    // First, get volume data for all markets
    const volumeData = await getVolume24h();
    
    if (volumeData.length === 0) {
      console.warn('⚠️ No volume data available');
      return [];
    }
    
    // Then, fetch OI data for each market in parallel
    const marketDataPromises = volumeData.map(async (market) => {
      try {
        const openInterest = await getOpenInterest(market.symbol);
        return createMarketData(market, openInterest);
      } catch (error) {
        // Return market data without OI rather than failing completely
        return createMarketDataWithFallback(market, error as Error);
      }
    });
    
    // Wait for all market data to be fetched
    const marketData = await Promise.all(marketDataPromises);
    
    console.log(`🎉 Successfully fetched complete data for ${marketData.length} markets`);
    return marketData;
    
  } catch (error) {
    console.error('❌ Failed to fetch market data:', error);
    throw error;
  }
}