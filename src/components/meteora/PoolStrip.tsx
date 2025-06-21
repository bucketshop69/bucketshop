'use client';

import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { selectPool } from '@/store/slices/meteoraSlice';
import { MeteoraPoolInfo } from '@/lib/services/meteora';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, TrendingUp } from 'lucide-react';

interface PoolStripProps {
  pool: MeteoraPoolInfo;
  isNested?: boolean;
}

/**
 * Pool Strip Component
 * 
 * Displays a single pool in a compact strip format:
 * - Token pair with symbols
 * - Key metrics (APR, liquidity, volume)
 * - Select button for pool selection
 * - Optimized for narrow 25% panel width
 */
export function PoolStrip({ pool, isNested = false }: PoolStripProps) {
  const dispatch = useDispatch<AppDispatch>();

  const handleSelectPool = () => {
    dispatch(selectPool(pool.address));
    // TODO: Navigate to pool detail/position creation
    console.log('Selected pool:', pool.name);
  };

  // Format large numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toFixed(2);
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${formatNumber(num)}`;
  };

  return (
    <Card 
      className={`${isNested ? 'p-1.5' : 'p-2'} hover:bg-muted/20 transition-colors cursor-pointer ${isNested ? 'bg-muted/5' : ''}`}
      onClick={handleSelectPool}
    >
      {isNested ? (
        // Compact nested layout
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium">Bin {pool.bin_step}</span>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs font-medium">{(pool.apr || 0).toFixed(1)}%</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {formatCurrency(pool.liquidity || '0')}
          </div>
        </div>
      ) : (
        // Regular layout for non-nested
        <div className="space-y-1">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{pool.name}</span>
            <Badge variant="outline" className="text-xs h-4 px-1">
              {pool.bin_step}
            </Badge>
          </div>
          
          {/* Metrics in single row */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="font-medium">{(pool.apr || 0).toFixed(1)}%</span>
            </div>
            <span className="font-medium">{formatCurrency(pool.liquidity || '0')}</span>
            <span className="text-muted-foreground">{formatCurrency(pool.trade_volume_24h || 0)}</span>
          </div>
        </div>
      )}
    </Card>
  );
}