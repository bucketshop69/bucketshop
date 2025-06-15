const { http, HttpResponse } = require('msw')

// Mock data
const mockTokens = [
  {
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  },
  {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  },
]

const mockMarketData = {
  price: 150.25,
  priceChange24h: 5.2,
  volume24h: 1000000,
  marketCap: 65000000000,
  lastUpdated: new Date().toISOString(),
}

const mockWatchlistItems = [
  {
    id: 1,
    tokenAddress: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Solana',
    addedAt: new Date().toISOString(),
  },
]

const handlers = [
  // Token search endpoint
  http.get('/api/tokens/search', ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('q')
    
    if (!query) {
      return HttpResponse.json({ tokens: [] })
    }
    
    const filteredTokens = mockTokens.filter(token =>
      token.symbol.toLowerCase().includes(query.toLowerCase()) ||
      token.name.toLowerCase().includes(query.toLowerCase())
    )
    
    return HttpResponse.json({ tokens: filteredTokens })
  }),

  // Single token market data
  http.get('/api/tokens/:address/market-data', ({ params }) => {
    const { address } = params
    const token = mockTokens.find(t => t.address === address)
    
    if (!token) {
      return HttpResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      )
    }
    
    return HttpResponse.json({
      ...token,
      ...mockMarketData,
    })
  }),

  // Token price endpoint
  http.get('/api/tokens/:address/price', ({ params }) => {
    const { address } = params
    const token = mockTokens.find(t => t.address === address)
    
    if (!token) {
      return HttpResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      )
    }
    
    return HttpResponse.json({
      price: mockMarketData.price,
      priceChange24h: mockMarketData.priceChange24h,
      lastUpdated: mockMarketData.lastUpdated,
    })
  }),

  // Token RSI endpoint
  http.get('/api/tokens/:address/rsi', ({ params }) => {
    const { address } = params
    const token = mockTokens.find(t => t.address === address)
    
    if (!token) {
      return HttpResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      )
    }
    
    return HttpResponse.json({
      rsi: 62.5,
      period: 14,
      lastUpdated: new Date().toISOString(),
    })
  }),

  // Bulk market data endpoint
  http.post('/api/tokens/bulk-market-data', async ({ request }) => {
    const { addresses } = await request.json() as { addresses: string[] }
    
    const marketData = addresses.map(address => {
      const token = mockTokens.find(t => t.address === address)
      return {
        address,
        ...mockMarketData,
        symbol: token?.symbol || 'UNKNOWN',
      }
    })
    
    return HttpResponse.json({ marketData })
  }),

  // Watchlist endpoints
  http.get('/api/watchlist', () => {
    return HttpResponse.json({ watchlist: mockWatchlistItems })
  }),

  http.post('/api/watchlist', async ({ request }) => {
    const { tokenAddress } = await request.json() as { tokenAddress: string }
    const token = mockTokens.find(t => t.address === tokenAddress)
    
    if (!token) {
      return HttpResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      )
    }
    
    const newItem = {
      id: mockWatchlistItems.length + 1,
      tokenAddress,
      symbol: token.symbol,
      name: token.name,
      addedAt: new Date().toISOString(),
    }
    
    mockWatchlistItems.push(newItem)
    
    return HttpResponse.json({
      message: 'Token added to watchlist',
      item: newItem,
    })
  }),

  http.delete('/api/watchlist/:id', ({ params }) => {
    const { id } = params
    const index = mockWatchlistItems.findIndex(item => item.id === parseInt(id as string))
    
    if (index === -1) {
      return HttpResponse.json(
        { error: 'Watchlist item not found' },
        { status: 404 }
      )
    }
    
    mockWatchlistItems.splice(index, 1)
    
    return HttpResponse.json({
      message: 'Token removed from watchlist',
    })
  }),

  // External Jupiter API mock
  http.get('https://tokens.jup.ag/tokens', () => {
    return HttpResponse.json(mockTokens)
  }),

  http.get('https://api.jup.ag/price/v2', ({ request }) => {
    const url = new URL(request.url)
    const ids = url.searchParams.get('ids')
    
    if (!ids) {
      return HttpResponse.json({ data: {} })
    }
    
    const addresses = ids.split(',')
    const priceData: Record<string, any> = {}
    
    addresses.forEach(address => {
      priceData[address] = {
        id: address,
        price: mockMarketData.price.toString(),
        extraInfo: {
          lastSwappedPrice: {
            lastJupiterSellAt: Date.now(),
            lastJupiterSellPrice: mockMarketData.price.toString(),
          },
        },
      }
    })
    
    return HttpResponse.json({ data: priceData })
  }),
]

// Utility functions for tests
const updateMockTokenPrice = (address: string, price: number) => {
  mockMarketData.price = price
}

const addMockToken = (token: typeof mockTokens[0]) => {
  mockTokens.push(token)
}

const clearMockWatchlist = () => {
  mockWatchlistItems.length = 0
}

const getMockWatchlist = () => [...mockWatchlistItems]

module.exports = {
  handlers,
  updateMockTokenPrice,
  addMockToken,
  clearMockWatchlist,
  getMockWatchlist
}