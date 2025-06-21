# BucketShop App - Project Context

## Vision
Unified crypto trading dashboard consolidating multiple Solana DApps:
- Jupiter (swaps)
- Drift (perps) 
- Meteora/Raydium (liquidity pools)
- Portfolio tracking with live prices and RSI

## Target Users
Crypto traders wanting single interface for:
- Investment tracking
- Trade execution  
- Token analysis

## MVP Scope
Watchlist feature with real-time Solana token prices and RSI calculations

## UI Layout & UX Philosophy

### **Core Layout Principle: Context-Preserving Trading**
- **75% Chart Area**: Primary focus where users spend most time analyzing
- **25% Action Panel**: Quick, actionable tasks without losing chart context
- **No Context Switching**: Execute trades/actions while keeping charts in view

### **Design Challenge: Actionable 25% Panel**
All DApp functionality must work efficiently in constrained space:
- **Drift Perps**: Simple form (amount, leverage, direction) → execute
- **Meteora Positions**: Pool selection + range inputs → create position  
- **Jupiter Swaps**: Token pair + amount → swap
- **Watchlist Management**: Search, add, monitor tokens

### **Navigation Strategy: Hybrid Panel + Routes**
- **Quick Actions**: Discovery and simple tasks in 25% panel
- **Complex Forms**: Full-screen routes when detailed input needed
- **Deep Linking**: Bookmarkable URLs for specific pools/tokens

### **Example Flow - Meteora:**
1. **25% Panel**: Browse/search pools while viewing charts
2. **Route Navigation**: Select pool → `/meteora/[poolAddress]` for position creation
3. **Context Return**: Complete action → return to chart analysis

## Technical Stack
- Next.js 15 + React 19 + TypeScript
- SQLite + better-sqlite3
- Tailwind CSS + shadcn/ui
- Helius API for Solana data