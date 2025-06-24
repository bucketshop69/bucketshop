'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MeteoraPoolInfo } from '@/lib/services/meteora';
import { BarChart, Bar, ResponsiveContainer } from 'recharts';

interface PositionConfigFormProps {
  pool: MeteoraPoolInfo;
}

// Position creation state types
type PositionType = 'single' | 'both';
type SelectedToken = 'tokenX' | 'tokenY' | null;

export function PositionConfigForm({ pool }: PositionConfigFormProps) {
  // Extract token symbols from pool name (e.g., "GOR-SOL" -> "GOR", "SOL")
  const [tokenXSymbol, tokenYSymbol] = pool.name.split('-');

  // Step 1: Position Type Selection state
  const [positionType, setPositionType] = useState<PositionType>('both');
  const [selectedToken, setSelectedToken] = useState<SelectedToken>(null);

  // Step 2: SOL Allocation state
  const [totalSolAllocation, setTotalSolAllocation] = useState<number>(0);
  const [availableSolBalance] = useState<number>(2.5); // Mock balance for now

  // Step 3: Calculated Token Amounts state
  const [calculatedTokenXAmount, setCalculatedTokenXAmount] = useState<number>(0);
  const [calculatedTokenYAmount, setCalculatedTokenYAmount] = useState<number>(0);
  const [requiresSwap, setRequiresSwap] = useState<boolean>(false);

  // Step 4: Strategy state (range is fixed based on position type)
  const [strategy, setStrategy] = useState<'spot' | 'curve' | 'bidask'>('spot');

  // Handle position type change
  const handlePositionTypeChange = (value: PositionType) => {
    setPositionType(value);
    // Reset token selection when switching position types
    setSelectedToken(null);
  };

  // Handle token selection for single positions
  const handleTokenSelection = (value: SelectedToken) => {
    setSelectedToken(value);
  };

  // Handle SOL allocation input
  const handleSolAllocationChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setTotalSolAllocation(Math.min(numValue, availableSolBalance));
  };

  // Handle percentage button clicks
  const handlePercentageClick = (percentage: number) => {
    const amount = (availableSolBalance * percentage) / 100;
    setTotalSolAllocation(amount);
  };

  // Check if position type is ready
  const isPositionTypeReady = positionType === 'both' || (positionType === 'single' && selectedToken);

  // Calculate token amounts based on position type and SOL allocation
  useEffect(() => {
    if (!isPositionTypeReady || totalSolAllocation <= 0) {
      setCalculatedTokenXAmount(0);
      setCalculatedTokenYAmount(0);
      setRequiresSwap(false);
      return;
    }

    const currentPrice = pool.current_price;

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
      // Both tokens: Simple 50/50 split for now (will enhance in Task 4)
      const halfAllocation = totalSolAllocation / 2;
      const tokenXFromHalf = halfAllocation / currentPrice;

      setCalculatedTokenXAmount(tokenXFromHalf);
      setCalculatedTokenYAmount(halfAllocation);
      setRequiresSwap(true); // Need to swap half SOL → TokenX
    }
  }, [positionType, selectedToken, totalSolAllocation, pool.current_price, isPositionTypeReady]);

  // Calculate dynamic bin ranges based on actual pool data
  const calculateBinRanges = () => {
    // Get actual bin step from pool (supports any bin step: 1, 5, 10, 20, 25, 50, 100, etc.)
    const binStep = pool.bin_step;
    const currentBin = 34; // Would get from pool.activeBin - TODO: implement
    const totalBins = 69; // DLMM constant
    
    const stepDecimal = binStep / 10000; // Convert bp to decimal
    const binsBelow = currentBin - 1; // bins [1 to currentBin-1] = 33 bins
    const binsAbove = totalBins - currentBin; // bins [currentBin+1 to 69] = 35 bins
    
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
  };

  // Check if we have token calculations ready
  const hasTokenCalculations = totalSolAllocation > 0 && (calculatedTokenXAmount > 0 || calculatedTokenYAmount > 0);

  // Smart strategy recommendations based on position type
  const getRecommendedStrategy = () => {
    if (positionType === 'single') {
      return 'bidask'; // Best for directional bets
    }
    return 'spot'; // Safe default for both tokens
  };

  // Set smart defaults when position type or token selection changes
  useEffect(() => {
    if (isPositionTypeReady) {
      const recommended = getRecommendedStrategy();
      setStrategy(recommended);
    }
  }, [positionType, selectedToken, isPositionTypeReady]);

  // Handle strategy selection
  const handleStrategyChange = (newStrategy: 'spot' | 'curve' | 'bidask') => {
    setStrategy(newStrategy);
  };

  // Calculate range prices for display using dynamic bin calculation
  const getCurrentPrice = () => pool.current_price;
  const getRangeDisplay = () => {
    const currentPrice = getCurrentPrice();
    const binRanges = calculateBinRanges();
    
    // Get the appropriate range based on position type
    let rangeConfig;
    if (positionType === 'both') {
      rangeConfig = binRanges.bothTokens;
    } else if (selectedToken === 'tokenX') {
      rangeConfig = binRanges.tokenXOnly;
    } else {
      rangeConfig = binRanges.tokenYOnly;
    }
    
    return {
      min: currentPrice * (1 + rangeConfig.min / 100),
      max: currentPrice * (1 + rangeConfig.max / 100),
      description: rangeConfig.description,
      percentageRange: `${rangeConfig.min.toFixed(2)}% to ${rangeConfig.max.toFixed(2)}%`
    };
  };

  // Check if strategy and range are configured
  const hasStrategyConfig = hasTokenCalculations && strategy;

  // Generate bin data for visualization using actual ranges
  const generateBinData = () => {
    const binRanges = calculateBinRanges();
    const totalBins = 69;
    
    // Get the appropriate range based on position type
    let rangeConfig;
    if (positionType === 'both') {
      rangeConfig = binRanges.bothTokens;
    } else if (selectedToken === 'tokenX') {
      rangeConfig = binRanges.tokenXOnly;
    } else {
      rangeConfig = binRanges.tokenYOnly;
    }
    
    const [startBin, endBin] = rangeConfig.binRange;
    const currentPriceBin = 34; // Current price bin (from calculateBinRanges)

    return Array.from({ length: totalBins }, (_, index) => {
      const isSelected = index >= startBin && index <= endBin;
      const isCurrent = index === currentPriceBin;

      return {
        bin: index,
        height: isSelected ? 100 : 20, // Selected bins are taller
        fill: isCurrent ? '#ef4444' : isSelected ? '#3b82f6' : '#e5e7eb',
        price: getCurrentPrice() * Math.pow(1.0025, index - currentPriceBin) // Mock bin step calculation
      };
    });
  };

  return (
    <Card className="p-3">
      <h3 className="text-sm font-medium mb-3">Create Position</h3>

      <div className="space-y-3">
        {/* Compact Position Type Selection */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Position Type</div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={positionType === 'both' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePositionTypeChange('both')}
              className="h-8 text-xs"
            >
              Both Tokens
            </Button>
            <Button
              variant={positionType === 'single' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePositionTypeChange('single')}
              className="h-8 text-xs"
            >
              Single Token
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            {positionType === 'both'
              ? `LP with ${tokenXSymbol} + ${tokenYSymbol}`
              : 'Directional bet with one token'
            }
          </div>
        </div>

        {/* Compact Token Selection for Single Positions */}
        {positionType === 'single' && (
          <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
            <div className="text-xs font-medium text-muted-foreground">Select Token</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={selectedToken === 'tokenX' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTokenSelection('tokenX')}
                className="h-8 text-xs"
              >
                {tokenXSymbol}
              </Button>
              <Button
                variant={selectedToken === 'tokenY' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTokenSelection('tokenY')}
                className="h-8 text-xs"
              >
                {tokenYSymbol}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              {selectedToken === 'tokenX'
                ? `Bullish on ${tokenXSymbol}`
                : selectedToken === 'tokenY'
                  ? `Using ${tokenYSymbol} directly`
                  : 'Choose your direction'
              }
            </div>
          </div>
        )}

        {/* SOL Allocation Section - Step 2 */}
        {isPositionTypeReady && (
          <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
            <div className="text-xs font-medium text-muted-foreground">SOL to Allocate</div>

            {/* SOL Input with Balance */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>Amount</span>
                <span className="text-muted-foreground">
                  Balance: {availableSolBalance.toFixed(2)} SOL
                </span>
              </div>
              <Input
                type="number"
                placeholder="0.0"
                value={totalSolAllocation || ''}
                onChange={(e) => handleSolAllocationChange(e.target.value)}
                className="h-8 text-sm"
                step="0.1"
                min="0"
                max={availableSolBalance}
              />
            </div>

            {/* Percentage Quick Buttons */}
            <div className="grid grid-cols-4 gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePercentageClick(25)}
                className="h-6 text-xs px-1"
              >
                25%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePercentageClick(50)}
                className="h-6 text-xs px-1"
              >
                50%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePercentageClick(75)}
                className="h-6 text-xs px-1"
              >
                75%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePercentageClick(100)}
                className="h-6 text-xs px-1"
              >
                MAX
              </Button>
            </div>

            {/* Allocation Feedback */}
            <div className="text-xs text-muted-foreground">
              {totalSolAllocation > 0
                ? `Allocating ${totalSolAllocation.toFixed(2)} SOL`
                : 'Enter amount to continue'
              }
            </div>
          </div>
        )}
        {/* Strategy & Range Selection - Step 4 */}
        {hasTokenCalculations && (
          <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
            <div className="text-xs font-medium text-muted-foreground">Strategy</div>

            {/* Strategy Selection with Visual Indicators */}
            <div className="grid grid-cols-3 gap-1">
              <Button
                variant={strategy === 'spot' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStrategyChange('spot')}
                className="h-8 text-xs flex flex-col p-1"
              >
                <div className="text-xs">Spot</div>
              </Button>
              <Button
                variant={strategy === 'curve' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStrategyChange('curve')}
                className="h-8 text-xs flex flex-col p-1"
              >
                <div className="text-xs">Curve</div>
              </Button>
              <Button
                variant={strategy === 'bidask' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStrategyChange('bidask')}
                className="h-8 text-xs flex flex-col p-1"
              >
                <div className="text-xs">Bid-Ask</div>
              </Button>
            </div>

            {/* Visual Bin Range Configuration */}
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">
                Range ({pool.bin_step}bp step)
              </div>

              {/* BrushBarChart Bin Visualization */}
              <div className="space-y-1">
                <div className="h-16 w-full bg-muted/20 rounded p-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={generateBinData()} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                      <Bar
                        dataKey="height"
                        fill="#3b82f6"
                        stroke="none"
                        radius={[1, 1, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Range description */}
                <div className="text-xs text-muted-foreground text-center">
                  {positionType === 'both' && "← 33 below • current • 35 above →"}
                  {positionType === 'single' && selectedToken === 'tokenX' && "current • 35 bins above →"}
                  {positionType === 'single' && selectedToken === 'tokenY' && "← 33 bins below • current"}
                </div>

                {/* Bin count display - fixed for DLMM */}
                <div className="flex items-center justify-center">
                  <div className="text-center text-xs font-medium">
                    {positionType === 'both' ? '69 bins (full range)' : 
                     selectedToken === 'tokenX' ? '35 bins (above)' : 
                     '33 bins (below)'}
                  </div>
                </div>

                {/* Price range display with percentages */}
                <div className="text-xs text-muted-foreground text-center space-y-1">
                  <div>${getRangeDisplay().min.toFixed(2)} - ${getRangeDisplay().max.toFixed(2)}</div>
                  <div className="text-xs opacity-75">{getRangeDisplay().percentageRange}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Final Transaction Preview */}
        {hasStrategyConfig && (
          <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
            <div className="text-xs font-medium text-muted-foreground">Transaction Preview</div>
            <div className="border rounded p-2 text-xs space-y-1">
              <div className="font-medium">
                {totalSolAllocation.toFixed(2)} SOL → {
                  positionType === 'single' && selectedToken === 'tokenX' ?
                    `~${calculatedTokenXAmount.toFixed(4)} ${tokenXSymbol}` :
                    positionType === 'single' && selectedToken === 'tokenY' ?
                      `${calculatedTokenYAmount.toFixed(2)} ${tokenYSymbol}` :
                      `${calculatedTokenYAmount.toFixed(2)} ${tokenYSymbol} + ~${calculatedTokenXAmount.toFixed(4)} ${tokenXSymbol}`
                }
              </div>
              <div className="text-muted-foreground">
                Strategy: {strategy === 'spot' ? 'Spot (Balanced)' : strategy === 'curve' ? 'Curve (Focused)' : 'Bid-Ask (Volatile)'}
              </div>
              <div className="text-muted-foreground">
                Range: {getRangeDisplay().description} (${getRangeDisplay().min.toFixed(2)}-${getRangeDisplay().max.toFixed(2)})
              </div>
              <div className="text-muted-foreground">
                {requiresSwap ? '2 transactions' : '1 transaction'} + gas fees
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  // Reset to first step for editing
                  setTotalSolAllocation(0);
                }}
              >
                Edit
              </Button>
              <Button
                variant="default"
                size="sm"
                className="h-8 text-xs"
              >
                Create Position
              </Button>
            </div>
          </div>
        )}

        {/* Compact Progress Status */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {!isPositionTypeReady ? 'Step 1/4' :
                !totalSolAllocation ? 'Step 1/4' :
                  !hasTokenCalculations ? 'Step 2/4' :
                    !hasStrategyConfig ? 'Step 3/4' : 'Step 4/4'}
            </span>
            <span className="text-green-600 font-medium">
              {!isPositionTypeReady ? 'Pending' :
                !totalSolAllocation ? 'Pending' :
                  !hasTokenCalculations ? 'Pending' :
                    !hasStrategyConfig ? 'Pending' : '✓ Complete'}
            </span>
          </div>
        </div>

        {/* Next Step Indicator */}
        {!hasStrategyConfig && (
          <div className="text-center py-2 text-xs text-muted-foreground bg-muted/20 rounded border">
            {!isPositionTypeReady ?
              'Select position type to continue' :
              !totalSolAllocation ?
                'Enter SOL amount to continue' :
                !hasTokenCalculations ?
                  'Calculating tokens...' :
                  'Configure strategy & range'
            }
          </div>
        )}
      </div>
    </Card>
  );
}