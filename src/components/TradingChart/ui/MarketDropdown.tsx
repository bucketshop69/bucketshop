'use client';

import { BUCKETSHOP_ELITE_THEME } from '../core/theme';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MarketOption {
  symbol: string;
  displayName?: string;
}

interface MarketDropdownProps {
  selectedSymbol: string;
  availableMarkets: MarketOption[];
  isLoading?: boolean;
  onMarketSelect: (symbol: string) => void;
  theme?: 'light' | 'dark';
}

export function MarketDropdown({
  selectedSymbol,
  availableMarkets,
  isLoading = false,
  onMarketSelect,
  theme = 'dark'
}: MarketDropdownProps) {
  const isDark = theme === 'dark';
  const colors = BUCKETSHOP_ELITE_THEME;

  return (
    <div className="relative">
      <Select
        value={selectedSymbol}
        onValueChange={onMarketSelect}
        disabled={isLoading}
      >
        <SelectTrigger 
          className={`
            w-fit min-w-[160px] px-3 py-2 text-2xl font-bold tracking-tight 
            border-none bg-transparent hover:bg-opacity-80 
            focus:ring-0 focus:ring-offset-0
            transition-all duration-200
            ${isLoading ? 'cursor-not-allowed opacity-60' : ''}
          `}
          style={{
            color: isDark ? colors.text.primary : '#1f2937',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <span>Loading...</span>
              <div
                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                style={{ borderColor: isDark ? colors.text.secondary : '#6b7280' }}
              />
            </div>
          ) : (
            <SelectValue placeholder="Select market" />
          )}
        </SelectTrigger>

        <SelectContent
          className="min-w-[200px]"
          style={{
            backgroundColor: isDark ? colors.background.secondary : '#ffffff',
            borderColor: isDark ? colors.grid.secondary : '#e5e7eb',
            boxShadow: isDark 
              ? `0 10px 25px -3px ${colors.overlay.shadow}, 0 4px 6px -2px ${colors.overlay.shadow}`
              : '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}
        >
          {availableMarkets.length === 0 ? (
            <div
              className="px-4 py-3 text-sm"
              style={{ color: isDark ? colors.text.tertiary : '#9ca3af' }}
            >
              No markets available
            </div>
          ) : (
            availableMarkets.map((market) => (
              <SelectItem
                key={market.symbol}
                value={market.symbol}
                className={`
                  text-lg font-semibold cursor-pointer px-4 py-3
                  hover:bg-opacity-80 focus:bg-opacity-80
                  transition-colors duration-150
                `}
                style={{
                  color: market.symbol === selectedSymbol
                    ? (isDark ? colors.accent.primary : '#4f46e5')
                    : (isDark ? colors.text.primary : '#1f2937'),
                }}
              >
                {market.displayName || market.symbol}
                {market.symbol === selectedSymbol && (
                  <span
                    className="ml-2 text-sm opacity-60"
                    style={{ color: isDark ? colors.text.tertiary : '#6b7280' }}
                  >
                    (current)
                  </span>
                )}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}