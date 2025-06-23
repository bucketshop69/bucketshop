'use client';

import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { 
  selectFilteredGroups, 
  selectMeteoraLoading, 
  selectMeteoraError,
  selectMeteoraSearchQuery,
  setSearchQuery 
} from '@/store/slices/meteoraSlice';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { GroupStrip } from './GroupStrip';
import { Search, Loader2, AlertCircle } from 'lucide-react';

/**
 * Group Strip List Component
 * 
 * Handles the main token group discovery interface:
 * - Search input for filtering token groups
 * - Loading and error states
 * - Scrollable list of group strips (SOL-USDC, BTC-USDC, etc.)
 * - Each group strip can be expanded to show individual pools
 */
export function GroupStripList() {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux selectors
  const groups = useSelector(selectFilteredGroups);
  const loading = useSelector(selectMeteoraLoading);
  const error = useSelector(selectMeteoraError);
  const searchQuery = useSelector(selectMeteoraSearchQuery);

  const handleSearchChange = (value: string) => {
    dispatch(setSearchQuery(value));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search token pairs (SOL-USDC, BTC-ETH, etc.)"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 h-9 text-sm"
          />
        </div>
      </div>

      {/* Group List Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading token groups...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4">
            <Card className="p-4 border-destructive/50 bg-destructive/5">
              <div className="flex items-center space-x-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Error loading groups</span>
              </div>
              <p className="text-xs text-destructive/80 mt-1">{error}</p>
            </Card>
          </div>
        )}

        {!loading && !error && groups.length === 0 && (
          <div className="flex items-center justify-center p-8">
            <div className="text-center text-muted-foreground">
              <div className="text-2xl mb-2">🔍</div>
              <p className="text-sm">No token pairs found</p>
              <p className="text-xs">Try adjusting your search</p>
            </div>
          </div>
        )}

        {!loading && !error && groups.length > 0 && (
          <div className="p-2 space-y-1">
            {groups.map((group) => (
              <GroupStrip key={group.name} group={group} />
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {!loading && !error && groups.length > 0 && (
        <div className="p-2 border-t bg-muted/5">
          <p className="text-xs text-muted-foreground text-center">
            {groups.length} token pair{groups.length !== 1 ? 's' : ''} available
          </p>
        </div>
      )}
    </div>
  );
}