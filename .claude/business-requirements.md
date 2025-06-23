# Business Requirements: SOL-Based Position Creation Flow

## Overview
Transform the position creation experience from complex dual-token inputs to intuitive SOL allocation-based flow. Users think in terms of capital allocation, not token mathematics.

## Core Philosophy
**Current Problem**: "How much TokenX and TokenY do I need?" (confusing)
**Solution**: "How much SOL do I want to allocate?" (intuitive)

---

## Step-by-Step Business Logic

### Step 1: Position Type Selection
**Prompt**: "Add position type selection as the first step"

**UI Requirements**:
- Two radio buttons: "Single token position" and "Both tokens position"
- When "Single token position" selected → show token selection (TokenX or TokenY)
- When "Both tokens position" selected → skip directly to allocation step

**State Management**:
```typescript
positionType: 'single' | 'both'
selectedToken: 'tokenX' | 'tokenY' | null
```

**Business Rules**:
- Single token positions are directional bets (bullish/bearish)
- Both tokens positions are traditional liquidity provision
- Token selection only appears for single token positions

---

### Step 2: SOL Allocation Amount
**Prompt**: "Replace current deposit inputs with Total SOL allocation"

**UI Requirements**:
- Single input field: "Total SOL to allocate"
- Display user's available SOL balance next to input
- Percentage quick buttons: [25%] [50%] [75%] [MAX]
- Input validation against available balance

**State Management**:
```typescript
totalSolAllocation: number
availableSolBalance: number
```

**Business Rules**:
- All position calculations derive from this single SOL amount
- System handles all token conversion mathematics
- Users think in terms of capital allocation, not token ratios

---

### Step 3: Smart Token Calculation
**Prompt**: "Add automatic token amount calculation based on position type"

**Calculation Logic**:
```typescript
IF positionType === 'single' AND selectedToken === 'tokenX':
  - Calculate: tokenXNeeded = totalSolAllocation / currentPrice
  - Display: "Will buy ~X.XX TokenX"
  - Set: tokenXAmount = calculated amount, tokenYAmount = 0

IF positionType === 'single' AND selectedToken === 'tokenY':
  - Set: tokenXAmount = 0, tokenYAmount = totalSolAllocation
  - Display: "Using X.XX SOL directly"

IF positionType === 'both':
  - Calculate optimal ratio based on strategy and price range
  - Split totalSolAllocation according to calculated ratio
  - Display: "Will use X SOL to buy TokenX, Y SOL for liquidity"
```

**State Management**:
```typescript
calculatedTokenXAmount: number
calculatedTokenYAmount: number
requiresSwap: boolean
swapAmount: number
```

**Business Rules**:
- All calculations happen in real-time as user adjusts inputs
- Show preview of what tokens will be acquired/used
- Clearly indicate when swaps are required vs direct usage

---

### Step 4: Strategy Selection Enhancement
**Prompt**: "Keep existing strategy selection but add visual indicators"

**Enhanced Logic**:
- **Single TokenX positions**: Recommend "Bid Ask" (buying strategy)
- **Single TokenY positions**: Recommend "Bid Ask" (selling strategy)  
- **Both tokens positions**: All strategies (Spot, Curve, Bid Ask) available
- **Disabled strategies**: Grey out options that don't make sense for position type

**UI Requirements**:
- Add visual indicators (icons/badges) for recommended strategies
- Tooltips explaining why certain strategies are recommended
- Clear visual distinction between available/recommended/disabled options

**Business Rules**:
- Strategy affects optimal ratio calculations for "both tokens" positions
- Single token positions have natural strategy preferences
- UI should guide users toward optimal choices

---

### Step 5: Range Adjustment Based on Position Type
**Prompt**: "Auto-adjust range based on position type"

**Range Logic**:
```typescript
IF positionType === 'single':
  IF selectedToken === 'tokenX':
    - Default range: current price to current price + 20%
    - Asymmetric range (above current price only)
    - User is betting price will rise
    
  IF selectedToken === 'tokenY':
    - Default range: current price - 20% to current price
    - Asymmetric range (below current price only)
    - User is betting price will fall

IF positionType === 'both':
  - Keep current symmetric range logic (±percentage)
  - Traditional liquidity provision around current price
```

**State Management**:
```typescript
rangeMin: number
rangeMax: number
rangeType: 'symmetric' | 'asymmetric-above' | 'asymmetric-below'
```

**Business Rules**:
- Single token positions should default to directional ranges
- Both token positions use symmetric ranges
- Range type affects bin distribution and capital efficiency

---

### Step 6: Final Confirmation Preview
**Prompt**: "Add transaction preview before creating position"

**Preview Card Requirements**:
- **Total SOL allocated**: Clear capital commitment
- **Tokens to be acquired**: "Will buy X TokenX" or "Using Y SOL directly"
- **Final position composition**: Token amounts and price range
- **Transaction count**: "1 transaction" vs "2 transactions (swap + position)"
- **Estimated costs**: Gas fees and potential slippage
- **Action buttons**: "Edit" (go back) and "Create Position" (execute)

**State Management**:
```typescript
transactionPreview: {
  solAllocated: number
  tokensToAcquire: { tokenX: number, tokenY: number }
  positionRange: { min: number, max: number }
  transactionCount: number
  estimatedGasFees: number
  requiresSwap: boolean
}
```

**Business Rules**:
- User must see exactly what will happen before execution
- Clear cost breakdown builds trust and confidence
- Edit functionality allows easy adjustments without starting over

---

## Complete State Management Structure

```typescript
interface PositionCreationState {
  // Step 1: Position Type
  positionType: 'single' | 'both'
  selectedToken: 'tokenX' | 'tokenY' | null
  
  // Step 2: SOL Allocation
  totalSolAllocation: number
  availableSolBalance: number
  
  // Step 3: Calculated Amounts
  calculatedTokenXAmount: number
  calculatedTokenYAmount: number
  requiresSwap: boolean
  swapAmount: number
  
  // Step 4: Strategy
  strategy: 'spot' | 'curve' | 'bidask'
  recommendedStrategy: string
  
  // Step 5: Range
  rangeMin: number
  rangeMax: number
  rangeType: 'symmetric' | 'asymmetric-above' | 'asymmetric-below'
  
  // Step 6: Preview
  transactionPreview: {
    solAllocated: number
    tokensToAcquire: { tokenX: number, tokenY: number }
    positionRange: { min: number, max: number }
    transactionCount: number
    estimatedGasFees: number
  }
}
```

---

## UX Improvements

### Required Enhancements
1. **Remove "Auto-fill" checkbox** - Not needed with SOL-first approach
2. **Step indicators** - "Step 1 of 4" progress indication
3. **Collapsible sections** - Allow users to expand/collapse completed steps
4. **Smart validation** - Disable "Create Position" until all required fields complete
5. **Loading states** - Show calculation progress for complex operations
6. **Contextual help** - Tooltips explaining strategies in simple terms

### Form Flow Logic
1. **Progressive disclosure** - Only show relevant options based on previous selections
2. **Smart defaults** - Pre-select recommended options when possible
3. **Real-time feedback** - Update calculations and previews immediately
4. **Error prevention** - Validate inputs and guide users toward valid choices
5. **Confidence building** - Clear previews and explanations reduce user anxiety

---

## Success Criteria

### User Experience Goals
- ✅ Users can create positions thinking only in SOL terms
- ✅ Complex token mathematics handled transparently by system
- ✅ Clear preview of exactly what will happen before execution
- ✅ Directional positions (single token) have appropriate range defaults
- ✅ Strategy recommendations guide users toward optimal choices

### Technical Goals
- ✅ All calculations happen client-side with real-time updates
- ✅ State management supports easy editing and step navigation
- ✅ Form validation prevents invalid position configurations
- ✅ Preview accurately reflects actual transaction requirements
- ✅ Architecture supports future transaction execution integration

---

## Integration Notes

### Current Sprint Scope
- **IN SCOPE**: Complete form flow leading to "Create Position" button
- **OUT OF SCOPE**: Actual swaps, transactions, wallet integration beyond balance display

### Future Sprint Integration Points
- **Swap Execution**: Jupiter integration for SOL → TokenX conversions
- **Transaction Management**: Actual position creation via Meteora SDK
- **Wallet Integration**: Full wallet connection and signature flows
- **Error Handling**: Transaction failure recovery and retry mechanisms

---

*This document serves as the definitive source of truth for SOL-based position creation requirements. All implementation decisions should reference these business rules and user experience goals.*