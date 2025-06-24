import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit"

// Import the interfaces from the service
import { MeteoraPoolInfo, MeteoraTokenGroup } from '@/lib/services/meteora';

// View state for the UI
type MeteoraView = 'pool-selection' | 'pool-detail';

interface MeteoraState {
    // Normalized entities
    groups: {
        ids: string[];
        entities: Record<string, MeteoraTokenGroup>;
    };
    pools: {
        ids: string[];
        entities: Record<string, MeteoraPoolInfo>;
    };
    
    // UI state
    expandedGroups: string[];
    selectedPoolId: string | null;
    loading: boolean;
    error: string | null;
    searchQuery: string;
    
    // View management
    currentView: MeteoraView;
}


const initialState: MeteoraState = {
    groups: {
        ids: [],
        entities: {}
    },
    pools: {
        ids: [],
        entities: {}
    },
    expandedGroups: [],
    selectedPoolId: null,
    loading: false,
    error: null,
    searchQuery: '',
    
    // View management
    currentView: 'pool-selection'
}

const meteoraSlice = createSlice({
    name: "meteora",
    initialState,
    reducers: {
        // Set loading state
        setLoading(state, action: PayloadAction<boolean>) {
            state.loading = action.payload;
            if (state.loading) {
                state.error = null;
            }
        },
        
        // Set error state
        setError(state, action: PayloadAction<string>) {
            state.error = action.payload;
            state.loading = false;
        },
        
        
        // Select a specific pool by ID
        selectPool(state, action: PayloadAction<string>) {
            state.selectedPoolId = action.payload;
        },
        
        // Clear selected pool
        clearSelectedPool(state) {
            state.selectedPoolId = null;
        },
        
        // Set search query
        setSearchQuery(state, action: PayloadAction<string>) {
            state.searchQuery = action.payload;
        },
        
        // Set groups data (normalized)
        setGroups(state, action: PayloadAction<MeteoraTokenGroup[]>) {
            // Clear existing data
            state.groups.ids = [];
            state.groups.entities = {};
            state.pools.ids = [];
            state.pools.entities = {};
            
            // Normalize groups and pools
            action.payload.forEach(group => {
                // Add group
                state.groups.ids.push(group.name);
                state.groups.entities[group.name] = group;
                
                // Add pools from this group
                group.pairs.forEach(pool => {
                    if (!state.pools.entities[pool.address]) {
                        state.pools.ids.push(pool.address);
                        state.pools.entities[pool.address] = pool;
                    }
                });
            });
            
            state.loading = false;
            state.error = null;
        },
        
        // Toggle group expansion
        toggleGroupExpansion(state, action: PayloadAction<string>) {
            const groupName = action.payload;
            const currentIndex = state.expandedGroups.indexOf(groupName);
            
            if (currentIndex > -1) {
                // Group is expanded, remove it
                state.expandedGroups.splice(currentIndex, 1);
            } else {
                // Group is collapsed, add it
                state.expandedGroups.push(groupName);
            }
        },
        
        // View management actions
        showPoolDetail(state, action: PayloadAction<string>) {
            state.selectedPoolId = action.payload;
            state.currentView = 'pool-detail';
        },
        
        showPoolSelection(state) {
            state.currentView = 'pool-selection';
            state.selectedPoolId = null;
        },
        
        setCurrentView(state, action: PayloadAction<MeteoraView>) {
            state.currentView = action.payload;
        }
    }
});

// Export actions
export const {
    setLoading,
    setError,
    selectPool,
    clearSelectedPool,
    setSearchQuery,
    setGroups,
    toggleGroupExpansion,
    showPoolDetail,
    showPoolSelection,
    setCurrentView
} = meteoraSlice.actions;

// Selectors - Normalized Pattern

// Base entity selectors
export const selectGroupIds = (state: { meteora: MeteoraState }) => 
    state.meteora.groups.ids;

export const selectGroupEntities = (state: { meteora: MeteoraState }) => 
    state.meteora.groups.entities;

export const selectPoolIds = (state: { meteora: MeteoraState }) => 
    state.meteora.pools.ids;

export const selectPoolEntities = (state: { meteora: MeteoraState }) => 
    state.meteora.pools.entities;

// Denormalized selectors
export const selectAllGroups = (state: { meteora: MeteoraState }) => 
    state.meteora.groups.ids.map(id => state.meteora.groups.entities[id]);

export const selectAllPools = (state: { meteora: MeteoraState }) => 
    state.meteora.pools.ids.map(id => state.meteora.pools.entities[id]);

export const selectGroupById = (state: { meteora: MeteoraState }, groupId: string) => 
    state.meteora.groups.entities[groupId];

export const selectPoolById = (state: { meteora: MeteoraState }, poolId: string) => 
    state.meteora.pools.entities[poolId];

// UI state selectors
export const selectMeteoraSelectedPool = (state: { meteora: MeteoraState }) => 
    state.meteora.selectedPoolId ? state.meteora.pools.entities[state.meteora.selectedPoolId] : null;

export const selectMeteoraLoading = (state: { meteora: MeteoraState }) => 
    state.meteora.loading;

export const selectMeteoraError = (state: { meteora: MeteoraState }) => 
    state.meteora.error;

export const selectMeteoraSearchQuery = (state: { meteora: MeteoraState }) => 
    state.meteora.searchQuery;

export const selectExpandedGroups = (state: { meteora: MeteoraState }) => 
    state.meteora.expandedGroups;

export const isGroupExpanded = createSelector(
    [
        (state: { meteora: MeteoraState }) => state.meteora.expandedGroups,
        (_state: { meteora: MeteoraState }, groupName: string) => groupName
    ],
    (expandedGroups, groupName) => expandedGroups.includes(groupName)
);

// View management selectors
export const selectCurrentView = (state: { meteora: MeteoraState }) => 
    state.meteora.currentView;

// Memoized filtered groups based on search query
export const selectFilteredGroups = createSelector(
    [selectAllGroups, selectMeteoraSearchQuery],
    (groups, searchQuery) => {
        if (!searchQuery) return groups;
        
        const query = searchQuery.toLowerCase();
        return groups.filter(group => 
            group.name.toLowerCase().includes(query)
        );
    }
);


// Export reducer
export default meteoraSlice.reducer;