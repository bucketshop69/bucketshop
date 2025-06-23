'use client';

import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { toggleGroupExpansion, isGroupExpanded } from '@/store/slices/meteoraSlice';
import { MeteoraTokenGroup } from '@/lib/services/meteora';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, TrendingUp } from 'lucide-react';
import { PoolStrip } from './PoolStrip';

interface GroupStripProps {
  group: MeteoraTokenGroup;
}

/**
 * Group Strip Component
 * 
 * Displays a token pair group (e.g., SOL-USDC) with:
 * - Token pair name and aggregate metrics
 * - Number of available pools in group
 * - Expand/collapse functionality
 * - When expanded: shows individual pool strips
 */
export function GroupStrip({ group }: GroupStripProps) {
  const dispatch = useDispatch<AppDispatch>();
  const expanded = useSelector((state: any) => isGroupExpanded(state, group.name));

  const handleToggleExpansion = () => {
    dispatch(toggleGroupExpansion(group.name));
  };

  // Use pre-calculated aggregates from service layer
  const { totalLiquidity, totalVolume24h, highestAPR, totalPools } = group.aggregates;

  // Format large numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toFixed(2);
  };

  const formatCurrency = (amount: number) => {
    return `$${formatNumber(amount)}`;
  };

  return (
    <div>
      {/* Group Header - Always Visible */}
      <Card className="p-1 hover:bg-muted/20 transition-colors cursor-pointer group">
        <div className="space-y-2" onClick={handleToggleExpansion}>
          {/* Token Pair Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {expanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-semibold text-sm">{group.name}</span>
              </div>
            </div>
          </div>

          {/* Aggregate Metrics */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-muted-foreground">Best APR</div>
              <div className="font-medium flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                {highestAPR.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Total Liquidity</div>
              <div className="font-medium">
                {formatCurrency(totalLiquidity)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Vol 24h</div>
              <div className="font-medium">
                {formatCurrency(totalVolume24h)}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Expanded Pool List */}
      {expanded && (
        <div className="ml-4 mt-1 space-y-1 border-l-2 border-muted/30 pl-2">
          {group.pairs.map((pool) => (
            <PoolStrip key={pool.address} pool={pool} isNested={true} />
          ))}

          {/* Pool count info */}
          {totalPools > group.pairs.length && (
            <div className="text-xs text-muted-foreground text-center bg-muted/10 rounded">
              Showing {group.pairs.length} of {totalPools} pools
              {/* Future: Add "Show More" button here */}
            </div>
          )}
        </div>
      )}
    </div>
  );
}