'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';

// Import our RTK Query hooks
import { useLazySearchTokenByAddressQuery, useLazySearchLocalTokensQuery } from '@/store/api/watchlistApi';

/**
 * TokenSearch Component - The Heart of Our Search Feature
 * 
 * LEARNING: This component demonstrates several advanced React patterns:
 * 
 * 1. DEBOUNCED SEARCH:
 *    - Problem: User types "SOL" → 3 API calls (S, SO, SOL)
 *    - Solution: Wait 300ms after user stops typing
 *    - Implementation: useCallback + setTimeout + cleanup
 * 
 * 2. RTK QUERY LAZY HOOK:
 *    - useLazySearchTokensQuery() gives us manual control
 *    - We call searchTokens(query) when we want to search
 *    - Automatic loading states, error handling, caching
 * 
 * 3. FOCUS MANAGEMENT:
 *    - Show dropdown when input focused + has results
 *    - Hide dropdown when clicking outside
 *    - useRef + event listeners for click outside detection
 * 
 * 4. KEYBOARD NAVIGATION:
 *    - Up/Down arrows to navigate results
 *    - Enter to select highlighted result
 *    - Escape to close dropdown
 * 
 * 5. ROUTER NAVIGATION:
 *    - Navigate to /token/[address] when token selected
 *    - Next.js useRouter hook for programmatic navigation
 */

interface TokenSearchProps {
  placeholder?: string;
  className?: string;
}

export function TokenSearch({ 
  placeholder = "Enter token address (e.g., So111...)",
  className = "" 
}: TokenSearchProps) {
  // === STATE MANAGEMENT ===
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // === REFS FOR DOM MANIPULATION ===
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // === NEXT.JS ROUTER FOR NAVIGATION ===
  const router = useRouter();
  
  // === RTK QUERY HOOKS ===
  // LEARNING: Address-based search (exact lookup)
  const [searchByAddress, { 
    data: addressResults, 
    isLoading: isLoadingAddress, 
    error: addressError 
  }] = useLazySearchTokenByAddressQuery();
  
  // Local search for suggestions (when user types symbol/name)
  const [searchLocal, { 
    data: localResults, 
    isLoading: isLoadingLocal, 
    error: localError 
  }] = useLazySearchLocalTokensQuery();
  
  // Determine which results to show
  const searchResults = addressResults || localResults;
  const isLoading = isLoadingAddress || isLoadingLocal;
  const error = addressError || localError;
  
  // === DEBOUNCED SEARCH LOGIC ===
  // LEARNING: Smart search - address vs local search
  const debouncedSearch = useCallback((searchQuery: string) => {
    const timeoutId = setTimeout(() => {
      const trimmedQuery = searchQuery.trim();
      
      if (trimmedQuery.length < 2) {
        setShowDropdown(false);
        return;
      }
      
      // Check if query looks like a token address (32+ characters, alphanumeric)
      const isTokenAddress = trimmedQuery.length >= 32 && /^[A-Za-z0-9]+$/.test(trimmedQuery);
      
      if (isTokenAddress) {
        // Search by exact token address
        console.log('Searching by address:', trimmedQuery);
        searchByAddress(trimmedQuery);
      } else {
        // Search local database for symbol/name suggestions
        console.log('Searching local tokens:', trimmedQuery);
        searchLocal({ query: trimmedQuery, limit: 10 });
      }
      
      setShowDropdown(true);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchByAddress, searchLocal]);
  
  // === EFFECT: TRIGGER SEARCH WHEN QUERY CHANGES ===
  useEffect(() => {
    const cleanup = debouncedSearch(query);
    return cleanup; // This runs when query changes or component unmounts
  }, [query, debouncedSearch]);
  
  // === EFFECT: CLICK OUTSIDE TO CLOSE DROPDOWN ===
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // === KEYBOARD NAVIGATION HANDLER ===
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || !searchResults?.results) return;
    
    const resultsCount = searchResults.results.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < resultsCount - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : resultsCount - 1
        );
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < resultsCount) {
          const selectedToken = searchResults.results[selectedIndex];
          handleTokenSelect(selectedToken.tokenAddress);
        }
        break;
        
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };
  
  // === TOKEN SELECTION HANDLER ===
  const handleTokenSelect = (tokenAddress: string) => {
    // LEARNING: This is where we navigate to the token details page
    // Next.js router.push() triggers client-side navigation
    router.push(`/token/${tokenAddress}`);
    
    // Clean up UI state
    setShowDropdown(false);
    setSelectedIndex(-1);
    setQuery(''); // Clear search input
    inputRef.current?.blur(); // Remove focus from input
  };
  
  // === INPUT CHANGE HANDLER ===
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSelectedIndex(-1); // Reset selection when typing
    
    // If query is empty, hide dropdown immediately
    if (!newQuery.trim()) {
      setShowDropdown(false);
    }
  };
  
  // === INPUT FOCUS HANDLER ===
  const handleInputFocus = () => {
    // Show dropdown if we have results and query is long enough
    if (query.trim().length >= 2 && searchResults?.results?.length) {
      setShowDropdown(true);
    }
  };
  
  return (
    <div className={`relative ${className}`}>
      {/* === SEARCH INPUT === */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className="pl-10 w-full"
        />
        
        {/* Loading spinner */}
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      
      {/* === DROPDOWN RESULTS === */}
      {showDropdown && (
        <Card 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto shadow-lg"
        >
          {/* Loading state */}
          {isLoading && (
            <div className="p-4 text-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              Searching tokens...
            </div>
          )}
          
          {/* Error state */}
          {error && (
            <div className="p-4 text-center text-red-500">
              Search failed. Please try again.
            </div>
          )}
          
          {/* Results */}
          {!isLoading && !error && searchResults?.results && (
            <>
              {searchResults.results.length > 0 ? (
                <div className="py-2">
                  {searchResults.results.map((token, index) => (
                    <div
                      key={token.tokenAddress}
                      className={`flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors ${
                        index === selectedIndex 
                          ? 'bg-primary/10 border-l-2 border-primary' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleTokenSelect(token.tokenAddress)}
                    >
                      {/* Token Icon */}
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        {token.iconUrl ? (
                          <img 
                            src={token.iconUrl} 
                            alt={token.symbol}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <span className="text-xs font-bold">
                            {token.symbol.slice(0, 2)}
                          </span>
                        )}
                      </div>
                      
                      {/* Token Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{token.symbol}</span>
                          {token.isInWatchlist && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                              In Watchlist
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {token.name}
                        </p>
                      </div>
                      
                      {/* Price (if available) */}
                      {token.currentPrice && (
                        <div className="text-right">
                          <p className="text-sm font-mono">
                            ${token.currentPrice.toFixed(4)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No tokens found for &quot;{query}&quot;
                </div>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  );
}