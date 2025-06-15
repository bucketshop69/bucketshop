'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Star, StarOff, Loader2, ExternalLink, Copy, Check } from 'lucide-react';

// Import RTK Query hooks
import { 
  useGetTokenWithMarketDataQuery,
  useAddTokenToWatchlistMutation,
  useRemoveFromWatchlistMutation,
  useGetUserWatchlistQuery 
} from '@/store/api/watchlistApi';

/**
 * TokenDetails Component - Shows token information and watchlist actions
 * 
 * LEARNING: This component demonstrates several advanced patterns:
 * 
 * 1. MULTIPLE RTK QUERY HOOKS:
 *    - useGetTokenWithMarketDataQuery() → fetch token data
 *    - useAddTokenToWatchlistMutation() → add to watchlist
 *    - useRemoveFromWatchlistMutation() → remove from watchlist
 *    - useGetUserWatchlistQuery() → check if already in watchlist
 * 
 * 2. OPTIMISTIC UPDATES:
 *    - UI updates immediately when user clicks "Add to Watchlist"
 *    - If API call fails, RTK Query automatically reverts the change
 *    - Provides smooth UX without waiting for server response
 * 
 * 3. CONDITIONAL RENDERING:
 *    - Show different button based on watchlist status
 *    - Handle loading states for each operation
 *    - Error boundaries for failed operations
 * 
 * 4. COPY-TO-CLIPBOARD:
 *    - Navigator API for copying token address
 *    - Visual feedback with icon change
 * 
 * 5. RESPONSIVE DESIGN:
 *    - Adapts to different screen sizes
 *    - Mobile-friendly layout
 */

interface TokenDetailsProps {
  tokenAddress: string;
}

// Demo wallet - in production this comes from wallet connection
const DEMO_WALLET = '7EHgQpahjYzu8qCShiSW3jFpLnmoZNosMi9hVQp1mEsj';

export function TokenDetails({ tokenAddress }: TokenDetailsProps) {
  // === LOCAL STATE ===
  const [copied, setCopied] = useState(false);
  
  // === RTK QUERY HOOKS ===
  
  // LEARNING: This fetches token data with market information
  const { 
    data: tokenData, 
    isLoading: isLoadingToken, 
    error: tokenError,
    refetch: refetchTokenData
  } = useGetTokenWithMarketDataQuery(tokenAddress);
  
  // LEARNING: This fetches user's watchlist to check if token is already added
  const { 
    data: watchlist,
    refetch: refetchWatchlist
  } = useGetUserWatchlistQuery(DEMO_WALLET);
  
  // LEARNING: These are mutation hooks - they modify data
  const [addToWatchlist, { 
    isLoading: isAdding 
  }] = useAddTokenToWatchlistMutation();
  
  const [removeFromWatchlist, { 
    isLoading: isRemoving 
  }] = useRemoveFromWatchlistMutation();
  
  // === DERIVED STATE ===
  // Check if token is already in watchlist
  const isInWatchlist = watchlist?.some(
    item => item.tokenAddress === tokenAddress
  );
  
  const watchlistItem = watchlist?.find(
    item => item.tokenAddress === tokenAddress
  );
  
  // === EVENT HANDLERS ===
  
  const handleAddToWatchlist = async () => {
    try {
      // LEARNING: RTK Query mutation - this calls /api/watchlist POST
      await addToWatchlist({
        tokenAddress,
        walletAddress: DEMO_WALLET,
        userNotes: `Added ${tokenData?.symbol || 'token'} to watchlist`
      }).unwrap();
      
      // Force immediate refetch of both queries to update UI
      await Promise.all([
        refetchWatchlist(),
        refetchTokenData()
      ]);
      
      console.log('Token added to watchlist successfully!');
    } catch (error: unknown) {
      // Error handling - RTK Query provides detailed error info
      console.error('Failed to add token to watchlist:', error);
      
      // Handle specific error cases
      if (error && typeof error === 'object' && 'status' in error && error.status === 409) {
        console.log('Token is already in watchlist');
        // Could show a toast notification here
        alert('This token is already in your watchlist!');
      } else {
        console.error('Unexpected error:', error);
        alert('Failed to add token to watchlist. Please try again.');
      }
    }
  };
  
  const handleRemoveFromWatchlist = async () => {
    if (!watchlistItem) {
      console.error('No watchlist item found to remove');
      return;
    }
    
    console.log(`Attempting to remove watchlist item ID: ${watchlistItem.id}`);
    
    try {
      // LEARNING: RTK Query mutation - this calls /api/watchlist/[id] DELETE
      const result = await removeFromWatchlist({
        id: watchlistItem.id,
        walletAddress: DEMO_WALLET,
        tokenAddress: tokenAddress
      }).unwrap();
      
      // Force immediate refetch of both queries to update UI
      await Promise.all([
        refetchWatchlist(),
        refetchTokenData()
      ]);
      
      console.log('Token removed from watchlist successfully!', result);
    } catch (error) {
      console.error('Failed to remove token from watchlist:', error);
      console.error('Error details:', {
        watchlistItemId: watchlistItem.id,
        walletAddress: DEMO_WALLET,
        error
      });
    }
  };
  
  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(tokenAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };
  
  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };
  
  const formatPrice = (price: number) => {
    if (price < 0.01) {
      return price.toExponential(2);
    }
    return price.toFixed(4);
  };
  
  // === LOADING STATE ===
  if (isLoadingToken) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <h3 className="text-xl font-semibold">Loading token details...</h3>
          <p className="text-muted-foreground">
            Fetching data from Jupiter API
          </p>
        </div>
      </div>
    );
  }
  
  // === ERROR STATE ===
  if (tokenError || !tokenData) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <Card className="p-8 text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2">Token Not Found</h3>
          <p className="text-muted-foreground mb-4">
            Unable to load token information for this address.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground break-all">
              Address: {tokenAddress}
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="mt-4"
            >
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  // === MAIN RENDER ===
  return (
    <div className="h-full flex flex-col">
      {/* Token Header Strip */}
      <div className="border-b bg-card">
        <div className="p-6">
          <div className="flex items-center justify-between">
            {/* Left: Token Info */}
            <div className="flex items-center space-x-4">
              {/* Token Icon */}
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                {tokenData.iconUrl ? (
                  <img 
                    src={tokenData.iconUrl} 
                    alt={tokenData.symbol}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <span className="text-xl font-bold">
                    {tokenData.symbol.slice(0, 2)}
                  </span>
                )}
              </div>
              
              {/* Token Details */}
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-3xl font-bold">{tokenData.symbol}</h1>
                  {isInWatchlist && (
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  )}
                </div>
                <h2 className="text-xl text-muted-foreground mb-2">
                  {tokenData.name}
                </h2>
                
                {/* Token Address */}
                <div className="flex items-center space-x-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {formatAddress(tokenAddress)}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyAddress}
                    className="h-8 w-8 p-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-8 w-8 p-0"
                  >
                    <a 
                      href={`https://solscan.io/token/${tokenAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Right: Watchlist Action */}
            <div className="flex items-center space-x-4">
              {/* Price Display */}
              {tokenData.currentPrice && (
                <div className="text-right">
                  <p className="text-2xl font-bold font-mono">
                    ${formatPrice(tokenData.currentPrice)}
                  </p>
                  {tokenData.priceChange24h && (
                    <p className={`text-sm font-medium ${
                      tokenData.priceChange24h >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {tokenData.priceChange24h >= 0 ? '+' : ''}
                      {tokenData.priceChange24h.toFixed(2)}% (24h)
                    </p>
                  )}
                </div>
              )}
              
              {/* Watchlist Button */}
              {isInWatchlist ? (
                <Button
                  variant="outline"
                  onClick={handleRemoveFromWatchlist}
                  disabled={isRemoving}
                  className="flex items-center space-x-2"
                >
                  {isRemoving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                  <span>Remove from Watchlist</span>
                </Button>
              ) : (
                <Button
                  onClick={handleAddToWatchlist}
                  disabled={isAdding}
                  className="flex items-center space-x-2"
                >
                  {isAdding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Star className="h-4 w-4" />
                  )}
                  <span>Add to Watchlist</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Market Data Section */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Market Cap */}
          {tokenData.marketCap && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Market Cap
              </h3>
              <p className="text-2xl font-bold">
                ${tokenData.marketCap.toLocaleString()}
              </p>
            </Card>
          )}
          
          {/* Volume 24h */}
          {tokenData.volume24h && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Volume (24h)
              </h3>
              <p className="text-2xl font-bold">
                ${tokenData.volume24h.toLocaleString()}
              </p>
            </Card>
          )}
          
          {/* RSI */}
          {tokenData.rsi && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                RSI (14)
              </h3>
              <div className="flex items-center space-x-2">
                <p className="text-2xl font-bold">{tokenData.rsi.toFixed(1)}</p>
                <span className={`text-xs px-2 py-1 rounded ${
                  tokenData.rsiSignal === 'oversold' 
                    ? 'bg-green-100 text-green-800' 
                    : tokenData.rsiSignal === 'overbought'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {tokenData.rsiSignal}
                </span>
              </div>
            </Card>
          )}
          
          {/* Liquidity */}
          {tokenData.liquidity && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Liquidity
              </h3>
              <p className="text-2xl font-bold">
                ${tokenData.liquidity.toLocaleString()}
              </p>
            </Card>
          )}
        </div>
        
        {/* Chart Placeholder */}
        <Card className="p-8">
          <div className="text-center space-y-4">
            <div className="text-6xl">📈</div>
            <h3 className="text-2xl font-bold text-muted-foreground">
              Price Chart Coming Soon
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Advanced charting with technical indicators will be available here. 
              For now, you can view key metrics above and manage your watchlist.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}