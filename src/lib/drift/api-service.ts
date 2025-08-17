// Drift API Integration Service
// Main service class that orchestrates all Drift API operations

// Import modular components
import type { DriftVolumeResponse, DriftMarketData } from './core/types';
import { fetchWithTimeout, DEFAULT_CONFIG } from './core/client';
import { getVolume24h } from './services/volume';
import { getOpenInterest } from './services/openInterest';
import { getAllMarketData } from './services/markets';

// Main service class - now uses modular components
export class DriftApiService {
  
  /**
   * Fetch 24-hour volume data for all markets
   * Returns cleaned and standardized volume data
   */
  async getVolume24h(): Promise<DriftVolumeResponse[]> {
    return getVolume24h();
  }

  /**
   * Fetch open interest data for a specific market
   * @param marketName - Market symbol (e.g., "SOL-PERP")
   * @param hoursBack - How many hours back to look (default: 1)
   */
  async getOpenInterest(marketName: string, hoursBack: number = 1): Promise<number> {
    return getOpenInterest(marketName, hoursBack);
  }

  /**
   * Fetch complete market data by combining volume and OI data
   * This is the main function that other services will use
   */
  async getAllMarketData(): Promise<DriftMarketData[]> {
    return getAllMarketData();
  }

  /**
   * Health check - test if Drift API is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const endpoint = `${DEFAULT_CONFIG.baseUrl}/stats/markets/volume/24h`;
      const response = await fetchWithTimeout(endpoint);
      return response.ok;
    } catch (error) {
      console.error('❌ Drift API health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const driftApiService = new DriftApiService();