'use client';

import { useEffect, useRef, useState } from 'react';
import { ChartEngine, ChartConfiguration } from '../core/ChartEngine';
import { useChartStore, selectLoadingState, selectError, selectCandles, selectCurrentPrice, selectConnectionState, selectMetrics } from '../data/chartStore';
import { useChartData } from '../hooks/useChartData';
import { ChartOverlays } from './ChartOverlays';

export interface ChartContainerProps {
  className?: string;
  height?: number;
  theme?: 'light' | 'dark';
  onPriceChange?: (price: number) => void;
}

/**
 * ChartContainer - Main chart component that orchestrates all chart functionality
 * 
 * This component brings together:
 * - ChartEngine for lightweight-charts rendering
 * - ChartStore for state management
 * - ChartData hook for data fetching
 * - ChartOverlays for UI states
 * 
 * It provides a clean, production-ready interface for the trading chart.
 */
export function ChartContainer({
  className = '',
  height = 500,
  theme = 'dark',
  onPriceChange
}: ChartContainerProps) {
  // Chart engine and container refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartEngineRef = useRef<ChartEngine>(new ChartEngine());
  const [isMounted, setIsMounted] = useState(false);

  // Chart store state
  const loadingState = useChartStore(selectLoadingState);
  const error = useChartStore(selectError);
  const candles = useChartStore(selectCandles);
  const currentPrice = useChartStore(selectCurrentPrice);
  const connectionState = useChartStore(selectConnectionState);
  const metrics = useChartStore(selectMetrics);

  // Chart store actions
  const { setTheme, clearError, setConnectionState } = useChartStore();

  // Chart data management
  const {
    retryLoad,
  } = useChartData();

  // Ensure client-side only rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize chart engine
  useEffect(() => {
    if (!isMounted || !chartContainerRef.current) return;

    const initializeChart = async () => {
      try {
        const container = chartContainerRef.current;
        if (!container) return;

        // Calculate dimensions
        const containerWidth = container.clientWidth || 800;
        const containerHeight = height;

        const config: ChartConfiguration = {
          width: containerWidth,
          height: containerHeight,
          theme,
        };

        console.log('Initializing chart with config:', config);

        await chartEngineRef.current.initialize(container, config);

        console.log('Chart engine initialized successfully');

      } catch (error) {
        console.error('Failed to initialize chart:', error);
      }
    };

    initializeChart();

    // Cleanup on unmount
    return () => {
      const chartEngine = chartEngineRef.current;
      if (chartEngine) {
        chartEngine.destroy();
      }
    };
  }, [isMounted, height, theme]);

  // Update chart data when candles change
  useEffect(() => {
    if (!chartEngineRef.current.isInitialized() || candles.length === 0) return;

    try {
      // Convert to chart format
      const chartData = candles.map(candle => ({
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }));

      chartEngineRef.current.setData(chartData);

      // Fit content after initial load
      if (loadingState === 'success') {
        setTimeout(() => chartEngineRef.current.fitContent(), 100);
      }

    } catch (error) {
      console.error('Failed to update chart data:', error);
    }
  }, [candles, loadingState]);

  // Update chart theme
  useEffect(() => {
    if (chartEngineRef.current.isInitialized()) {
      chartEngineRef.current.updateTheme(theme);
    }
    setTheme(theme);
  }, [theme, setTheme]);

  // Handle price changes
  useEffect(() => {
    if (currentPrice > 0 && onPriceChange) {
      onPriceChange(currentPrice);
    }
  }, [currentPrice, onPriceChange]);

  // Chart header with current price and status
  const renderHeader = () => (
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-gray-800 text-xl font-bold">BTC-PERP</h2>
          {currentPrice > 0 && (
            <div className="text-gray-800 text-lg font-mono">
              ${currentPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Connection status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connectionState === 'connected' ? 'bg-green-500' :
              connectionState === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                'bg-red-500'
              }`} />
            <span className="text-sm text-gray-600">
              {connectionState === 'connected' ? 'Live' :
                connectionState === 'connecting' ? 'Connecting' :
                  'Offline'}
            </span>
          </div>

          {/* Timeframe */}
          <span className="text-gray-600 text-sm">1H</span>

          {/* Candle count */}
          <span className="text-gray-600 text-sm">
            {metrics.candleCount.toLocaleString()} candles
          </span>
        </div>
      </div>
    </div>
  );

  // Debug info footer (development only)
  const renderDebugInfo = () => {
    if (process.env.NODE_ENV !== 'development') return null;

    return (
      <div className="p-2 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Market: BTC-PERP (perp_1)</span>
          <span>WebSocket: {connectionState}</span>
          <span>Quality: {metrics.dataQuality.toFixed(1)}%</span>
          <span>Data: {metrics.candleCount} candles</span>
        </div>
      </div>
    );
  };

  // Handle retry actions
  const handleRetry = () => {
    clearError();
    retryLoad();
  };

  const handleReconnect = () => {
    setConnectionState('connecting');
    // WebSocket reconnection will be handled by WebSocketManager in Task 2
  };

  if (!isMounted) {
    return (
      <div className={`h-full w-full bg-white flex items-center justify-center ${className}`}>
        <div className="text-gray-800">Initializing chart...</div>
      </div>
    );
  }

  return (
    <div className={`h-full w-full bg-white flex flex-col ${className}`}>
      {/* Chart Header */}
      {renderHeader()}

      {/* Chart Container */}
      <div className="flex-1 relative">
        <div
          ref={chartContainerRef}
          className="absolute inset-0"
          style={{ minHeight: '400px' }}
        />

        {/* Chart Overlays */}
        <ChartOverlays
          loadingState={loadingState}
          error={error}
          isConnected={connectionState === 'connected'}
          isConnecting={connectionState === 'connecting'}
          hasData={candles.length > 0}
          dataQuality={metrics.dataQuality}
          candleCount={metrics.candleCount}
          onRetry={handleRetry}
          onDismissError={() => clearError()}
          onReconnect={handleReconnect}
        />
      </div>

      {/* Debug Info */}
      {renderDebugInfo()}
    </div>
  );
}