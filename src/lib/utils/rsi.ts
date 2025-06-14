import { JupiterClient } from '@/lib/api/jupiter.client';
import { TimeInterval, RSIData } from '@/types/token';

/**
 * Calculate RSI (Relative Strength Index) from price array
 * @param prices Array of closing prices
 * @param period RSI period (default 14)
 * @returns Array of RSI values
 */
export function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  // Calculate initial average gain and loss
  let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;

  // Calculate first RSI
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsiValue = 100 - (100 / (1 + rs));
  rsi.push(Math.min(Math.max(rsiValue, 0), 100)); // Ensure RSI stays between 0 and 100

  // Calculate remaining RSI values
  for (let i = period; i < prices.length - 1; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;

    // Handle edge cases
    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      rs = avgGain / avgLoss;
      rsiValue = 100 - (100 / (1 + rs));
      rsi.push(Math.min(Math.max(rsiValue, 0), 100)); // Ensure RSI stays between 0 and 100
    }
  }

  return rsi;
}

/**
 * Calculate RSI for a token using Jupiter chart data
 * @param tokenAddress Solana token address
 * @param period RSI period (default 14)
 * @param interval Time interval for candles (default 15 minutes)
 * @param candles Number of candles to fetch (default 100)
 * @returns RSI data object with values and metadata
 */
export async function calculateTokenRSI(
  tokenAddress: string,
  period: number = 14,
  interval: TimeInterval = TimeInterval.FIFTEEN_MINUTES,
  candles: number = 100
): Promise<RSIData | null> {
  try {
    // Get closing prices from Jupiter
    const closingPrices = await JupiterClient.getClosingPrices(tokenAddress, interval, candles);
    
    if (closingPrices.length < period + 1) {
      console.warn(`Insufficient price data for RSI calculation. Need at least ${period + 1} prices, got ${closingPrices.length}`);
      return null;
    }

    // Calculate RSI values
    const rsiValues = calculateRSI(closingPrices, period);

    return {
      tokenAddress,
      period,
      values: rsiValues,
      lastUpdated: new Date(),
    };

  } catch (error) {
    console.error(`Failed to calculate RSI for ${tokenAddress}:`, error);
    return null;
  }
}

/**
 * Get current RSI value for a token
 * @param tokenAddress Solana token address
 * @param period RSI period (default 14)
 * @param interval Time interval for candles (default 15 minutes)
 * @returns Current RSI value or null if unavailable
 */
export async function getCurrentRSI(
  tokenAddress: string,
  period: number = 14,
  interval: TimeInterval = TimeInterval.FIFTEEN_MINUTES
): Promise<number | null> {
  try {
    const rsiData = await calculateTokenRSI(tokenAddress, period, interval);
    if (!rsiData || rsiData.values.length === 0) {
      return null;
    }
    
    // Return the most recent RSI value
    return rsiData.values[rsiData.values.length - 1];

  } catch (error) {
    console.error(`Failed to get current RSI for ${tokenAddress}:`, error);
    return null;
  }
}

/**
 * Interpret RSI value for trading signals
 * @param rsi RSI value (0-100)
 * @returns Trading signal interpretation
 */
export function interpretRSI(rsi: number): {
  signal: 'oversold' | 'neutral' | 'overbought';
  strength: 'weak' | 'moderate' | 'strong';
  description: string;
} {
  if (rsi >= 70) {
    return {
      signal: 'overbought',
      strength: rsi >= 80 ? 'strong' : 'moderate',
      description: rsi >= 80 ? 'Strongly overbought - consider selling' : 'Overbought - potential sell signal'
    };
  } else if (rsi <= 30) {
    return {
      signal: 'oversold',
      strength: rsi <= 20 ? 'strong' : 'moderate',
      description: rsi <= 20 ? 'Strongly oversold - consider buying' : 'Oversold - potential buy signal'
    };
  } else {
    return {
      signal: 'neutral',
      strength: 'weak',
      description: 'Neutral - no clear signal'
    };
  }
}

/**
 * Calculate multiple RSI periods for comprehensive analysis
 * @param tokenAddress Solana token address
 * @param periods Array of RSI periods to calculate (default [7, 14, 21])
 * @param interval Time interval for candles
 * @returns Object with RSI values for each period
 */
export async function calculateMultiPeriodRSI(
  tokenAddress: string,
  periods: number[] = [7, 14, 21],
  interval: TimeInterval = TimeInterval.FIFTEEN_MINUTES
): Promise<Record<number, number | null>> {
  const result: Record<number, number | null> = {};
  
  try {
    // Get enough candles for the largest period
    const maxPeriod = Math.max(...periods);
    const closingPrices = await JupiterClient.getClosingPrices(tokenAddress, interval, maxPeriod + 50);
    
    if (closingPrices.length < maxPeriod + 1) {
      console.warn(`Insufficient data for multi-period RSI calculation`);
      periods.forEach(period => {
        result[period] = null;
      });
      return result;
    }

    // Calculate RSI for each period
    for (const period of periods) {
      if (closingPrices.length >= period + 1) {
        const rsiValues = calculateRSI(closingPrices, period);
        result[period] = rsiValues.length > 0 ? rsiValues[rsiValues.length - 1] : null;
      } else {
        result[period] = null;
      }
    }

    return result;

  } catch (error) {
    console.error(`Failed to calculate multi-period RSI for ${tokenAddress}:`, error);
    periods.forEach(period => {
      result[period] = null;
    });
    return result;
  }
}