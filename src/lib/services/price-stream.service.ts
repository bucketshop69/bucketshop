import { EventEmitter } from 'events';
import { HeliusWebSocketService, PriceUpdateEvent } from './helius-websocket.service';

/**
 * Price Stream Service
 * 
 * High-level interface for real-time price streaming
 * Provides clean API for frontend components to subscribe to live price updates
 * Manages WebSocket connection and provides fallback mechanisms
 */

export interface PriceStreamConfig {
  heliusApiKey: string;
  network?: 'mainnet' | 'devnet';
  autoConnect?: boolean;
  enableFallback?: boolean;
  fallbackInterval?: number; // ms
}

export interface TokenPriceUpdate {
  tokenAddress: string;
  poolId: string;
  currentPrice: number;
  baseReserve: number;
  quoteReserve: number;
  timestamp: Date;
  source: 'websocket' | 'fallback';
}

export interface ConnectionStatus {
  connected: boolean;
  mode: 'websocket' | 'fallback' | 'disconnected';
  subscribedTokens: string[];
  lastUpdate?: Date;
}

/**
 * Main Price Stream Service
 * Abstracts WebSocket complexity for frontend consumption
 */
export class PriceStreamService extends EventEmitter {
  private webSocketService: HeliusWebSocketService;
  private config: Required<PriceStreamConfig>;
  private isActive = false;
  private fallbackTimer: NodeJS.Timeout | null = null;
  private lastPrices: Map<string, TokenPriceUpdate> = new Map();
  
  // Token address to pool mapping for easy lookup
  private tokenPoolMap: Map<string, string> = new Map();

  constructor(config: PriceStreamConfig) {
    super();
    
    this.config = {
      heliusApiKey: config.heliusApiKey,
      network: config.network || 'mainnet',
      autoConnect: config.autoConnect ?? true,
      enableFallback: config.enableFallback ?? true,
      fallbackInterval: config.fallbackInterval || 30000, // 30 seconds
    };

    this.webSocketService = new HeliusWebSocketService({
      heliusApiKey: this.config.heliusApiKey,
      network: this.config.network,
    });

    this.setupWebSocketListeners();
    this.setupTokenPoolMapping();

    if (this.config.autoConnect) {
      this.start();
    }
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupWebSocketListeners(): void {
    this.webSocketService.on('connected', () => {
      console.log('Price stream: WebSocket connected');
      this.stopFallback();
      this.emit('connected');
    });

    this.webSocketService.on('disconnected', () => {
      console.log('Price stream: WebSocket disconnected');
      if (this.isActive && this.config.enableFallback) {
        this.startFallback();
      }
      this.emit('disconnected');
    });

    this.webSocketService.on('priceUpdate', (update: PriceUpdateEvent) => {
      this.handlePriceUpdate(update, 'websocket');
    });

    this.webSocketService.on('error', (error) => {
      console.error('Price stream WebSocket error:', error);
      this.emit('error', error);
    });

    this.webSocketService.on('maxReconnectAttemptsReached', () => {
      console.warn('Price stream: Max reconnect attempts reached, switching to fallback');
      if (this.config.enableFallback) {
        this.startFallback();
      }
    });
  }

  /**
   * Setup token address to pool ID mapping
   * Using well-known Solana token addresses
   */
  private setupTokenPoolMapping(): void {
    // SOL token address (wrapped SOL)
    const SOL_TOKEN = 'So11111111111111111111111111111111111111112';
    const USDC_TOKEN = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    
    // Map tokens to their primary pools
    const supportedPools = this.webSocketService.getSupportedPools();
    
    // SOL/USDC pool - map both SOL and USDC to this pool
    if (supportedPools.SOL_USDC) {
      this.tokenPoolMap.set(SOL_TOKEN, supportedPools.SOL_USDC);
      this.tokenPoolMap.set(USDC_TOKEN, supportedPools.SOL_USDC);
    }
  }

  /**
   * Start the price streaming service
   */
  async start(): Promise<void> {
    if (this.isActive) {
      console.log('Price stream already active');
      return;
    }

    this.isActive = true;
    
    try {
      await this.webSocketService.connect();
      await this.webSocketService.subscribeToRaydiumPools();
      console.log('Price stream service started successfully');
    } catch (error) {
      console.error('Failed to start price stream:', error);
      
      if (this.config.enableFallback) {
        console.log('Starting fallback mode');
        this.startFallback();
      } else {
        this.isActive = false;
        throw error;
      }
    }
  }

  /**
   * Stop the price streaming service
   */
  stop(): void {
    this.isActive = false;
    this.webSocketService.disconnect();
    this.stopFallback();
    console.log('Price stream service stopped');
  }

  /**
   * Subscribe to price updates for a specific token
   */
  subscribeToToken(tokenAddress: string): boolean {
    const poolId = this.tokenPoolMap.get(tokenAddress);
    
    if (!poolId) {
      console.warn(`No pool mapping found for token: ${tokenAddress}`);
      return false;
    }

    // WebSocket subscription is handled automatically for supported pools
    console.log(`Subscribed to price updates for token: ${tokenAddress} via pool: ${poolId}`);
    return true;
  }

  /**
   * Get the latest price for a token
   */
  getLatestPrice(tokenAddress: string): TokenPriceUpdate | null {
    const poolId = this.tokenPoolMap.get(tokenAddress);
    if (!poolId) return null;

    return this.lastPrices.get(poolId) || null;
  }

  /**
   * Get all latest prices
   */
  getAllLatestPrices(): TokenPriceUpdate[] {
    return Array.from(this.lastPrices.values());
  }

  /**
   * Handle price updates from WebSocket or fallback
   */
  private handlePriceUpdate(update: PriceUpdateEvent, source: 'websocket' | 'fallback'): void {
    const { poolId, reserveData, timestamp } = update;
    
    // For SOL/USDC pool, we can extract both SOL and USDC prices
    const tokenUpdate: TokenPriceUpdate = {
      tokenAddress: this.getTokenAddressFromPool(poolId),
      poolId,
      currentPrice: reserveData.price,
      baseReserve: reserveData.baseReserve,
      quoteReserve: reserveData.quoteReserve,
      timestamp,
      source,
    };

    this.lastPrices.set(poolId, tokenUpdate);
    
    // Emit to subscribers
    this.emit('priceUpdate', tokenUpdate);
    console.log(`Price update: ${tokenUpdate.tokenAddress} = $${tokenUpdate.currentPrice.toFixed(4)} (${source})`);
  }

  /**
   * Get token address from pool ID (reverse lookup)
   */
  private getTokenAddressFromPool(poolId: string): string {
    for (const [tokenAddress, mappedPoolId] of this.tokenPoolMap.entries()) {
      if (mappedPoolId === poolId) {
        return tokenAddress;
      }
    }
    return 'unknown';
  }

  /**
   * Start fallback polling mode
   */
  private startFallback(): void {
    if (this.fallbackTimer) {
      return;
    }

    console.log('Starting fallback price polling');
    
    this.fallbackTimer = setInterval(async () => {
      try {
        await this.pollPricesFromRaydium();
      } catch (error) {
        console.error('Fallback polling error:', error);
      }
    }, this.config.fallbackInterval);

    // Initial poll
    this.pollPricesFromRaydium().catch(console.error);
  }

  /**
   * Stop fallback polling
   */
  private stopFallback(): void {
    if (this.fallbackTimer) {
      clearInterval(this.fallbackTimer);
      this.fallbackTimer = null;
      console.log('Stopped fallback polling');
    }
  }

  /**
   * Poll prices directly from Raydium service (fallback mode)
   */
  private async pollPricesFromRaydium(): Promise<void> {
    const supportedPools = this.webSocketService.getSupportedPools();
    
    for (const [name, poolId] of Object.entries(supportedPools)) {
      try {
        const reserveData = await this.webSocketService['raydiumService'].getPoolReserveData(poolId);
        
        const priceUpdate: PriceUpdateEvent = {
          poolId,
          reserveData,
          timestamp: new Date(),
        };

        this.handlePriceUpdate(priceUpdate, 'fallback');
        
      } catch (error) {
        console.error(`Failed to poll price for ${name} pool:`, error);
      }
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    const wsStatus = this.webSocketService.getConnectionStatus();
    
    return {
      connected: this.isActive,
      mode: wsStatus.connected ? 'websocket' : (this.fallbackTimer ? 'fallback' : 'disconnected'),
      subscribedTokens: Array.from(this.tokenPoolMap.keys()),
      lastUpdate: this.lastPrices.size > 0 ? 
        new Date(Math.max(...Array.from(this.lastPrices.values()).map(p => p.timestamp.getTime())))
        : undefined,
    };
  }

  /**
   * Get supported tokens
   */
  getSupportedTokens(): string[] {
    return Array.from(this.tokenPoolMap.keys());
  }
}

/**
 * Factory function to create price stream service
 */
export function createPriceStreamService(config: PriceStreamConfig): PriceStreamService {
  return new PriceStreamService(config);
}

/**
 * Singleton instance for app-wide use
 */
let priceStreamInstance: PriceStreamService | null = null;

export function getPriceStreamService(config?: PriceStreamConfig): PriceStreamService {
  if (!priceStreamInstance && config) {
    priceStreamInstance = new PriceStreamService(config);
  }
  
  if (!priceStreamInstance) {
    throw new Error('PriceStreamService not initialized. Provide config on first call.');
  }
  
  return priceStreamInstance;
}