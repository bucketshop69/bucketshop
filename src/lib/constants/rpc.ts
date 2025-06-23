/**
 * RPC Configuration Constants
 */

// Get Helius API key from environment
const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;

if (!HELIUS_API_KEY) {
  throw new Error('NEXT_PUBLIC_HELIUS_API_KEY environment variable is required');
}

// RPC Endpoints
export const RPC_ENDPOINTS = {
  HELIUS_MAINNET: `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
  HELIUS_DEVNET: `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
  SOLANA_MAINNET: 'https://api.mainnet-beta.solana.com',
  SOLANA_DEVNET: 'https://api.devnet.solana.com'
} as const;

// WebSocket Endpoints
export const WEBSOCKET_ENDPOINTS = {
  HELIUS_MAINNET: `wss://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
  HELIUS_DEVNET: `wss://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
  SOLANA_MAINNET: 'wss://api.mainnet-beta.solana.com',
  SOLANA_DEVNET: 'wss://api.devnet.solana.com'
} as const;

// Default endpoints
export const DEFAULT_RPC_ENDPOINT = RPC_ENDPOINTS.HELIUS_MAINNET;
export const DEFAULT_WEBSOCKET_ENDPOINT = WEBSOCKET_ENDPOINTS.HELIUS_MAINNET;

// Network type
export type Network = 'mainnet' | 'devnet';

// Get RPC endpoint by network
export function getRpcEndpoint(network: Network = 'mainnet'): string {
  return network === 'mainnet' 
    ? RPC_ENDPOINTS.HELIUS_MAINNET 
    : RPC_ENDPOINTS.HELIUS_DEVNET;
}

// Get WebSocket endpoint by network
export function getWebSocketEndpoint(network: Network = 'mainnet'): string {
  return network === 'mainnet'
    ? WEBSOCKET_ENDPOINTS.HELIUS_MAINNET
    : WEBSOCKET_ENDPOINTS.HELIUS_DEVNET;
}