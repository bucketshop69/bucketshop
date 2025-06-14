import db from '@/lib/db/db';
import { TokenService } from './token.service';
import {
  UserWatchlistEntity,
  UserWatchlistItem,
  AddTokenToWatchlistInput,
  UpdateWatchlistItemInput
} from '@/types/watchlist';

// Hardcoded wallet for MVP
const DEMO_WALLET = 'DEMO_WALLET_ADDRESS';

// === PREPARED STATEMENTS ===

const statements = {
  // User watchlist operations
  addToWatchlist: db.prepare(`
    INSERT INTO user_watchlist (wallet_address, token_address, user_notes)
    VALUES (?, ?, ?)
  `),
  
  getUserWatchlist: db.prepare(`
    SELECT * FROM user_watchlist
    WHERE wallet_address = ? AND is_active = 1
    ORDER BY date_added DESC
  `),
  
  getWatchlistItem: db.prepare(`
    SELECT * FROM user_watchlist
    WHERE id = ? AND wallet_address = ? AND is_active = 1
  `),
  
  updateWatchlistItem: db.prepare(`
    UPDATE user_watchlist 
    SET user_notes = ?, is_active = ?
    WHERE id = ? AND wallet_address = ?
  `),
  
  removeFromWatchlist: db.prepare(`
    UPDATE user_watchlist 
    SET is_active = 0 
    WHERE id = ? AND wallet_address = ?
  `),
  
  checkTokenInWatchlist: db.prepare(`
    SELECT id FROM user_watchlist 
    WHERE wallet_address = ? AND token_address = ? AND is_active = 1
  `)
};

// === WATCHLIST SERVICE CLASS ===

export class WatchlistService {
  
  /**
   * Add token to user's watchlist
   * 1. Ensure token exists in global registry (via TokenService)
   * 2. Add to user's personal watchlist
   */
  static async addTokenToWatchlist(input: AddTokenToWatchlistInput): Promise<UserWatchlistItem> {
    // Check if already in user's watchlist
    const existing = statements.checkTokenInWatchlist.get(input.walletAddress, input.tokenAddress);
    if (existing) {
      throw new Error('Token already exists in watchlist');
    }

    // Ensure token exists in global registry (TokenService handles Jupiter API fetching)
    await TokenService.getOrFetchToken(input.tokenAddress);

    // Add to user's watchlist
    const result = statements.addToWatchlist.run(
      input.walletAddress,
      input.tokenAddress,
      input.userNotes || null
    );

    // Get the created watchlist item
    const watchlistItem = await this.getWatchlistItem(result.lastInsertRowid as number, input.walletAddress);
    if (!watchlistItem) {
      throw new Error('Failed to retrieve created watchlist item');
    }

    return watchlistItem;
  }

  /**
   * Get user's complete watchlist with token info and pools
   */
  static async getUserWatchlist(walletAddress: string = DEMO_WALLET): Promise<UserWatchlistItem[]> {
    const entities = statements.getUserWatchlist.all(walletAddress) as UserWatchlistEntity[];
    
    const watchlistItems: UserWatchlistItem[] = [];
    
    for (const entity of entities) {
      // Get token info from TokenService
      const tokenInfo = await TokenService.getToken(entity.token_address);
      if (!tokenInfo) {
        // Skip if token data is missing (shouldn't happen with proper data integrity)
        continue;
      }

      // Get pools for this token
      const pools = await TokenService.getTokenPools(entity.token_address);
      
      // Create watchlist item
      watchlistItems.push({
        id: entity.id,
        walletAddress: entity.wallet_address,
        tokenAddress: entity.token_address,
        dateAdded: new Date(entity.date_added * 1000),
        userNotes: entity.user_notes || undefined,
        isActive: entity.is_active === 1,
        tokenInfo,
        pools,
      });
    }
    
    return watchlistItems;
  }

  /**
   * Get specific watchlist item
   */
  static async getWatchlistItem(id: number, walletAddress: string = DEMO_WALLET): Promise<UserWatchlistItem | null> {
    const entity = statements.getWatchlistItem.get(id, walletAddress) as UserWatchlistEntity | undefined;
    if (!entity) return null;

    // Get token info from TokenService
    const tokenInfo = await TokenService.getToken(entity.token_address);
    if (!tokenInfo) {
      return null; // Token data missing
    }

    // Get pools for this token
    const pools = await TokenService.getTokenPools(entity.token_address);
    
    return {
      id: entity.id,
      walletAddress: entity.wallet_address,
      tokenAddress: entity.token_address,
      dateAdded: new Date(entity.date_added * 1000),
      userNotes: entity.user_notes || undefined,
      isActive: entity.is_active === 1,
      tokenInfo,
      pools,
    };
  }

  /**
   * Update watchlist item (notes, active status)
   */
  static async updateWatchlistItem(input: UpdateWatchlistItemInput, walletAddress: string = DEMO_WALLET): Promise<UserWatchlistItem | null> {
    const current = await this.getWatchlistItem(input.id, walletAddress);
    if (!current) {
      throw new Error('Watchlist item not found');
    }

    statements.updateWatchlistItem.run(
      input.userNotes !== undefined ? input.userNotes : current.userNotes,
      input.isActive !== undefined ? (input.isActive ? 1 : 0) : (current.isActive ? 1 : 0),
      input.id,
      walletAddress
    );

    return this.getWatchlistItem(input.id, walletAddress);
  }

  /**
   * Remove token from watchlist (soft delete)
   */
  static async removeFromWatchlist(id: number, walletAddress: string = DEMO_WALLET): Promise<boolean> {
    const result = statements.removeFromWatchlist.run(id, walletAddress);
    return result.changes > 0;
  }

  /**
   * Check if token is in user's watchlist
   */
  static async isTokenInWatchlist(tokenAddress: string, walletAddress: string = DEMO_WALLET): Promise<boolean> {
    const result = statements.checkTokenInWatchlist.get(walletAddress, tokenAddress);
    return !!result;
  }

  /**
   * Get user's watchlist as simple token addresses (for quick lookups)
   */
  static async getUserWatchlistTokens(walletAddress: string = DEMO_WALLET): Promise<string[]> {
    const entities = statements.getUserWatchlist.all(walletAddress) as UserWatchlistEntity[];
    return entities.map(entity => entity.token_address);
  }
}