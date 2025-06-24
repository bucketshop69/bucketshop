import { useState, useEffect } from 'react';
import { MeteoraPoolInfo } from '@/lib/services/meteora';
import { PositionType, SelectedToken, Strategy } from '../utils/types';
import { getRecommendedStrategy } from '../utils/strategyRecommendations';
import { useMeteoraTokenCalculations } from './useMeteoraTokenCalculations';
import { useMeteoraBinCalculations } from './useMeteoraBinCalculations';

/**
 * Main hook for managing position creation state and logic
 */
export function useMeteoraPositionCreation(pool: MeteoraPoolInfo) {
  // Step 1: Position Type Selection state
  const [positionType, setPositionType] = useState<PositionType>('both');
  const [selectedToken, setSelectedToken] = useState<SelectedToken>(null);

  // Step 2: SOL Allocation state
  const [totalSolAllocation, setTotalSolAllocation] = useState<number>(0);
  const [availableSolBalance] = useState<number>(2.5); // Mock balance for now

  // Step 4: Strategy state (range is fixed based on position type)
  const [strategy, setStrategy] = useState<Strategy>('spot');

  // Check if position type is ready
  const isPositionTypeReady = positionType === 'both' || (positionType === 'single' && selectedToken);

  // Use token calculations hook
  const tokenCalculations = useMeteoraTokenCalculations(
    positionType,
    selectedToken,
    totalSolAllocation,
    pool.current_price,
    isPositionTypeReady
  );

  // Use bin calculations hook
  const binCalculations = useMeteoraBinCalculations(
    pool,
    positionType,
    selectedToken
  );

  // Set smart defaults when position type or token selection changes
  useEffect(() => {
    if (isPositionTypeReady) {
      const recommended = getRecommendedStrategy(positionType);
      setStrategy(recommended);
    }
  }, [positionType, selectedToken, isPositionTypeReady]);

  // Check if strategy and range are configured
  const hasStrategyConfig = tokenCalculations.hasTokenCalculations && strategy;

  // Event handlers
  const handlePositionTypeChange = (value: PositionType) => {
    setPositionType(value);
    // Reset token selection when switching position types
    setSelectedToken(null);
  };

  const handleTokenSelection = (value: SelectedToken) => {
    setSelectedToken(value);
  };

  const handleSolAllocationChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setTotalSolAllocation(Math.min(numValue, availableSolBalance));
  };

  const handlePercentageClick = (percentage: number) => {
    const amount = (availableSolBalance * percentage) / 100;
    setTotalSolAllocation(amount);
  };

  const handleStrategyChange = (newStrategy: Strategy) => {
    setStrategy(newStrategy);
  };

  const handleResetToEdit = () => {
    setTotalSolAllocation(0);
  };

  return {
    // State
    positionType,
    selectedToken,
    totalSolAllocation,
    availableSolBalance,
    strategy,
    isPositionTypeReady,
    hasStrategyConfig,
    
    // Computed values from hooks
    ...tokenCalculations,
    ...binCalculations,
    
    // Event handlers
    handlePositionTypeChange,
    handleTokenSelection,
    handleSolAllocationChange,
    handlePercentageClick,
    handleStrategyChange,
    handleResetToEdit
  };
}