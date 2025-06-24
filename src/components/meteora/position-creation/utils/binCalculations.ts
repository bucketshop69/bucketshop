import { BinRangeCalculation, BinData, PositionType, SelectedToken } from './types';

/**
 * Calculate dynamic bin ranges based on pool's bin step and current position
 */
export function calculateBinRanges(binStep: number, currentBin: number = 34): BinRangeCalculation {
  const totalBins = 69; // DLMM constant
  const stepDecimal = binStep / 10000; // Convert bp to decimal
  const binsBelow = currentBin - 1; // bins [1 to currentBin-1]
  const binsAbove = totalBins - currentBin; // bins [currentBin+1 to 69]
  
  // Compound calculation for accurate percentages
  const belowPercent = ((1 - stepDecimal) ** binsBelow - 1) * 100;
  const abovePercent = ((1 + stepDecimal) ** binsAbove - 1) * 100;
  
  return {
    bothTokens: { 
      min: belowPercent, 
      max: abovePercent,
      binRange: [1, totalBins],
      description: 'Full range'
    },
    tokenXOnly: { 
      min: stepDecimal * 100, 
      max: abovePercent,
      binRange: [currentBin + 1, totalBins],
      description: 'Above current price'
    },
    tokenYOnly: { 
      min: belowPercent, 
      max: -stepDecimal * 100,
      binRange: [1, currentBin - 1],
      description: 'Below current price'
    }
  };
}

/**
 * Get the appropriate range config based on position type and token selection
 */
export function getRangeConfigForPosition(
  binRanges: BinRangeCalculation,
  positionType: PositionType,
  selectedToken: SelectedToken
) {
  if (positionType === 'both') {
    return binRanges.bothTokens;
  } else if (selectedToken === 'tokenX') {
    return binRanges.tokenXOnly;
  } else {
    return binRanges.tokenYOnly;
  }
}

/**
 * Generate bin data for visualization
 */
export function generateBinData(
  binRanges: BinRangeCalculation,
  positionType: PositionType,
  selectedToken: SelectedToken,
  currentPrice: number,
  binStep: number,
  currentBin: number = 34
): BinData[] {
  const totalBins = 69;
  const rangeConfig = getRangeConfigForPosition(binRanges, positionType, selectedToken);
  const [startBin, endBin] = rangeConfig.binRange;

  return Array.from({ length: totalBins }, (_, index) => {
    const isSelected = index >= startBin && index <= endBin;
    const isCurrent = index === currentBin;

    return {
      bin: index,
      height: isSelected ? 100 : 20, // Selected bins are taller
      fill: isCurrent ? '#ef4444' : isSelected ? '#3b82f6' : '#e5e7eb',
      price: currentPrice * Math.pow(1 + (binStep / 10000), index - currentBin)
    };
  });
}

/**
 * Calculate range display information
 */
export function calculateRangeDisplay(
  currentPrice: number,
  binRanges: BinRangeCalculation,
  positionType: PositionType,
  selectedToken: SelectedToken
) {
  const rangeConfig = getRangeConfigForPosition(binRanges, positionType, selectedToken);
  
  return {
    min: currentPrice * (1 + rangeConfig.min / 100),
    max: currentPrice * (1 + rangeConfig.max / 100),
    description: rangeConfig.description,
    percentageRange: `${rangeConfig.min.toFixed(2)}% to ${rangeConfig.max.toFixed(2)}%`
  };
}