'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { setLoading, setGroups, setError } from '@/store/slices/meteoraSlice';
import { getAvailableGroups } from '@/lib/services/meteora';
import { GroupStripList } from './GroupStripList';

/**
 * Meteora Main Layout Component
 * 
 * This component serves as the main container for Meteora functionality:
 * - Loads pool data on mount using the service layer
 * - Manages loading/error states through Redux
 * - Renders the pool discovery interface
 * 
 * Architecture:
 * - Uses RTK for state management (no RTK Query)
 * - Integrates with existing Meteora service
 * - Designed for 25% panel constraints
 */
export function MeteoraMainLayout() {
  const dispatch = useDispatch<AppDispatch>();

  // Load groups on component mount
  useEffect(() => {
    const loadGroups = async () => {
      try {
        dispatch(setLoading(true));
        const groups = await getAvailableGroups();
        dispatch(setGroups(groups));
      } catch (error: any) {
        dispatch(setError(error.message || 'Failed to load token groups'));
      }
    };

    loadGroups();
  }, [dispatch]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-muted/10">
        <div className="flex items-center space-x-2 mb-2">
          <div className="text-xl">☄️</div>
          <h2 className="font-semibold">Meteora DLMM</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Select token pair, then choose specific pool
        </p>
      </div>

      {/* Group Discovery Area */}
      <div className="flex-1 overflow-hidden">
        <GroupStripList />
      </div>
    </div>
  );
}