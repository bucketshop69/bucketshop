# Current Sprint: Drift Perps Trading Integration

**Status**: =Ä IMPLEMENTATION - Building Drift perpetual trading functionality for 30% panel
**Current Story**: Implement complete Drift perps trading system with wallet integration and real-time position management
**Active Branch**: `feature/drift-perps-trading`

## Trading Integration & Task Breakdown:
- [ ] Task 1: Client-side Drift Integration (Backend Developer) **ê CURRENT**
  - **Branch**: `feature/drift-client-integration`
  - Set up client-side Drift SDK with wallet connection
  - Create DriftTradingService for client operations
  - Implement user account management and initialization
- [ ] Task 2: Wallet Integration Setup (Full-stack Developer)
  - **Branch**: `feature/solana-wallet-adapter`
  - Install and configure @solana/wallet-adapter packages
  - Set up wallet context and connection management
  - Add wallet connect/disconnect UI components
- [ ] Task 3: Trading UI Components (Frontend Developer)
  - **Branch**: `feature/trading-panel-ui`
  - Market selector dropdown (using existing DriftService)
  - Trading form with amount input and leverage slider
  - Long/Short position buttons with visual feedback
- [ ] Task 4: Position Management (Trading Systems Developer)
  - **Branch**: `feature/position-tracking`
  - Real-time position display with PnL calculations
  - Margin and account balance monitoring
  - Position history and transaction log
- [ ] Task 5: Order Execution System (Trading Backend Developer)
  - **Branch**: `feature/order-execution`
  - Market order placement with size validation
  - Limit order functionality and management
  - Transaction confirmation and error handling

## Trading System Priorities (High to Low):
1. **Critical Wallet Integration** - User must connect wallet to trade
2. **Important Order Execution** - Core trading functionality with market orders
3. **Nice-to-have Real-time Updates** - Live position and PnL updates

## Drift Trading Tools & Framework:
**Primary Stack**:
- **@drift-labs/sdk**: Client-side trading operations and account management
- **@solana/wallet-adapter**: Wallet connection and transaction signing
- **@solana/web3.js**: Solana blockchain interactions

**Integration Strategy**:
- **Server-side DriftService**: Static market data and configuration (existing)
- **Client-side DriftTradingService**: Wallet-connected trading operations (new)
- **Real-time Data**: WebSocket connections for position updates

## Success Criteria:
- [ ] **Functional Trading Interface** - Users can place market orders through 30% panel
- [ ] **Wallet Integration Complete** - Seamless wallet connection with popular Solana wallets
- [ ] **Position Tracking Active** - Real-time display of positions, PnL, and account status
- [ ] **Learning Goal Achieved** - Co-developer understands Drift SDK integration patterns

## Next Session Instructions:
**Role to assume**: Backend Developer specializing in Drift Protocol integration
**Task**: Set up client-side DriftTradingService with wallet connection capabilities
**Learning goal**: Understand difference between server-side market data and client-side trading operations