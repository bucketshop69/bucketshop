// === DEX CONSTANTS ===

// Supported DEX platforms for pool data
export enum DEXType {
  RAYDIUM = 'Raydium',
  ORCA = 'Orca',
  METEORA = 'Meteora',
  PUMP_FUN = 'swap.pump.fun'
}

// === TOKEN DATABASE ENTITIES ===

// Global tokens table
export interface TokenEntity {
  token_address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon_url: string | null;
  market_cap: number | null;
  total_supply: number | null;
  first_discovered: number;
  last_updated: number;
}

// Token pools table
export interface TokenPoolEntity {
  id: number;
  token_address: string;
  pool_id: string;
  dex: DEXType;
  quote_asset: string;
  liquidity: number | null;
  is_primary: number; // SQLite boolean (0/1)
  created_at: number;
}

// === TOKEN BUSINESS OBJECTS ===

// Token business object
export interface Token {
  tokenAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  iconUrl?: string;
  marketCap?: number;
  totalSupply?: number;
  firstDiscovered: Date;
  lastUpdated: Date;
}

// Token pool business object
export interface TokenPool {
  id: number;
  tokenAddress: string;
  poolId: string;
  dex: DEXType;
  quoteAsset: string;
  liquidity?: number;
  isPrimary: boolean;
  createdAt: Date;
}

// === JUPITER API TYPES ===

// Jupiter API response for token data
export interface JupiterTokenData {
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
  marketCap?: number;
  totalSupply?: number;
}

// Jupiter API response for pool data
export interface JupiterPoolData {
  id: string;
  dex: string;
  baseAsset: {
    id: string;
    symbol: string;
    name: string;
    decimals: number;
    icon?: string;
    mcap?: number;
    totalSupply?: number;
  };
  quoteAsset: string;
  liquidity: number;
}

// === POOL RESERVE DATA ===

// Pool reserve information from DEX account data
export interface PoolReserveData {
  poolId: string;
  dex: DEXType;
  baseReserve: number;
  quoteReserve: number;
  price: number;
  baseMint: string;
  quoteMint: string;
  baseDecimals: number;
  quoteDecimals: number;
  lastUpdated: Date;
}

// Raydium-specific pool state data
export interface RaydiumPoolState {
  status: number;
  baseDecimal: number;
  quoteDecimal: number;
  baseMint: string;
  quoteMint: string;
  baseVault: string;
  quoteVault: string;
  baseNeedTakePnl: number;
  quoteNeedTakePnl: number;
  openOrders: string;
  lpMint: string;
}

// Orca Whirlpool state data
export interface OrcaWhirlpoolState {
  liquidity: string;
  sqrtPrice: string;
  tickCurrentIndex: number;
  tokenMintA: string;
  tokenVaultA: string;
  tokenMintB: string;
  tokenVaultB: string;
  feeRate: number;
  tickSpacing: number;
}

// Meteora Dynamic AMM state data
export interface MeteoraPoolState {
  tokenAMint: string;
  tokenBMint: string;
  tokenAVault: string;
  tokenBVault: string;
  volatilityAccumulator: number;
  variableFeeControl: number;
  activationPoint?: number;
}

// === LIVE PRICE DATA ===

// Live price data (in-memory cache)
export interface TokenPrice {
  tokenAddress: string;
  currentPrice: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  lastUpdated: Date;
}

// === CHART/OHLC DATA TYPES ===

export enum TimeInterval {
  ONE_MINUTE = '1_MINUTE',
  FIVE_MINUTES = '5_MINUTE',
  FIFTEEN_MINUTES = '15_MINUTE',
  THIRTY_MINUTES = '30_MINUTE',
  ONE_HOUR = '1_HOUR',
  FOUR_HOURS = '4_HOUR',
  ONE_DAY = '1_DAY',
  ONE_WEEK = '1_WEEK'
}

export interface CandleData {
  time: number;
  utcTime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed: boolean;
}

export interface ChartResponse {
  candles: CandleData[];
}

// RSI data
export interface RSIData {
  tokenAddress: string;
  period: number;
  values: number[];
  lastUpdated: Date;
}

// === INPUT TYPES ===

// Token search result
export interface TokenSearchResult {
  tokenAddress: string;
  symbol: string;
  name: string;
  iconUrl?: string;
  currentPrice?: number;
  isInWatchlist?: boolean; // Will be set by watchlist service
}