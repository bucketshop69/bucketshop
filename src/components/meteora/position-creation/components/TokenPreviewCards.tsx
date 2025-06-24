'use client';

import { PositionType, SelectedToken } from '../utils/types';

interface TokenPreviewCardsProps {
  positionType: PositionType;
  selectedToken: SelectedToken;
  totalSolAllocation: number;
  calculatedTokenXAmount: number;
  calculatedTokenYAmount: number;
  tokenXSymbol: string;
  tokenYSymbol: string;
}

export function TokenPreviewCards({
  positionType,
  selectedToken,
  totalSolAllocation,
  calculatedTokenXAmount,
  calculatedTokenYAmount,
  tokenXSymbol,
  tokenYSymbol
}: TokenPreviewCardsProps) {
  return (
    <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
      <div className="text-xs font-medium text-muted-foreground">Token Allocation Preview</div>
      
      <div className="grid gap-2">
        {positionType === 'single' && selectedToken === 'tokenX' && (
          <div className="border rounded p-2 bg-blue-50 dark:bg-blue-950/20">
            <div className="text-xs font-medium text-blue-700 dark:text-blue-300">
              Will buy ~{calculatedTokenXAmount.toFixed(4)} {tokenXSymbol}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Using {totalSolAllocation.toFixed(2)} SOL
            </div>
          </div>
        )}
        
        {positionType === 'single' && selectedToken === 'tokenY' && (
          <div className="border rounded p-2 bg-green-50 dark:bg-green-950/20">
            <div className="text-xs font-medium text-green-700 dark:text-green-300">
              Will use {calculatedTokenYAmount.toFixed(2)} {tokenYSymbol}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              Direct allocation, no swap needed
            </div>
          </div>
        )}
        
        {positionType === 'both' && (
          <div className="grid grid-cols-2 gap-2">
            <div className="border rounded p-2 bg-blue-50 dark:bg-blue-950/20">
              <div className="text-xs font-medium text-blue-700 dark:text-blue-300">
                ~{calculatedTokenXAmount.toFixed(4)} {tokenXSymbol}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                From {(totalSolAllocation / 2).toFixed(2)} SOL
              </div>
            </div>
            <div className="border rounded p-2 bg-green-50 dark:bg-green-950/20">
              <div className="text-xs font-medium text-green-700 dark:text-green-300">
                {calculatedTokenYAmount.toFixed(2)} {tokenYSymbol}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                Direct allocation
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}