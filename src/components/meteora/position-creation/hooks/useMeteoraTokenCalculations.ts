import { useEffect, useState } from 'react';
import { PositionType, SelectedToken } from '../utils/types';

/**
 * Hook for managing token amount calculations based on SOL allocation
 */
export function useMeteoraTokenCalculations(
  positionType: PositionType,
  selectedToken: SelectedToken,
  totalSolAllocation: number,
  currentPrice: number,
  isPositionTypeReady: boolean
) {
  const [calculatedTokenXAmount, setCalculatedTokenXAmount] = useState<number>(0);
  const [calculatedTokenYAmount, setCalculatedTokenYAmount] = useState<number>(0);
  const [requiresSwap, setRequiresSwap] = useState<boolean>(false);

  // Calculate token amounts based on position type and SOL allocation
  useEffect(() => {
    if (!isPositionTypeReady || totalSolAllocation <= 0) {
      setCalculatedTokenXAmount(0);
      setCalculatedTokenYAmount(0);
      setRequiresSwap(false);
      return;
    }

    if (positionType === 'single') {
      if (selectedToken === 'tokenX') {
        // Single TokenX: Calculate tokenXNeeded = totalSol / currentPrice
        const tokenXNeeded = totalSolAllocation / currentPrice;
        setCalculatedTokenXAmount(tokenXNeeded);
        setCalculatedTokenYAmount(0);
        setRequiresSwap(true); // Need to swap SOL → TokenX
      } else if (selectedToken === 'tokenY') {
        // Single TokenY: Direct SOL usage (assuming TokenY is SOL)
        setCalculatedTokenXAmount(0);
        setCalculatedTokenYAmount(totalSolAllocation);
        setRequiresSwap(false); // No swap needed
      }
    } else if (positionType === 'both') {
      // Both tokens: Simple 50/50 split for now
      const halfAllocation = totalSolAllocation / 2;
      const tokenXFromHalf = halfAllocation / currentPrice;

      setCalculatedTokenXAmount(tokenXFromHalf);
      setCalculatedTokenYAmount(halfAllocation);
      setRequiresSwap(true); // Need to swap half SOL → TokenX
    }
  }, [positionType, selectedToken, totalSolAllocation, currentPrice, isPositionTypeReady]);

  // Check if we have token calculations ready
  const hasTokenCalculations = totalSolAllocation > 0 && (calculatedTokenXAmount > 0 || calculatedTokenYAmount > 0);

  return {
    calculatedTokenXAmount,
    calculatedTokenYAmount,
    requiresSwap,
    hasTokenCalculations
  };
}