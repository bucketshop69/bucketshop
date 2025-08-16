'use client';

import { useEffect, useRef, useState } from 'react';
import { ChartEngine, ChartConfiguration } from '../core/ChartEngine';
import { BUCKETSHOP_ELITE_THEME } from '../core/theme';
import {
  useChartStore, selectLoadingState, selectError,
  selectCandles, selectCurrentPrice, selectConnectionState, selectMetrics
} from '../data/chartStore';
import { useChartData } from '../hooks/useChartData';
import { useRealTime } from '../hooks/useRealTime';
import { useMarketStore, selectSelectedSymbol, selectAvailableMarkets, useMarketInitialization } from '../data/marketStore';
import { ChartOverlays } from './ChartOverlays';
import { MarketDropdown } from './MarketDropdown';
import { TimeframeSelector } from './TimeframeSelector';

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

  // Track initial load vs real-time updates
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const previousCandlesLengthRef = useRef(0);

  // Chart store state
  const loadingState = useChartStore(selectLoadingState);
  const error = useChartStore(selectError);
  const candles = useChartStore(selectCandles);
  const currentPrice = useChartStore(selectCurrentPrice);
  const connectionState = useChartStore(selectConnectionState);
  const metrics = useChartStore(selectMetrics);

  // Chart store actions
  const { setTheme, clearError, setSymbol, setCandles } = useChartStore();

  // Market store state
  const selectedSymbol = useMarketStore(selectSelectedSymbol);
  const availableMarkets = useMarketStore(selectAvailableMarkets);
  const { selectMarket } = useMarketStore();

  // Chart data management
  const {
    retryLoad,
  } = useChartData();

  // Real-time WebSocket integration
  const {
    reconnect,
  } = useRealTime();

  // Initialize markets on mount
  useMarketInitialization();

  // Handle market switching
  const handleMarketSwitch = (newSymbol: string) => {
    if (newSymbol === selectedSymbol) return;

    // Clear current chart data
    setCandles([]);

    // Reset chart state to trigger full reload
    setIsInitialLoadComplete(false);

    // Switch market in store (this will trigger all the reactive chains)
    selectMarket(newSymbol);

    // Reset loading state AFTER symbol sync to allow new data fetch
    setTimeout(() => {
      const { setLoadingState } = useChartStore.getState();
      setLoadingState('idle');
    }, 0);
  };

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

  // Update chart data when candles change - distinguish initial load vs real-time updates
  useEffect(() => {
    if (!chartEngineRef.current.isInitialized() || candles.length === 0) return;

    try {
      const currentCandleCount = candles.length;
      const previousCandleCount = previousCandlesLengthRef.current;

      // Initial load: set all data and fit content
      if (!isInitialLoadComplete || currentCandleCount !== previousCandleCount + 1) {
        // console.log('Initial load or bulk update:', { currentCandleCount, previousCandleCount });

        // Convert all candles to chart format
        const chartData = candles.map(candle => ({
          time: candle.time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }));

        chartEngineRef.current.setData(chartData);

        // Set initial zoom on first load (show last 50 candles)
        if (loadingState === 'success' && !isInitialLoadComplete) {
          setTimeout(() => {
            chartEngineRef.current.setInitialZoom();
            setIsInitialLoadComplete(true);
          }, 100);
        }
      }
      // Real-time update: update only the latest candle
      else if (isInitialLoadComplete && currentCandleCount === previousCandleCount + 1) {
        console.log('Real-time update: updating latest candle');

        const latestCandle = candles[candles.length - 1];
        const candleData = {
          time: latestCandle.time,
          open: latestCandle.open,
          high: latestCandle.high,
          low: latestCandle.low,
          close: latestCandle.close,
        };

        chartEngineRef.current.updateCandle(candleData);
      }
      // Same length but data changed: update latest candle (price update)
      else if (isInitialLoadComplete && currentCandleCount === previousCandleCount) {
        console.log('Price update: updating current candle');

        const latestCandle = candles[candles.length - 1];
        const candleData = {
          time: latestCandle.time,
          open: latestCandle.open,
          high: latestCandle.high,
          low: latestCandle.low,
          close: latestCandle.close,
        };

        chartEngineRef.current.updateCandle(candleData);
      }

      // Update ref for next comparison
      previousCandlesLengthRef.current = currentCandleCount;

    } catch (error) {
      console.error('Failed to update chart data:', error);
    }
  }, [candles, loadingState, isInitialLoadComplete]);

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
        className="p-2 border-b transition-colors duration-200"
        style={{
          backgroundColor: isDark ? colors.background.secondary : '#ffffff',
          borderColor: isDark ? colors.grid.secondary : '#e5e7eb',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Market Selector Dropdown */}
            <MarketDropdown
              selectedSymbol={selectedSymbol}
              availableMarkets={availableMarkets.map(market => ({
                symbol: market.config.symbol,
                displayName: market.displayName
              }))}
              isLoading={loadingState === 'loading'}
              onMarketSelect={handleMarketSwitch}
              theme={theme}
            />

            {/* Timeframe Selector */}
            <TimeframeSelector />

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
                className={`w-2 h-2 rounded-full transition-all duration-300 ${connectionState === 'connecting' ? 'animate-pulse' : ''
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