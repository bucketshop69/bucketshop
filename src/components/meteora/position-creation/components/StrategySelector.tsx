'use client';

import { Button } from '@/components/ui/button';
import { Strategy } from '../utils/types';
import { getStrategyInfo, getStrategyPattern } from '../utils/strategyRecommendations';

interface StrategySelectorProps {
  strategy: Strategy;
  onStrategyChange: (strategy: Strategy) => void;
}

export function StrategySelector({
  strategy,
  onStrategyChange
}: StrategySelectorProps) {
  const strategies: Strategy[] = ['spot', 'curve', 'bidask'];

  return (
    <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
      <div className="text-xs font-medium text-muted-foreground">Distribution Strategy</div>
      
      <div className="grid grid-cols-3 gap-1">
        {strategies.map((strategyOption) => {
          const info = getStrategyInfo(strategyOption);
          const isSelected = strategy === strategyOption;
          
          return (
            <Button
              key={strategyOption}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStrategyChange(strategyOption)}
              className="h-auto p-2 text-xs flex flex-col items-center gap-1"
            >
              <div className="text-lg leading-none">{info.icon}</div>
              <div className="font-medium">{strategyOption.charAt(0).toUpperCase() + strategyOption.slice(1)}</div>
              <div className="text-xs opacity-75">{info.riskLevel}</div>
            </Button>
          );
        })}
      </div>

      {/* Strategy Pattern Visualization */}
      <div className="text-center space-y-1">
        <div className="text-xs font-mono bg-muted/50 rounded px-2 py-1">
          {getStrategyPattern(strategy)}
        </div>
        <div className="text-xs text-muted-foreground">
          {getStrategyInfo(strategy).description}
        </div>
      </div>
    </div>
  );
}