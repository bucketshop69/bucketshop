import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { ThemeProvider } from 'next-themes'

// Import your store slices when they exist
// import { watchlistSlice } from '@/store/watchlistSlice'

// Create a test store factory
export function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      // Add your reducers here as they're created
      // watchlist: watchlistSlice.reducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  })
}

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: any
  store?: ReturnType<typeof createTestStore>
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </Provider>
    )
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  }
}

// Test data factories
export const mockToken = {
  address: 'So11111111111111111111111111111111111111112',
  symbol: 'SOL',
  name: 'Solana',
  decimals: 9,
  logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  price: 150.25,
  priceChange24h: 5.2,
  volume24h: 1000000,
  marketCap: 65000000000,
  rsi: 62.5
}

export const mockWatchlistItem = {
  id: 1,
  tokenAddress: 'So11111111111111111111111111111111111111112',
  symbol: 'SOL',
  name: 'Solana',
  addedAt: new Date().toISOString(),
  ...mockToken
}

// Database test helpers
export const createMockDatabase = () => ({
  prepare: jest.fn().mockReturnValue({
    get: jest.fn(),
    all: jest.fn(),
    run: jest.fn().mockReturnValue({ changes: 1, lastInsertRowid: 1 }),
  }),
  close: jest.fn(),
  transaction: jest.fn().mockReturnValue({
    immediate: jest.fn(),
    deferred: jest.fn(),
    exclusive: jest.fn(),
  }),
})

// API response helpers
export const createApiResponse = <T>(data: T, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
})

// Re-export everything from testing-library
export * from '@testing-library/react'
export { userEvent } from '@testing-library/user-event'