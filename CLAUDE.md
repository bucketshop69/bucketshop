# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack (available at http://localhost:3000)
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

## Architecture Overview

This is a Next.js 15 application using the App Router with TypeScript and Tailwind CSS.

### Key Technologies
- **Next.js 15** with App Router and React 19
- **TypeScript** with strict configuration
- **Tailwind CSS v4** for styling
- **Lucide React** for icons
- **Upstash Redis** for serverless market data caching
- **SWR** for data fetching and real-time updates
- **Zustand** for state management (global + DApp-specific stores)

### Project Structure (DApp-Centric Architecture)
- `src/app/` - Next.js App Router with DApp-specific routing
  - `src/app/(dapps)/` - Route group for DApp-specific pages
    - `drift/markets/` → `/drift/markets` (market discovery)
    - `drift/markets/[symbol]/` → `/drift/markets/btc-usd` (trading)
    - `jupiter/markets/` → Jupiter market discovery
    - `meteora/pools/` → Pool discovery and liquidity provision
- `src/features/` - DApp-specific feature modules
  - `src/features/drift/` - Drift Protocol complete implementation
    - `components/` - Drift UI components (MarketList, TradingPanel, OrderForm)
    - `services/` - Drift business logic and API integration
    - `hooks/` - Drift-specific React hooks
    - `store/` - Drift Zustand stores (markets, orders, trading)
    - `types.ts` - Drift type definitions
  - `src/features/jupiter/` - Jupiter DEX integration
  - `src/features/meteora/` - Meteora DLMM integration
- `src/shared/` - Cross-DApp shared resources
  - `components/Chart/` - Universal chart component for all DApps
  - `components/ui/` - Basic UI components (buttons, inputs)
  - `components/layout/` - Common layouts and navigation
  - `services/` - Shared services (Redis, wallet, theme)
  - `hooks/` - Common React hooks
  - `store/` - Global Zustand stores (wallet, chart, navigation, ui)
- `src/lib/` - Configuration and setup utilities

### Path Aliases
- `@/*` maps to `./src/*`
- Configured in both tsconfig.json and components.json

## DApp-Centric Architecture

### Core Design Philosophy

**Layout Pattern**: 70% Chart Area + 30% Action Panel
- **Chart Area**: Universal analytics/price data for selected asset
- **Action Panel**: DApp-specific discovery and trading interfaces
- **URL-Driven State**: Routes determine chart data and action panel content

### URL Structure & Navigation

**Pattern**: `/dapp-name/feature/[asset]`

```
/drift/markets              → Drift market discovery
/drift/markets/btc-usd      → BTC-USD trading on Drift
/jupiter/markets            → Jupiter token discovery  
/jupiter/markets/sol-usdc   → SOL→USDC swap interface
/meteora/pools              → Pool discovery
/meteora/pools/[pool-id]    → Liquidity provision interface
/kamino/vaults              → Vault discovery (future)
```

### State Management with Zustand

**Multi-Level State Architecture**:

```typescript
// Global Stores (shared/store/)
├── chartStore          # Chart data, timeframes, selected asset
├── walletStore         # Wallet connection, user authentication  
├── navigationStore     # Current DApp, route context
└── uiStore            # Theme, layout preferences

// DApp-Specific Stores (features/[dapp]/store/)
├── drift/
│   ├── marketsStore    # Drift markets data, selection
│   ├── ordersStore     # Open orders, positions
│   └── tradingStore    # Order form state, trade execution
├── jupiter/
│   ├── routesStore     # Swap routes, price impact
│   └── tokensStore     # Token lists, balances
└── meteora/
    ├── poolsStore      # Pool data, APY, volume
    └── positionsStore  # LP positions, rewards
```

**State Communication Flow**:
1. **URL Change** → `navigationStore` updates current DApp context
2. **Navigation Store** → Triggers chart data update for selected asset  
3. **Chart Store** → Loads appropriate data (price, volume, pool metrics)
4. **DApp Store** → Loads DApp-specific data (markets, pools, routes)

### DApp Integration Pattern

**Each DApp follows standardized structure**:

```
features/[dapp-name]/
├── components/           # DApp-specific UI components
│   ├── MarketList.tsx   # Asset discovery interface
│   ├── TradingPanel.tsx # Action interface (trade/swap/deposit)
│   └── OrderForm.tsx    # Transaction forms
├── services/            # Business logic and API integration
│   ├── api.ts          # External API calls
│   ├── orders.ts       # Transaction management
│   └── utils.ts        # DApp-specific utilities
├── hooks/              # React hooks for DApp functionality
│   ├── useMarkets.ts   # Market data management
│   └── useTrading.ts   # Trading state management
├── store/              # Zustand stores for DApp state
│   ├── markets.store.ts
│   └── trading.store.ts
├── types.ts            # TypeScript definitions
└── server/             # Server-side logic (API routes)
    ├── services/       # Server-side business logic
    └── api-handlers/   # API route handlers
```

### Scalability Benefits

✅ **Clean Separation**: Each DApp is completely self-contained  
✅ **Easy Expansion**: Add new DApps by creating `features/[new-dapp]/`  
✅ **Shared Resources**: Chart component and utilities available to all DApps  
✅ **URL-Friendly**: Deep linking to specific markets/pools/vaults  
✅ **Team-Friendly**: Each developer can own a complete DApp feature  
✅ **Route-Based Loading**: Only load code for active DApp

## Project Memory Structure

For detailed project information, see:
- @.claude/project-context.md - Project vision, goals, and technical stack
- @.claude/current-sprint.md - Active sprint status and next actions

## Session Startup Protocol

**IMPORTANT**: Before starting ANY work, new Claude instances MUST:

1. **Read all memory files** (@.claude/project-context.md and @.claude/current-sprint.md)
2. **Verify git branch** and check if correct branch exists for current task
3. **Confirm understanding** of:
   - Project vision (unified crypto trading dashboard)
   - User's role (experienced frontend dev learning full-stack)
   - Collaboration model (Manager-Developer with teaching focus)
   - Current task and learning objectives
   - Required branch from current-sprint.md
4. **Branch verification protocol**:
   - Check current git branch with `git branch --show-current`
   - Compare with "Active Branch" in current-sprint.md
   - If mismatch: Ask user if they want to switch or create the correct branch
   - If branch doesn't exist: Ask user if they want to create it
5. **Ask clarifying questions** if anything is unclear
6. **Wait for user confirmation** before proceeding with implementation

## Work Classification System

Prefix all work with appropriate tags:

- **[TASK]** - Planned development work from current sprint
- **[BUG]** - Fixing broken functionality
- **[RESEARCH]** - Investigating APIs, tools, or patterns
- **[REFACTOR]** - Improving existing code structure
- **[PLANNING]** - Breaking down new features or modules
- **[LEARNING]** - Teaching/explaining concepts to user

## Teaching Requirements

This is a **collaborative learning project**. When working on any task:

- **Explain the "why"** - Architecture decisions, patterns, best practices
- **Teach concepts** - Backend patterns, crypto APIs, database design
- **Ask for input** - Get user's perspective on design decisions
- **Review together** - Walk through code and explain each part
- **Connect to frontend** - Show how backend connects to frontend concepts

## Communication Rules

**Co-developer Profile**:
- **User**: Experienced frontend developer comfortable with React/TypeScript/UI patterns
- **Claude**: Takes the driving seat on backend/full-stack decisions
- **Approach**: Claude leads implementation without asking for design approval
- **User Focus**: Learning backend concepts through observation and explanation

**Development Flow**:
- **Planning First**: Always explain what you're going to do and how before implementing
- **Wait for Permission**: Get explicit approval from co-dev before making any changes
- **Teaching Focus**: Explain backend concepts, architecture decisions, and reasoning
- **Frontend Connection**: Show how backend connects to frontend patterns user knows
- **Learning Priority**: Co-dev learning takes precedence over speed of implementation

**Mandatory Pre-Implementation Protocol**:
1. **Explain the Plan**: Detail what files you'll create/modify and why
2. **Show the Approach**: Explain the technical approach and patterns you'll use
3. **Teaching Moment**: Connect to concepts the co-dev should understand
4. **Wait for Approval**: Get explicit "go ahead" before making any changes
5. **No Assumptions**: Never assume permission to proceed with implementation

**UI Change Verification Workflow**:
- **No Dev Server Debugging**: Don't start dev servers or try to test UI changes yourself
- **Make Changes First**: Implement the UI changes/components as planned
- **Ask for Verification**: Request user to check if the changes work as expected in their browser
- **Describe Expected Behavior**: Clearly explain what should happen after the change
- **Wait for Confirmation**: Get user feedback before proceeding to next step
- **Example**: "Can you check if the Meteora tab is now enabled and clickable in your browser?"

## GitHub Workflow & Project Management

### Branch Strategy
Create feature branches for focused work that helps Claude understand context:

```bash
# Sprint-based feature branches
git checkout -b feature/unit-testing-setup
git checkout -b feature/service-layer-tests
git checkout -b feature/component-tests
git checkout -b fix/rtk-query-cache-issue
```

**Branch Naming Convention**:
- `feature/` - New functionality or major additions
- `fix/` - Bug fixes and corrections
- `test/` - Adding or updating tests
- `refactor/` - Code improvements without behavior changes
- `docs/` - Documentation updates

### Sprint Creation Guide
**IMPORTANT**: When the co-developer asks you to create a new sprint, use this standardized structure for consistency and discoverability.

Update `.claude/current-sprint.md` with the following template:

```markdown
# Current Sprint: [Sprint Name]

**Status**: [EMOJI] [SPRINT TYPE] - [Brief Description]
**Current Story**: [Main objective/theme of the sprint]
**Active Branch**: `feature/[main-sprint-branch]`

## [Strategy/Domain] & Task Breakdown:
- [ ] Task 1: [Task Name] ([Specialist Role]) **← CURRENT**
  - **Branch**: `feature/[task-branch-name]`
  - [Specific deliverable 1]
  - [Specific deliverable 2]
  - [Technical requirements]
- [ ] Task 2: [Task Name] ([Specialist Role])
  - **Branch**: `feature/[task-branch-name]`
  - [Deliverables...]

## [Domain] Priorities (High to Low):
1. **Critical [Component]** - [Description]
2. **Important [Feature]** - [Description]
3. **Nice-to-have [Enhancement]** - [Description]

## [Technical Domain] Tools & Framework:
**Primary Stack**:
- **[Tool/Library]**: [Purpose and usage]
- **[Framework]**: [Integration approach]

**[Integration] Strategy**:
- **[External API]**: [How to integrate]
- **[Data Source]**: [Processing approach]

## Success Criteria:
- [ ] **[Major Goal 1]** - [Measurable outcome]
- [ ] **[Major Goal 2]** - [Specific deliverable]
- [ ] **[Quality Gate]** - [Testing/validation requirement]
- [ ] **[Learning Goal]** - [Educational objective achieved]

## Next Session Instructions:
**Role to assume**: [Specialist Role for next task]
**Task**: [Specific next action to take]
**Learning goal**: [Concepts to understand/teach]
```

**Sprint Planning Best Practices**:
- **Focused Theme**: Each sprint has a clear technical focus (Testing, Real-time Data, UI/UX, etc.)
- **Role-Based Tasks**: Assign specialist roles to help Claude understand the context and approach
- **Learning Integration**: Every task includes educational objectives for the co-developer
- **Branch Strategy**: One main sprint branch with task-specific feature branches
- **Measurable Outcomes**: Success criteria should be specific and testable
- **Status Tracking**: Clear completion states with emoji indicators for quick visual status

### Issue & Project Planning Template
Create GitHub Issues for each sprint task using this template:

```markdown
## Issue: [Task Name]
**Sprint**: [Current Sprint Name]
**Priority**: High/Medium/Low
**Type**: Feature/Bug/Test/Refactor

### Acceptance Criteria:
- [ ] Specific deliverable 1
- [ ] Specific deliverable 2
- [ ] Tests passing
- [ ] Documentation updated

### Technical Details:
- **Files to modify**: List key files
- **Dependencies**: Any external requirements
- **Learning objectives**: What concepts to understand

### Claude Code Context:
Brief context about what this task involves for better collaboration
```

### Pull Request Template
Create `.github/pull_request_template.md` with:

```markdown
## What Changed
Brief description of the changes made

## Sprint Task
Link to related issue: Closes #[issue-number]
- [ ] Task completed according to acceptance criteria
- [ ] All tests passing
- [ ] Code reviewed and documented

## Testing
- [ ] New tests added for new functionality
- [ ] Existing tests still pass
- [ ] Manual testing completed
- [ ] No breaking changes

## Claude Code Collaboration
- **Key files changed**: List main files modified
- **Architecture impact**: Any structural changes
- **Learning notes**: Key concepts implemented

## Deployment Notes
- [ ] No migration required
- [ ] Environment variables updated (if needed)
- [ ] Ready for merge
```

### Commit Message Standards
Follow conventional commits for better tracking:

- `feat:` - New features
- `fix:` - Bug fixes
- `test:` - Adding/updating tests
- `refactor:` - Code improvements
- `docs:` - Documentation
- `chore:` - Maintenance tasks

Example: `feat: add Jest testing framework with TypeScript support`

## Drift Integration Architecture

### Market Data Pipeline (Real-time)
**Architecture**: Serverless Redis caching with background data updates for live market information.

**Data Flow**:
1. **Background Cron Job** (`/api/drift/cron/update-markets`):
   - Runs every 60 seconds via Vercel Cron
   - Fetches live data from Drift APIs (volume, open interest)
   - Stores in Redis with 5-minute TTL for reliability
   - Handles 65+ perpetual and spot markets

2. **Client API** (`/api/drift/markets`):
   - Fast Redis reads for instant market data serving
   - Data validation and sorting by volume
   - HTTP caching headers for optimal performance
   - Auto-refresh endpoint for empty data states

3. **Frontend Integration**:
   - SWR for data fetching with 60-second refresh intervals
   - Auto-refresh logic when markets are empty
   - Real-time updates in MarketList component
   - Loading states and error boundaries

**Redis Schema**:
```
drift:market:{symbol}     - Individual market data
drift:last_update        - Update timestamp
drift:update_status       - Cron job status tracking
```

**Market Data Structure**:
```typescript
interface MarketData {
  symbol: string;           // e.g., "ETH-PERP"
  displayName: string;      // Market display name
  price: number | null;     // Current price (to be implemented)
  priceChange24h: number | null; // 24h change (to be implemented)
  quoteVolume: number;      // 24h volume in quote currency
  baseVolume: number;       // 24h volume in base currency
  marketIndex: number;      // Drift market index
  marketType: string;       // "perp" or "spot"
  openInterest: number;     // Current open interest
  lastUpdated: number;      // Timestamp
}
```

### Hybrid Transaction Flow (Server + Client)
**Why this approach**: Drift SDK requires Node.js modules (fs, os, crypto) that cannot run in browser environment.

**Solution**: Server creates unsigned transactions, client signs with real wallet:

1. **Server Side** (`/src/lib/server/DriftServerService.ts`):
   - Uses full Drift SDK with Node.js environment
   - Creates unsigned transactions for account creation and order placement
   - Returns serialized transaction to client via API routes

2. **Client Side** (`/src/lib/drift/DriftApiService.ts`):
   - Calls server API routes to get unsigned transactions
   - Signs transactions using Privy wallet integration
   - Submits signed transactions to Solana network

3. **API Routes**:
   - `/api/drift/check-account` - Account existence verification
   - `/api/drift/create-account` - Account creation transaction generation
   - `/api/drift/place-order` - Order placement transaction generation
   - `/api/drift/markets` - Real-time market data serving
   - `/api/drift/markets/refresh` - Manual market data refresh
   - `/api/drift/cron/update-markets` - Background data updates

**Key Benefits**:
- Full Drift SDK functionality on server
- Real wallet signing on client
- No browser compatibility issues
- Secure transaction flow
- Real-time market data with Redis caching

## Memories and Guidelines

- **Commit Messages**: Do not use Claude-related messages in commit messages
```

</invoke>