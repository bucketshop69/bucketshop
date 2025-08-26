'use client';

import React from 'react';
import { theme } from '@/lib/theme';
import { useDriftMarkets, useDriftMarketSelection } from '@/shared/store/drift/driftMarketsStore';

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

export default function MarketList() {
    // Use the new drift markets store
    const { markets, isLoading, error, success } = useDriftMarkets();
    const { selectedSymbol, selectMarket } = useDriftMarketSelection();

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

    if (error || !success) {
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
                        onClick={() => selectMarket(market.symbol)}
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