// Volume data fetching service

import { fetchWithTimeout, withRetry, DEFAULT_CONFIG } from '../core/client';
import { DriftAPIError } from '../core/errors';
import type { DriftVolumeResponse, DriftVolumeApiResponse } from '../core/types';
import { cleanVolumeData } from '../utils/validation';

/**
 * Fetch 24-hour volume data for all markets
 * Returns cleaned and standardized volume data
 */
export async function getVolume24h(): Promise<DriftVolumeResponse[]> {
  const endpoint = `${DEFAULT_CONFIG.baseUrl}/stats/markets/volume/24h`;
  
  return withRetry(async () => {
    console.log('📊 Fetching 24h volume data from Drift...');
    
    const response = await fetchWithTimeout(endpoint);
    const data = await response.json() as DriftVolumeApiResponse;
    
    // Validate response structure
    if (!data.success || !Array.isArray(data.markets)) {
      throw new DriftAPIError('Invalid volume API response structure', endpoint);
    }
    
    // Clean and validate each market's data
    const cleanedData = data.markets
      .map(cleanVolumeData)
      .filter(item => item !== null) as DriftVolumeResponse[];
    
    console.log(`✅ Successfully fetched ${cleanedData.length} markets volume data`);
    console.log(`📊 Total volume: ${data.total}`);
    return cleanedData;
  });
}