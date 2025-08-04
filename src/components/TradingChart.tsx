'use client';

import { ChartContainer } from './TradingChart/ui/ChartContainer';

/**
 * TradingChart - Legacy wrapper component
 * 
 * This component maintains backward compatibility while using
 * the new modular architecture under the hood.
 * 
 * For new implementations, use ChartContainer directly from
 * './TradingChart/ui/ChartContainer'
 */
export function TradingChart() {
  return (
    <ChartContainer
      theme="dark"
      className="w-full h-full"
    />
  );
}