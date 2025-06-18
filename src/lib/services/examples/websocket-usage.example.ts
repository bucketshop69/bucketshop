/**
 * WebSocket Service Usage Examples
 * 
 * Demonstrates how to use the Helius WebSocket and Price Stream services
 * for real-time Raydium pool monitoring
 */

import { createPriceStreamService, PriceStreamService } from '../price-stream.service';
import { TokenPriceUpdate, ConnectionStatus } from '../price-stream.service';

/**
 * Example 1: Basic Price Stream Setup
 */
export async function basicPriceStreamExample() {
  // Initialize the price stream service
  const priceStream = createPriceStreamService({
    heliusApiKey: process.env.HELIUS_API_KEY!,
    network: 'mainnet',
    autoConnect: true,
    enableFallback: true,
  });

  // Listen for price updates
  priceStream.on('priceUpdate', (update: TokenPriceUpdate) => {
    console.log(`💰 Price Update: ${update.tokenAddress}`);
    console.log(`   Price: $${update.currentPrice.toFixed(4)}`);
    console.log(`   Pool: ${update.poolId}`);
    console.log(`   Source: ${update.source}`);
    console.log(`   Timestamp: ${update.timestamp.toISOString()}`);
    console.log('---');
  });

  // Listen for connection events
  priceStream.on('connected', () => {
    console.log('🔗 Price stream connected - receiving live updates');
  });

  priceStream.on('disconnected', () => {
    console.log('⚠️ Price stream disconnected - may switch to fallback');
  });

  priceStream.on('error', (error) => {
    console.error('❌ Price stream error:', error);
  });

  // Start the service (if autoConnect is false)
  if (!priceStream.getConnectionStatus().connected) {
    await priceStream.start();
  }

  // Subscribe to specific tokens
  const SOL_TOKEN = 'So11111111111111111111111111111111111111112';
  const USDC_TOKEN = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

  priceStream.subscribeToToken(SOL_TOKEN);
  priceStream.subscribeToToken(USDC_TOKEN);

  console.log('🚀 Price streaming started for SOL and USDC');
}

/**
 * Example 2: Frontend Component Integration
 */
export class WatchlistPriceUpdater {
  private priceStream: PriceStreamService;
  private watchedTokens: Set<string> = new Set();

  constructor(heliusApiKey: string) {
    this.priceStream = createPriceStreamService({
      heliusApiKey,
      network: 'mainnet',
      autoConnect: true,
      enableFallback: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.priceStream.on('priceUpdate', (update: TokenPriceUpdate) => {
      this.updateWatchlistPrice(update);
    });

    this.priceStream.on('connected', () => {
      this.updateConnectionStatus('connected');
    });

    this.priceStream.on('disconnected', () => {
      this.updateConnectionStatus('disconnected');
    });
  }

  /**
   * Add token to watchlist and start price monitoring
   */
  addToWatchlist(tokenAddress: string): void {
    if (this.watchedTokens.has(tokenAddress)) {
      return;
    }

    const subscribed = this.priceStream.subscribeToToken(tokenAddress);
    if (subscribed) {
      this.watchedTokens.add(tokenAddress);
      console.log(`Added ${tokenAddress} to price monitoring`);
      
      // Get latest price if available
      const latestPrice = this.priceStream.getLatestPrice(tokenAddress);
      if (latestPrice) {
        this.updateWatchlistPrice(latestPrice);
      }
    } else {
      console.warn(`Token ${tokenAddress} not supported for real-time pricing`);
    }
  }

  /**
   * Remove token from watchlist
   */
  removeFromWatchlist(tokenAddress: string): void {
    this.watchedTokens.delete(tokenAddress);
    console.log(`Removed ${tokenAddress} from price monitoring`);
  }

  /**
   * Update watchlist UI with new price (placeholder for actual UI update)
   */
  private updateWatchlistPrice(update: TokenPriceUpdate): void {
    if (!this.watchedTokens.has(update.tokenAddress)) {
      return;
    }

    // This would integrate with your actual watchlist UI component
    console.log(`📊 Updating watchlist price for ${update.tokenAddress}: $${update.currentPrice.toFixed(4)}`);
    
    // Example: Update React state, emit to parent component, etc.
    // setWatchlistPrices(prev => ({
    //   ...prev,
    //   [update.tokenAddress]: {
    //     price: update.currentPrice,
    //     timestamp: update.timestamp,
    //     source: update.source
    //   }
    // }));
  }

  /**
   * Update connection status UI
   */
  private updateConnectionStatus(status: string): void {
    console.log(`🔄 Connection status: ${status}`);
    
    // Example: Update UI indicator
    // setConnectionStatus(status);
  }

  /**
   * Get current connection info
   */
  getConnectionInfo(): ConnectionStatus {
    return this.priceStream.getConnectionStatus();
  }

  /**
   * Get supported tokens for real-time pricing
   */
  getSupportedTokens(): string[] {
    return this.priceStream.getSupportedTokens();
  }

  /**
   * Stop price monitoring
   */
  destroy(): void {
    this.priceStream.stop();
    this.watchedTokens.clear();
  }
}

/**
 * Example 3: Price Monitoring with Error Handling
 */
export async function robustPriceMonitoringExample() {
  const priceStream = createPriceStreamService({
    heliusApiKey: process.env.HELIUS_API_KEY!,
    network: 'mainnet',
    autoConnect: false, // Manual connection for better error handling
    enableFallback: true,
    fallbackInterval: 15000, // 15 seconds
  });

  try {
    // Start with explicit error handling
    await priceStream.start();
    
    // Monitor connection status
    const statusInterval = setInterval(() => {
      const status = priceStream.getConnectionStatus();
      console.log(`Status: ${status.mode} | Connected: ${status.connected} | Tokens: ${status.subscribedTokens.length}`);
      
      if (status.lastUpdate) {
        const timeSinceUpdate = Date.now() - status.lastUpdate.getTime();
        console.log(`Last update: ${Math.round(timeSinceUpdate / 1000)}s ago`);
      }
    }, 10000); // Every 10 seconds

    // Setup graceful shutdown
    process.on('SIGINT', () => {
      console.log('Shutting down price monitoring...');
      clearInterval(statusInterval);
      priceStream.stop();
      process.exit(0);
    });

    console.log('🔄 Robust price monitoring started');

  } catch (error) {
    console.error('Failed to start price monitoring:', error);
    
    // Fallback to basic HTTP polling could be implemented here
    console.log('Consider implementing HTTP fallback for critical applications');
  }
}

/**
 * Example 4: Development Testing
 */
export async function developmentTestingExample() {
  if (!process.env.HELIUS_API_KEY) {
    console.error('HELIUS_API_KEY environment variable required');
    return;
  }

  console.log('🧪 Starting development testing...');
  
  // Test with actual Helius API
  const priceStream = createPriceStreamService({
    heliusApiKey: process.env.HELIUS_API_KEY,
    network: 'mainnet',
    autoConnect: true,
    enableFallback: true,
  });

  // Log all events for debugging
  priceStream.on('priceUpdate', (update) => {
    console.log(`[${new Date().toISOString()}] Price Update:`, {
      token: update.tokenAddress,
      price: update.currentPrice,
      reserves: `${update.baseReserve.toFixed(2)} / ${update.quoteReserve.toFixed(2)}`,
      source: update.source,
    });
  });

  priceStream.on('connected', () => console.log('✅ WebSocket connected'));
  priceStream.on('disconnected', () => console.log('❌ WebSocket disconnected'));
  priceStream.on('error', (error) => console.error('🚨 Error:', error));

  // Test for 2 minutes then stop
  setTimeout(() => {
    console.log('🛑 Stopping test...');
    priceStream.stop();
  }, 120000);
}