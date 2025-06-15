import db from '@/lib/db/db';
import { JupiterClient } from '@/lib/api/jupiter.client';
import { calculateTokenRSI, getCurrentRSI } from '@/lib/utils/rsi';
import {
  TokenEntity,
  TokenPoolEntity,
  Token,
  TokenPool,
  JupiterTokenData,
  JupiterPoolData,
  TokenSearchResult,
  CandleData,
  TimeInterval,
  RSIData
} from '@/types/token';

// === TRANSFORMATION FUNCTIONS ===

function entityToToken(entity: TokenEntity): Token {
  return {
    tokenAddress: entity.token_address,
    symbol: entity.symbol,
    name: entity.name,
    decimals: entity.decimals,
    iconUrl: entity.icon_url || undefined,
    marketCap: entity.market_cap || undefined,
    totalSupply: entity.total_supply || undefined,
    firstDiscovered: new Date(entity.first_discovered * 1000),
    lastUpdated: new Date(entity.last_updated * 1000),
  };
}

function entityToTokenPool(entity: TokenPoolEntity): TokenPool {
  return {
    id: entity.id,
    tokenAddress: entity.token_address,
    poolId: entity.pool_id,
    dex: entity.dex,
    quoteAsset: entity.quote_asset,
    liquidity: entity.liquidity || undefined,
    isPrimary: entity.is_primary === 1,
    createdAt: new Date(entity.created_at * 1000),
  };
}

// === PREPARED STATEMENTS ===

const statements = {
  // Token operations
  insertToken: db.prepare(`
    INSERT OR REPLACE INTO tokens (
      token_address, symbol, name, decimals, icon_url, market_cap, total_supply, last_updated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  
  getToken: db.prepare(`
    SELECT * FROM tokens WHERE token_address = ?
  `),
  
  checkTokenExists: db.prepare(`
    SELECT token_address FROM tokens WHERE token_address = ?
  `),
  
  searchTokens: db.prepare(`
    SELECT * FROM tokens 
    WHERE symbol LIKE ? OR name LIKE ? 
    ORDER BY symbol ASC 
    LIMIT ?
  `),
  
  // Pool operations
  insertTokenPool: db.prepare(`
    INSERT OR REPLACE INTO token_pools (
      token_address, pool_id, dex, quote_asset, liquidity, is_primary
    ) VALUES (?, ?, ?, ?, ?, ?)
  `),
  
  getTokenPools: db.prepare(`
    SELECT * FROM token_pools 
    WHERE token_address = ? 
    ORDER BY is_primary DESC, liquidity DESC
  `),
  
  getPrimaryPool: db.prepare(`
    SELECT * FROM token_pools 
    WHERE token_address = ? AND is_primary = 1 
    LIMIT 1
  `),
  
  updateTokenMetadata: db.prepare(`
    UPDATE tokens 
    SET symbol = ?, name = ?, decimals = ?, icon_url = ?, market_cap = ?, total_supply = ?, last_updated = ?
    WHERE token_address = ?
  `)
};

// === TOKEN SERVICE CLASS ===

export class TokenService {
  
  /**
   * Get token by address
   */
  static async getToken(tokenAddress: string): Promise<Token | null> {
    const entity = statements.getToken.get(tokenAddress) as TokenEntity | undefined;
    return entity ? entityToToken(entity) : null;
  }

  /**
   * Check if token exists in our registry
   */
  static async tokenExists(tokenAddress: string): Promise<boolean> {
    const result = statements.checkTokenExists.get(tokenAddress);
    return !!result;
  }

  /**
   * Store token data from Jupiter API
   */
  static async storeTokenData(tokenAddress: string, tokenData: JupiterTokenData, poolsData: JupiterPoolData[]): Promise<Token> {
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Store token info
    statements.insertToken.run(
      tokenAddress,
      tokenData.symbol,
      tokenData.name,
      tokenData.decimals,
      tokenData.icon || null,
      tokenData.marketCap || null,
      tokenData.totalSupply || null,
      timestamp
    );

    // Store pool data
    for (const [index, pool] of poolsData.entries()) {
      statements.insertTokenPool.run(
        tokenAddress,
        pool.id,
        pool.dex,
        pool.quoteAsset,
        pool.liquidity,
        index === 0 ? 1 : 0 // First pool is primary
      );
    }

    // Return the stored token
    const storedToken = await this.getToken(tokenAddress);
    if (!storedToken) {
      throw new Error('Failed to store token data');
    }
    
    return storedToken;
  }

  /**
   * Create placeholder token (when Jupiter API data not available)
   */
  static async createPlaceholderToken(tokenAddress: string): Promise<Token> {
    const timestamp = Math.floor(Date.now() / 1000);
    
    statements.insertToken.run(
      tokenAddress,
      'UNKNOWN',
      'Unknown Token',
      6, // Default decimals
      null,
      null,
      null,
      timestamp
    );

    const token = await this.getToken(tokenAddress);
    if (!token) {
      throw new Error('Failed to create placeholder token');
    }
    
    return token;
  }

  /**
   * Update token metadata (when we get fresh data from Jupiter)
   */
  static async updateTokenMetadata(tokenAddress: string, tokenData: JupiterTokenData): Promise<Token | null> {
    const timestamp = Math.floor(Date.now() / 1000);
    
    statements.updateTokenMetadata.run(
      tokenData.symbol,
      tokenData.name,
      tokenData.decimals,
      tokenData.icon || null,
      tokenData.marketCap || null,
      tokenData.totalSupply || null,
      timestamp,
      tokenAddress
    );

    return this.getToken(tokenAddress);
  }

  /**
   * Get all pools for a token
   */
  static async getTokenPools(tokenAddress: string): Promise<TokenPool[]> {
    const entities = statements.getTokenPools.all(tokenAddress) as TokenPoolEntity[];
    return entities.map(entityToTokenPool);
  }

  /**
   * Get primary pool for a token (highest liquidity)
   */
  static async getPrimaryPool(tokenAddress: string): Promise<TokenPool | null> {
    const entity = statements.getPrimaryPool.get(tokenAddress) as TokenPoolEntity | undefined;
    return entity ? entityToTokenPool(entity) : null;
  }

  /**
   * Search tokens by address - SIMPLIFIED APPROACH
   * 
   * LEARNING: Simplified token discovery strategy:
   * 1. User provides token address (exact, no ambiguity)
   * 2. Check local database first (fast!)
   * 3. If not found, fetch from Jupiter using fetchPoolData
   * 4. Save token + pool data to database
   * 5. Return token with pool information
   * 
   * Benefits:
   * - No search ambiguity (exact address)
   * - Rich pool data for real-time features
   * - Automatic caching of tokens and pools
   * - Foundation for live price feeds
   */
  static async searchTokenByAddress(tokenAddress: string): Promise<TokenSearchResult | null> {
    console.log(`🔍 Looking up token: ${tokenAddress}`);
    
    // Validate token address format
    if (!tokenAddress || tokenAddress.length < 32) {
      console.log(`❌ Invalid token address format`);
      return null;
    }
    
    // STEP 1: Check local database first
    const existingToken = await this.getToken(tokenAddress);
    
    if (existingToken) {
      console.log(`📊 Found token in local database: ${existingToken.symbol}`);
      return {
        tokenAddress: existingToken.tokenAddress,
        symbol: existingToken.symbol,
        name: existingToken.name,
        iconUrl: existingToken.iconUrl,
      };
    }
    
    // STEP 2: Fetch from Jupiter API using fetchPoolData
    try {
      console.log(`🌐 Fetching token data from Jupiter API...`);
      const { tokenData, poolsData } = await JupiterClient.fetchTokenAndPools(tokenAddress);
      
      if (!tokenData) {
        console.log(`❌ Token not found in Jupiter API`);
        return null;
      }
      
      console.log(`📡 Found token: ${tokenData.symbol} with ${poolsData.length} pools`);
      
      // STEP 3: Save token and pool data to database
      const savedToken = await this.storeTokenData(tokenAddress, tokenData, poolsData);
      
      console.log(`💾 Saved token to database: ${savedToken.symbol}`);
      
      return {
        tokenAddress: savedToken.tokenAddress,
        symbol: savedToken.symbol,
        name: savedToken.name,
        iconUrl: savedToken.iconUrl,
      };
      
    } catch (error) {
      console.error(`Jupiter API lookup failed for ${tokenAddress}:`, error);
      return null;
    }
  }
  
  /**
   * Search tokens in local database (for autocomplete/suggestions)
   */
  static async searchLocalTokens(query: string, limit: number = 10): Promise<TokenSearchResult[]> {
    const searchPattern = `%${query}%`;
    const entities = statements.searchTokens.all(searchPattern, searchPattern, limit) as TokenEntity[];
    
    return entities.map(entity => ({
      tokenAddress: entity.token_address,
      symbol: entity.symbol,
      name: entity.name,
      iconUrl: entity.icon_url || undefined,
    }));
  }
  

  /**
   * Fetch token data from Jupiter API
   */
  static async fetchFromJupiter(tokenAddress: string): Promise<{ tokenData: JupiterTokenData; poolsData: JupiterPoolData[] } | null> {
    try {
      const result = await JupiterClient.fetchTokenAndPools(tokenAddress);
      
      // If we got token data, return it
      if (result.tokenData) {
        return {
          tokenData: result.tokenData,
          poolsData: result.poolsData,
        };
      }
      
      // If no token data but we have pools, create minimal token data from pool info
      if (result.poolsData.length > 0) {
        const firstPool = result.poolsData[0];
        const tokenData: JupiterTokenData = {
          symbol: firstPool.baseAsset.symbol,
          name: firstPool.baseAsset.name,
          decimals: firstPool.baseAsset.decimals,
          icon: firstPool.baseAsset.icon,
          marketCap: firstPool.baseAsset.mcap,
          totalSupply: firstPool.baseAsset.totalSupply,
        };
        
        return {
          tokenData,
          poolsData: result.poolsData,
        };
      }
      
      // No data available from Jupiter
      return null;
      
    } catch (error) {
      console.error(`Failed to fetch Jupiter data for ${tokenAddress}:`, error);
      return null;
    }
  }

  /**
   * Get or fetch token (smart caching)
   * 1. Check if token exists in our registry
   * 2. If not, try to fetch from Jupiter API
   * 3. If Jupiter fails, create placeholder
   */
  static async getOrFetchToken(tokenAddress: string): Promise<Token> {
    // Check if we already have this token
    let token = await this.getToken(tokenAddress);
    if (token) {
      return token;
    }

    // Try to fetch from Jupiter API
    const jupiterData = await this.fetchFromJupiter(tokenAddress);
    if (jupiterData) {
      return this.storeTokenData(tokenAddress, jupiterData.tokenData, jupiterData.poolsData);
    }

    // Fallback: create placeholder
    return this.createPlaceholderToken(tokenAddress);
  }

  // === PRICE AND CHART DATA METHODS ===

  /**
   * Get current token price from Jupiter charts
   */
  static async getCurrentPrice(tokenAddress: string): Promise<number | null> {
    return JupiterClient.getCurrentPrice(tokenAddress);
  }

  /**
   * Get OHLCV chart data for a token
   */
  static async getTokenOHLCVData(
    tokenAddress: string,
    interval: TimeInterval = TimeInterval.FIFTEEN_MINUTES,
    candles: number = 100
  ): Promise<CandleData[]> {
    return JupiterClient.getTokenOHLCVData(tokenAddress, interval, Date.now(), candles);
  }

  /**
   * Get closing prices for technical analysis
   */
  static async getClosingPrices(
    tokenAddress: string,
    interval: TimeInterval = TimeInterval.FIFTEEN_MINUTES,
    candles: number = 100
  ): Promise<number[]> {
    return JupiterClient.getClosingPrices(tokenAddress, interval, candles);
  }

  /**
   * Calculate RSI for a token
   */
  static async calculateRSI(
    tokenAddress: string,
    period: number = 14,
    interval: TimeInterval = TimeInterval.FIFTEEN_MINUTES
  ): Promise<RSIData | null> {
    return calculateTokenRSI(tokenAddress, period, interval);
  }

  /**
   * Get current RSI value for a token
   */
  static async getCurrentRSI(
    tokenAddress: string,
    period: number = 14,
    interval: TimeInterval = TimeInterval.FIFTEEN_MINUTES
  ): Promise<number | null> {
    return getCurrentRSI(tokenAddress, period, interval);
  }

  /**
   * Get comprehensive token data (metadata + current price + RSI)
   */
  static async getTokenWithMarketData(
    tokenAddress: string,
    includePriceData: boolean = true,
    includeRSI: boolean = true
  ): Promise<Token & { currentPrice?: number; rsi14?: number } | null> {
    const token = await this.getToken(tokenAddress);
    if (!token) return null;

    const result: Token & { currentPrice?: number; rsi14?: number } = { ...token };

    if (includePriceData) {
      try {
        const currentPrice = await this.getCurrentPrice(tokenAddress);
        if (currentPrice) {
          result.currentPrice = currentPrice;
        }
      } catch (error) {
        console.warn(`Failed to get current price for ${tokenAddress}:`, error);
      }
    }

    if (includeRSI) {
      try {
        const rsi = await this.getCurrentRSI(tokenAddress);
        if (rsi !== null) {
          result.rsi14 = rsi;
        }
      } catch (error) {
        console.warn(`Failed to get RSI for ${tokenAddress}:`, error);
      }
    }

    return result;
  }

  /**
   * Bulk get market data for multiple tokens (for watchlist)
   */
  static async getBulkMarketData(
    tokenAddresses: string[],
    includePriceData: boolean = true,
    includeRSI: boolean = true
  ): Promise<Record<string, { currentPrice?: number; rsi14?: number }>> {
    const result: Record<string, { currentPrice?: number; rsi14?: number }> = {};
    
    // Initialize all tokens
    tokenAddresses.forEach(address => {
      result[address] = {};
    });

    // Fetch prices in parallel if requested
    if (includePriceData) {
      const pricePromises = tokenAddresses.map(async (address) => {
        try {
          const price = await this.getCurrentPrice(address);
          if (price !== null) {
            result[address].currentPrice = price;
          }
        } catch (error) {
          console.warn(`Failed to get price for ${address}:`, error);
        }
      });
      
      await Promise.all(pricePromises);
    }

    // Fetch RSI in parallel if requested
    if (includeRSI) {
      const rsiPromises = tokenAddresses.map(async (address) => {
        try {
          const rsi = await this.getCurrentRSI(address);
          if (rsi !== null) {
            result[address].rsi14 = rsi;
          }
        } catch (error) {
          console.warn(`Failed to get RSI for ${address}:`, error);
        }
      });
      
      await Promise.all(rsiPromises);
    }

    return result;
  }
}