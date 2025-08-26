'use client';

import React from 'react';
import useSWR from 'swr';
import { theme } from '@/lib/theme';

interface MarketData {
  symbol: string;
  displayName: string;
  price: number | null;
  priceChange24h: number | null;
  quoteVolume: number;
  baseVolume: number;
  marketIndex: number;
  marketType: string;
  openInterest: number;
  lastUpdated: number;
}

interface MarketsApiResponse {
  success: boolean;
  markets: MarketData[];
  count: number;
  lastUpdated: number | null;
  message?: string;
}

interface MarketListProps {
  selectedSymbol: string;
  onMarketSelect: (symbol: string) => void;
}

// Format volume to readable format
function formatVolume(volume: number): string {
  if (volume >= 1_000_000) {
    return `$${(volume / 1_000_000).toFixed(1)}M`;
  } else if (volume >= 1_000) {
    return `$${(volume / 1_000).toFixed(1)}K`;
  } else {
    return `$${volume.toFixed(2)}`;
  }
}

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MarketList({
  selectedSymbol,
  onMarketSelect
}: MarketListProps) {
  // Fetch market data from our API (backend handles auto-refresh internally)
  const { data, error, isLoading } = useSWR<MarketsApiResponse>(
    '/api/drift/markets',
    fetcher,
    {
      refreshInterval: 60000, // Refresh every 60 seconds
      revalidateOnFocus: false
    }
  );

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="p-4 border-b" style={{ borderColor: theme.grid.primary }}>
          <div className="flex items-center gap-2">
            <span style={{ color: theme.text.secondary }}>
              Loading markets...
            </span>
            <div
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
              style={{ borderColor: theme.text.secondary }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="p-4 text-center">
          <span style={{ color: theme.text.secondary }}>
            Failed to load markets
          </span>
        </div>
      </div>
    );
  }

  const markets = data.markets || [];

  if (markets.length === 0) {
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
        {markets.map((market) => (
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
                  {market.symbol}
                </span>
                <span
                  className="text-xs opacity-60"
                  style={{ color: theme.text.secondary }}
                >
                  {market.marketType.toUpperCase()}
                </span>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-sm font-medium">
                  {formatVolume(market.quoteVolume)}
                </span>
                {market.symbol === selectedSymbol && (
                  <span
                    className="text-xs font-medium"
                    style={{ color: theme.text.secondary }}
                  >
                    Current
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}