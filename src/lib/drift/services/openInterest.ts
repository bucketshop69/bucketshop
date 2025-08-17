// Open Interest data fetching service

import { fetchWithTimeout, withRetry, DEFAULT_CONFIG } from '../core/client';
import type { DriftOpenInterestResponse } from '../core/types';
import { validateOpenInterestValue } from '../utils/validation';
import { calculateTimeRange } from '../utils/formatting';

/**
 * Fetch open interest data for a specific market
 * @param marketName - Market symbol (e.g., "SOL-PERP")
 * @param hoursBack - How many hours back to look (default: 1)
 */
export async function getOpenInterest(marketName: string, hoursBack: number = 1): Promise<number> {
  const { start, end } = calculateTimeRange(hoursBack);
  
  const endpoint = `${DEFAULT_CONFIG.baseUrl}/amm/openInterest`;
  const params = new URLSearchParams({
    marketName,
    start: start.toString(),
    end: end.toString(),
    samples: '1' // Just get the latest value
  });
  
  const url = `${endpoint}?${params}`;
  
  return withRetry(async () => {
    console.log(`📈 Fetching OI data for ${marketName}...`);
    
    const response = await fetchWithTimeout(url);
    const data = await response.json();
    
    // Validate response structure
    if (!Array.isArray(data) || data.length === 0) {
      console.warn(`⚠️ No OI data found for ${marketName}`);
      return 0;
    }
    
    // Get the most recent open interest value
    const latestOI = data[data.length - 1] as DriftOpenInterestResponse;
    const validatedOI = validateOpenInterestValue(latestOI.openInterest, marketName);
    
    console.log(`✅ OI for ${marketName}: ${validatedOI}`);
    return validatedOI;
  });
}