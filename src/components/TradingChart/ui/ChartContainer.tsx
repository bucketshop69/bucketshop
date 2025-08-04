'use client';

import { useEffect, useRef, useState } from 'react';
import { ChartEngine, ChartConfiguration } from '../core/ChartEngine';
import { BUCKETSHOP_ELITE_THEME, TYPOGRAPHY, SPACING } from '../core/theme';
import {
  useChartStore, selectLoadingState, selectError,
  selectCandles, selectCurrentPrice, selectConnectionState, selectMetrics
} from '../data/chartStore';
import { useChartData } from '../hooks/useChartData';
import { useRealTime } from '../hooks/useRealTime';
import { useMarketStore, selectSelectedSymbol, useMarketInitialization } from '../data/marketStore';
import { ChartOverlays } from './ChartOverlays';

export interface ChartContainerProps {
  className?: string;
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
  theme = 'dark',
  onPriceChange
}: ChartContainerProps) {
  // Chart engine and container refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartEngineRef = useRef<ChartEngine>(new ChartEngine());
  const [isMounted, setIsMounted] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Chart store state
  const loadingState = useChartStore(selectLoadingState);
  const error = useChartStore(selectError);
  const candles = useChartStore(selectCandles);
  const currentPrice = useChartStore(selectCurrentPrice);
  const connectionState = useChartStore(selectConnectionState);
  const metrics = useChartStore(selectMetrics);

  // Chart store actions
  const { setTheme, clearError, setSymbol } = useChartStore();

  // Market store state
  const selectedSymbol = useMarketStore(selectSelectedSymbol);

  // Chart data management
  const {
    retryLoad,
  } = useChartData();

  // Real-time WebSocket integration
  const {
    reconnect,
    getConnectionStats,
  } = useRealTime();

  // Initialize markets on mount
  useMarketInitialization();

  // Ensure client-side only rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize chart engine when mounted
  useEffect(() => {
    if (!isMounted || !chartContainerRef.current) return;

    const initializeChart = async () => {
      try {
        const container = chartContainerRef.current;
        if (!container) return;

        // Get initial dimensions
        const { clientWidth, clientHeight } = container;
        const width = clientWidth || 800;
        const height = clientHeight || 500;

        const config: ChartConfiguration = {
          width,
          height,
          theme,
        };

        console.log('Initializing chart with config:', config);

        await chartEngineRef.current.initialize(container, config);
        setDimensions({ width, height });

        console.log('Chart engine initialized successfully');

      } catch (error) {
        console.error('Failed to initialize chart:', error);
      }
    };

    initializeChart();

    // Cleanup on unmount
    const chartEngine = chartEngineRef.current;
    return () => {
      if (chartEngine) {
        chartEngine.destroy();
      }
    };
  }, [isMounted, theme]);

  // ResizeObserver for dynamic sizing after initialization
  useEffect(() => {
    if (!chartContainerRef.current || !chartEngineRef.current.isInitialized()) return;

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;

      // Only update if dimensions actually changed and are valid
      if (width > 0 && height > 0 && (width !== dimensions.width || height !== dimensions.height)) {
        console.log('Resizing chart to:', { width, height });
        chartEngineRef.current.resize(width, height);
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isMounted, dimensions.width, dimensions.height]);

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

  // Sync chart store symbol with market store
  useEffect(() => {
    if (selectedSymbol) {
      setSymbol(selectedSymbol);
    }
  }, [selectedSymbol, setSymbol]);

  // Chart header with current price and status - Elite Dark Theme
  const renderHeader = () => {
    const isDark = theme === 'dark';
    const colors = BUCKETSHOP_ELITE_THEME;
    
    return (
      <div 
        className="px-6 py-4 border-b transition-colors duration-200"
        style={{
          backgroundColor: isDark ? colors.background.secondary : '#ffffff',
          borderColor: isDark ? colors.grid.secondary : '#e5e7eb',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Symbol */}
            <h2 
              className="text-2xl font-bold tracking-tight transition-colors duration-200"
              style={{
                color: isDark ? colors.text.primary : '#1f2937',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              {selectedSymbol || 'Loading...'}
            </h2>
            
            {/* Current Price */}
            {currentPrice > 0 && (
              <div 
                className="text-xl font-mono font-semibold transition-colors duration-200"
                style={{
                  color: isDark ? colors.accent.primary : '#4f46e5',
                }}
              >
                ${currentPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            {/* Connection status */}
            <div className="flex items-center gap-3">
              <div 
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  connectionState === 'connecting' ? 'animate-pulse' : ''
                }`}
                style={{
                  backgroundColor: connectionState === 'connected' ? colors.status.connected :
                    connectionState === 'connecting' ? colors.status.connecting :
                    colors.status.disconnected
                }}
              />
              <span 
                className="text-sm font-medium transition-colors duration-200"
                style={{
                  color: isDark ? colors.text.secondary : '#6b7280',
                }}
              >
                {connectionState === 'connected' ? 'Live' :
                  connectionState === 'connecting' ? 'Connecting' :
                    'Offline'}
              </span>
            </div>

            {/* Timeframe Badge */}
            <div 
              className="px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200"
              style={{
                backgroundColor: isDark ? colors.accent.primary + '20' : '#f3f4f6',
                color: isDark ? colors.accent.primary : '#374151',
                border: `1px solid ${isDark ? colors.accent.primary + '40' : '#d1d5db'}`,
              }}
            >
              1H
            </div>

            {/* Candle count */}
            <span 
              className="text-sm font-medium transition-colors duration-200"
              style={{
                color: isDark ? colors.text.tertiary : '#9ca3af',
              }}
            >
              {metrics.candleCount.toLocaleString()} candles
            </span>
          </div>
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
    console.log('Manual reconnect requested');
    reconnect();
  };

  if (!isMounted) {
    const isDark = theme === 'dark';
    const colors = BUCKETSHOP_ELITE_THEME;
    
    return (
      <div 
        className={`h-full w-full flex items-center justify-center ${className}`}
        style={{
          backgroundColor: isDark ? colors.background.primary : '#ffffff',
        }}
      >
        <div 
          className="text-lg font-medium"
          style={{
            color: isDark ? colors.text.secondary : '#6b7280',
          }}
        >
          Initializing chart...
        </div>
      </div>
    );
  }

  const isDark = theme === 'dark';
  const colors = BUCKETSHOP_ELITE_THEME;

  return (
    <div 
      className={`h-full w-full flex flex-col transition-colors duration-200 ${className}`}
      style={{
        backgroundColor: isDark ? colors.background.primary : '#ffffff',
      }}
    >
      {/* Chart Header */}
      {renderHeader()}

      {/* Chart Container */}
      <div className="flex-1 relative">
        <div
          ref={chartContainerRef}
          className="h-[calc(100vh-80px)] w-full"
          style={{
            backgroundColor: isDark ? colors.background.primary : '#ffffff',
          }}
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
    </div>
  );
}