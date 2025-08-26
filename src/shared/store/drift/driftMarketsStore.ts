import { create } from 'zustand';
import useSWR from 'swr';
import React from 'react';
import { MarketData } from '@/lib/redis';

// Normalized markets structure for efficient lookups
export interface NormalizedMarkets {
  ids: number[];              // Array of marketIndex values
  entities: Record<number, MarketData>;  // marketIndex -> MarketData mapping
}

export interface MarketsApiResponse {
  success: boolean;
  markets: MarketData[];
  count: number;
  lastUpdated: number | null;
  message?: string;
}

// Store state interface
interface DriftMarketsState {
  selectedSymbol: string;
  selectedMarket: MarketData | null;
  markets: NormalizedMarkets;  // Normalized markets data
}

// Store actions interface  
interface DriftMarketsActions {
  selectMarket: (symbol: string) => void;
  setMarkets: (markets: MarketData[]) => void;
}

type DriftMarketsStore = DriftMarketsState & DriftMarketsActions;

// Helper function to normalize markets array
function normalizeMarkets(marketsList: MarketData[]): NormalizedMarkets {
  const ids: number[] = [];
  const entities: Record<number, MarketData> = {};

  marketsList.forEach(market => {
    ids.push(market.marketIndex);
    entities[market.marketIndex] = market;
  });

  return { ids, entities };
}

// Initial state
const initialState: DriftMarketsState = {
  selectedSymbol: '',
  selectedMarket: null,
  markets: { ids: [], entities: {} },
};

// Create the Zustand store
export const useDriftMarketsStore = create<DriftMarketsStore>((set, get) => ({
  ...initialState,

  setMarkets: (marketsList: MarketData[]) => {
    const normalized = normalizeMarkets(marketsList);
    set({ markets: normalized });
  },

  selectMarket: (symbol: string) => {
    const { markets } = get();
    const normalizedSymbol = symbol.toUpperCase();

    // Find market by symbol in entities
    const market = Object.values(markets.entities).find(m => m.symbol === normalizedSymbol);

    if (market) {
      set({
        selectedSymbol: normalizedSymbol,
        selectedMarket: market,
      });
    }
  },
}));

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Hook to get markets data with SWR
export const useDriftMarkets = () => {
  const { data, error, isLoading } = useSWR<MarketsApiResponse>(
    '/api/drift/markets',
    fetcher,
    {
      refreshInterval: 60000, // Refresh every 60 seconds
      revalidateOnFocus: false
    }
  );

  return {
    markets: data?.markets || [],
    isLoading,
    error,
    success: data?.success || false,
  };
};

// Selectors for optimized subscriptions
export const selectSelectedSymbol = (state: DriftMarketsStore) => state.selectedSymbol;
export const selectSelectedMarket = (state: DriftMarketsStore) => state.selectedMarket;

// Hook for market selection with SWR data
export const useDriftMarketSelection = () => {
  const { selectedSymbol, selectedMarket, selectMarket, setMarkets, markets: storeMarkets } = useDriftMarketsStore();
  const { markets: apiMarkets, isLoading, error, success } = useDriftMarkets();

  // Update store when markets data changes
  React.useEffect(() => {
    if (apiMarkets.length > 0) {
      setMarkets(apiMarkets);
    }
  }, [apiMarkets, setMarkets]);

  // Auto-select first market if none selected and markets are loaded in store
  React.useEffect(() => {
    if (!selectedSymbol && storeMarkets.ids.length > 0) {
      // Hardcode to select market at marketIndex 0 (SOL-PERP)
      const defaultMarket = storeMarkets.entities[0];
      if (defaultMarket) {
        selectMarket(defaultMarket.symbol);
      }
    }
  }, [selectedSymbol, storeMarkets.ids.length, storeMarkets.entities, selectMarket]);

  // Return markets as array for components (convert from normalized structure)
  const marketsArray = Object.values(storeMarkets.entities);

  return {
    selectedSymbol,
    selectedMarket,
    selectMarket,
    markets: marketsArray,
    isLoading,
    error,
    success,
  };
};