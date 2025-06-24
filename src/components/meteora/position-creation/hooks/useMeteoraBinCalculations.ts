import { useMemo } from 'react';
import { MeteoraPoolInfo } from '@/lib/services/meteora';
import { PositionType, SelectedToken } from '../utils/types';
import { 
  calculateBinRanges, 
  generateBinData, 
  calculateRangeDisplay 
} from '../utils/binCalculations';

/**
 * Hook for managing bin range calculations based on pool data and position configuration
 */
export function useMeteoraBinCalculations(
  pool: MeteoraPoolInfo,
  positionType: PositionType,
  selectedToken: SelectedToken
) {
  // Calculate bin ranges based on pool's bin step
  const binRanges = useMemo(() => {
    return calculateBinRanges(pool.bin_step);
  }, [pool.bin_step]);

  // Generate visualization data for the bar chart
  const binVisualizationData = useMemo(() => {
    return generateBinData(
      binRanges,
      positionType,
      selectedToken,
      pool.current_price,
      pool.bin_step
    );
  }, [binRanges, positionType, selectedToken, pool.current_price, pool.bin_step]);

  // Calculate range display information
  const rangeDisplay = useMemo(() => {
    return calculateRangeDisplay(
      pool.current_price,
      binRanges,
      positionType,
      selectedToken
    );
  }, [pool.current_price, binRanges, positionType, selectedToken]);

  // Get bin count information for display
  const binCountInfo = useMemo(() => {
    if (positionType === 'both') {
      return {
        count: 69,
        description: '69 bins (full range)',
        rangeDescription: '← 33 below • current • 35 above →'
      };
    } else if (selectedToken === 'tokenX') {
      return {
        count: 35,
        description: '35 bins (above)',
        rangeDescription: 'current • 35 bins above →'
      };
    } else {
      return {
        count: 33,
        description: '33 bins (below)', 
        rangeDescription: '← 33 bins below • current'
      };
    }
  }, [positionType, selectedToken]);

  return {
    binRanges,
    binVisualizationData,
    rangeDisplay,
    binCountInfo
  };
}