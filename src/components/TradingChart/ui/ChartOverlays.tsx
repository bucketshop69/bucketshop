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
    </>
  );
}