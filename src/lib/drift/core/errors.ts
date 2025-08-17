// Error classes for Drift API integration

export class DriftAPIError extends Error {
  constructor(
    message: string,
    public endpoint: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'DriftAPIError';
  }
}

export class DriftTimeoutError extends DriftAPIError {
  constructor(endpoint: string, timeout: number) {
    super(`Request timeout after ${timeout}ms`, endpoint);
    this.name = 'DriftTimeoutError';
  }
}