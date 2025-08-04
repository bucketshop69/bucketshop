'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useChartStore } from '../data/chartStore';
import { useMarketStore, selectSelectedSymbol } from '../data/marketStore';
import { WebSocketManager, WebSocketCallbacks } from '../data/WebSocketManager';

/**
 * useRealTime - Hook for managing real-time WebSocket connections to Drift Protocol
 * 
 * This hook encapsulates the WebSocket integration patterns:
 * - Connection lifecycle management with automatic reconnection
 * - Real-time price updates from orderbook mid-price calculations
 * - Trade data processing for volume and market activity
 * - Integration with chart store for state synchronization
 * - Error handling and connection health monitoring
 * 
 * Learning Focus: WebSocket patterns for financial data streaming
 * - How to handle connection states in React components
 * - Processing orderbook data for price calculations
 * - Memory-efficient real-time data updates
 * - Error recovery and reconnection strategies
 */
export function useRealTime() {
  const {
    // State
    wsConnectionState,
    autoRefresh,

    // Actions
    setConnectionState,
    setCurrentPrice,
    updateCurrentCandle,
    updateMetrics,
    setError,
    clearError,
    updateLastUpdateTime,
  } = useChartStore();

  // Get current market from market store
  const selectedSymbol = useMarketStore(selectSelectedSymbol);

  // WebSocket manager instance (persisted across re-renders)
  const wsManagerRef = useRef<WebSocketManager | null>(null);

  // Track last candle timestamp for real-time updates
  const lastCandleTimeRef = useRef<number>(0);

  // Track current candle state for OHLCV construction
  const currentCandleRef = useRef<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  } | null>(null);


  /**
   * Start real-time connection
   */
  const connect = useCallback(() => {
    if (wsManagerRef.current?.getConnectionState() === 'connected') {
      console.log('WebSocket already connected');
      return;
    }

    console.log('Starting real-time connection for', selectedSymbol);

    // Create WebSocket callbacks - using current values at connection time
    const callbacks: WebSocketCallbacks = {
      onConnectionChange: (state) => {
        console.log(`WebSocket connection state: ${state}`);
        setConnectionState(state);
        if (state === 'connected') {
          clearError();
        }
      },
      onPriceUpdate: (price) => {
        try {
          console.log(price);

          setCurrentPrice(price);
          updateLastUpdateTime();

          const now = Math.floor(Date.now() / 1000);
          const candleTime = Math.floor(now / 3600) * 3600;

          if (!currentCandleRef.current || currentCandleRef.current.time !== candleTime) {
            currentCandleRef.current = {
              time: candleTime,
              open: price,
              high: price,
              low: price,
              close: price,
              volume: 0,
            };
            lastCandleTimeRef.current = candleTime;
          } else {
            const candle = currentCandleRef.current;
            candle.high = Math.max(candle.high, price);
            candle.low = Math.min(candle.low, price);
            candle.close = price;
          }

          if (currentCandleRef.current) {
            updateCurrentCandle({
              time: currentCandleRef.current.time,
              open: currentCandleRef.current.open,
              high: currentCandleRef.current.high,
              low: currentCandleRef.current.low,
              close: currentCandleRef.current.close,
              volume: currentCandleRef.current.volume,
            });
          }

          clearError();
        } catch (error) {
          console.error('Failed to process price update:', error);
          setError({
            code: 'PRICE_UPDATE_ERROR',
            message: 'Failed to process real-time price update',
            timestamp: Date.now(),
          });
        }
      },
      onError: (error) => {
        console.error('WebSocket error:', error);
        setError({
          code: 'WEBSOCKET_ERROR',
          message: error.message || 'WebSocket connection error',
          timestamp: Date.now(),
        });
      },
    };

    // Create new WebSocket manager
    wsManagerRef.current = new WebSocketManager(callbacks);

    // Connect and subscribe to current market
    wsManagerRef.current.connect();
    wsManagerRef.current.subscribeToMarket(selectedSymbol);

  }, [selectedSymbol,
    setConnectionState,
    clearError,
    setCurrentPrice,
    updateLastUpdateTime, updateCurrentCandle, setError, updateMetrics]);

  /**
   * Stop real-time connection
   */
  const disconnect = useCallback(() => {
    console.log('Stopping real-time connection');

    if (wsManagerRef.current) {
      wsManagerRef.current.disconnect();
      wsManagerRef.current = null;
    }

    // Reset candle tracking
    currentCandleRef.current = null;
    lastCandleTimeRef.current = 0;

    setConnectionState('disconnected');
  }, [setConnectionState]);

  /**
   * Reconnect WebSocket (useful for manual retry)
   */
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => connect(), 1000);
  }, [disconnect, connect]);

  /**
   * Get connection statistics
   */
  const getConnectionStats = useCallback(() => {
    return wsManagerRef.current?.getStats() || null;
  }, []);

  /**
   * Check if connection is healthy
   */
  const isHealthy = useCallback(() => {
    return wsManagerRef.current?.isHealthy() || false;
  }, []);

  // Auto-connect when autoRefresh is enabled and we have a selected symbol
  useEffect(() => {
    if (autoRefresh && selectedSymbol && wsConnectionState === 'disconnected') {
      console.log('Auto-connecting to real-time feed for', selectedSymbol);
      connect();
    }
  }, [autoRefresh, selectedSymbol, wsConnectionState, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsManagerRef.current) {
        wsManagerRef.current.disconnect();
        wsManagerRef.current = null;
      }
    };
  }, []);

  return {
    // Connection state
    isConnected: wsConnectionState === 'connected',
    isConnecting: wsConnectionState === 'connecting',
    isDisconnected: wsConnectionState === 'disconnected',
    hasError: wsConnectionState === 'error',
    connectionState: wsConnectionState,

    // Actions
    connect,
    disconnect,
    reconnect,

    // Utilities
    getConnectionStats,
    isHealthy,

    // Current candle state (for debugging)
    currentCandle: currentCandleRef.current,
  };
}