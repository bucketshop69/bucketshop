/**
 * WebSocketManager - Real-time connection management for Drift Protocol
 * 
 * This class implements enterprise-grade WebSocket patterns for financial data streaming:
 * - Automatic reconnection with exponential backoff
 * - Connection health monitoring with heartbeat
 * - Subscription management for multiple channels
 * - Graceful error handling and recovery
 * - Performance optimizations for high-frequency updates
 * - Dynamic market configuration (no hardcoded indices)
 */

import { ConnectionState } from './chartStore';

export interface WebSocketConfig {
  url: string;
  reconnectDelay: number;
  maxReconnectDelay: number;
  heartbeatInterval: number;
  connectionTimeout: number;
  maxRetries?: number;
}

export interface DriftSubscription {
  type: 'subscribe' | 'unsubscribe';
  marketType: 'perp' | 'spot';
  channel: 'orderbook' | 'trades' | 'candles';
  market: string;
}

export interface DriftOrderbookData {
  channel: string;
  market: string;
  data: {
    bids: Array<{ price: string; size: string }>;
    asks: Array<{ price: string; size: string }>;
    slot: number;
    timestamp: number;
  };
}

export interface DriftTradeData {
  channel: string;
  market: string;
  data: {
    price: string;
    size: string;
    side: 'buy' | 'sell';
    timestamp: number;
    slot: number;
  };
}

export type DriftMessageData = DriftOrderbookData | DriftTradeData;

export interface WebSocketCallbacks {
  onConnectionChange: (state: ConnectionState) => void;
  onPriceUpdate: (price: number) => void;
  onError: (error: Error) => void;
}

/**
 * Default configuration optimized for Drift Protocol WebSocket
 */
const DEFAULT_CONFIG: WebSocketConfig = {
  url: 'wss://dlob.drift.trade/ws',
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  heartbeatInterval: 5000,
  connectionTimeout: 10000,
  maxRetries: 10,
};

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private callbacks: WebSocketCallbacks;

  // Connection management
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private connectionTimer: NodeJS.Timeout | null = null;

  // Subscription management
  private subscriptions = new Map<string, DriftSubscription>();
  private pendingSubscriptions = new Set<string>();

  // Performance tracking
  private lastMessageTime = 0;
  private messageCount = 0;
  private reconnectCount = 0;

  constructor(callbacks: WebSocketCallbacks, config: Partial<WebSocketConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.callbacks = callbacks;

    // Bind methods to preserve context
    this.handleOpen = this.handleOpen.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }

  /**
   * Establish WebSocket connection to Drift Protocol
   */
  public connect(): void {
    if (this.connectionState === 'connecting' || this.connectionState === 'connected') {
      console.warn('WebSocket already connecting or connected');
      return;
    }

    console.log('Connecting to Drift WebSocket:', this.config.url);
    this.setConnectionState('connecting');

    try {
      this.ws = new WebSocket(this.config.url);
      this.ws.onopen = this.handleOpen;
      this.ws.onmessage = this.handleMessage;
      this.ws.onerror = this.handleError;
      this.ws.onclose = this.handleClose;

      // Set connection timeout
      this.connectionTimer = setTimeout(() => {
        if (this.connectionState === 'connecting') {
          console.error('Connection timeout');
          this.handleConnectionTimeout();
        }
      }, this.config.connectionTimeout);

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.handleError(error as Event);
    }
  }

  /**
   * Close WebSocket connection gracefully
   */
  public disconnect(): void {
    console.log('Disconnecting WebSocket...');

    this.clearTimers();
    this.reconnectAttempts = 0;

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;

      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Client disconnect');
      }

      this.ws = null;
    }

    this.setConnectionState('disconnected');
  }

  /**
   * Subscribe to market data for a specific symbol
   */
  public subscribeToMarket(symbol: string): void {
    console.log(`Subscribing to ${symbol} orderbook for price updates`);

    // Subscribe to orderbook for oracle price updates
    this.subscribe({
      type: 'subscribe',
      marketType: 'perp',
      channel: 'orderbook',
      market: symbol
    });
  }

  /**
   * Subscribe to BTC-PERP market data (legacy method for backwards compatibility)
   */
  public subscribeToBTCPerp(): void {
    this.subscribeToMarket('SOL-PERP');
  }

  /**
   * Subscribe to a specific channel
   */
  private subscribe(subscription: DriftSubscription): void {
    const key = `${subscription.channel}_${subscription.market}`;
    this.subscriptions.set(key, subscription);

    if (this.connectionState === 'connected' && this.ws) {
      this.sendSubscription(subscription);
    } else {
      this.pendingSubscriptions.add(key);
    }
  }

  /**
   * Send subscription message to WebSocket
   */
  private sendSubscription(subscription: DriftSubscription): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send subscription - WebSocket not ready');
      return;
    }

    try {
      const message = JSON.stringify(subscription);
      this.ws.send(message);
      console.log('Sent subscription:', subscription);
    } catch (error) {
      console.error('Failed to send subscription:', error);
    }
  }

  /**
   * Handle WebSocket connection open
   */
  private handleOpen(): void {
    console.log('WebSocket connected successfully');

    this.clearTimers();
    this.reconnectAttempts = 0;
    this.setConnectionState('connected');

    // Send pending subscriptions
    this.sendPendingSubscriptions();

    // Start heartbeat monitoring
    this.startHeartbeat();
  }



  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    this.lastMessageTime = Date.now();
    this.messageCount++;

    try {
      const data: DriftMessageData = JSON.parse(event.data);
      this.processMessage(data);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Process parsed WebSocket message
   */
  private processMessage(data: any): void {
    try {
      console.log(data);

      // Handle orderbook updates for oracle price extraction
      if (data.channel?.includes('orderbook_perp_')) {
        console.log('Received orderbook data:', data);

        // Parse the data field which contains JSON string
        let orderbookData;
        try {
          orderbookData = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
        } catch (parseError) {
          console.error('Failed to parse orderbook data:', parseError);
          return;
        }

        // Extract oracle price (primary) or fallback to oracleData.price
        let rawOraclePrice = null;
        console.log(orderbookData);

        if (orderbookData.oracle) {
          rawOraclePrice = parseFloat(orderbookData.oracle);
        } else if (orderbookData.oracleData?.price) {
          rawOraclePrice = parseFloat(orderbookData.oracleData.price);
        }

        if (rawOraclePrice && rawOraclePrice > 0) {
          // Drift oracle prices are scaled by 10^6, so divide to get actual price
          const oraclePrice = rawOraclePrice / 1000000;
          console.log(`Oracle price update: $${oraclePrice.toFixed(2)} (raw: ${rawOraclePrice})`);
          this.callbacks.onPriceUpdate(oraclePrice);
        } else {
          console.warn('No valid oracle price found in orderbook data');
        }
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket errors
   */
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);

    const error = new Error('WebSocket connection error');
    this.callbacks.onError(error);

    this.setConnectionState('error');
  }

  /**
   * Handle WebSocket connection close
   */
  private handleClose(event: CloseEvent): void {
    console.log('WebSocket connection closed:', event.code, event.reason);

    this.clearTimers();
    this.setConnectionState('disconnected');

    // Auto-reconnect unless explicitly closed
    if (event.code !== 1000 && this.reconnectAttempts < (this.config.maxRetries || 10)) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle connection timeout
   */
  private handleConnectionTimeout(): void {
    console.error('WebSocket connection timeout');

    if (this.ws) {
      this.ws.close();
    }

    this.setConnectionState('error');
    this.scheduleReconnect();
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    this.reconnectCount++;

    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.config.maxReconnectDelay
    );

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      console.log(`Reconnect attempt ${this.reconnectAttempts}`);
      this.connect();
    }, delay);
  }

  /**
   * Send pending subscriptions after connection
   */
  private sendPendingSubscriptions(): void {
    this.pendingSubscriptions.forEach(key => {
      const subscription = this.subscriptions.get(key);
      if (subscription) {
        this.sendSubscription(subscription);
      }
    });

    this.pendingSubscriptions.clear();
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const timeSinceLastMessage = Date.now() - this.lastMessageTime;

      // If no message received in 2x heartbeat interval, consider connection stale
      if (timeSinceLastMessage > this.config.heartbeatInterval * 2) {
        console.warn('No heartbeat received, connection may be stale');

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          // Send ping message if supported
          try {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          } catch (error) {
            console.error('Failed to send ping:', error);
          }
        }
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
  }

  /**
   * Update connection state and notify callbacks
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      console.log(`Connection state: ${this.connectionState} → ${state}`);
      this.connectionState = state;
      this.callbacks.onConnectionChange(state);
    }
  }

  /**
   * Get current connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Get connection statistics
   */
  public getStats() {
    return {
      connectionState: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      reconnectCount: this.reconnectCount,
      messageCount: this.messageCount,
      lastMessageTime: this.lastMessageTime,
      subscriptions: Array.from(this.subscriptions.keys()),
    };
  }

  /**
   * Check if WebSocket is healthy
   */
  public isHealthy(): boolean {
    return (
      this.connectionState === 'connected' &&
      this.ws?.readyState === WebSocket.OPEN &&
      (Date.now() - this.lastMessageTime) < this.config.heartbeatInterval * 3
    );
  }
}