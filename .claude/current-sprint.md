# Current Sprint: Watchlist CRUD & Search

**Status**: ✅ SPRINT COMPLETE - MVP WATCHLIST FUNCTIONALITY WORKING
**Current Story**: All core watchlist functionality implemented and debugged

## Task Breakdown & Status:
- [x] Task 1: Database Schema & Models (Backend Developer) **COMPLETE**
  - ✅ Three-table architecture: tokens, token_pools, user_watchlist
  - ✅ TokenService for global token registry
  - ✅ WatchlistService for user preferences  
  - ✅ Clean type separation (token.ts, watchlist.ts)
- [x] Task 2: Jupiter API Integration (API Developer) **COMPLETE**
  - ✅ Token metadata fetching with smart caching
  - ✅ Pool discovery and data parsing
  - ✅ OHLC chart data integration
  - ✅ RSI calculation with your provided function
  - ✅ Bulk market data operations for watchlist
- [x] Task 3: RTK Query Setup (Full-stack Developer) **COMPLETE**
  - ✅ Base API slice with intelligent caching
  - ✅ Comprehensive watchlist API endpoints
  - ✅ Redux store with proper middleware
  - ✅ TypeScript integration with typed hooks
  - ✅ API routes bridging frontend to backend services
- [x] Task 4: Basic UI Layout (Frontend Developer) **COMPLETE**
  - ✅ 75/25 split layout (charts left, DApps right)
  - ✅ NavBar with centered search input
  - ✅ DApp panel with tab system
  - ✅ WatchlistView using RTK Query
- [x] Task 5: Token Search & CRUD (Frontend Developer) **COMPLETE**
  - ✅ TokenSearch component with dropdown results
  - ✅ Add token to watchlist functionality (with reactivation)
  - ✅ Remove from watchlist functionality (soft delete)
  - ✅ Enhanced TokenCard with price/RSI display
  - ✅ Click navigation from watchlist to token details
  - ✅ All CRUD bugs fixed with manual refetch approach

## Critical Bug Fixes Completed:
- ✅ **Remove API Parameter Fix**: Added walletAddress to DELETE requests
- ✅ **Cache Invalidation Issues**: Disabled RTK Query caching entirely
- ✅ **Reactivation Logic**: Proper handling of soft-deleted tokens
- ✅ **UI State Updates**: Manual refetch ensures immediate UI refresh
- ✅ **Navigation**: Clickable watchlist items navigate to token details

## Development Approach
**Collaboration Model**: Manager-Developer with specialized agents
- **User**: Experienced frontend developer learning full-stack
- **Claude**: Project Manager + Specialist Developers
- **Learning Focus**: Database design ✅, crypto APIs ✅, RTK Query ✅, CRUD operations

## MVP READY FOR NEXT SPRINT
**Current Status**: All core watchlist CRUD functionality complete and working
**Ready for**: Real-time data integration, advanced UI features, or trading integration
**Architecture**: Solid foundation with RTK Query, SQLite, and Jupiter API integration

## MOVED TO FUTURE SPRINTS
**Real-time Data Sprint** (separate sprint):
- WebSocket/polling for live price updates
- Background RSI recalculation
- Helius WebSocket integration
- Pool account data parsing for different DEX programs (Orca, Meteora, Raydium)

## Completed Architecture
**Full-Stack Foundation**:
- ✅ Database Layer: SQLite with tokens, token_pools, user_watchlist tables
- ✅ Service Layer: TokenService, WatchlistService with Jupiter API integration
- ✅ API Routes: RESTful endpoints for all CRUD operations
- ✅ RTK Query: Complete state management with caching and optimistic updates
- ✅ UI Layout: 75/25 split with NavBar, DApp tabs, and responsive design

**Current Tech Stack**:
- **Backend**: Node.js + SQLite + Jupiter API
- **State Management**: RTK Query + Redux Toolkit
- **Frontend**: Next.js 15 + React 19 + TypeScript
- **UI**: Tailwind CSS + shadcn/ui components
- **Architecture**: API Routes bridging RTK Query to backend services

## Available RTK Query Hooks (Ready to Use):
```typescript
// Query hooks (data fetching)
useGetUserWatchlistQuery(walletAddress)      // Get user's watchlist
useSearchTokensQuery({ query, limit })       // Search for tokens
useGetTokenWithMarketDataQuery(address)      // Get token + price + RSI
useGetBulkMarketDataQuery(addresses)         // Bulk watchlist data

// Mutation hooks (data modification)
useAddTokenToWatchlistMutation()             // Add token to watchlist
useRemoveFromWatchlistMutation()             // Remove from watchlist
useUpdateWatchlistItemMutation()             // Update notes/status

// Manual trigger hooks
useLazySearchTokensQuery()                   // Search on demand
```

## Next Implementation Focus:
**Token Search Component**: Connect NavBar search to `useSearchTokensQuery()`
**Add/Remove Operations**: Use mutation hooks with optimistic updates
**Enhanced Token Cards**: Display price, RSI, and interactive buttons