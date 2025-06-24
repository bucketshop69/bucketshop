'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SolAllocationInputProps {
  totalSolAllocation: number;
  availableSolBalance: number;
  onSolAllocationChange: (value: string) => void;
  onPercentageClick: (percentage: number) => void;
}

export function SolAllocationInput({
  totalSolAllocation,
  availableSolBalance,
  onSolAllocationChange,
  onPercentageClick
}: SolAllocationInputProps) {
  return (
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
          onChange={(e) => onSolAllocationChange(e.target.value)}
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
          onClick={() => onPercentageClick(25)}
          className="h-6 text-xs px-1"
        >
          25%
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPercentageClick(50)}
          className="h-6 text-xs px-1"
        >
          50%
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPercentageClick(75)}
          className="h-6 text-xs px-1"
        >
          75%
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPercentageClick(100)}
          className="h-6 text-xs px-1"
        >
          MAX
        </Button>
      </div>
    </div>
  );
}