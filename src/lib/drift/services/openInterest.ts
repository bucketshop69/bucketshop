// Open Interest data fetching service

import { fetchWithTimeout, withRetry, DEFAULT_CONFIG } from '../core/client';
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
    samples: '100' // Get more samples for reliable data
  });

  const url = `${endpoint}?${params}`;

  return withRetry(async () => {
    const response = await fetchWithTimeout(url);
    const data = await response.json();

    // Validate response structure - Drift API returns { success: true, data: [[timestamp, "value"], ...] }
    if (!data.success || !Array.isArray(data.data) || data.data.length === 0) {
      console.warn(`⚠️ No OI data found for ${marketName}`);
      return 0;
    }

    // Get the most recent open interest value - data is array of [timestamp, openInterest_string]
    const latestEntry = data.data[data.data.length - 1];
    if (!Array.isArray(latestEntry) || latestEntry.length < 2) {
      console.warn(`⚠️ Invalid OI data format for ${marketName}`);
      return 0;
    }

    // Parse the open interest value from string to number
    const openInterestString = latestEntry[1];
    const openInterestValue = parseFloat(openInterestString) || 0;
    const validatedOI = validateOpenInterestValue(openInterestValue, marketName);
    return validatedOI;
  });
}