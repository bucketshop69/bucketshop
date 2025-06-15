import { baseApi } from './baseApi';
import {
  Token,
  TokenSearchResult,
  TokenPrice,
  RSIData
} from '@/types/token';
import {
  UserWatchlistItem,
  AddTokenToWatchlistInput,
  UpdateWatchlistItemInput
} from '@/types/watchlist';

/**
 * Enhanced token data combining token info with market data
 */
export interface TokenWithMarketData extends Token {
  currentPrice?: number;
  priceChange24h?: number;
  volume24h?: number;
  liquidity?: number;
  rsi?: number;
  rsiSignal?: 'oversold' | 'overbought' | 'neutral';
}

/**
 * Bulk market data response for watchlist
 */
export interface BulkMarketDataResponse {
  tokens: TokenWithMarketData[];
  lastUpdated: string;
}

/**
 * Token search response
 */
export interface TokenSearchResponse {
  results: TokenSearchResult[];
  totalCount: number;
}

/**
 * Watchlist API slice - extends the base API
 * 
 * This slice defines all endpoints related to watchlist and token operations.
 * Each endpoint automatically generates hooks like useGetUserWatchlistQuery,
 * useAddTokenToWatchlistMutation, etc.
 */
export const watchlistApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // === WATCHLIST OPERATIONS ===

    /**
     * Get user's complete watchlist with market data
     * Cached for 30 seconds, auto-refetch in background
     */
    getUserWatchlist: builder.query<UserWatchlistItem[], string>({
      query: (walletAddress) => ({
        url: `/watchlist?walletAddress=${encodeURIComponent(walletAddress)}`,
        method: 'GET',
      }),
      // Disable caching entirely

    }),

    /**
     * Get bulk market data for watchlist tokens
     * This combines token info + live prices + RSI
     */
    getBulkMarketData: builder.query<BulkMarketDataResponse, string[]>({
      query: (tokenAddresses) => ({
        url: '/tokens/bulk-market-data',
        method: 'POST',
        body: { tokenAddresses },
      }),
      // Disable caching entirely

    }),

    /**
     * Add token to user's watchlist
     * Optimistically updates the cache
     */
    addTokenToWatchlist: builder.mutation<UserWatchlistItem, AddTokenToWatchlistInput>({
      query: (input) => ({
        url: '/watchlist',
        method: 'POST',
        body: input,
      }),
      // No cache invalidation - manual refetch handles updates
    }),

    /**
     * Remove token from watchlist
     */
    removeFromWatchlist: builder.mutation<void, { id: number; walletAddress: string; tokenAddress: string }>({
      query: ({ id, walletAddress }) => ({
        url: `/watchlist/${id}`,
        method: 'DELETE',
        body: { walletAddress },
      }),
      // No cache invalidation - manual refetch handles updates
    }),

    /**
     * Update watchlist item (notes, active status)
     */
    updateWatchlistItem: builder.mutation<UserWatchlistItem, UpdateWatchlistItemInput>({
      query: (input) => ({
        url: `/watchlist/${input.id}`,
        method: 'PATCH',
        body: input,
      }),
      // No cache invalidation - manual refetch handles updates
    }),

    // === TOKEN OPERATIONS ===

    /**
     * Search token by address (exact lookup)
     */
    searchTokenByAddress: builder.query<TokenSearchResponse, string>({
      query: (tokenAddress) => ({
        url: `/tokens/search?q=${encodeURIComponent(tokenAddress)}&type=address`,
        method: 'GET',
      }),
      // Disable caching entirely

    }),

    /**
     * Search local tokens for suggestions/autocomplete
     */
    searchLocalTokens: builder.query<TokenSearchResponse, { query: string; limit?: number }>({
      query: ({ query, limit = 10 }) => ({
        url: `/tokens/search?q=${encodeURIComponent(query)}&type=local&limit=${limit}`,
        method: 'GET',
      }),
      // Disable caching entirely

    }),

    /**
     * Get detailed token information with market data
     */
    getTokenWithMarketData: builder.query<TokenWithMarketData, string>({
      query: (tokenAddress) => ({
        url: `/tokens/${tokenAddress}/market-data`,
        method: 'GET',
      }),
      // Disable caching entirely

    }),

    /**
     * Get current token price only
     */
    getTokenPrice: builder.query<TokenPrice, string>({
      query: (tokenAddress) => ({
        url: `/tokens/${tokenAddress}/price`,
        method: 'GET',
      }),
      // Disable caching entirely

    }),

    /**
     * Get RSI data for a token
     */
    getTokenRSI: builder.query<RSIData, { tokenAddress: string; period?: number }>({
      query: ({ tokenAddress, period = 14 }) => ({
        url: `/tokens/${tokenAddress}/rsi?period=${period}`,
        method: 'GET',
      }),
      // Disable caching entirely

    }),

  }),
});

// Export hooks for use in components
export const {
  // Watchlist operations
  useGetUserWatchlistQuery,
  useGetBulkMarketDataQuery,
  useAddTokenToWatchlistMutation,
  useRemoveFromWatchlistMutation,
  useUpdateWatchlistItemMutation,

  // Token operations
  useSearchTokenByAddressQuery,
  useSearchLocalTokensQuery,
  useGetTokenWithMarketDataQuery,
  useGetTokenPriceQuery,
  useGetTokenRSIQuery,

  // Manual trigger functions
  useLazySearchTokenByAddressQuery,
  useLazySearchLocalTokensQuery,
  useLazyGetTokenWithMarketDataQuery,
} = watchlistApi;