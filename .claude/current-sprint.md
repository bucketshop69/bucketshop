# Current Sprint: Watchlist Module

**Status**: Backend & API Integration Complete - Moving to Frontend
**Current Story**: Build MVP watchlist with token search, price tracking, and RSI calculation

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
- [ ] Task 3: Basic React Components (Frontend Developer) **← NEXT**
  - Token search component
  - Watchlist display component with live prices & RSI
- [ ] Task 4: Layout Structure (Frontend Developer)
  - 75% left sidebar for watchlist
  - 25% right panel for trading interface
- [ ] Task 5: Real-time Updates (Full-stack Developer)
  - WebSocket/polling for live price updates
  - Background RSI recalculation
- [ ] Task 6: Helius WebSocket Integration (Advanced)
  - Pool account data parsing for custom price engine

## Development Approach
**Collaboration Model**: Manager-Developer with specialized agents
- **User**: Experienced frontend developer learning full-stack
- **Claude**: Project Manager + Specialist Developers
- **Learning Focus**: Database design ✅, crypto APIs, real-time data

## Next Session Instructions
**Role to assume**: Frontend Developer
**Task**: Build React components for token search and watchlist display
**Learning goal**: Show user how backend services integrate with React components

## Completed Architecture
**Database Layer**: 
- Global token registry with shared caching
- User watchlist with token relationships
- Pool references for price calculation

**Service Layer**:
- `TokenService` - Global token operations, Jupiter API, OHLC data, RSI calculations
- `WatchlistService` - User watchlist management
- `JupiterClient` - API integration with caching and error handling
- `RSI Utils` - Technical analysis calculations

**API Integration**:
- ✅ Jupiter token metadata and pool discovery
- ✅ OHLC chart data for price history
- ✅ RSI calculation system
- ✅ Bulk market data operations

## Ready for Frontend Development
**Available Backend Methods:**
```typescript
// Token operations
TokenService.getTokenWithMarketData(address) // Token + price + RSI
TokenService.getBulkMarketData(addresses)    // Bulk watchlist data

// Watchlist operations  
WatchlistService.addTokenToWatchlist(input)
WatchlistService.getUserWatchlist()

// Price & Technical Analysis
TokenService.getCurrentPrice(address)
TokenService.getCurrentRSI(address)
TokenService.getTokenOHLCVData(address)
```