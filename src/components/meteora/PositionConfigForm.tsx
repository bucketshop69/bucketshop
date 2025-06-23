'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MeteoraPoolInfo } from '@/lib/services/meteora';
import { BarChart, Bar, Brush, ResponsiveContainer } from 'recharts';

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

  // Step 4: Strategy & Range state
  const [strategy, setStrategy] = useState<'spot' | 'curve' | 'bidask'>('spot');
  const [rangePercentage, setRangePercentage] = useState<number>(25);
  const [rangeType, setRangeType] = useState<'symmetric' | 'asymmetric-above' | 'asymmetric-below'>('symmetric');

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

      // Set range type based on position
      if (positionType === 'single') {
        if (selectedToken === 'tokenX') {
          setRangeType('asymmetric-above'); // Bullish
        } else if (selectedToken === 'tokenY') {
          setRangeType('asymmetric-below'); // Bearish
        }
      } else {
        setRangeType('symmetric'); // Both tokens
      }
    }
  }, [positionType, selectedToken, isPositionTypeReady]);

  // Handle strategy selection
  const handleStrategyChange = (newStrategy: 'spot' | 'curve' | 'bidask') => {
    setStrategy(newStrategy);
  };

  // Calculate range prices for display
  const getCurrentPrice = () => pool.current_price;
  const getRangeDisplay = () => {
    const currentPrice = getCurrentPrice();
    const percentage = rangePercentage / 100;

    if (rangeType === 'symmetric') {
      return {
        min: currentPrice * (1 - percentage),
        max: currentPrice * (1 + percentage),
        description: `±${rangePercentage}% around current`
      };
    } else if (rangeType === 'asymmetric-above') {
      return {
        min: currentPrice,
        max: currentPrice * (1 + percentage),
        description: `+${rangePercentage}% above current`
      };
    } else {
      return {
        min: currentPrice * (1 - percentage),
        max: currentPrice,
        description: `${rangePercentage}% below current`
      };
    }
  };

  // Check if strategy and range are configured
  const hasStrategyConfig = hasTokenCalculations && strategy;

  // Generate bin data for visualization (69 bins total)
  const generateBinData = () => {
    const totalBins = 69;
    const currentPriceBin = Math.floor(totalBins / 2); // Center bin
    const selectedBinCount = 20; // Fixed for now, will make dynamic later
    
    let startBin = currentPriceBin - Math.floor(selectedBinCount / 2);
    let endBin = currentPriceBin + Math.floor(selectedBinCount / 2);
    
    // Adjust for asymmetric ranges
    if (rangeType === 'asymmetric-above') {
      startBin = currentPriceBin;
      endBin = currentPriceBin + selectedBinCount;
    } else if (rangeType === 'asymmetric-below') {
      startBin = currentPriceBin - selectedBinCount;
      endBin = currentPriceBin;
    }
    
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

        {/* Token Calculations Preview - Step 3 */}
        {hasTokenCalculations && (
          <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
            <div className="text-xs font-medium text-muted-foreground">Token Preview</div>

            {/* Token Amount Cards */}
            <div className="space-y-1">
              {positionType === 'single' && selectedToken === 'tokenX' && (
                <div className="border  rounded p-2 text-xs">
                  <div className="font-medium">
                    Will buy ~{calculatedTokenXAmount.toFixed(4)} {tokenXSymbol}
                  </div>
                  <div className="">
                    {requiresSwap ? '1 transaction: SOL → ' + tokenXSymbol : 'Direct purchase'}
                  </div>
                </div>
              )}

              {positionType === 'single' && selectedToken === 'tokenY' && (
                <div className="bg-green-50 border border-green-200 rounded p-2 text-xs">
                  <div className="font-medium text-green-900">
                    Using {calculatedTokenYAmount.toFixed(2)} {tokenYSymbol} directly
                  </div>
                  <div className="text-green-700">
                    No swap needed
                  </div>
                </div>
              )}

              {positionType === 'both' && (
                <div className="bg-purple-50 border border-purple-200 rounded p-2 text-xs space-y-1">
                  <div className="font-medium text-purple-900">
                    Will use {calculatedTokenYAmount.toFixed(2)} {tokenYSymbol} + ~{calculatedTokenXAmount.toFixed(4)} {tokenXSymbol}
                  </div>
                  <div className="text-purple-700">
                    {requiresSwap ? '2 transactions: SOL → ' + tokenXSymbol + ' + position creation' : '1 transaction'}
                  </div>
                </div>
              )}
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
                <div className="text-xs mb-1">Spot</div>
              </Button>
              <Button
                variant={strategy === 'curve' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStrategyChange('curve')}
                className="h-8 text-xs flex flex-col p-1"
              >
                <div className="text-xs mb-1">Curve</div>
              </Button>
              <Button
                variant={strategy === 'bidask' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStrategyChange('bidask')}
                className="h-8 text-xs flex flex-col p-1"
              >
                <div className="text-xs mb-1">Bid-Ask</div>
              </Button>
            </div>

            {/* Visual Bin Range Configuration */}
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Range (20 bins)</div>
              
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
                      <Brush 
                        dataKey="bin"
                        height={8}
                        stroke="#3b82f6"
                        fill="#3b82f620"
                        startIndex={24}
                        endIndex={44}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Range description */}
                <div className="text-xs text-muted-foreground text-center">
                  {rangeType === 'symmetric' && "← 10 below • current • 10 above →"}
                  {rangeType === 'asymmetric-above' && "current • 20 bins above →"}
                  {rangeType === 'asymmetric-below' && "← 20 bins below • current"}
                </div>

                {/* Bin count controls */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRangePercentage(Math.max(5, rangePercentage - 5))}
                    className="h-6 w-6 p-0 text-xs"
                    disabled={rangePercentage <= 5}
                  >
                    -
                  </Button>
                  <div className="flex-1 text-center text-xs font-medium">
                    20 bins
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRangePercentage(Math.min(50, rangePercentage + 5))}
                    className="h-6 w-6 p-0 text-xs"
                    disabled={rangePercentage >= 50}
                  >
                    +
                  </Button>
                </div>

                {/* Price range display */}
                <div className="text-xs text-muted-foreground text-center">
                  ${getRangeDisplay().min.toFixed(2)} - ${getRangeDisplay().max.toFixed(2)}
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