import { EventEmitter } from 'events';
import { RaydiumPoolService } from './raydium.service';
import { PoolReserveData } from '@/types/token';
import { getWebSocketEndpoint } from '@/lib/constants/rpc';

/**
 * Helius WebSocket Service for Real-time Pool Monitoring
 * 
 * Phase 1: Raydium-only implementation
 * Monitors specific Raydium pool accounts for reserve changes
 * Emits live price updates using our validated Raydium parser
 */

export interface WebSocketConfig {
  heliusApiKey: string;
  network?: 'mainnet' | 'devnet';
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export interface PoolAccountChange {
  account: string;
  lamports: number;
  data: string;
  executable: boolean;
  owner: string;
  rentEpoch: number;
}

export interface PriceUpdateEvent {
  poolId: string;
  reserveData: PoolReserveData;
  timestamp: Date;
}

/**
 * Main WebSocket Service Class
 * Manages connection to Helius WebSocket API and pool account subscriptions
 */
export class HeliusWebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private subscribedAccounts: Set<string> = new Set();
  private raydiumService: RaydiumPoolService;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnected = false;

  // Well-known Raydium pools to start with
  private readonly RAYDIUM_POOLS = {
    // SOL/USDC - Our validated working pool
    SOL_USDC: '58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2',
    // Add more popular Raydium pools here as needed
  };

  constructor(config: WebSocketConfig) {
    super();
    
    this.config = {
      heliusApiKey: config.heliusApiKey,
      network: config.network || 'mainnet',
      reconnectAttempts: config.reconnectAttempts || 5,
      reconnectDelay: config.reconnectDelay || 5000,
    };

    this.raydiumService = new RaydiumPoolService(this.config.heliusApiKey, this.config.network);
  }

  /**
   * Connect to Helius WebSocket
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    const wsUrl = getWebSocketEndpoint(this.config.network || 'mainnet');

    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
        
        this.once('connected', () => {
          clearTimeout(timeout);
          resolve();
        });
        
        this.once('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

    } catch (error) {
      console.error('WebSocket connection failed:', error);
      throw error;
    }
  }

  /**
   * Subscribe to Raydium pool account changes
   */
  async subscribeToRaydiumPools(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('WebSocket not connected. Call connect() first.');
    }

    // Subscribe to our known working pools
    for (const [name, poolId] of Object.entries(this.RAYDIUM_POOLS)) {
      await this.subscribeToPoolAccount(poolId);
      console.log(`Subscribed to ${name} pool: ${poolId}`);
    }
  }

  /**
   * Subscribe to specific pool account changes
   */
  async subscribeToPoolAccount(poolId: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    if (this.subscribedAccounts.has(poolId)) {
      console.log(`Already subscribed to pool: ${poolId}`);
      return;
    }

    // Validate it's a Raydium pool first
    const isValid = await this.raydiumService.isValidRaydiumPool(poolId);
    if (!isValid) {
      throw new Error(`Invalid Raydium pool: ${poolId}`);
    }

    const subscribeMessage = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'accountSubscribe',
      params: [
        poolId,
        {
          encoding: 'base64',
          commitment: 'confirmed'
        }
      ]
    };

    this.ws!.send(JSON.stringify(subscribeMessage));
    this.subscribedAccounts.add(poolId);
    
    console.log(`Subscribed to pool account: ${poolId}`);
  }

  /**
   * Unsubscribe from pool account
   */
  async unsubscribeFromPoolAccount(poolId: string): Promise<void> {
    if (!this.subscribedAccounts.has(poolId)) {
      return;
    }

    // Note: Helius WebSocket unsubscribe would require tracking subscription IDs
    // For now, we'll remove from our tracking
    this.subscribedAccounts.delete(poolId);
    console.log(`Unsubscribed from pool: ${poolId}`);
  }

  /**
   * Handle WebSocket connection open
   */
  private handleOpen(): void {
    console.log('Helius WebSocket connected');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.emit('connected');
  }

  /**
   * Handle WebSocket messages (account changes)
   */
  private async handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      // Handle account change notifications
      if (data.method === 'accountNotification') {
        await this.handleAccountChange(data.params);
      }
      
      // Handle subscription confirmations
      if (data.result && typeof data.result === 'number') {
        console.log(`Subscription confirmed with ID: ${data.result}`);
      }

    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      this.emit('error', error);
    }
  }

  /**
   * Handle pool account changes and emit price updates
   */
  private async handleAccountChange(params: { result: unknown; subscription: unknown }): void {
    try {
      const accountInfo = params.result;
      
      // Find which pool this account belongs to
      const poolId = Array.from(this.subscribedAccounts).find(_id => 
        // For now, we'll need to match based on account info
        // This may need refinement based on actual Helius response structure
        accountInfo
      );

      if (!poolId) {
        console.warn('Received account change for unknown pool');
        return;
      }

      console.log(`Pool account change detected: ${poolId}`);

      // Parse the updated pool data using our Raydium service
      const reserveData = await this.raydiumService.getPoolReserveData(poolId);
      
      // Emit price update event
      const priceUpdate: PriceUpdateEvent = {
        poolId,
        reserveData,
        timestamp: new Date()
      };

      this.emit('priceUpdate', priceUpdate);
      console.log(`Price update emitted for ${poolId}: $${reserveData.price.toFixed(4)}`);

    } catch (error) {
      console.error('Error handling account change:', error);
      this.emit('error', error);
    }
  }

  /**
   * Handle WebSocket connection close
   */
  private handleClose(event: CloseEvent): void {
    console.log('WebSocket connection closed:', event.code, event.reason);
    this.isConnected = false;
    this.ws = null;

    // Attempt reconnection if not a clean close
    if (event.code !== 1000 && this.reconnectAttempts < this.config.reconnectAttempts) {
      this.scheduleReconnect();
    }

    this.emit('disconnected', event);
  }

  /**
   * Handle WebSocket errors
   */
  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
    this.emit('error', error);
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.config.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      
      try {
        await this.connect();
        await this.subscribeToRaydiumPools();
      } catch (error) {
        console.error('Reconnection failed:', error);
        
        if (this.reconnectAttempts < this.config.reconnectAttempts) {
          this.scheduleReconnect();
        } else {
          console.error('Max reconnection attempts reached');
          this.emit('maxReconnectAttemptsReached');
        }
      }
    }, delay);
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.isConnected = false;
    this.subscribedAccounts.clear();
    console.log('WebSocket disconnected');
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    connected: boolean;
    subscribedPools: string[];
    reconnectAttempts: number;
  } {
    return {
      connected: this.isConnected,
      subscribedPools: Array.from(this.subscribedAccounts),
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Get supported Raydium pools
   */
  getSupportedPools(): Record<string, string> {
    return { ...this.RAYDIUM_POOLS };
  }
}

/**
 * Factory function to create WebSocket service
 */
export function createHeliusWebSocketService(config: WebSocketConfig): HeliusWebSocketService {
  return new HeliusWebSocketService(config);
}