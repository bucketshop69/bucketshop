import { Token, TokenPool } from './token';

// === WATCHLIST DATABASE ENTITIES ===

// User watchlist table
export interface UserWatchlistEntity {
  id: number;
  wallet_address: string;
  token_address: string;
  date_added: number;
  user_notes: string | null;
  is_active: number; // SQLite boolean (0/1)
}

// === WATCHLIST BUSINESS OBJECTS ===

// User watchlist item (combines token + user preferences)
export interface UserWatchlistItem {
  id: number;
  walletAddress: string;
  tokenAddress: string;
  dateAdded: Date;
  userNotes?: string;
  isActive: boolean;
  tokenInfo: Token;  // From token.ts
  pools: TokenPool[]; // From token.ts
}

// === WATCHLIST INPUT/OUTPUT TYPES ===

// Add token to watchlist
export interface AddTokenToWatchlistInput {
  tokenAddress: string;
  walletAddress: string;
  userNotes?: string;
}

// Update watchlist item
export interface UpdateWatchlistItemInput {
  id: number;
  userNotes?: string;
  isActive?: boolean;
}