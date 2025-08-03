'use client';

import { LoadingState, ChartError } from '../data/chartStore';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

interface ErrorOverlayProps {
  error: ChartError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

interface ConnectionOverlayProps {
  isConnected: boolean;
  isConnecting: boolean;
  onReconnect?: () => void;
}

/**
 * LoadingOverlay - Shows loading state with animated indicator
 */
export function LoadingOverlay({ isVisible, message = 'Loading chart data...' }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
      <div className="text-center">
        <div className="text-2xl mb-2 animate-pulse">📈</div>
        <div className="text-gray-800 font-medium">{message}</div>
        <div className="text-sm text-gray-600 mt-2">Fetching historical data...</div>
        
        {/* Loading spinner */}
        <div className="mt-4 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * ErrorOverlay - Shows error state with retry option
 */
export function ErrorOverlay({ error, onRetry, onDismiss }: ErrorOverlayProps) {
  if (!error) return null;

  const getErrorIcon = (code: string) => {
    switch (code) {
      case 'NETWORK_ERROR':
      case 'FETCH_ERROR':
        return '🌐';
      case 'DATA_ERROR':
      case 'PARSE_ERROR':
        return '📊';
      case 'WEBSOCKET_ERROR':
        return '🔌';
      default:
        return '⚠️';
    }
  };

  const getErrorTitle = (code: string) => {
    switch (code) {
      case 'NETWORK_ERROR':
        return 'Network Error';
      case 'FETCH_ERROR':
        return 'Data Fetch Failed';
      case 'DATA_ERROR':
        return 'Invalid Data';
      case 'PARSE_ERROR':
        return 'Data Parse Error';
      case 'WEBSOCKET_ERROR':
        return 'Connection Error';
      default:
        return 'Chart Error';
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-95 z-20">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="text-3xl mb-3">{getErrorIcon(error.code)}</div>
        <div className="text-lg font-semibold text-gray-800 mb-2">
          {getErrorTitle(error.code)}
        </div>
        <div className="text-gray-600 mb-4 text-sm">
          {error.message}
        </div>
        
        {/* Error details for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500 mb-4 font-mono bg-gray-100 p-2 rounded">
            Code: {error.code} | Time: {new Date(error.timestamp).toLocaleTimeString()}
          </div>
        )}
        
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ConnectionOverlay - Shows connection status for WebSocket
 */
export function ConnectionOverlay({ isConnected, isConnecting, onReconnect }: ConnectionOverlayProps) {
  // Don't show overlay if connected
  if (isConnected) return null;

  return (
    <div className="absolute top-4 right-4 z-30">
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
        ${isConnecting 
          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
          : 'bg-red-100 text-red-800 border border-red-200'
        }
      `}>
        <div className={`w-2 h-2 rounded-full ${
          isConnecting ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
        }`} />
        
        <span>
          {isConnecting ? 'Connecting...' : 'Disconnected'}
        </span>
        
        {!isConnecting && onReconnect && (
          <button
            onClick={onReconnect}
            className="ml-2 text-xs px-2 py-1 bg-red-200 hover:bg-red-300 rounded transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * NoDataOverlay - Shows when no chart data is available
 */
export function NoDataOverlay({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
      <div className="text-center">
        <div className="text-4xl mb-4 text-gray-400">📈</div>
        <div className="text-gray-700 font-medium mb-2">No Chart Data</div>
        <div className="text-gray-500 text-sm mb-4">
          Unable to load chart data from the server
        </div>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            Load Data
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * DataQualityIndicator - Shows data quality metrics
 */
export function DataQualityIndicator({ 
  quality, 
  candleCount,
  className = '' 
}: { 
  quality: number; 
  candleCount: number;
  className?: string;
}) {
  const getQualityColor = (quality: number) => {
    if (quality >= 90) return 'text-green-600';
    if (quality >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityLabel = (quality: number) => {
    if (quality >= 90) return 'Excellent';
    if (quality >= 70) return 'Good';
    if (quality >= 50) return 'Fair';
    return 'Poor';
  };

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <div className={`font-medium ${getQualityColor(quality)}`}>
        {getQualityLabel(quality)}
      </div>
      <div className="text-gray-500">
        {candleCount.toLocaleString()} candles
      </div>
      {process.env.NODE_ENV === 'development' && (
        <div className="text-gray-400">
          ({quality.toFixed(1)}%)
        </div>
      )}
    </div>
  );
}

/**
 * ChartOverlays - Main overlay container that manages all overlay states
 */
export interface ChartOverlaysProps {
  loadingState: LoadingState;
  error: ChartError | null;
  isConnected: boolean;
  isConnecting: boolean;
  hasData: boolean;
  dataQuality: number;
  candleCount: number;
  onRetry?: () => void;
  onDismissError?: () => void;
  onReconnect?: () => void;
}

export function ChartOverlays({
  loadingState,
  error,
  isConnected,
  isConnecting,
  hasData,
  dataQuality,
  candleCount,
  onRetry,
  onDismissError,
  onReconnect,
}: ChartOverlaysProps) {
  return (
    <>
      {/* Loading overlay */}
      <LoadingOverlay 
        isVisible={loadingState === 'loading'} 
        message="Loading BTC-PERP data..."
      />
      
      {/* Error overlay */}
      <ErrorOverlay 
        error={error}
        onRetry={onRetry}
        onDismiss={onDismissError}
      />
      
      {/* No data overlay */}
      {!hasData && loadingState !== 'loading' && !error && (
        <NoDataOverlay onRetry={onRetry} />
      )}
      
      {/* Connection status overlay */}
      <ConnectionOverlay 
        isConnected={isConnected}
        isConnecting={isConnecting}
        onReconnect={onReconnect}
      />
      
      {/* Data quality indicator (bottom-left corner) */}
      {hasData && (
        <div className="absolute bottom-4 left-4 z-10">
          <DataQualityIndicator 
            quality={dataQuality}
            candleCount={candleCount}
            className="bg-white bg-opacity-90 px-2 py-1 rounded"
          />
        </div>
      )}
    </>
  );
}