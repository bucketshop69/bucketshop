'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { showPoolSelection } from '@/store/slices/meteoraSlice';
import { MeteoraPoolInfo } from '@/lib/services/meteora';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  TrendingUp, 
  ChevronDown, 
  ChevronRight
} from 'lucide-react';

interface PoolDetailViewProps {
  pool: MeteoraPoolInfo;
}

/**
 * Pool Detail View Component
 * 
 * Displays comprehensive pool information with:
 * - Critical pool metrics (Tier 1)
 * - Expandable detailed information (Tier 2/3)
 * - Back navigation to pool selection via Redux
 * - Current positions list (future)
 * - Inline position creation form (future)
 */
export function PoolDetailView({ pool }: PoolDetailViewProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const handleBackToPoolSelection = () => {
    dispatch(showPoolSelection());
  };

  // Format utilities
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

  const formatPrice = (price: number) => {
    if (price < 0.01) {
      return `$${price.toFixed(6)}`;
    } else if (price < 1) {
      return `$${price.toFixed(4)}`;
    } else {
      return `$${price.toFixed(2)}`;
    }
  };


  return (
    <div className="h-full flex flex-col">
      {/* Header with back button */}
      <div className="p-4 border-b">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBackToPoolSelection}
          className="mb-3"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Pools
        </Button>
        
        {/* Pool title */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">{pool.name}</h2>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {pool.bin_step}% Fee
              </Badge>
              {pool.farm_apr > 0 && (
                <Badge variant="secondary" className="text-xs">
                  🌾 Rewards
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Critical Information (Tier 1) */}
        <div className="p-4 space-y-4">
          {/* Current Price */}
          <Card className="p-4">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Current Price</div>
              <div className="text-2xl font-bold">{formatPrice(pool.current_price)}</div>
            </div>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            {/* APR */}
            <Card className="p-3">
              <div className="text-xs text-muted-foreground mb-1">APR</div>
              <div className="flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                <span className="font-semibold text-sm">
                  {pool.apr.toFixed(1)}%
                  {pool.farm_apr > 0 && (
                    <span className="text-xs text-green-600 ml-1">
                      (+{pool.farm_apr.toFixed(1)}%)
                    </span>
                  )}
                </span>
              </div>
            </Card>

            {/* Liquidity */}
            <Card className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Liquidity</div>
              <div className="font-semibold text-sm">
                {formatCurrency(pool.liquidity)}
              </div>
            </Card>

            {/* 24h Volume */}
            <Card className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Volume 24h</div>
              <div className="font-semibold text-sm">
                {formatCurrency(pool.trade_volume_24h)}
              </div>
            </Card>

            {/* 24h Fees */}
            <Card className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Fees 24h</div>
              <div className="font-semibold text-sm">
                {formatCurrency(pool.fees_24h)}
              </div>
            </Card>
          </div>

          {/* Expandable Details (Tier 2/3) */}
          <Card className="p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDetailsExpanded(!detailsExpanded)}
              className="w-full justify-between p-0 h-auto"
            >
              <span className="text-sm font-medium">Pool Details</span>
              {detailsExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>

            {detailsExpanded && (
              <div className="mt-4 space-y-3 pt-3 border-t">
                {/* Token Reserves */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground">Token X Reserve</div>
                    <div className="font-medium">{formatNumber(pool.reserve_x_amount)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Token Y Reserve</div>
                    <div className="font-medium">{formatNumber(pool.reserve_y_amount)}</div>
                  </div>
                </div>

                {/* Fee Structure */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground">Base Fee</div>
                    <div className="font-medium">{parseFloat(pool.base_fee_percentage).toFixed(3)}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Max Fee</div>
                    <div className="font-medium">{parseFloat(pool.max_fee_percentage).toFixed(3)}%</div>
                  </div>
                </div>

                {/* Additional Metrics */}
                <div className="text-xs">
                  <div className="text-muted-foreground">Total Volume</div>
                  <div className="font-medium">{formatCurrency(pool.cumulative_trade_volume)}</div>
                </div>
              </div>
            )}
          </Card>

          {/* Placeholder sections for future implementation */}
          
          {/* Current Positions Section */}
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-2">Your Positions</h3>
            <div className="text-center py-6 text-muted-foreground">
              <div className="text-xs">No positions found</div>
              <div className="text-xs">Create your first position below</div>
            </div>
          </Card>

          {/* Position Creation Section */}
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3">Create Position</h3>
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-xs mb-2">Position configuration form</div>
              <div className="text-xs">Coming next...</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}