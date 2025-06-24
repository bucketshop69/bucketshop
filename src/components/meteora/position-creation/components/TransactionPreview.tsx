'use client';

import { Button } from '@/components/ui/button';
import { PositionType, SelectedToken, Strategy } from '../utils/types';
import { getStrategyInfo } from '../utils/strategyRecommendations';

interface TransactionPreviewProps {
  positionType: PositionType;
  selectedToken: SelectedToken;
  totalSolAllocation: number;
  calculatedTokenXAmount: number;
  calculatedTokenYAmount: number;
  strategy: Strategy;
  requiresSwap: boolean;
  tokenXSymbol: string;
  tokenYSymbol: string;
  rangeDescription: string;
  rangeMinPrice: number;
  rangeMaxPrice: number;
  onEdit: () => void;
}

export function TransactionPreview({
  positionType,
  selectedToken,
  totalSolAllocation,
  calculatedTokenXAmount,
  calculatedTokenYAmount,
  strategy,
  requiresSwap,
  tokenXSymbol,
  tokenYSymbol,
  rangeDescription,
  rangeMinPrice,
  rangeMaxPrice,
  onEdit
}: TransactionPreviewProps) {
  const strategyInfo = getStrategyInfo(strategy);

  // Format token allocation display
  const tokenAllocationText = (() => {
    if (positionType === 'single' && selectedToken === 'tokenX') {
      return `~${calculatedTokenXAmount.toFixed(4)} ${tokenXSymbol}`;
    } else if (positionType === 'single' && selectedToken === 'tokenY') {
      return `${calculatedTokenYAmount.toFixed(2)} ${tokenYSymbol}`;
    } else {
      return `${calculatedTokenYAmount.toFixed(2)} ${tokenYSymbol} + ~${calculatedTokenXAmount.toFixed(4)} ${tokenXSymbol}`;
    }
  })();

  return (
    <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
      <div className="text-xs font-medium text-muted-foreground">Transaction Preview</div>
      <div className="border rounded p-2 text-xs space-y-1">
        <div className="font-medium">
          {totalSolAllocation.toFixed(2)} SOL → {tokenAllocationText}
        </div>
        <div className="text-muted-foreground">
          Strategy: {strategyInfo.name}
        </div>
        <div className="text-muted-foreground">
          Range: {rangeDescription} (${rangeMinPrice.toFixed(2)}-${rangeMaxPrice.toFixed(2)})
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
          onClick={onEdit}
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
  );
}