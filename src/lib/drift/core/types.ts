// Core TypeScript interfaces for Drift API integration

export interface DriftVolumeResponse {
  symbol: string;
  quoteVolume: string;
  baseVolume: string;
  marketIndex: number;
  marketType: string;
}

export interface DriftVolumeApiResponse {
  success: boolean;
  total: string;
  markets: DriftVolumeResponse[];
}

export interface DriftOpenInterestResponse {
  timestamp: number;
  openInterest: number;
}

export interface DriftMarketData {
  symbol: string;
  displayName: string;
  price: number | null;           // Will be null until we get price source
  priceChange24h: number | null;  // Will be null until we get price source
  quoteVolume: number;            // From quoteVolume string conversion
  baseVolume: number;             // From baseVolume string conversion
  marketIndex: number;
  marketType: string;
  openInterest: number;
  lastUpdated: number;
}

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
}