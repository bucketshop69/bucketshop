/**
 * DriftService - Server-side Drift Protocol SDK integration
 * 
 * This service provides server-side operations using the full Drift SDK.
 * Handles all Node.js-specific operations and exposes clean APIs for client consumption.
 * 
 * Features:
 * - Market data fetching from Drift Protocol
 * - Connection management with Solana RPC
 * - Error handling and caching
 * - Type-safe market information
 */

import { Connection } from '@solana/web3.js';
import { DriftClient, initialize, PerpMarkets, PerpMarketConfig } from '@drift-labs/sdk';

/**
 * Drift service configuration
 */
interface DriftServiceConfig {
  rpcUrl: string;
  environment: 'mainnet-beta' | 'devnet';
  cacheTimeout: number; // Cache timeout in milliseconds
}

/**
 * Market data response interface
 */
export interface MarketDataResponse {
  success: boolean;
  data?: PerpMarketConfig[];
  error?: string;
  timestamp: number;
  source: 'cache' | 'api';
}

/**
 * Market info with extended data for UI
 */
export interface ExtendedMarketData {
  config: PerpMarketConfig;
  displayName: string;
  channelSuffix: string;
  quoteSymbol: string;
  isActive: boolean;
}

/**
 * Default configuration for production
 */
const DEFAULT_CONFIG: DriftServiceConfig = {
  rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  environment: 'mainnet-beta',
  cacheTimeout: 5 * 60 * 1000, // 5 minutes cache
};

/**
 * DriftService - Centralized Drift Protocol operations
 */
export class DriftService {
  private static instance: DriftService;
  private config: DriftServiceConfig;
  private connection: Connection;
  private driftClient: DriftClient | null = null;
  
  // Cache management
  private marketCache: {
    data: PerpMarketConfig[] | null;
    timestamp: number;
  } = { data: null, timestamp: 0 };

  private constructor(config: Partial<DriftServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.connection = new Connection(this.config.rpcUrl, 'confirmed');
    
    console.log(`DriftService initialized for ${this.config.environment}`);
    console.log(`RPC URL: ${this.config.rpcUrl}`);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<DriftServiceConfig>): DriftService {
    if (!DriftService.instance) {
      DriftService.instance = new DriftService(config);
    }
    return DriftService.instance;
  }

  /**
   * Initialize Drift SDK (lightweight - just for static data)
   */
  private initializeDriftSDK(): void {
    if (this.driftClient) return;

    try {
      console.log('Initializing Drift SDK for static data...');
      
      // Initialize the Drift SDK for static market data access
      initialize({ env: this.config.environment });
      
      // Mark as initialized (we use static data, no client needed)
      this.driftClient = {} as DriftClient; // Placeholder
      
      console.log('Drift SDK initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Drift SDK:', error);
      throw new Error(`Drift SDK initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all perpetual markets from Drift Protocol
   */
  public async getPerpMarkets(): Promise<MarketDataResponse> {
    try {
      // Check cache first
      const now = Date.now();
      if (this.marketCache.data && (now - this.marketCache.timestamp) < this.config.cacheTimeout) {
        console.log('Returning cached market data');
        return {
          success: true,
          data: this.marketCache.data,
          timestamp: this.marketCache.timestamp,
          source: 'cache',
        };
      }

      console.log('Fetching fresh market data from Drift...');

      // Try to get from SDK first (static data)
      let markets: PerpMarketConfig[] = [];
      
      // Initialize SDK for static data access
      this.initializeDriftSDK();
      
      if (PerpMarkets && PerpMarkets[this.config.environment]) {
        markets = PerpMarkets[this.config.environment];
        console.log(`Loaded ${markets.length} markets from Drift SDK static data`);
      } else {
        console.warn(`No markets found for environment: ${this.config.environment}`);
        // Return empty array if no markets available
        markets = [];
      }

      // Filter and validate markets
      const validMarkets = markets.filter(market => 
        market.symbol && 
        market.baseAssetSymbol && 
        typeof market.marketIndex === 'number'
      );

      // Update cache
      this.marketCache = {
        data: validMarkets,
        timestamp: now,
      };

      console.log(`Successfully fetched ${validMarkets.length} valid markets`);

      return {
        success: true,
        data: validMarkets,
        timestamp: now,
        source: 'api',
      };

    } catch (error) {
      console.error('Failed to fetch perp markets:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: Date.now(),
        source: 'api',
      };
    }
  }

  /**
   * Get specific market by symbol
   */
  public async getMarketBySymbol(symbol: string): Promise<PerpMarketConfig | null> {
    try {
      const response = await this.getPerpMarkets();
      
      if (!response.success || !response.data) {
        return null;
      }

      return response.data.find(market => market.symbol === symbol) || null;
      
    } catch (error) {
      console.error(`Failed to get market ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get extended market data with UI information
   */
  public async getExtendedMarkets(): Promise<ExtendedMarketData[]> {
    try {
      const response = await this.getPerpMarkets();
      
      if (!response.success || !response.data) {
        return [];
      }

      return response.data.map(config => ({
        config,
        displayName: config.fullName || `${config.baseAssetSymbol} Perpetual`,
        channelSuffix: `perp_${config.marketIndex}`,
        quoteSymbol: 'USDC',
        isActive: true, // Could add logic to determine if market is active
      }));
      
    } catch (error) {
      console.error('Failed to get extended markets:', error);
      return [];
    }
  }

  /**
   * Health check for the service
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    connection: boolean;
    driftClient: boolean;
    cache: boolean;
    timestamp: number;
  }> {
    try {
      // Check RPC connection
      const connectionHealthy = await this.checkConnection();
      
      // Check Drift SDK initialization
      const clientHealthy = this.driftClient !== null;
      
      // Check cache
      const cacheHealthy = this.marketCache.data !== null;
      
      const isHealthy = connectionHealthy && (clientHealthy || cacheHealthy);
      
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        connection: connectionHealthy,
        driftClient: clientHealthy,
        cache: cacheHealthy,
        timestamp: Date.now(),
      };
      
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        connection: false,
        driftClient: false,
        cache: false,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Check Solana RPC connection
   */
  private async checkConnection(): Promise<boolean> {
    try {
      const version = await this.connection.getVersion();
      return version !== null;
    } catch (error) {
      console.error('RPC connection check failed:', error);
      return false;
    }
  }

  /**
   * Clear cache (useful for development)
   */
  public clearCache(): void {
    this.marketCache = { data: null, timestamp: 0 };
    console.log('Market cache cleared');
  }

  /**
   * Get cache info
   */
  public getCacheInfo() {
    return {
      hasData: this.marketCache.data !== null,
      timestamp: this.marketCache.timestamp,
      age: Date.now() - this.marketCache.timestamp,
      timeout: this.config.cacheTimeout,
    };
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    try {
      if (this.driftClient) {
        this.driftClient = null;
      }
      
      this.clearCache();
      console.log('DriftService cleaned up successfully');
      
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Export singleton instance
export const driftService = DriftService.getInstance();