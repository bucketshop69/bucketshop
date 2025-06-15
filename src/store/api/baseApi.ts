import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * Base API configuration for RTK Query
 * 
 * This creates the foundation for all API endpoints in the app.
 * RTK Query automatically handles:
 * - Loading states
 * - Caching with intelligent invalidation
 * - Background refetching
 * - Optimistic updates
 * - Request deduplication
 */
export const baseApi = createApi({
  reducerPath: 'api',
  
  // Configure base query with proper error handling
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      // Add any auth headers here in the future
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),

  // Define tag types for cache invalidation
  tagTypes: [
    'Token',           // Individual token data
    'Watchlist',       // User's watchlist
    'TokenPrice',      // Live price data
    'TokenSearch',     // Search results
    'MarketData',      // Market data with RSI
  ],

  // Endpoints will be defined in separate slice files
  endpoints: () => ({}),
});