/**
 * WatchlistService Unit Tests
 * 
 * Focused tests for WatchlistService business logic with proper mocking
 */

import {
  createMockToken,
  createMockTokenPool
} from '../setup/database-mock';

// Mock the database before any imports
jest.mock('@/lib/db/db', () => ({
  default: {
    prepare: jest.fn(),
    exec: jest.fn(),
    close: jest.fn(),
    transaction: jest.fn(),
    pragma: jest.fn()
  }
}));

// Mock TokenService
jest.mock('@/lib/services/token.service', () => ({
  TokenService: {
    getOrFetchToken: jest.fn(),
    getToken: jest.fn(),
    getTokenPools: jest.fn(),
  },
}));

// Now import the service
import { WatchlistService } from '@/lib/services/watchlist.service';
import { TokenService } from '@/lib/services/token.service';
import mockDb from '@/lib/db/db';

// Cast mocks to access the mock functions
const mockDatabase = mockDb as jest.Mocked<typeof mockDb>;
const mockTokenService = TokenService as jest.Mocked<typeof TokenService>;

describe('WatchlistService', () => {
  const DEMO_WALLET = 'DEMO_WALLET_ADDRESS';
  const TEST_TOKEN_ADDRESS = 'So11111111111111111111111111111111111111112';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default TokenService responses
    mockTokenService.getOrFetchToken.mockResolvedValue(createMockToken({
      token_address: TEST_TOKEN_ADDRESS
    }));
    mockTokenService.getToken.mockResolvedValue(createMockToken({
      token_address: TEST_TOKEN_ADDRESS,
      symbol: 'SOL',
      name: 'Solana'
    }));
    mockTokenService.getTokenPools.mockResolvedValue([createMockTokenPool({
      token_address: TEST_TOKEN_ADDRESS
    })]);
  });

  describe('addTokenToWatchlist', () => {
    it('should add new token to watchlist successfully', async () => {
      // Arrange
      const input = {
        tokenAddress: TEST_TOKEN_ADDRESS,
        walletAddress: DEMO_WALLET,
        userNotes: 'My SOL investment'
      };

      // Mock prepared statements for the add flow
      const mockStatements = {
        checkTokenInWatchlistAny: {
          get: jest.fn().mockReturnValue(null) // No existing token
        },
        addToWatchlist: {
          run: jest.fn().mockReturnValue({ lastInsertRowid: 1 })
        },
        getWatchlistItem: {
          get: jest.fn().mockReturnValue({
            id: 1,
            wallet_address: DEMO_WALLET,
            token_address: TEST_TOKEN_ADDRESS,
            date_added: Math.floor(Date.now() / 1000),
            user_notes: 'My SOL investment',
            is_active: 1
          })
        }
      };

      // Setup database.prepare to return appropriate mock for each SQL query
      mockDatabase.prepare.mockImplementation((sql: string) => {
        if (sql.includes('checkTokenInWatchlistAny')) {
          return mockStatements.checkTokenInWatchlistAny;
        } else if (sql.includes('INSERT INTO user_watchlist')) {
          return mockStatements.addToWatchlist;
        } else if (sql.includes('getWatchlistItem')) {
          return mockStatements.getWatchlistItem;
        }
        return { get: jest.fn(), run: jest.fn(), all: jest.fn() };
      });

      // Act
      const result = await WatchlistService.addTokenToWatchlist(input);

      // Assert
      expect(result).toMatchObject({
        id: 1,
        walletAddress: DEMO_WALLET,
        tokenAddress: TEST_TOKEN_ADDRESS,
        userNotes: 'My SOL investment',
        isActive: true
      });

      // Verify service dependencies were called
      expect(mockTokenService.getOrFetchToken).toHaveBeenCalledWith(TEST_TOKEN_ADDRESS);
    });

    it('should reactivate soft-deleted token', async () => {
      // Arrange
      const input = {
        tokenAddress: TEST_TOKEN_ADDRESS,
        walletAddress: DEMO_WALLET,
        userNotes: 'Updated notes'
      };

      const mockStatements = {
        checkTokenInWatchlistAny: {
          get: jest.fn().mockReturnValue({ id: 1, is_active: 0 }) // Soft-deleted token exists
        },
        reactivateWatchlistItem: {
          run: jest.fn().mockReturnValue({ changes: 1 })
        },
        getWatchlistItem: {
          get: jest.fn().mockReturnValue({
            id: 1,
            wallet_address: DEMO_WALLET,
            token_address: TEST_TOKEN_ADDRESS,
            date_added: Math.floor(Date.now() / 1000),
            user_notes: 'Updated notes',
            is_active: 1
          })
        }
      };

      mockDatabase.prepare.mockImplementation((sql: string) => {
        if (sql.includes('checkTokenInWatchlistAny')) {
          return mockStatements.checkTokenInWatchlistAny;
        } else if (sql.includes('reactivateWatchlistItem')) {
          return mockStatements.reactivateWatchlistItem;
        } else if (sql.includes('getWatchlistItem')) {
          return mockStatements.getWatchlistItem;
        }
        return { get: jest.fn(), run: jest.fn(), all: jest.fn() };
      });

      // Act
      const result = await WatchlistService.addTokenToWatchlist(input);

      // Assert
      expect(result.id).toBe(1);
      expect(result.isActive).toBe(true);
      expect(result.userNotes).toBe('Updated notes');

      // Verify getOrFetchToken was NOT called (reactivation flow)
      expect(mockTokenService.getOrFetchToken).not.toHaveBeenCalled();
    });

    it('should throw error when token is already active', async () => {
      // Arrange
      const input = {
        tokenAddress: TEST_TOKEN_ADDRESS,
        walletAddress: DEMO_WALLET
      };

      mockDatabase.prepare.mockReturnValue({
        get: jest.fn().mockReturnValue({ id: 1, is_active: 1 }), // Active token exists
        run: jest.fn(),
        all: jest.fn()
      });

      // Act & Assert
      await expect(WatchlistService.addTokenToWatchlist(input))
        .rejects
        .toThrow('Token already exists in watchlist');
    });
  });

  describe('getUserWatchlist', () => {
    it('should return empty array when no items exist', async () => {
      // Arrange
      mockDatabase.prepare.mockReturnValue({
        all: jest.fn().mockReturnValue([]),
        get: jest.fn(),
        run: jest.fn()
      });

      // Act
      const result = await WatchlistService.getUserWatchlist(DEMO_WALLET);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return watchlist with token data', async () => {
      // Arrange
      const mockWatchlistEntity = {
        id: 1,
        wallet_address: DEMO_WALLET,
        token_address: TEST_TOKEN_ADDRESS,
        date_added: Math.floor(Date.now() / 1000),
        user_notes: 'My notes',
        is_active: 1
      };

      mockDatabase.prepare.mockReturnValue({
        all: jest.fn().mockReturnValue([mockWatchlistEntity]),
        get: jest.fn(),
        run: jest.fn()
      });

      // Act
      const result = await WatchlistService.getUserWatchlist(DEMO_WALLET);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        walletAddress: DEMO_WALLET,
        tokenAddress: TEST_TOKEN_ADDRESS,
        userNotes: 'My notes',
        isActive: true
      });
    });
  });

  describe('removeFromWatchlist', () => {
    it('should return true when item is removed', async () => {
      // Arrange
      mockDatabase.prepare.mockReturnValue({
        run: jest.fn().mockReturnValue({ changes: 1 }),
        get: jest.fn(),
        all: jest.fn()
      });

      // Act
      const result = await WatchlistService.removeFromWatchlist(1, DEMO_WALLET);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when item does not exist', async () => {
      // Arrange
      mockDatabase.prepare.mockReturnValue({
        run: jest.fn().mockReturnValue({ changes: 0 }),
        get: jest.fn(),
        all: jest.fn()
      });

      // Act
      const result = await WatchlistService.removeFromWatchlist(999, DEMO_WALLET);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isTokenInWatchlist', () => {
    it('should return true when token exists', async () => {
      // Arrange
      mockDatabase.prepare.mockReturnValue({
        get: jest.fn().mockReturnValue({ id: 1 }),
        run: jest.fn(),
        all: jest.fn()
      });

      // Act
      const result = await WatchlistService.isTokenInWatchlist(TEST_TOKEN_ADDRESS, DEMO_WALLET);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when token does not exist', async () => {
      // Arrange
      mockDatabase.prepare.mockReturnValue({
        get: jest.fn().mockReturnValue(null),
        run: jest.fn(),
        all: jest.fn()
      });

      // Act
      const result = await WatchlistService.isTokenInWatchlist('non-existent', DEMO_WALLET);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getUserWatchlistTokens', () => {
    it('should return array of token addresses', async () => {
      // Arrange
      const mockEntities = [
        { token_address: 'token1' },
        { token_address: 'token2' },
        { token_address: 'token3' }
      ];

      mockDatabase.prepare.mockReturnValue({
        all: jest.fn().mockReturnValue(mockEntities),
        get: jest.fn(),
        run: jest.fn()
      });

      // Act
      const result = await WatchlistService.getUserWatchlistTokens(DEMO_WALLET);

      // Assert
      expect(result).toEqual(['token1', 'token2', 'token3']);
    });
  });
});