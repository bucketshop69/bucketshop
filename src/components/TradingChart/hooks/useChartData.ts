'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useChartStore, selectTimeframe } from '../data/chartStore';
import { HistoricalDataService } from '../data/HistoricalDataService';
import { CandleBuffer } from '../core/CandleBuffer';
import { DataProcessor } from '../core/DataProcessor';

/**
 * useChartData - Hook for managing chart data fetching and updates
 * 
 * This hook encapsulates all the logic for:
 * - Loading historical data from Drift S3
 * - Managing the CandleBuffer for memory efficiency
 * - Handling data quality and error states
 * - Providing a clean interface for the UI components
 */
export function useChartData() {
  const {
    // State
    candles,
    symbol,
    timeframe,
    loadingState,
    error,

    // Actions
    setCandles,
    setLoadingState,
    setError,
    clearError,
    updateMetrics,
    setTimeframeSwitching,
  } = useChartStore();

  // CandleBuffer for efficient memory management
  const candleBufferRef = useRef<CandleBuffer>(new CandleBuffer(10000));

  /**
   * Load historical data for the current symbol
   */
  const loadHistoricalData = useCallback(async () => {
    if (loadingState === 'loading') return;

    try {
      setLoadingState('loading');
      clearError();


      // Use more candles for daily timeframe to get more historical coverage
      const maxCandles = timeframe === '1d' ? 200 : 1000;

      const result = await HistoricalDataService.fetchMarketData(symbol, {
        maxCandles,
        timeout: 30000,
        retries: 3,
        timeframe: timeframe,
      });

      if (result.success && result.data.length > 0) {
        // Clear buffer and add new data
        candleBufferRef.current.clear();

        // Add candles to buffer
        result.data.forEach(candle => {
          candleBufferRef.current.addCandle(candle);
        });

        // Update store with processed data
        setCandles(result.data);

        // Update metrics
        updateMetrics({
          candleCount: result.data.length,
          dataQuality: result.dataQuality,
          latestPrice: result.data[result.data.length - 1]?.close || 0,
        });

        setLoadingState('success');

        console.log(`Successfully loaded ${result.data.length} candles (${result.dataQuality.toFixed(1)}% quality)`);
      } else {
        throw new Error(result.error || 'Failed to load data');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error('Failed to load historical data:', errorMessage);

      setError({
        code: 'FETCH_ERROR',
        message: errorMessage,
        timestamp: Date.now(),
      });

      setLoadingState('error');
    }
  }, [symbol, loadingState, setLoadingState, setError, clearError, setCandles, updateMetrics]);

  /**
   * Update a single candle (for real-time updates)
   */
  const updateCandle = useCallback((newCandle: { timestamp: number; open: number; high: number; low: number; close: number; volume?: number }) => {
    try {
      // Process the raw candle data
      const processedCandle = DataProcessor.processSingleCandle(newCandle);

      if (!processedCandle) {
        console.warn('Failed to process candle:', newCandle);
        return;
      }

      // Update buffer
      candleBufferRef.current.updateLastCandle(processedCandle);

      // Update store
      const allCandles = candleBufferRef.current.getAllCandles();
      setCandles(allCandles);

      // Update metrics
      updateMetrics({
        candleCount: allCandles.length,
        latestPrice: processedCandle.close,
      });

    } catch (error) {
      console.error('Failed to update candle:', error);
    }
  }, [setCandles, updateMetrics]);

  /**
   * Add a new candle (for real-time updates)
   */
  const addCandle = useCallback((newCandle: { timestamp: number; open: number; high: number; low: number; close: number; volume?: number }) => {
    try {
      // Process the raw candle data
      const processedCandle = DataProcessor.processSingleCandle(newCandle);

      if (!processedCandle) {
        console.warn('Failed to process candle:', newCandle);
        return;
      }

      // Add to buffer
      candleBufferRef.current.addCandle(processedCandle);

      // Update store
      const allCandles = candleBufferRef.current.getAllCandles();
      setCandles(allCandles);

      // Update metrics
      updateMetrics({
        candleCount: allCandles.length,
        latestPrice: processedCandle.close,
      });

    } catch (error) {
      console.error('Failed to add candle:', error);
    }
  }, [setCandles, updateMetrics]);

  /**
   * Get candles in a specific range (for viewport optimization)
   */
  const getCandlesInRange = useCallback((fromTime: number, toTime: number, maxPoints: number = 1000) => {
    return candleBufferRef.current.getViewportCandles(fromTime, toTime, maxPoints);
  }, []);

  /**
   * Get buffer statistics
   */
  const getBufferStats = useCallback(() => {
    return candleBufferRef.current.getStats();
  }, []);

  /**
   * Clear all data
   */
  const clearData = useCallback(() => {
    candleBufferRef.current.clear();
    setCandles([]);
    updateMetrics({
      candleCount: 0,
      dataQuality: 0,
      latestPrice: 0,
    });
  }, [setCandles, updateMetrics]);

  /**
   * Retry loading data after error
   */
  const retryLoad = useCallback(() => {
    if (loadingState !== 'loading') {
      loadHistoricalData();
    }
  }, [loadHistoricalData, loadingState]);

  // Auto-load data when symbol or timeframe changes
  useEffect(() => {
    if (symbol && loadingState === 'idle') {
      loadHistoricalData();
    }
  }, [symbol, timeframe, loadingState, loadHistoricalData]);

  // Handle timeframe switching - clear data and reload
  useEffect(() => {
    if (symbol && timeframe) {
      // Clear existing data when timeframe changes
      setCandles([]);
      setLoadingState('idle'); // Trigger reload
      setTimeframeSwitching(false); // Reset switching state after data loads
    }
  }, [timeframe, symbol, setCandles, setLoadingState, setTimeframeSwitching]);

  // Cleanup on unmount
  useEffect(() => {
    const buffer = candleBufferRef.current;
    return () => {
      if (buffer) {
        buffer.clear();
      }
    };
  }, []);

  return {
    // Data
    candles,

    // State
    isLoading: loadingState === 'loading',
    isSuccess: loadingState === 'success',
    isError: loadingState === 'error',
    error,

    // Actions
    loadHistoricalData,
    updateCandle,
    addCandle,
    getCandlesInRange,
    clearData,
    retryLoad,

    // Utilities
    getBufferStats,
  };
}