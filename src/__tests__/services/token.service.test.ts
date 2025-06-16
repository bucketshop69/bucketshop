/**
 * TokenService Unit Tests
 * 
 * Tests the comprehensive TokenService functionality:
 * - Token CRUD operations (get, store, update)
 * - Jupiter API integration and fallback handling
 * - Search functionality (local and remote)
 * - Market data operations (price, RSI, bulk operations)
 * - Smart caching and placeholder creation
 */

import {
  createMockToken,
  createMockTokenPool
} from '../setup/database-mock';

// Mock the database
jest.mock('@/lib/db/db', () => ({
  default: {
    prepare: jest.fn(),
    exec: jest.fn(),
    close: jest.fn(),
    transaction: jest.fn(),
    pragma: jest.fn()
  }
}));

// Mock JupiterClient
jest.mock('@/lib/api/jupiter.client', () => ({
  JupiterClient: {
    fetchTokenAndPools: jest.fn(),
    getCurrentPrice: jest.fn(),
    getTokenOHLCVData: jest.fn(),
    getClosingPrices: jest.fn(),
  },
}));

// Mock RSI utilities
jest.mock('@/lib/utils/rsi', () => ({
  calculateTokenRSI: jest.fn(),
  getCurrentRSI: jest.fn(),
}));

// Import service after mocking
import { TokenService } from '@/lib/services/token.service';
import { JupiterClient } from '@/lib/api/jupiter.client';
import { calculateTokenRSI, getCurrentRSI } from '@/lib/utils/rsi';
import mockDb from '@/lib/db/db';

const mockDatabase = mockDb as jest.Mocked<typeof mockDb>;
const mockJupiterClient = JupiterClient as jest.Mocked<typeof JupiterClient>;
const mockCalculateRSI = calculateTokenRSI as jest.MockedFunction<typeof calculateTokenRSI>;
const mockGetCurrentRSI = getCurrentRSI as jest.MockedFunction<typeof getCurrentRSI>;

describe('TokenService', () => {
  const TEST_TOKEN_ADDRESS = 'So11111111111111111111111111111111111111112';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default database mock behavior
    mockDatabase.prepare.mockReturnValue({
      get: jest.fn(),
      run: jest.fn().mockReturnValue({ changes: 1 }),
      all: jest.fn().mockReturnValue([]),
    } as any);
  });

  describe('getToken', () => {
    it('should return token when found in database', async () => {
      // Arrange
      const mockTokenEntity = {
        token_address: TEST_TOKEN_ADDRESS,
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        icon_url: 'https://example.com/sol.png',
        market_cap: 65000000000,
        total_supply: 511616946,
        first_discovered: Math.floor(Date.now() / 1000),
        last_updated: Math.floor(Date.now() / 1000)
      };

      mockDatabase.prepare.mockReturnValue({
        get: jest.fn().mockReturnValue(mockTokenEntity),
        run: jest.fn(),
        all: jest.fn()
      } as any);

      // Act
      const result = await TokenService.getToken(TEST_TOKEN_ADDRESS);

      // Assert
      expect(result).toMatchObject({
        tokenAddress: TEST_TOKEN_ADDRESS,
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9
      });
    });

    it('should return null when token not found', async () => {
      // Arrange
      mockDatabase.prepare.mockReturnValue({
        get: jest.fn().mockReturnValue(undefined),
        run: jest.fn(),
        all: jest.fn()
      } as any);

      // Act
      const result = await TokenService.getToken('non-existent-token');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('tokenExists', () => {
    it('should return true when token exists', async () => {
      // Arrange
      mockDatabase.prepare.mockReturnValue({
        get: jest.fn().mockReturnValue({ token_address: TEST_TOKEN_ADDRESS }),
        run: jest.fn(),
        all: jest.fn()
      } as any);

      // Act
      const result = await TokenService.tokenExists(TEST_TOKEN_ADDRESS);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when token does not exist', async () => {
      // Arrange
      mockDatabase.prepare.mockReturnValue({
        get: jest.fn().mockReturnValue(null),
        run: jest.fn(),
        all: jest.fn()
      } as any);

      // Act
      const result = await TokenService.tokenExists('non-existent');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('storeTokenData', () => {
    it('should store token and pool data successfully', async () => {
      // Arrange
      const mockTokenData = {
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        icon: 'https://example.com/sol.png',
        marketCap: 65000000000,
        totalSupply: 511616946
      };

      const mockPoolsData = [
        {
          id: 'pool-1',
          dex: 'Raydium',
          quoteAsset: 'USDC',
          liquidity: 1000000,
          baseAsset: {
            symbol: 'SOL',
            name: 'Solana',
            decimals: 9,
            icon: 'https://example.com/sol.png'
          }
        }
      ];

      // Mock successful insert and retrieval
      let dbCallCount = 0;
      mockDatabase.prepare.mockImplementation(() => ({
        get: jest.fn().mockImplementation(() => {
          dbCallCount++;
          if (dbCallCount > 2) { // After inserts, return the stored token
            return {
              token_address: TEST_TOKEN_ADDRESS,
              symbol: 'SOL',
              name: 'Solana',
              decimals: 9,
              icon_url: 'https://example.com/sol.png',
              market_cap: 65000000000,
              total_supply: 511616946,
              first_discovered: Math.floor(Date.now() / 1000),
              last_updated: Math.floor(Date.now() / 1000)
            };
          }
          return null;
        }),
        run: jest.fn().mockReturnValue({ changes: 1 }),
        all: jest.fn()
      } as any));

      // Act
      const result = await TokenService.storeTokenData(TEST_TOKEN_ADDRESS, mockTokenData, mockPoolsData);

      // Assert
      expect(result).toMatchObject({
        tokenAddress: TEST_TOKEN_ADDRESS,
        symbol: 'SOL',
        name: 'Solana'
      });
    });

    it('should throw error when storage fails', async () => {
      // Arrange
      const mockTokenData = {
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9
      };

      // Mock failed storage (getToken returns null after insert)
      mockDatabase.prepare.mockReturnValue({
        get: jest.fn().mockReturnValue(null), // Storage failed
        run: jest.fn().mockReturnValue({ changes: 1 }),
        all: jest.fn()
      } as any);

      // Act & Assert
      await expect(TokenService.storeTokenData(TEST_TOKEN_ADDRESS, mockTokenData, []))
        .rejects
        .toThrow('Failed to store token data');
    });
  });

  describe('createPlaceholderToken', () => {
    it('should create placeholder token with default values', async () => {
      // Arrange
      let getCallCount = 0;
      mockDatabase.prepare.mockReturnValue({
        get: jest.fn().mockImplementation(() => {
          getCallCount++;
          if (getCallCount > 1) { // After insert, return the placeholder
            return {
              token_address: TEST_TOKEN_ADDRESS,
              symbol: 'UNKNOWN',
              name: 'Unknown Token',
              decimals: 6,
              icon_url: null,
              market_cap: null,
              total_supply: null,
              first_discovered: Math.floor(Date.now() / 1000),
              last_updated: Math.floor(Date.now() / 1000)
            };
          }
          return null;
        }),
        run: jest.fn().mockReturnValue({ changes: 1 }),
        all: jest.fn()
      } as any);

      // Act
      const result = await TokenService.createPlaceholderToken(TEST_TOKEN_ADDRESS);

      // Assert
      expect(result).toMatchObject({
        tokenAddress: TEST_TOKEN_ADDRESS,
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        decimals: 6
      });
    });
  });

  describe('searchTokenByAddress', () => {
    it('should return cached token if exists locally', async () => {
      // Arrange
      const cachedToken = {
        token_address: TEST_TOKEN_ADDRESS,
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        icon_url: 'https://example.com/sol.png',
        market_cap: 65000000000,
        total_supply: 511616946,
        first_discovered: Math.floor(Date.now() / 1000),
        last_updated: Math.floor(Date.now() / 1000)
      };

      mockDatabase.prepare.mockReturnValue({
        get: jest.fn().mockReturnValue(cachedToken),
        run: jest.fn(),
        all: jest.fn()
      } as any);

      // Act
      const result = await TokenService.searchTokenByAddress(TEST_TOKEN_ADDRESS);

      // Assert
      expect(result).toMatchObject({
        tokenAddress: TEST_TOKEN_ADDRESS,
        symbol: 'SOL',
        name: 'Solana'
      });
      
      // Verify Jupiter API was not called
      expect(mockJupiterClient.fetchTokenAndPools).not.toHaveBeenCalled();
    });

    it('should fetch from Jupiter API when token not in cache', async () => {
      // Arrange
      // First call returns null (not in cache), second call returns stored token
      let getCallCount = 0;
      mockDatabase.prepare.mockReturnValue({
        get: jest.fn().mockImplementation(() => {
          getCallCount++;
          if (getCallCount === 1) {
            return null; // Not in cache
          }
          return {
            token_address: TEST_TOKEN_ADDRESS,
            symbol: 'SOL',
            name: 'Solana',
            decimals: 9,
            icon_url: 'https://example.com/sol.png',
            market_cap: 65000000000,
            total_supply: 511616946,
            first_discovered: Math.floor(Date.now() / 1000),
            last_updated: Math.floor(Date.now() / 1000)
          };
        }),
        run: jest.fn().mockReturnValue({ changes: 1 }),
        all: jest.fn()
      } as any);

      mockJupiterClient.fetchTokenAndPools.mockResolvedValue({
        tokenData: {
          symbol: 'SOL',
          name: 'Solana',
          decimals: 9,
          icon: 'https://example.com/sol.png',
          marketCap: 65000000000,
          totalSupply: 511616946
        },
        poolsData: []
      });

      // Act
      const result = await TokenService.searchTokenByAddress(TEST_TOKEN_ADDRESS);

      // Assert
      expect(result).toMatchObject({
        tokenAddress: TEST_TOKEN_ADDRESS,
        symbol: 'SOL',
        name: 'Solana'
      });
      
      // Verify Jupiter API was called
      expect(mockJupiterClient.fetchTokenAndPools).toHaveBeenCalledWith(TEST_TOKEN_ADDRESS);
    });

    it('should return null for invalid token address', async () => {
      // Act
      const result = await TokenService.searchTokenByAddress('invalid');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when Jupiter API fails', async () => {
      // Arrange
      mockDatabase.prepare.mockReturnValue({
        get: jest.fn().mockReturnValue(null), // Not in cache
        run: jest.fn(),
        all: jest.fn()
      } as any);

      mockJupiterClient.fetchTokenAndPools.mockResolvedValue({
        tokenData: null,
        poolsData: []
      });

      // Act
      const result = await TokenService.searchTokenByAddress(TEST_TOKEN_ADDRESS);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getOrFetchToken', () => {
    it('should return cached token if available', async () => {
      // Arrange
      const cachedToken = {
        token_address: TEST_TOKEN_ADDRESS,
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        icon_url: null,
        market_cap: null,
        total_supply: null,
        first_discovered: Math.floor(Date.now() / 1000),
        last_updated: Math.floor(Date.now() / 1000)
      };

      mockDatabase.prepare.mockReturnValue({
        get: jest.fn().mockReturnValue(cachedToken),
        run: jest.fn(),
        all: jest.fn()
      } as any);

      // Act
      const result = await TokenService.getOrFetchToken(TEST_TOKEN_ADDRESS);

      // Assert
      expect(result.tokenAddress).toBe(TEST_TOKEN_ADDRESS);
      expect(mockJupiterClient.fetchTokenAndPools).not.toHaveBeenCalled();
    });

    it('should fetch from Jupiter when not cached', async () => {
      // Arrange
      let getCallCount = 0;
      mockDatabase.prepare.mockReturnValue({
        get: jest.fn().mockImplementation(() => {
          getCallCount++;
          if (getCallCount === 1) {
            return null; // Not cached initially
          }
          return {
            token_address: TEST_TOKEN_ADDRESS,
            symbol: 'SOL',
            name: 'Solana',
            decimals: 9,
            icon_url: null,
            market_cap: null,
            total_supply: null,
            first_discovered: Math.floor(Date.now() / 1000),
            last_updated: Math.floor(Date.now() / 1000)
          };
        }),
        run: jest.fn().mockReturnValue({ changes: 1 }),
        all: jest.fn()
      } as any);

      mockJupiterClient.fetchTokenAndPools.mockResolvedValue({
        tokenData: {
          symbol: 'SOL',
          name: 'Solana',
          decimals: 9
        },
        poolsData: []
      });

      // Act
      const result = await TokenService.getOrFetchToken(TEST_TOKEN_ADDRESS);

      // Assert
      expect(result.tokenAddress).toBe(TEST_TOKEN_ADDRESS);
      expect(mockJupiterClient.fetchTokenAndPools).toHaveBeenCalledWith(TEST_TOKEN_ADDRESS);
    });

    it('should create placeholder when Jupiter fails', async () => {
      // Arrange
      let getCallCount = 0;
      mockDatabase.prepare.mockReturnValue({
        get: jest.fn().mockImplementation(() => {
          getCallCount++;
          if (getCallCount === 1) {
            return null; // Not cached initially
          }
          return {
            token_address: TEST_TOKEN_ADDRESS,
            symbol: 'UNKNOWN',
            name: 'Unknown Token',
            decimals: 6,
            icon_url: null,
            market_cap: null,
            total_supply: null,
            first_discovered: Math.floor(Date.now() / 1000),
            last_updated: Math.floor(Date.now() / 1000)
          };
        }),
        run: jest.fn().mockReturnValue({ changes: 1 }),
        all: jest.fn()
      } as any);

      mockJupiterClient.fetchTokenAndPools.mockResolvedValue(null);

      // Act
      const result = await TokenService.getOrFetchToken(TEST_TOKEN_ADDRESS);

      // Assert
      expect(result.symbol).toBe('UNKNOWN');
      expect(result.name).toBe('Unknown Token');
    });
  });

  describe('getCurrentPrice', () => {
    it('should return current price from Jupiter', async () => {
      // Arrange
      mockJupiterClient.getCurrentPrice.mockResolvedValue(156.78);

      // Act
      const result = await TokenService.getCurrentPrice(TEST_TOKEN_ADDRESS);

      // Assert
      expect(result).toBe(156.78);
      expect(mockJupiterClient.getCurrentPrice).toHaveBeenCalledWith(TEST_TOKEN_ADDRESS);
    });

    it('should return null when Jupiter price fetch fails', async () => {
      // Arrange
      mockJupiterClient.getCurrentPrice.mockResolvedValue(null);

      // Act
      const result = await TokenService.getCurrentPrice(TEST_TOKEN_ADDRESS);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getCurrentRSI', () => {
    it('should return current RSI value', async () => {
      // Arrange
      mockGetCurrentRSI.mockResolvedValue(65.5);

      // Act
      const result = await TokenService.getCurrentRSI(TEST_TOKEN_ADDRESS);

      // Assert
      expect(result).toBe(65.5);
      expect(mockGetCurrentRSI).toHaveBeenCalledWith(TEST_TOKEN_ADDRESS, 14, expect.any(String));
    });

    it('should return null when RSI calculation fails', async () => {
      // Arrange
      mockGetCurrentRSI.mockResolvedValue(null);

      // Act
      const result = await TokenService.getCurrentRSI(TEST_TOKEN_ADDRESS);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getTokenWithMarketData', () => {
    it('should return token with price and RSI data', async () => {
      // Arrange
      const mockTokenEntity = {
        token_address: TEST_TOKEN_ADDRESS,
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        icon_url: null,
        market_cap: null,
        total_supply: null,
        first_discovered: Math.floor(Date.now() / 1000),
        last_updated: Math.floor(Date.now() / 1000)
      };

      mockDatabase.prepare.mockReturnValue({
        get: jest.fn().mockReturnValue(mockTokenEntity),
        run: jest.fn(),
        all: jest.fn()
      } as any);

      mockJupiterClient.getCurrentPrice.mockResolvedValue(156.78);
      mockGetCurrentRSI.mockResolvedValue(65.5);

      // Act
      const result = await TokenService.getTokenWithMarketData(TEST_TOKEN_ADDRESS);

      // Assert
      expect(result).toMatchObject({
        tokenAddress: TEST_TOKEN_ADDRESS,
        symbol: 'SOL',
        currentPrice: 156.78,
        rsi14: 65.5
      });
    });

    it('should return null when token not found', async () => {
      // Arrange
      mockDatabase.prepare.mockReturnValue({
        get: jest.fn().mockReturnValue(null),
        run: jest.fn(),
        all: jest.fn()
      } as any);

      // Act
      const result = await TokenService.getTokenWithMarketData(TEST_TOKEN_ADDRESS);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle market data fetch failures gracefully', async () => {
      // Arrange
      const mockTokenEntity = {
        token_address: TEST_TOKEN_ADDRESS,
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        icon_url: null,
        market_cap: null,
        total_supply: null,
        first_discovered: Math.floor(Date.now() / 1000),
        last_updated: Math.floor(Date.now() / 1000)
      };

      mockDatabase.prepare.mockReturnValue({
        get: jest.fn().mockReturnValue(mockTokenEntity),
        run: jest.fn(),
        all: jest.fn()
      } as any);

      mockJupiterClient.getCurrentPrice.mockRejectedValue(new Error('Price fetch failed'));
      mockGetCurrentRSI.mockRejectedValue(new Error('RSI calculation failed'));

      // Act
      const result = await TokenService.getTokenWithMarketData(TEST_TOKEN_ADDRESS);

      // Assert
      expect(result).toMatchObject({
        tokenAddress: TEST_TOKEN_ADDRESS,
        symbol: 'SOL'
      });
      expect(result?.currentPrice).toBeUndefined();
      expect(result?.rsi14).toBeUndefined();
    });
  });

  describe('getBulkMarketData', () => {
    it('should fetch market data for multiple tokens in parallel', async () => {
      // Arrange
      const tokenAddresses = [TEST_TOKEN_ADDRESS, 'token2', 'token3'];
      
      mockJupiterClient.getCurrentPrice
        .mockResolvedValueOnce(156.78)  // SOL
        .mockResolvedValueOnce(1.0)     // token2
        .mockResolvedValueOnce(25.5);   // token3

      mockGetCurrentRSI
        .mockResolvedValueOnce(65.5)    // SOL RSI
        .mockResolvedValueOnce(45.2)    // token2 RSI
        .mockResolvedValueOnce(78.9);   // token3 RSI

      // Act
      const result = await TokenService.getBulkMarketData(tokenAddresses);

      // Assert
      expect(result).toEqual({
        [TEST_TOKEN_ADDRESS]: { currentPrice: 156.78, rsi14: 65.5 },
        'token2': { currentPrice: 1.0, rsi14: 45.2 },
        'token3': { currentPrice: 25.5, rsi14: 78.9 }
      });

      // Verify parallel execution
      expect(mockJupiterClient.getCurrentPrice).toHaveBeenCalledTimes(3);
      expect(mockGetCurrentRSI).toHaveBeenCalledTimes(3);
    });

    it('should handle individual token failures gracefully', async () => {
      // Arrange
      const tokenAddresses = [TEST_TOKEN_ADDRESS, 'failing-token'];
      
      mockJupiterClient.getCurrentPrice
        .mockResolvedValueOnce(156.78)  // SOL succeeds
        .mockRejectedValueOnce(new Error('Price fetch failed')); // failing-token fails

      mockGetCurrentRSI
        .mockResolvedValueOnce(65.5)    // SOL RSI succeeds
        .mockResolvedValueOnce(null);   // failing-token RSI returns null

      // Act
      const result = await TokenService.getBulkMarketData(tokenAddresses);

      // Assert
      expect(result).toEqual({
        [TEST_TOKEN_ADDRESS]: { currentPrice: 156.78, rsi14: 65.5 },
        'failing-token': {} // No data due to failures
      });
    });

    it('should respect includePriceData and includeRSI flags', async () => {
      // Arrange
      const tokenAddresses = [TEST_TOKEN_ADDRESS];

      // Act
      const result = await TokenService.getBulkMarketData(tokenAddresses, false, false);

      // Assert
      expect(result).toEqual({
        [TEST_TOKEN_ADDRESS]: {}
      });

      // Verify no API calls were made
      expect(mockJupiterClient.getCurrentPrice).not.toHaveBeenCalled();
      expect(mockGetCurrentRSI).not.toHaveBeenCalled();
    });
  });

  describe('getTokenPools', () => {
    it('should return array of token pools', async () => {
      // Arrange
      const mockPoolEntities = [
        {
          id: 1,
          token_address: TEST_TOKEN_ADDRESS,
          pool_id: 'pool-1',
          dex: 'Raydium',
          quote_asset: 'USDC',
          liquidity: 1000000,
          is_primary: 1,
          created_at: Math.floor(Date.now() / 1000)
        },
        {
          id: 2,
          token_address: TEST_TOKEN_ADDRESS,
          pool_id: 'pool-2',
          dex: 'Orca',
          quote_asset: 'USDT',
          liquidity: 500000,
          is_primary: 0,
          created_at: Math.floor(Date.now() / 1000)
        }
      ];

      mockDatabase.prepare.mockReturnValue({
        all: jest.fn().mockReturnValue(mockPoolEntities),
        get: jest.fn(),
        run: jest.fn()
      } as any);

      // Act
      const result = await TokenService.getTokenPools(TEST_TOKEN_ADDRESS);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        tokenAddress: TEST_TOKEN_ADDRESS,
        poolId: 'pool-1',
        dex: 'Raydium',
        isPrimary: true
      });
      expect(result[1]).toMatchObject({
        poolId: 'pool-2',
        dex: 'Orca',
        isPrimary: false
      });
    });
  });
});