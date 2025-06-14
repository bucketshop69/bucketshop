import Database from 'better-sqlite3';
import path from 'path';

// Create database file path
const dbPath = path.join(process.cwd(), 'src/lib/db/watchlist.db');

// Initialize database connection
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Global tokens table - shared across all users
const createTokensTable = `
  CREATE TABLE IF NOT EXISTS tokens (
    token_address TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    decimals INTEGER NOT NULL DEFAULT 6,
    icon_url TEXT,
    market_cap REAL,
    total_supply REAL,
    first_discovered INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    last_updated INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  )
`;

// Token pools table - multiple pools per token
const createTokenPoolsTable = `
  CREATE TABLE IF NOT EXISTS token_pools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_address TEXT NOT NULL,
    pool_id TEXT NOT NULL,
    dex TEXT NOT NULL,
    quote_asset TEXT NOT NULL,
    liquidity REAL,
    is_primary INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (token_address) REFERENCES tokens (token_address),
    UNIQUE(token_address, pool_id)
  )
`;

// User watchlist table - personal references to tokens
const createUserWatchlistTable = `
  CREATE TABLE IF NOT EXISTS user_watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT NOT NULL DEFAULT 'DEMO_WALLET_ADDRESS',
    token_address TEXT NOT NULL,
    date_added INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    user_notes TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (token_address) REFERENCES tokens (token_address),
    UNIQUE(wallet_address, token_address)
  )
`;

// Create indexes for faster lookups
const createIndexes = `
  CREATE INDEX IF NOT EXISTS idx_tokens_symbol ON tokens(symbol);
  CREATE INDEX IF NOT EXISTS idx_token_pools_token ON token_pools(token_address);
  CREATE INDEX IF NOT EXISTS idx_token_pools_dex ON token_pools(dex);
  CREATE INDEX IF NOT EXISTS idx_user_watchlist_wallet ON user_watchlist(wallet_address);
  CREATE INDEX IF NOT EXISTS idx_user_watchlist_active ON user_watchlist(wallet_address, is_active);
`;

// Initialize tables
db.exec(createTokensTable);
db.exec(createTokenPoolsTable);
db.exec(createUserWatchlistTable);
db.exec(createIndexes);

export default db;