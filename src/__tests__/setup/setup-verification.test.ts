/**
 * Test Setup Verification
 * 
 * This test file verifies that our testing framework is properly configured:
 * - Jest with TypeScript support
 * - React Testing Library integration
 * - API mocking with fallback
 * - Database mocking
 * - Path aliases (@/ imports)
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { createMockDb, createMockToken, createMockWatchlistItem } from './database-mock'
import { server } from '../mocks/server-fallback'

describe('Testing Framework Setup Verification', () => {
  describe('Jest Configuration', () => {
    it('should support TypeScript', () => {
      const testFunction = (input: string): string => {
        return `Hello, ${input}!`
      }
      
      expect(testFunction('Jest')).toBe('Hello, Jest!')
    })

    it('should support async/await', async () => {
      const asyncFunction = async (): Promise<number> => {
        return new Promise(resolve => setTimeout(() => resolve(42), 10))
      }
      
      const result = await asyncFunction()
      expect(result).toBe(42)
    })

    it('should have jest-dom matchers available', () => {
      // Create a simple DOM element
      const element = document.createElement('div')
      element.textContent = 'Test Content'
      
      // Test that jest-dom matchers work
      expect(element).toBeInTheDocument
      expect(element).toHaveTextContent('Test Content')
    })
  })

  describe('Database Mocking', () => {
    let mockDb: ReturnType<typeof createMockDb>

    beforeEach(() => {
      mockDb = createMockDb()
    })

    it('should create mock database with proper methods', () => {
      expect(mockDb.prepare).toBeDefined()
      expect(mockDb.exec).toBeDefined()
      expect(mockDb.close).toBeDefined()
      expect(mockDb.transaction).toBeDefined()
    })

    it('should handle token insertion', () => {
      const insertStmt = mockDb.prepare('INSERT INTO tokens (token_address, symbol, name) VALUES (?, ?, ?)')
      const result = insertStmt.run({
        token_address: 'test-token',
        symbol: 'TEST',
        name: 'Test Token'
      })
      
      expect(result.changes).toBe(1)
      expect(result.lastInsertRowid).toBeGreaterThan(0)
    })

    it('should handle watchlist operations', () => {
      // Insert
      const insertStmt = mockDb.prepare('INSERT INTO user_watchlist (token_address) VALUES (?)')
      const insertResult = insertStmt.run({ token_address: 'test-token' })
      expect(insertResult.changes).toBe(1)

      // Select
      const selectStmt = mockDb.prepare('SELECT * FROM user_watchlist WHERE token_address = ?')
      const items = selectStmt.all({ token_address: 'test-token' })
      expect(items).toHaveLength(1)

      // Delete
      const deleteStmt = mockDb.prepare('DELETE FROM user_watchlist WHERE token_address = ?')
      const deleteResult = deleteStmt.run({ token_address: 'test-token' })
      expect(deleteResult.changes).toBe(1)
    })
  })

  describe('Test Data Factories', () => {
    it('should create mock token with defaults', () => {
      const token = createMockToken()
      
      expect(token).toHaveProperty('token_address')
      expect(token).toHaveProperty('symbol')
      expect(token).toHaveProperty('name')
      expect(token).toHaveProperty('decimals')
      expect(token.symbol).toBe('SOL')
    })

    it('should create mock token with overrides', () => {
      const token = createMockToken({
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6
      })
      
      expect(token.symbol).toBe('USDC')
      expect(token.name).toBe('USD Coin')
      expect(token.decimals).toBe(6)
    })

    it('should create mock watchlist item', () => {
      const item = createMockWatchlistItem()
      
      expect(item).toHaveProperty('id')
      expect(item).toHaveProperty('wallet_address')
      expect(item).toHaveProperty('token_address')
      expect(item).toHaveProperty('is_active')
      expect(item.is_active).toBe(1)
    })
  })

  describe('API Mocking', () => {
    it('should mock token search API', async () => {
      const response = await fetch('/api/tokens/search?q=sol')
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data).toHaveProperty('tokens')
      expect(Array.isArray(data.tokens)).toBe(true)
    })

    it('should mock watchlist API', async () => {
      const response = await fetch('/api/watchlist')
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data).toHaveProperty('watchlist')
      expect(Array.isArray(data.watchlist)).toBe(true)
    })

    it('should handle API error responses', async () => {
      const response = await fetch('/api/tokens/invalid-address/market-data')
      
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data).toHaveProperty('error')
    })

    it('should have mock server utilities available', () => {
      expect(server).toBeDefined()
      expect(server.use).toBeDefined()
      expect(server.resetHandlers).toBeDefined()
      expect(server.close).toBeDefined()
    })
  })

  describe('Environment Configuration', () => {
    it('should have test environment variables set', () => {
      expect(process.env.NODE_ENV).toBe('test')
    })

    it('should have global test utilities available', () => {
      expect(global.ResizeObserver).toBeDefined()
      expect(window.matchMedia).toBeDefined()
    })
  })
})