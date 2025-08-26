# BucketShop App - Project Context

## Vision
Unified crypto trading dashboard consolidating multiple Solana DApps:
- **Drift** (perpetuals) - *Currently Active*
- Jupiter (swaps) - *Planned*
- Meteora/Raydium (liquidity pools) - *Planned*
- Kamino (lending/vaults) - *Future*
- Portfolio tracking with live prices and analytics

## Target Users
Crypto traders wanting single interface for:
- Multi-DApp trading execution
- Real-time market analysis
- Asset discovery and management

## Current Development Status
**Active DApp**: Drift Protocol integration with perpetual futures trading
**MVP Scope**: Complete Drift trading interface with real-time market data pipeline

## UI Layout & UX Philosophy

### **Core Layout Principle: Context-Preserving Trading**
- **70% Chart Area**: Primary focus where users spend most time analyzing
- **30% Action Panel**: DApp-specific trading and discovery interfaces
- **No Context Switching**: Execute trades/actions while keeping charts in view

### **Design Challenge: Actionable 30% Panel**
All DApp functionality must work efficiently in dedicated action space:
- **Drift Perps**: Market discovery + trading panel (amount, leverage, direction)
- **Meteora Positions**: Pool selection + liquidity provision interface  
- **Jupiter Swaps**: Token discovery + swap interface
- **Portfolio Management**: Cross-DApp position tracking

### **Navigation Strategy: DApp-Centric Routing**
- **URL Pattern**: `/dapp-name/feature/[asset]` for deep linking
- **Chart Integration**: Chart data changes based on selected DApp and asset
- **Action Panel**: Content driven by current route and DApp context

### **Example Flow - Drift:**
1. **Route**: `/drift/markets` → Market discovery view
2. **Selection**: Choose BTC-PERP → Navigate to `/drift/markets/btc-perp`
3. **Chart Updates**: Shows BTC-PERP price data and technical indicators
4. **Action Panel**: Trading interface with order forms and position management

### **Example Flow - Meteora:**
1. **Route**: `/meteora/pools` → Pool discovery view
2. **Selection**: Choose SOL-USDC pool → Navigate to `/meteora/pools/[pool-id]`
3. **Chart Updates**: Shows pool performance metrics and volume data
4. **Action Panel**: Liquidity provision interface with strategy selection

## Technical Stack
- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + Lucide React icons
- **State Management**: Zustand (global + DApp-specific stores)
- **Data Fetching**: SWR for real-time updates
- **Backend**: Upstash Redis for serverless caching
- **External APIs**: 
  - Drift Protocol APIs for perpetual futures data
  - Helius API for Solana blockchain data
  - GitHub Actions for background data updates

## Architecture Approach
- **DApp-Centric**: Feature-based modules for each protocol integration
- **URL-Driven State**: Routes control chart data and action panel content
- **Shared Resources**: Universal chart component and utilities across DApps
- **Scalable Structure**: Easy addition of new DApps (Jupiter, Meteora, Kamino)