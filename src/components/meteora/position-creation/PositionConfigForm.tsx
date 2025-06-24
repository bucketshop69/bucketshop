'use client';

import { Card } from '@/components/ui/card';
import { MeteoraPoolInfo } from '@/lib/services/meteora';
import { useMeteoraPositionCreation } from './hooks/useMeteoraPositionCreation';
import { PositionTypeSelector } from './components/PositionTypeSelector';
import { SolAllocationInput } from './components/SolAllocationInput';
import { TokenPreviewCards } from './components/TokenPreviewCards';
import { StrategySelector } from './components/StrategySelector';
import { BinRangeVisualization } from './components/BinRangeVisualization';
import { TransactionPreview } from './components/TransactionPreview';

interface PositionConfigFormProps {
  pool: MeteoraPoolInfo;
}

export function PositionConfigForm({ pool }: PositionConfigFormProps) {
  // Extract token symbols from pool name (e.g., "GOR-SOL" -> "GOR", "SOL")
  const [tokenXSymbol, tokenYSymbol] = pool.name.split('-');

  // Use the main position creation hook
  const {
    // State
    positionType,
    selectedToken,
    totalSolAllocation,
    availableSolBalance,
    strategy,
    isPositionTypeReady,
    hasStrategyConfig,
    
    // Calculated values
    calculatedTokenXAmount,
    calculatedTokenYAmount,
    requiresSwap,
    hasTokenCalculations,
    rangeDisplay,
    binVisualizationData,
    binCountInfo,
    
    // Event handlers
    handlePositionTypeChange,
    handleTokenSelection,
    handleSolAllocationChange,
    handlePercentageClick,
    handleStrategyChange,
    handleResetToEdit
  } = useMeteoraPositionCreation(pool);

  return (
    <Card className="p-3">
      <h3 className="text-sm font-medium mb-3">Create Position</h3>

      <div className="space-y-3">
        {/* Step 1: Position Type Selection */}
        <PositionTypeSelector
          positionType={positionType}
          selectedToken={selectedToken}
          tokenXSymbol={tokenXSymbol}
          tokenYSymbol={tokenYSymbol}
          onPositionTypeChange={handlePositionTypeChange}
          onTokenSelection={handleTokenSelection}
        />

        {/* Step 2: SOL Allocation */}
        {isPositionTypeReady && (
          <SolAllocationInput
            totalSolAllocation={totalSolAllocation}
            availableSolBalance={availableSolBalance}
            onSolAllocationChange={handleSolAllocationChange}
            onPercentageClick={handlePercentageClick}
          />
        )}

        {/* Step 3: Token Allocation Preview */}
        {hasTokenCalculations && (
          <TokenPreviewCards
            positionType={positionType}
            selectedToken={selectedToken}
            totalSolAllocation={totalSolAllocation}
            calculatedTokenXAmount={calculatedTokenXAmount}
            calculatedTokenYAmount={calculatedTokenYAmount}
            tokenXSymbol={tokenXSymbol}
            tokenYSymbol={tokenYSymbol}
          />
        )}

        {/* Step 4: Strategy & Range Configuration */}
        {hasTokenCalculations && (
          <div className="space-y-3">
            <StrategySelector
              strategy={strategy}
              onStrategyChange={handleStrategyChange}
            />

            <BinRangeVisualization
              binVisualizationData={binVisualizationData}
              rangeDisplay={rangeDisplay}
              binCountInfo={binCountInfo}
              binStep={pool.bin_step}
            />
          </div>
        )}

        {/* Step 5: Final Transaction Preview */}
        {hasStrategyConfig && (
          <TransactionPreview
            positionType={positionType}
            selectedToken={selectedToken}
            totalSolAllocation={totalSolAllocation}
            calculatedTokenXAmount={calculatedTokenXAmount}
            calculatedTokenYAmount={calculatedTokenYAmount}
            strategy={strategy}
            requiresSwap={requiresSwap}
            tokenXSymbol={tokenXSymbol}
            tokenYSymbol={tokenYSymbol}
            rangeDescription={rangeDisplay.description}
            rangeMinPrice={rangeDisplay.min}
            rangeMaxPrice={rangeDisplay.max}
            onEdit={handleResetToEdit}
          />
        )}

        {/* Progress Status */}
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