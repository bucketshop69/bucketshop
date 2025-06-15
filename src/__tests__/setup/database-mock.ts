// Mock database for tests - implements Database interface without importing the actual class

// Mock database for tests
export class MockDatabase {
  private statements: Map<string, any> = new Map()
  private data: Map<string, any[]> = new Map()
  
  constructor() {
    // Initialize empty tables
    this.data.set('tokens', [])
    this.data.set('token_pools', [])
    this.data.set('user_watchlist', [])
  }

  prepare(sql: string) {
    const mockStatement = {
      get: jest.fn((_params?: any) => {
        if (sql.includes('SELECT') && sql.includes('user_watchlist')) {
          const watchlist = this.data.get('user_watchlist') || []
          return watchlist[0] || null
        }
        if (sql.includes('SELECT') && sql.includes('tokens')) {
          const tokens = this.data.get('tokens') || []
          return tokens[0] || null
        }
        return null
      }),
      
      all: jest.fn((_params?: any) => {
        if (sql.includes('SELECT') && sql.includes('user_watchlist')) {
          return this.data.get('user_watchlist') || []
        }
        if (sql.includes('SELECT') && sql.includes('tokens')) {
          return this.data.get('tokens') || []
        }
        return []
      }),
      
      run: jest.fn((params?: any) => {
        let changes = 0
        let lastInsertRowid = 0
        
        if (sql.includes('INSERT INTO user_watchlist')) {
          const watchlist = this.data.get('user_watchlist') || []
          lastInsertRowid = watchlist.length + 1
          watchlist.push({
            id: lastInsertRowid,
            wallet_address: 'DEMO_WALLET_ADDRESS',
            token_address: params?.token_address || 'test-token',
            date_added: Date.now(),
            user_notes: null,
            is_active: 1
          })
          this.data.set('user_watchlist', watchlist)
          changes = 1
        }
        
        if (sql.includes('INSERT INTO tokens')) {
          const tokens = this.data.get('tokens') || []
          lastInsertRowid = tokens.length + 1
          tokens.push({
            token_address: params?.token_address || 'test-token',
            symbol: params?.symbol || 'TEST',
            name: params?.name || 'Test Token',
            decimals: params?.decimals || 6,
            icon_url: params?.icon_url || null,
            market_cap: params?.market_cap || null,
            total_supply: params?.total_supply || null,
            first_discovered: Date.now(),
            last_updated: Date.now()
          })
          this.data.set('tokens', tokens)
          changes = 1
        }
        
        if (sql.includes('DELETE FROM user_watchlist')) {
          const watchlist = this.data.get('user_watchlist') || []
          const filtered = watchlist.filter(item => 
            item.token_address !== (params?.token_address || 'test-token')
          )
          this.data.set('user_watchlist', filtered)
          changes = watchlist.length - filtered.length
        }
        
        return { changes, lastInsertRowid }
      })
    }
    
    this.statements.set(sql, mockStatement)
    return mockStatement
  }

  exec(_sql: string) {
    // Mock table creation and other exec operations
    return this
  }

  pragma(_statement: string) {
    // Mock pragma operations
    return this
  }

  close() {
    // Mock close operation
    this.data.clear()
    this.statements.clear()
  }

  transaction(fn: () => void) {
    return {
      immediate: () => fn(),
      deferred: () => fn(),
      exclusive: () => fn(),
    }
  }

  // Test utilities
  seedData(table: string, data: any[]) {
    this.data.set(table, [...data])
  }

  clearData(table?: string) {
    if (table) {
      this.data.set(table, [])
    } else {
      this.data.clear()
      this.data.set('tokens', [])
      this.data.set('token_pools', [])
      this.data.set('user_watchlist', [])
    }
  }

  getData(table: string) {
    return this.data.get(table) || []
  }
}

// Factory function for creating mock database instances
export function createMockDb(): MockDatabase {
  return new MockDatabase()
}

// Mock the database module
export function mockDatabase() {
  const mockDb = createMockDb()
  
  jest.doMock('@/lib/db/db', () => ({
    __esModule: true,
    default: mockDb,
  }))
  
  return mockDb
}

// Test data factories for database entities
export const createMockToken = (overrides: Partial<any> = {}) => ({
  token_address: 'So11111111111111111111111111111111111111112',
  symbol: 'SOL',
  name: 'Solana',
  decimals: 9,
  icon_url: 'https://example.com/sol.png',
  market_cap: 65000000000,
  total_supply: 511616946,
  first_discovered: Date.now(),
  last_updated: Date.now(),
  ...overrides,
})

export const createMockWatchlistItem = (overrides: Partial<any> = {}) => ({
  id: 1,
  wallet_address: 'DEMO_WALLET_ADDRESS',
  token_address: 'So11111111111111111111111111111111111111112',
  date_added: Date.now(),
  user_notes: null,
  is_active: 1,
  ...overrides,
})

export const createMockTokenPool = (overrides: Partial<any> = {}) => ({
  id: 1,
  token_address: 'So11111111111111111111111111111111111111112',
  pool_id: 'test-pool-id',
  dex: 'Raydium',
  quote_asset: 'USDC',
  liquidity: 1000000,
  is_primary: 1,
  created_at: Date.now(),
  ...overrides,
})