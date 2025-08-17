'use client';

import { useState, useEffect } from 'react';
import { theme } from '@/lib/theme';

// This shows what our new Drift API backend would return
export default function DriftDataPreview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDriftData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/drift/markets');
      const result = await response.json();
      
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-4 border rounded" style={{ 
      backgroundColor: theme.background.secondary,
      borderColor: theme.grid.primary 
    }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: theme.text.primary }}>
          Drift API Data Preview
        </h3>
        <button
          onClick={fetchDriftData}
          disabled={loading}
          className="px-3 py-1 text-sm rounded border"
          style={{
            backgroundColor: theme.background.tertiary,
            borderColor: theme.grid.primary,
            color: theme.text.primary
          }}
        >
          {loading ? 'Loading...' : 'Fetch Data'}
        </button>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded" style={{ 
          backgroundColor: '#fee2e2',
          color: '#dc2626'
        }}>
          Error: {error}
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span style={{ color: theme.text.secondary }}>Markets Found:</span>
              <span className="ml-2 font-medium" style={{ color: theme.text.primary }}>
                {data.count || 0}
              </span>
            </div>
            <div>
              <span style={{ color: theme.text.secondary }}>Last Updated:</span>
              <span className="ml-2 font-medium" style={{ color: theme.text.primary }}>
                {data.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : 'Never'}
              </span>
            </div>
          </div>

          {data.markets && data.markets.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2" style={{ color: theme.text.primary }}>
                Sample Market Data:
              </h4>
              <div className="bg-black/20 rounded p-3 text-xs font-mono overflow-x-auto">
                <pre style={{ color: theme.text.primary }}>
                  {JSON.stringify(data.markets[0], null, 2)}
                </pre>
              </div>
            </div>
          )}

          {data.markets && data.markets.length > 1 && (
            <div>
              <h4 className="text-sm font-medium mb-2" style={{ color: theme.text.primary }}>
                All Markets Summary:
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {data.markets.map((market: any, index: number) => (
                  <div key={index} className="flex justify-between text-xs p-2 rounded" style={{
                    backgroundColor: theme.background.tertiary
                  }}>
                    <span style={{ color: theme.text.primary }}>{market.symbol}</span>
                    <span style={{ color: theme.text.secondary }}>
                      Vol: {market.quoteVolume ? `$${(market.quoteVolume / 1000000).toFixed(1)}M` : 'N/A'}
                    </span>
                    <span style={{ color: theme.text.secondary }}>
                      OI: {market.openInterest ? `$${(market.openInterest / 1000).toFixed(0)}K` : 'N/A'}
                    </span>
                    <span style={{ color: theme.text.secondary }}>
                      Price: {market.price || 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!data && !loading && !error && (
        <div className="text-center py-8" style={{ color: theme.text.secondary }}>
          Click "Fetch Data" to see what our Drift API returns
        </div>
      )}
    </div>
  );
}