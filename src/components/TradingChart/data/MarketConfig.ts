/**
 * MarketConfig - Drift Protocol market configuration and utilities
 * 
 * This module provides centralized market configuration compatible with browser environments.
 * Uses Drift Protocol market structure without importing Node.js dependencies.
 * 
 * Benefits:
 * - Browser-safe market configuration
 * - No more hardcoded market indices (perp_2, etc.)
 * - Type-safe market information matching Drift SDK
 * - Extensible for multiple trading pairs
 */

// Browser-safe type definition matching Drift SDK PerpMarketConfig
export interface PerpMarketConfig {
  symbol: string;
  baseAssetSymbol: string;
  marketIndex: number;
  fullName?: string;
  category?: string[];
}

/**
 * Extended market information for UI and WebSocket integration
 */
export interface ExtendedMarketInfo {
  config: PerpMarketConfig;
  displayName: string;
  channelSuffix: string; // e.g., "perp_2" for WebSocket channels
  quoteSymbol: string; // Always USDC for perps
}

/**
 * Drift Protocol mainnet perpetual markets configuration
 * This data matches the official Drift SDK PerpMarkets for mainnet-beta
 */
const DRIFT_PERP_MARKETS: PerpMarketConfig[] = [
  {
    symbol: 'SOL-PERP',
    baseAssetSymbol: 'SOL',
    marketIndex: 0,
    fullName: 'Solana Perpetual',
    category: ['crypto'],
  },
  {
    symbol: 'BTC-PERP', 
    baseAssetSymbol: 'BTC',
    marketIndex: 1,
    fullName: 'Bitcoin Perpetual',
    category: ['crypto'],
  },
  {
    symbol: 'ETH-PERP',
    baseAssetSymbol: 'ETH', 
    marketIndex: 2,
    fullName: 'Ethereum Perpetual',
    category: ['crypto'],
  },
  {
    symbol: '1MBONK-PERP',
    baseAssetSymbol: '1MBONK',
    marketIndex: 3,
    fullName: 'Bonk Perpetual (1M)',
    category: ['crypto', 'meme'],
  },
  {
    symbol: 'RNDR-PERP',
    baseAssetSymbol: 'RNDR',
    marketIndex: 4,
    fullName: 'Render Perpetual',
    category: ['crypto'],
  },
  // Add more markets as needed - these are the main ones used
];

/**
 * Get market configuration from static data
 * Browser-safe alternative to importing the full Drift SDK
 */
function getDriftMarkets(): Record<string, ExtendedMarketInfo> {
  const markets: Record<string, ExtendedMarketInfo> = {};
  
  DRIFT_PERP_MARKETS.forEach((config) => {
    if (config.symbol) {
      const displayName = config.fullName || `${config.baseAssetSymbol} Perpetual`;
      const channelSuffix = `perp_${config.marketIndex}`;
      
      markets[config.symbol] = {
        config,
        displayName,
        channelSuffix,
        quoteSymbol: 'USDC', // All perps use USDC
      };
    }
  });
  
  return markets;
}

/**
 * MarketConfig class - Centralized market configuration management
 */
export class MarketConfig {
  private static instance: MarketConfig;
  private markets: Record<string, ExtendedMarketInfo>;

  private constructor() {
    this.markets = getDriftMarkets();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): MarketConfig {
    if (!MarketConfig.instance) {
      MarketConfig.instance = new MarketConfig();
    }
    return MarketConfig.instance;
  }

  /**
   * Get market information by symbol
   */
  public getMarket(symbol: string): PerpMarketConfig | null {
    const market = this.markets[symbol];
    return market?.config || null;
  }

  /**
   * Get extended market information by symbol
   */
  public getExtendedMarket(symbol: string): ExtendedMarketInfo | null {
    return this.markets[symbol] || null;
  }

  /**
   * Get all available markets
   */
  public getAllMarkets(): PerpMarketConfig[] {
    return Object.values(this.markets).map(m => m.config);
  }

  /**
   * Get all extended market information
   */
  public getAllExtendedMarkets(): ExtendedMarketInfo[] {
    return Object.values(this.markets);
  }

  /**
   * Get market index for a symbol
   */
  public getMarketIndex(symbol: string): number | null {
    const market = this.getMarket(symbol);
    return market?.marketIndex || null;
  }

  /**
   * Get WebSocket channel suffix for a symbol
   */
  public getChannelSuffix(symbol: string): string | null {
    const market = this.getExtendedMarket(symbol);
    return market?.channelSuffix || null;
  }

  /**
   * Get historical data market key for a symbol
   */
  public getHistoricalDataKey(symbol: string): string | null {
    const market = this.getMarket(symbol);
    if (!market) return null;
    
    // Historical data uses format: perp_{marketIndex}
    return `perp_${market.marketIndex}`;
  }

  /**
   * Check if a symbol is supported
   */
  public isSupported(symbol: string): boolean {
    return symbol in this.markets;
  }

  /**
   * Get supported symbols list
   */
  public getSupportedSymbols(): string[] {
    return Object.keys(this.markets);
  }

  /**
   * Get market display name
   */
  public getDisplayName(symbol: string): string {
    const market = this.getExtendedMarket(symbol);
    return market?.displayName || symbol;
  }

  /**
   * Validate and normalize symbol
   */
  public normalizeSymbol(input: string): string | null {
    const normalized = input.toUpperCase();
    return this.isSupported(normalized) ? normalized : null;
  }

  /**
   * Get market info for WebSocket subscriptions
   */
  public getWebSocketConfig(symbol: string) {
    const market = this.getMarket(symbol);
    const extendedMarket = this.getExtendedMarket(symbol);
    if (!market || !extendedMarket) return null;

    return {
      market: symbol,
      marketType: 'perp' as const,
      marketIndex: market.marketIndex,
      channelSuffix: extendedMarket.channelSuffix,
    };
  }

  /**
   * Load markets from server-side Drift SDK API
   */
  public async loadMarketsFromAPI(): Promise<void> {
    try {
      console.log('Loading markets from Drift API...');
      
      // Import the API client dynamically to avoid server-side issues
      const { marketsApi } = await import('@/lib/api/marketsApi');
      
      const response = await marketsApi.getExtendedMarkets();
      
      if (response.success && response.data) {
        // Convert API response to our internal format
        const apiMarkets: Record<string, ExtendedMarketInfo> = {};
        
        response.data.forEach(market => {
          apiMarkets[market.config.symbol] = {
            config: market.config,
            displayName: market.displayName,
            channelSuffix: market.channelSuffix,
            quoteSymbol: market.quoteSymbol,
          };
        });
        
        // Update markets with live data
        this.markets = apiMarkets;
        
        console.log(`Successfully loaded ${response.data.length} markets from API`);
        
      } else {
        console.error('Failed to load markets from API:', response.error);
        console.log('Fallback to static market configuration');
      }
      
    } catch (error) {
      console.error('Error loading markets from API:', error);
      console.log('Fallback to static market configuration');
    }
  }

  /**
   * Debug helper - get all market information
   */
  public debug(): void {
    console.log('Drift Markets Configuration:');
    console.table(this.markets);
  }
}

/**
 * Convenience functions for common market operations
 */

/**
 * Get market configuration instance
 */
export const marketConfig = MarketConfig.getInstance();

/**
 * Quick market info lookup
 */
export function getMarketInfo(symbol: string): PerpMarketConfig | null {
  return marketConfig.getMarket(symbol);
}

/**
 * Quick extended market info lookup
 */
export function getExtendedMarketInfo(symbol: string): ExtendedMarketInfo | null {
  return marketConfig.getExtendedMarket(symbol);
}

/**
 * Quick market index lookup
 */
export function getMarketIndex(symbol: string): number | null {
  return marketConfig.getMarketIndex(symbol);
}

/**
 * Quick channel suffix lookup for WebSocket
 */
export function getChannelSuffix(symbol: string): string | null {
  return marketConfig.getChannelSuffix(symbol);
}

/**
 * Quick historical data key lookup
 */
export function getHistoricalDataKey(symbol: string): string | null {
  return marketConfig.getHistoricalDataKey(symbol);
}

/**
 * Validate if symbol is supported
 */
export function isSupportedSymbol(symbol: string): boolean {
  return marketConfig.isSupported(symbol);
}

// Initialize and optionally load from SDK
// marketConfig.loadMarketsFromSDK().catch(console.error);