# Current Sprint: Real-Time Price Fetching

**Status**: 🔄 REAL-TIME DATA SPRINT - Live Token Price Calculations via Pool Reserves
**Current Story**: Implement real-time price fetching using Helius WebSockets and pool account changes to calculate token prices from DEX reserves
**Active Branch**: `feature/real-time-price-fetching`

## Price Calculation Strategy & Task Breakdown:
- [ ] Task 2: Pool Account Data Parser (DeFi Backend Specialist) **← CURRENT**
  - **Branch**: `feature/pool-account-parser`
  - Research and understand Raydium/Meteora pool account data structures
  - Parse reserve data from raw account bytes
  - Identify pool addresses for watchlist tokens
  - Create pool data extraction utilities
- [ ] Task 3: Price Calculation Engine (Math/DeFi Specialist)
  - **Branch**: `feature/price-calculation-engine`
  - Implement reserve ratio to token price algorithms
  - USD conversion strategies (USDC pairs, SOL conversion)
  - Price impact and slippage calculations
  - Historical price tracking for RSI calculations
- [ ] Task 5: Frontend Integration (Full-stack Developer)
  - **Branch**: `feature/price-display-integration`
  - Display live prices in watchlist components
  - Price change indicators (+/- % with colors)
  - Update existing UI components with real-time data
  - Loading states and price update animations
- [ ] Task 1: Helius WebSocket Foundation (Infrastructure Specialist)
  - **Branch**: `feature/helius-websocket-service`
  - WebSocket service for pool account monitoring
  - Account change subscription management
  - Real-time data pipeline from Helius to frontend
  - Connection management and reconnection logic
- [ ] Task 6: Error Handling & Fallbacks (Reliability Engineer)
  - **Branch**: `feature/price-error-handling`
  - WebSocket reconnection and failure recovery
  - Fallback to HTTP polling when WebSocket fails
  - Data validation and stale price detection
  - Error states in UI components

## DeFi Integration Priorities (High to Low):
1. **Pool Data Parsing** - Foundation for all price calculations
2. **Price Calculation Logic** - Core mathematical operations
3. **User-facing Price Display** - Immediate value demonstration
4. **Real-time Infrastructure** - WebSocket complexity layer
5. **Production Reliability** - Error handling and fallbacks

## Real-Time Data Tools & Framework:
**Primary Stack**:
- **Helius WebSocket API**: Account change subscriptions for pool monitoring
- **Pool Account Parsing**: Direct bytecode interpretation for reserve data
- **Price Calculation**: Mathematical algorithms for DEX price discovery

**Integration Strategy**:
- **Raydium Pools**: Primary DEX for token price discovery
- **Meteora Pools**: Secondary pool source for price validation
- **USDC Reference**: Base currency pair for USD price conversion
- **SOL Conversion**: Alternative USD pricing through SOL/USDC rates

## Pool Architecture Understanding:
**Raydium Pool Structure**:
- Account data contains token A/B reserve amounts
- Reserve ratios determine current exchange rates
- Pool fees and slippage calculations

**Price Calculation Method**:
```
Token Price = (Reserve B / Reserve A) * Reference Price
USD Price = Token Price * USDC Rate (or SOL Rate * SOL/USD)
```

## Success Criteria:
- [ ] **Pool Data Parsing** - Successfully extract reserve data from pool accounts
- [ ] **Price Calculation Accuracy** - Prices match Jupiter/DEX rates within 1%
- [ ] **Real-time Updates** - Live price updates in watchlist under 2 seconds
- [ ] **USD Conversion** - Accurate USD pricing via USDC/SOL reference pairs
- [ ] **Error Resilience** - Graceful handling of WebSocket failures
- [ ] **Learning Complete** - Deep understanding of DEX mechanics and real-time data architecture

## Next Session Instructions:
**Role to assume**: DeFi Backend Specialist
**Task**: Research and implement pool account data parsing for Raydium/Meteora
**Learning goal**: Understand Solana account structure, DEX pool mechanics, and bytecode parsing techniques

## Technical Architecture Notes:
**Data Flow**: Helius WebSocket → Pool Account Changes → Reserve Parsing → Price Calculation → Frontend Updates
**Fallback Strategy**: WebSocket failure → HTTP polling → Cached prices → Error states
**Performance**: Throttled updates, efficient parsing, minimal re-renders
**Scalability**: Multiple pool monitoring, batch updates, connection pooling