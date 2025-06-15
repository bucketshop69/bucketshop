import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from './api/baseApi';

/**
 * Redux store configuration with RTK Query
 * 
 * This store includes:
 * - RTK Query API slice for data fetching
 * - Proper middleware setup for caching and background sync
 * - TypeScript integration for type-safe state access
 */
export const store = configureStore({
  reducer: {
    // Add the API reducer to the store
    [baseApi.reducerPath]: baseApi.reducer,
    // Add other reducers here as the app grows
  },
  
  // Add RTK Query middleware for caching, invalidation, polling, etc.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Disable serializable check for RTK Query
      serializableCheck: {
        ignoredActions: [
          // Ignore RTK Query actions
          'persist/PERSIST',
          'persist/REHYDRATE',
        ],
      },
    }).concat(baseApi.middleware),
  
  // Enable Redux DevTools in development
  devTools: process.env.NODE_ENV !== 'production',
});

// Enable listener behavior for RTK Query (refetchOnFocus, refetchOnReconnect)
setupListeners(store.dispatch);

// Type definitions for TypeScript integration
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export store for use in provider
export default store;