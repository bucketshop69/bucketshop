# Current Sprint: Market Discovery & Trading Interface

**Status**: 🚀 FEATURE SPRINT - Enhanced Market Navigation & Trading UX
**Current Story**: Transform 30% right panel into intuitive market discovery and trading interface
**Active Branch**: `feature/market-discovery-interface`

## UI/UX Strategy & Task Breakdown:
- [x] Task 1: Create Tab Navigation Foundation (Frontend Specialist) **← COMPLETED**
  - **Branch**: `feature/market-discovery-interface`
  - ✅ Tab navigation component in `components/core/TabNavigation.tsx`
  - ✅ Integration with main page layout
  - ✅ Markets/Trade tab structure
- [x] Task 2: Convert Market Dropdown to Market List (Frontend Specialist) **← COMPLETED**
  - **Branch**: `feature/market-discovery-interface`
  - ✅ Create MarketList component from existing MarketDropdown
  - ✅ Convert dropdown UI to scrollable list format
  - ✅ Integrate with existing market store and selection logic
  - ✅ Size appropriately for 30% panel constraints
- [x] Task 3: Implement Tab Content Management (State Management Specialist) **← COMPLETED**
  - **Branch**: `feature/market-discovery-interface`
  - ✅ Show MarketList when Markets tab is active
  - ✅ Show existing trading components when Trade tab is active
  - ✅ State synchronization between tabs and chart area
- [ ] Task 4: Backend Market Data Service (Backend Specialist) **← CURRENT**
  - **Branch**: `feature/market-discovery-interface`
  - [ ] Task 4.1: Redis Infrastructure Setup
    - Install @upstash/redis package
    - Create Redis client configuration (`lib/redis.ts`)
    - Set up Redis key naming conventions
    - Add environment variables for Upstash connection
  - [ ] Task 4.2: Drift API Integration Service
    - Create Drift API service (`lib/drift/api-service.ts`)
    - Implement volume data fetching from `/stats/markets/volume/24h`
    - Implement open interest data fetching from `/amm/openInterest`
    - Add error handling and retry logic for API calls
  - [ ] Task 4.3: Background Data Update Job
    - Create cron API route (`/api/drift/cron/update-markets`)
    - Implement market data aggregation logic
    - Add Redis pipeline operations for efficient bulk updates
    - Include proper logging and error reporting
  - [ ] Task 4.4: Client API Endpoint
    - Create client API route (`/api/drift/markets`)
    - Implement Redis data retrieval with proper formatting
    - Add response caching and error handling
    - Include market data validation and fallbacks
  - [ ] Task 4.5: Vercel Cron Configuration
    - Set up `vercel.json` cron configuration for 60-second intervals
    - Add authentication for cron endpoint security
    - Test cron job execution and monitoring
- [ ] Task 5: Enhanced Market Table UI (UI/UX Specialist)
  - **Branch**: `feature/market-discovery-interface`
  - Convert MarketList from simple list to data table format
  - Add columns: Symbol, Price, 24h Change, Volume, Open Interest
  - Integrate with new backend API for real-time market data
  - Loading states and error handling for market data
  - Responsive table design for 30% panel constraints
- [ ] Task 6: Market Data Integration & Polish (Full-stack Integration)
  - **Branch**: `feature/market-discovery-interface`
  - Connect MarketList component to new `/api/drift/markets` endpoint
  - Implement SWR for efficient data fetching and caching
  - Add auto-refresh every 60 seconds to sync with backend updates
  - Visual polish: selection states, hover effects, sorting capabilities
  - Error boundaries and fallback states for API failures

## Backend Architecture & Implementation:
**Primary Stack**:
- **Upstash Redis**: Serverless Redis for market data caching
- **Vercel Cron**: Background jobs for Drift API polling
- **Next.js API Routes**: RESTful endpoints for client data access

**Data Flow Strategy**:
- **Drift API**: External data source (volume, price, OI)
- **Background Service**: 60-second polling → Redis cache updates
- **Client API**: Fast Redis reads via `/api/drift/markets`
- **Frontend**: SWR for caching and auto-refresh

## Frontend Data Integration:
**Primary Stack**:
- **SWR**: Data fetching, caching, and revalidation
- **Market Table**: Responsive design for Symbol|Price|24h%|Volume|OI
- **Real-time UX**: 60-second auto-refresh with loading states

**Integration Strategy**:
- **API Integration**: Replace mock data with real `/api/drift/markets` calls
- **Table Components**: Convert list format to tabular market data display
- **State Management**: Maintain market selection across data refreshes

## Success Criteria:
- [x] **Functional Market List** - Users can browse and select markets from scrollable list
- [x] **Seamless Chart Integration** - Market selection updates chart area automatically
- [x] **Clean Tab Interface** - Smooth switching between Markets and Trade tabs
- [ ] **Real-time Market Data** - Live price, volume, and OI data from Drift API
- [ ] **Professional Table UI** - Sortable columns with proper data formatting
- [ ] **Robust Data Pipeline** - Backend service with error handling and fallbacks
- [ ] **Learning Goal** - Full-stack data architecture with Redis caching patterns

## Next Session Instructions:
**Role to assume**: Backend Specialist for market data infrastructure
**Task**: Set up Upstash Redis + Vercel Cron + API routes for market data pipeline
**Learning goal**: Serverless backend patterns, caching strategies, and API design