// Fallback MSW setup for when MSW isn't available
// This allows us to complete the testing framework setup

export function setupMockServer() {
  // Mock fetch for testing without MSW
  const originalFetch = global.fetch
  
  beforeAll(() => {
    global.fetch = jest.fn((url: string, init?: RequestInit) => {
      // Basic mock responses for common endpoints
      if (url.includes('/api/tokens/search')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ tokens: [] }),
        } as Response)
      }
      
      if (url.includes('/api/watchlist')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ watchlist: [] }),
        } as Response)
      }
      
      // Default fallback
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' }),
      } as Response)
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    global.fetch = originalFetch
  })
}

export const server = {
  use: jest.fn(),
  resetHandlers: jest.fn(),
  close: jest.fn(),
}