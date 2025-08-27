'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSolanaWallets } from '@privy-io/react-auth/solana';
import { theme } from '@/lib/theme';
import { DriftApiService, EnhancedPerpPosition } from '@/lib/drift/DriftApiService';

interface OpenPositionsProps {
  driftService: DriftApiService;
}

export function OpenPositions({ driftService }: OpenPositionsProps) {
  const [positions, setPositions] = useState<EnhancedPerpPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { authenticated } = usePrivy();
  const { wallets } = useSolanaWallets();

  const fetchPositions = async () => {
    if (!authenticated || wallets.length === 0) {
      setPositions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await driftService.getOpenPositions();

      if (result.success && result.positions) {
        console.log(result.positions);

        setPositions(result.positions);
      } else {
        setError(result.error || 'Failed to load positions');
        setPositions([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPositions([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch positions when component mounts and wallet changes
  useEffect(() => {
    fetchPositions();
  }, [authenticated, wallets, driftService]);


  const formatBaseAmount = (amount: number) => {
    // Now amount is already converted (e.g., 0.2 SOL instead of 200000000)
    return Math.abs(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

  const formatQuoteAmount = (amount: number) => {
    // Now amount is already converted (e.g., -39.13 USDC instead of -39133846)
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
      signDisplay: 'always'
    });
  };

  if (!authenticated) {
    return (
      <div className="border-t pt-6 mt-6" style={{ borderColor: theme.grid.primary }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: theme.text.primary }}>
          Open Positions
        </h3>
        <div className="text-center py-8">
          <p style={{ color: theme.text.secondary }}>Connect wallet to view positions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t p-2 mt-6" style={{ borderColor: theme.grid.primary }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold" style={{ color: theme.text.primary }}>
          Open Positions
        </h3>
        <button
          onClick={fetchPositions}
          disabled={loading}
          className="text-sm px-3 py-1 rounded border transition-colors hover:opacity-80 disabled:opacity-50"
          style={{
            borderColor: theme.grid.primary,
            color: theme.text.secondary
          }}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading && positions.length === 0 ? (
        <div className="text-center py-8">
          <p style={{ color: theme.text.secondary }}>Loading positions...</p>
        </div>
      ) : positions.length === 0 ? (
        <div className="text-center py-8">
          <p style={{ color: theme.text.secondary }}>No open positions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {positions.map((position) => (
            <div
              key={position.marketIndex}
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: theme.background.tertiary,
                borderColor: theme.grid.primary
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-sm" style={{ color: theme.text.secondary }}>
                    Market #{position.marketIndex}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-sm font-medium px-2 py-1 rounded ${position.isLong ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}
                  >
                    {position.isLong ? 'LONG' : 'SHORT'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div style={{ color: theme.text.secondary }}>Size</div>
                  <div style={{ color: theme.text.primary }}>
                    {formatBaseAmount(position.baseAssetAmount)} SOL
                  </div>
                </div>
                <div>
                  <div style={{ color: theme.text.secondary }}>Quote Amount</div>
                  <div
                    className={position.quoteAssetAmount >= 0 ? 'text-green-400' : 'text-red-400'}
                  >
                    ${formatQuoteAmount(position.quoteAssetAmount)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}