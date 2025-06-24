'use client';

import { Button } from '@/components/ui/button';
import { PositionType, SelectedToken } from '../utils/types';

interface PositionTypeSelectorProps {
  positionType: PositionType;
  selectedToken: SelectedToken;
  tokenXSymbol: string;
  tokenYSymbol: string;
  onPositionTypeChange: (value: PositionType) => void;
  onTokenSelection: (value: SelectedToken) => void;
}

export function PositionTypeSelector({
  positionType,
  selectedToken,
  tokenXSymbol,
  tokenYSymbol,
  onPositionTypeChange,
  onTokenSelection
}: PositionTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground">Position Type</div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={positionType === 'both' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPositionTypeChange('both')}
          className="h-8 text-xs"
        >
          Both Tokens
        </Button>
        <Button
          variant={positionType === 'single' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPositionTypeChange('single')}
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

      {/* Token Selection for Single Positions */}
      {positionType === 'single' && (
        <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
          <div className="text-xs font-medium text-muted-foreground">Select Token</div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={selectedToken === 'tokenX' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTokenSelection('tokenX')}
              className="h-8 text-xs"
            >
              {tokenXSymbol}
            </Button>
            <Button
              variant={selectedToken === 'tokenY' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTokenSelection('tokenY')}
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
    </div>
  );
}