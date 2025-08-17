// HTTP client with retry logic and timeout handling

import { DriftAPIError, DriftTimeoutError } from './errors';
import type { ApiConfig } from './types';

export const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: 'https://data.api.drift.trade',
  timeout: 10000, // 10 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
};

// Utility function for retrying failed requests
export async function withRetry<T>(
  operation: () => Promise<T>,
  retries: number = DEFAULT_CONFIG.maxRetries,
  delay: number = DEFAULT_CONFIG.retryDelay
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      console.warn(`Attempt ${attempt}/${retries} failed:`, error);
      
      // Don't retry on final attempt
      if (attempt === retries) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
}

// Enhanced fetch with timeout and error handling
export async function fetchWithTimeout(
  url: string, 
  options: RequestInit = {},
  timeout: number = DEFAULT_CONFIG.timeout
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new DriftAPIError(
        `HTTP ${response.status}: ${response.statusText}`,
        url,
        response.status
      );
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new DriftTimeoutError(url, timeout);
    }
    
    if (error instanceof DriftAPIError) {
      throw error;
    }
    
    throw new DriftAPIError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      url,
      undefined,
      error instanceof Error ? error : undefined
    );
  }
}