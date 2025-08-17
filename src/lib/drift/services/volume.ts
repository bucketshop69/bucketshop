// Volume data fetching service

import { fetchWithTimeout, withRetry, DEFAULT_CONFIG } from '../core/client';
import { DriftAPIError } from '../core/errors';
import type { DriftVolumeResponse } from '../core/types';
import { cleanVolumeData, validateArrayResponse } from '../utils/validation';

/**
 * Fetch 24-hour volume data for all markets
 * Returns cleaned and standardized volume data
 */
export async function getVolume24h(): Promise<DriftVolumeResponse[]> {
  const endpoint = `${DEFAULT_CONFIG.baseUrl}/stats/markets/volume/24h`;
  
  return withRetry(async () => {
    console.log('📊 Fetching 24h volume data from Drift...');
    
    const response = await fetchWithTimeout(endpoint);
    const data = await response.json();
    
    // Validate response structure
    const validatedData = validateArrayResponse(data, endpoint);
    
    // Clean and validate each market's data
    const cleanedData = validatedData
      .map(cleanVolumeData)
      .filter(item => item !== null) as DriftVolumeResponse[];
    
    console.log(`✅ Successfully fetched ${cleanedData.length} markets volume data`);
    return cleanedData;
  });
}