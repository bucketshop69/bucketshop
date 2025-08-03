import { create } from 'zustand';
import { ProcessedCandleData } from '../core/DataProcessor';

export type ChartTheme = 'light' | 'dark';
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ChartError {
  code: string;
  message: string;
  timestamp: number;
}

export interface ChartMetrics {
  candleCount: number;
  dataQuality: number; // 0-100 percentage
  latestPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume24h: number;
}

export interface ChartState {
  // Data state
  candles: ProcessedCandleData[];
  currentPrice: number;
  metrics: ChartMetrics;
  
  // UI state
  theme: ChartTheme;
  isLoading: boolean;
  loadingState: LoadingState;
  error: ChartError | null;
  
  // Connection state
  wsConnectionState: ConnectionState;
  lastUpdateTime: number;
  
  // Chart configuration
  symbol: string;
  timeframe: string;
  autoRefresh: boolean;
  
  // Performance tracking
  renderCount: number;
  lastRenderTime: number;
}

export interface ChartActions {
  // Data actions
  setCandles: (candles: ProcessedCandleData[]) => void;
  addCandle: (candle: ProcessedCandleData) => void;
  updateCurrentCandle: (candle: ProcessedCandleData) => void;
  setCurrentPrice: (price: number) => void;
  updateMetrics: (metrics: Partial<ChartMetrics>) => void;
  
  // UI actions
  setTheme: (theme: ChartTheme) => void;
  setLoading: (loading: boolean) => void;
  setLoadingState: (state: LoadingState) => void;
  setError: (error: ChartError | null) => void;
  
  // Connection actions
  setConnectionState: (state: ConnectionState) => void;
  updateLastUpdateTime: () => void;
  
  // Configuration actions
  setSymbol: (symbol: string) => void;
  setTimeframe: (timeframe: string) => void;
  setAutoRefresh: (enabled: boolean) => void;
  
  // Performance actions
  incrementRenderCount: () => void;
  updateRenderTime: () => void;
  
  // Utility actions
  reset: () => void;
  clearError: () => void;
}

type ChartStore = ChartState & ChartActions;

const initialState: ChartState = {
  // Data state
  candles: [],
  currentPrice: 0,
  metrics: {
    candleCount: 0,
    dataQuality: 0,
    latestPrice: 0,
    priceChange: 0,
    priceChangePercent: 0,
    volume24h: 0,
  },
  
  // UI state
  theme: 'light',
  isLoading: false,
  loadingState: 'idle',
  error: null,
  
  // Connection state
  wsConnectionState: 'disconnected',
  lastUpdateTime: 0,
  
  // Chart configuration
  symbol: 'BTC-PERP',
  timeframe: '1h',
  autoRefresh: true,
  
  // Performance tracking
  renderCount: 0,
  lastRenderTime: 0,
};

/**
 * ChartStore - Centralized state management for chart data and UI
 * 
 * This Zustand store manages all chart-related state including:
 * - Candle data and real-time updates
 * - UI state (loading, errors, theme)
 * - WebSocket connection status
 * - Performance metrics and monitoring
 * 
 * Benefits of this approach:
 * - Separation of concerns (UI logic separate from data logic)
 * - Efficient re-renders (only components using specific state update)
 * - Easy debugging and state inspection
 * - Scalable for adding new features
 */
export const useChartStore = create<ChartStore>((set, get) => ({
  ...initialState,

  // Data actions
  setCandles: (candles) => {
    const previousCandles = get().candles;
    const previousPrice = previousCandles.length > 0 
      ? previousCandles[previousCandles.length - 1].close 
      : 0;
    
    const currentPrice = candles.length > 0 
      ? candles[candles.length - 1].close 
      : 0;

    set({
      candles,
      currentPrice,
      metrics: {
        ...get().metrics,
        candleCount: candles.length,
        latestPrice: currentPrice,
        priceChange: currentPrice - previousPrice,
        priceChangePercent: previousPrice > 0 
          ? ((currentPrice - previousPrice) / previousPrice) * 100 
          : 0,
      },
      lastUpdateTime: Date.now(),
    });
  },

  addCandle: (candle) => {
    const currentCandles = get().candles;
    const newCandles = [...currentCandles, candle];
    
    set({
      candles: newCandles,
      currentPrice: candle.close,
      metrics: {
        ...get().metrics,
        candleCount: newCandles.length,
        latestPrice: candle.close,
      },
      lastUpdateTime: Date.now(),
    });
  },

  updateCurrentCandle: (candle) => {
    const currentCandles = get().candles;
    if (currentCandles.length === 0) {
      get().addCandle(candle);
      return;
    }

    const lastCandle = currentCandles[currentCandles.length - 1];
    
    // If same timestamp, update the candle
    if (lastCandle.time === candle.time) {
      const newCandles = [...currentCandles];
      newCandles[newCandles.length - 1] = candle;
      
      set({
        candles: newCandles,
        currentPrice: candle.close,
        metrics: {
          ...get().metrics,
          latestPrice: candle.close,
        },
        lastUpdateTime: Date.now(),
      });
    } else {
      // Different timestamp, add as new candle
      get().addCandle(candle);
    }
  },

  setCurrentPrice: (price) => {
    const currentMetrics = get().metrics;
    const previousPrice = currentMetrics.latestPrice;
    
    set({
      currentPrice: price,
      metrics: {
        ...currentMetrics,
        latestPrice: price,
        priceChange: price - previousPrice,
        priceChangePercent: previousPrice > 0 
          ? ((price - previousPrice) / previousPrice) * 100 
          : 0,
      },
      lastUpdateTime: Date.now(),
    });
  },

  updateMetrics: (metrics) => {
    set({
      metrics: {
        ...get().metrics,
        ...metrics,
      },
    });
  },

  // UI actions
  setTheme: (theme) => set({ theme }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setLoadingState: (loadingState) => set({ 
    loadingState,
    isLoading: loadingState === 'loading',
  }),
  
  setError: (error) => set({ 
    error,
    loadingState: error ? 'error' : get().loadingState,
  }),

  // Connection actions
  setConnectionState: (wsConnectionState) => set({ wsConnectionState }),
  
  updateLastUpdateTime: () => set({ lastUpdateTime: Date.now() }),

  // Configuration actions
  setSymbol: (symbol) => set({ symbol }),
  
  setTimeframe: (timeframe) => set({ timeframe }),
  
  setAutoRefresh: (autoRefresh) => set({ autoRefresh }),

  // Performance actions
  incrementRenderCount: () => {
    const currentCount = get().renderCount;
    set({ 
      renderCount: currentCount + 1,
      lastRenderTime: Date.now(),
    });
  },
  
  updateRenderTime: () => set({ lastRenderTime: Date.now() }),

  // Utility actions
  reset: () => set(initialState),
  
  clearError: () => set({ error: null }),
}));

// Selectors for optimized subscriptions
export const selectCandles = (state: ChartStore) => state.candles;
export const selectCurrentPrice = (state: ChartStore) => state.currentPrice;
export const selectMetrics = (state: ChartStore) => state.metrics;
export const selectLoadingState = (state: ChartStore) => state.loadingState;
export const selectConnectionState = (state: ChartStore) => state.wsConnectionState;
export const selectError = (state: ChartStore) => state.error;
export const selectTheme = (state: ChartStore) => state.theme;

// Computed selectors
export const selectIsConnected = (state: ChartStore) => 
  state.wsConnectionState === 'connected';

export const selectHasData = (state: ChartStore) => 
  state.candles.length > 0;

export const selectHasError = (state: ChartStore) => 
  state.error !== null;

export const selectIsHealthy = (state: ChartStore) => 
  state.wsConnectionState === 'connected' && 
  state.candles.length > 0 && 
  state.error === null;

// Performance monitoring
export const selectPerformanceMetrics = (state: ChartStore) => ({
  renderCount: state.renderCount,
  lastRenderTime: state.lastRenderTime,
  candleCount: state.metrics.candleCount,
  dataQuality: state.metrics.dataQuality,
});

// Hook for debugging (development only)
export const useChartDebug = () => {
  if (process.env.NODE_ENV === 'development') {
    return useChartStore.getState();
  }
  return null;
};