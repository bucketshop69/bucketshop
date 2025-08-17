// Core TypeScript interfaces for Drift API integration

export interface DriftVolumeResponse {
  symbol: string;
  marketName: string;
  volume24h: number;
  volumeChange24h?: number;
  price?: number;
  priceChange24h?: number;
}

export interface DriftOpenInterestResponse {
  timestamp: number;
  openInterest: number;
}

export interface DriftMarketData {
  symbol: string;
  displayName: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  openInterest: number;
  lastUpdated: number;
}

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
}