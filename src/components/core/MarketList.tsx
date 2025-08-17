'use client';

import { theme } from '@/lib/theme';

interface MarketOption {
  symbol: string;
  displayName?: string;
}

interface MarketListProps {
  selectedSymbol: string;
  availableMarkets: MarketOption[];
  isLoading?: boolean;
  onMarketSelect: (symbol: string) => void;
}

export default function MarketList({
  selectedSymbol,
  availableMarkets,
  isLoading = false,
  onMarketSelect
}: MarketListProps) {

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="p-4 border-b" style={{ borderColor: theme.grid.primary }}>
          <div className="flex items-center gap-2">
            <span style={{ color: theme.text.secondary }}>Loading markets...</span>
            <div
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
              style={{ borderColor: theme.text.secondary }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (availableMarkets.length === 0) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="p-4 text-center">
          <span style={{ color: theme.text.secondary }}>
            No markets available
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Markets List */}
      <div className="flex-1 overflow-y-auto">
        {availableMarkets.map((market) => (
          <button
            key={market.symbol}
            onClick={() => onMarketSelect(market.symbol)}
            className={`
              w-full px-4 py-3 text-left border-b transition-colors duration-150
              hover:bg-opacity-80 focus:bg-opacity-80 focus:outline-none cursor-pointer
              ${market.symbol === selectedSymbol ? 'bg-opacity-20' : ''}
            `}
            style={{
              borderColor: theme.grid.primary,
              backgroundColor: market.symbol === selectedSymbol
                ? theme.background.tertiary
                : 'transparent',
              color: theme.text.primary
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-sm">
                  {market.displayName || market.symbol}
                </span>
                {market.symbol !== (market.displayName || market.symbol) && (
                  <span
                    className="text-xs opacity-60"
                    style={{ color: theme.text.secondary }}
                  >
                    {market.symbol}
                  </span>
                )}
              </div>

              {market.symbol === selectedSymbol && (
                <span
                  className="text-xs font-medium"
                  style={{ color: theme.text.secondary }}
                >
                  Current
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}