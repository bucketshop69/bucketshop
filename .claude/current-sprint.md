# Current Sprint: Drift Perps Trading Integration

**Status**: 🚀 IMPLEMENTATION - Building Drift perpetual trading functionality for 30% panel
**Current Story**: Implement complete Drift perps trading system with wallet integration and account setup
**Active Branch**: `feature/drift-perps-trading`

## Trading Integration & Task Breakdown:
- [x] Task 1: Client-side Drift Integration (Backend Developer) **✅ COMPLETED**
  - **Branch**: `feature/drift-client-integration`
  - Set up client-side Drift SDK with wallet connection
  - Create DriftTradingService for client operations
  - Basic account detection functionality
- [x] Task 2: Wallet Integration Setup (Full-stack Developer) **✅ COMPLETED**
  - **Branch**: `feature/privy-wallet-integration`
  - Install and configure Privy for Solana wallet connection
  - Set up wallet context and connection management
  - Add wallet connect/disconnect UI with dropdown
- [x] Task 3: Trading UI Components (Frontend Developer) **✅ COMPLETED**
  - **Branch**: `feature/trading-panel-ui`
  - Trading form with position size input and leverage slider
  - Long/Short position buttons with proper styling
  - Market display showing selected trading pair
- [x] Task 4: Account Setup & Initialization (DeFi Integration Developer) **✅ COMPLETED**
  - **Branch**: `feature/drift-account-setup`
  - Check if connected wallet has existing Drift account
  - Create Drift account for new users via API routes
  - Hybrid transaction flow: server creates unsigned tx, client signs & submits
  - Show account status in trading UI with modal popup
- [ ] Task 5: Order Execution System (Trading Backend Developer) **← CURRENT**
  - **Branch**: `feature/order-execution`
  - Connect trading buttons to actual order placement
  - Market order execution with size validation
  - Transaction confirmation and error handling
  - User feedback for successful/failed trades

## Trading System Priorities (High to Low):
1. **Critical Account Setup** - User must have Drift account before trading
2. **Important Order Execution** - Core trading functionality with market orders
3. **Nice-to-have Error Handling** - Robust error handling and user feedback

## Drift Trading Tools & Framework:
**Primary Stack**:
- **@drift-labs/sdk**: Client-side trading operations and account management
- **@privy-io/react-auth**: Wallet connection and transaction signing
- **@solana/web3.js**: Solana blockchain interactions

**Integration Strategy**:
- **Server-side DriftService**: Static market data and configuration (existing)
- **Client-side DriftTradingService**: Wallet-connected trading operations (existing)
- **Account Management**: Check/create/initialize Drift accounts

## Success Criteria:
- [x] **Functional Trading Interface** - Users can interact with trading form ✅
- [x] **Wallet Integration Complete** - Seamless wallet connection with Privy ✅
- [x] **Account Setup Working** - Users can create and initialize Drift accounts ✅
- [ ] **Order Execution Live** - Users can place actual market orders
- [ ] **Learning Goal Achieved** - Co-developer understands Drift account setup and trading flow

## Next Session Instructions:
**Role to assume**: DeFi Integration Developer specializing in account setup
**Task**: Implement Drift account detection, creation, and initialization flow
**Learning goal**: Understand Drift account lifecycle and user onboarding process