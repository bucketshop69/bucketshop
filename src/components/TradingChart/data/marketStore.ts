import { create } from 'zustand';
import { useEffect } from 'react';
import { marketsApi, ExtendedMarketData } from '@/lib/api/marketsApi';
import { PerpMarketConfig } from './MarketConfig';
export interface MarketState {
  // Current market selection
  selectedSymbol: string;
  selectedMarket: PerpMarketConfig | null;

  // Available markets (extended data with UI info)
  availableMarkets: ExtendedMarketData[];

  // UI state
  isLoading: boolean;
  error: string | null;
}

export interface MarketActions {
  // Market selection
  selectMarket: (symbol: string) => void;

  // Market data management
  loadAvailableMarkets: () => void;

  // Utility
  reset: () => void;
  clearError: () => void;
}

type MarketStore = MarketState & MarketActions;

const initialState: MarketState = {
  selectedSymbol: '', // Will be set dynamically from API
  selectedMarket: null,
  availableMarkets: [],
  isLoading: true, // Start loading immediately
  error: null,
};

/**
 * MarketStore - Centralized market selection state management
 * 
 * This store manages:
 * - Current selected trading pair (defaults to BTC-PERP)
 * - Available markets from MarketConfig
 * - Market switching functionality
 * - Error handling for unsupported markets
 */
export const useMarketStore = create<MarketStore>((set, get) => ({
  ...initialState,

  // Market selection
  selectMarket: (symbol: string) => {
    const normalizedSymbol = symbol.toUpperCase();
    const { availableMarkets } = get();

    const marketData = availableMarkets.find(m => m.config.symbol === normalizedSymbol);

    if (!marketData) {
      set({
        error: `Market ${symbol} not found in available markets`,
      });
      return;
    }

    console.log(`Switching to market: ${normalizedSymbol} (index: ${marketData.config.marketIndex})`);

    set({
      selectedSymbol: normalizedSymbol,
      selectedMarket: marketData.config,
      error: null,
    });
  },

  // Load available markets
  loadAvailableMarkets: async () => {
    try {
      set({ isLoading: true, error: null });

      console.log('Loading markets from Drift API...');

      // Load extended markets directly from API
      const response = await marketsApi.getExtendedMarkets();

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load markets');
      }

      // Find first available market as default (prioritize BTC if available)
      const defaultMarket = response.data.find(m => m.config.symbol.includes('BTC')) || response.data[0];

      set({
        availableMarkets: response.data,
        selectedMarket: defaultMarket?.config || null,
        selectedSymbol: defaultMarket?.config.symbol || '',
        isLoading: false,
        error: null,
      });

      console.log(`Loaded ${response.data.length} markets from API`);

    } catch (error) {
      set({
        error: 'Failed to load available markets',
        isLoading: false,
      });
      console.error('Failed to load markets:', error);
    }
  },

  // Utility actions
  reset: () => {
    set({
      ...initialState,
      isLoading: true, // Will trigger reload
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));

// Selectors for optimized subscriptions
export const selectSelectedSymbol = (state: MarketStore) => state.selectedSymbol;
export const selectSelectedMarket = (state: MarketStore) => state.selectedMarket;
export const selectAvailableMarkets = (state: MarketStore) => state.availableMarkets;
export const selectMarketError = (state: MarketStore) => state.error;
export const selectIsLoading = (state: MarketStore) => state.isLoading;

// Computed selectors
export const selectMarketDisplayName = (state: MarketStore) => {
  if (state.selectedMarket) {
    const extended = state.availableMarkets.find(m => m.config.symbol === state.selectedSymbol);
    return extended?.displayName || `${state.selectedMarket.baseAssetSymbol} Perpetual`;
  }
  return state.selectedSymbol;
};

export const selectMarketIndex = (state: MarketStore) =>
  state.selectedMarket?.marketIndex || null;

export const selectChannelSuffix = (state: MarketStore) => {
  const extended = state.availableMarkets.find(m => m.config.symbol === state.selectedSymbol);
  return extended?.channelSuffix || null;
};

// Hook for easy market switching
export const useMarketSelection = () => {
  const { selectedSymbol, selectedMarket, availableMarkets, selectMarket } = useMarketStore();

  return {
    currentSymbol: selectedSymbol,
    currentMarket: selectedMarket,
    availableMarkets,
    switchMarket: selectMarket,
  };
};

// Hook to initialize markets on component mount
export const useMarketInitialization = () => {
  const { isLoading, loadAvailableMarkets } = useMarketStore();

  useEffect(() => {
    if (isLoading) {
      loadAvailableMarkets();
    }
  }, [isLoading, loadAvailableMarkets]);
};