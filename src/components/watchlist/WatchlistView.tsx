'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Import our RTK Query hooks - THIS IS THE MAGIC! 🪄
import { useGetUserWatchlistQuery } from '@/store/api/watchlistApi';

/**
 * WatchlistView - The main watchlist component
 * 
 * This component demonstrates RTK Query integration:
 * 1. useGetUserWatchlistQuery() automatically calls /api/watchlist
 * 2. Handles loading states, errors, and caching automatically
 * 3. Re-fetches data when needed
 * 4. Provides optimistic updates for better UX
 */

// Demo wallet address - in production this would come from wallet connection
const DEMO_WALLET = '7EHgQpahjYzu8qCShiSW3jFpLnmoZNosMi9hVQp1mEsj';

export function WatchlistView() {
  const router = useRouter();
  
  // 🔥 HERE'S WHERE RTK QUERY MAGIC HAPPENS!
  // This single line:
  // 1. Calls /api/watchlist?walletAddress=7EHgQpahjYzu8qCShiSW3jFpLnmoZNosMi9hVQp1mEsj
  // 2. Handles loading states automatically  
  // 3. Caches the result for 30 seconds
  // 4. Re-fetches in background when data gets stale
  const {
    data: watchlist,     // The actual watchlist data
    isLoading,          // True while first load
    isFetching,         // True during background refetch
    error,              // Any error that occurred
    refetch,            // Manual refetch function
  } = useGetUserWatchlistQuery(DEMO_WALLET);
  
  // Handle token card click - navigate to token details
  const handleTokenClick = (tokenAddress: string) => {
    router.push(`/token/${tokenAddress}`);
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading watchlist...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <Card className="p-6 text-center max-w-sm">
          <div className="text-4xl mb-2">⚠️</div>
          <h3 className="font-semibold mb-2">Failed to load watchlist</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {error && 'data' in error
              ? `Error: ${error.data?.error || 'Unknown error'}`
              : 'Network error occurred'
            }
          </p>
          <Button onClick={() => refetch()} size="sm">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  // Handle empty watchlist
  if (!watchlist || watchlist.length === 0) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">My Watchlist</h2>
            <Button
              onClick={() => refetch()}
              variant="ghost"
              size="sm"
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <div className="text-6xl">📋</div>
            <h3 className="text-xl font-semibold">No tokens yet</h3>
            <p className="text-muted-foreground max-w-xs">
              Search for tokens in the search bar above and add them to your watchlist
            </p>
            <Button className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Token
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render watchlist with tokens
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">My Watchlist</h2>
            <p className="text-sm text-muted-foreground">
              {watchlist.length} token{watchlist.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            onClick={() => refetch()}
            variant="ghost"
            size="sm"
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Token List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {watchlist.map((item) => (
          <Card 
            key={item.id} 
            className="p-4 cursor-pointer hover:bg-accent transition-colors"
            onClick={() => handleTokenClick(item.tokenAddress)}
          >
            {/* TokenCard component will replace this */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  {item.tokenInfo.iconUrl ? (
                    <img
                      src={item.tokenInfo.iconUrl}
                      alt={item.tokenInfo.symbol}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <span className="text-xs font-bold">
                      {item.tokenInfo.symbol.slice(0, 2)}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{item.tokenInfo.symbol}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.tokenInfo.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {item.tokenAddress.slice(0, 4)}...{item.tokenAddress.slice(-4)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm">Price: Loading...</p>
                <p className="text-xs text-muted-foreground">RSI: Loading...</p>
                <p className="text-xs text-muted-foreground">
                  Click to view details →
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Token Button */}
      <div className="p-4 border-t">
        <Button variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Token to Watchlist
        </Button>
      </div>
    </div>
  );
}