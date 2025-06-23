# Meteora DLMM System Research

*Research conducted for implementing position creation interface in BucketShop App*

## Overview

Meteora's Dynamic Liquidity Market Maker (DLMM) is a sophisticated system that organizes liquidity into discrete price bins, enabling zero-slippage trading within individual bins and providing multiple strategies for liquidity distribution.

## 1. Meteora DLMM Bin System

### Core Concept
- **Discrete Price Bins**: DLMM organizes liquidity into up to **69 discrete price bins** per position
- **Zero Slippage**: Trading within a single bin has zero slippage or price impact
- **Active Bin**: The current market price bin that contains both tokens and accumulates fees
- **Bin Steps**: Each consecutive bin differs by a percentage (basis points) set by the pool creator

### Bin Step Calculation Example
```
Current Price: SOL/USDC = $20
Bin Step: 25 basis points (0.25%)
Next Bin Price: $20 × 1.0025 = $20.05
```

### 69 Bin Limitation
- **Hard Constraint**: Maximum 69 bins per position
- **Workaround**: Create multiple positions to cover wider price ranges
- **Trade-off**: Larger bin steps = wider coverage but less continuous liquidity

## 2. Three Distribution Strategies

### 🎯 Spot Strategy (Uniform Distribution)
```
Visual Pattern: ████████████████████████
Distribution:   Even across all bins
```
- **Pattern**: Equal liquidity in every selected bin
- **Best For**: New LPs, any market conditions, minimal rebalancing
- **Risk**: Moderate, balanced exposure
- **Variants**:
  - **Spot-Spread**: 20-30 bins (high capital efficiency)
  - **Spot-Wide**: 50 bins (lower impermanent loss risk)

### 🔔 Curve Strategy (Center Concentration)
```
Visual Pattern:      ████
Distribution:    ████████████
                ████████████████
```
- **Pattern**: Bell curve - most liquidity around current price
- **Best For**: Stable pairs, minimal price movement, maximum capital efficiency
- **Risk**: Higher impermanent loss, requires frequent rebalancing
- **Use Case**: Stablecoins or assets with predictable price ranges

### 🎪 Bid-Ask Strategy (Edge Concentration)
```
Visual Pattern: ████          ████
Distribution:   ████████  ████████
                ████████  ████████
```
- **Pattern**: U-shape - liquidity concentrated at range extremes
- **Best For**: Capturing volatility, DCA strategies, volatile pairs
- **Risk**: Complex, requires frequent monitoring
- **Use Case**: Anticipating significant price movements away from current price

## 3. Strategy Use Cases

### When to Use Each Strategy

| Strategy | Market Condition | Position Type | Rebalancing | Risk Level |
|----------|------------------|---------------|-------------|------------|
| **Spot** | Any condition | Both tokens | Minimal | Medium |
| **Curve** | Low volatility | Both tokens | Frequent | High |
| **Bid-Ask** | High volatility | Single token DCA | Frequent | High |

### Position Type Implications

#### Single Token Positions
- **TokenX Single**: Use when expecting price increase
- **TokenY Single**: Use when expecting price decrease or for SOL positions
- **Recommended**: Bid-Ask strategy for DCA approach
- **Range**: Asymmetric (above or below current price)

#### Both Token Positions
- **Traditional LP**: Balanced exposure to both tokens
- **Recommended**: Spot or Curve strategies
- **Range**: Symmetric around current price

## 4. Range and Bin Relationship

### Range Configuration
- **Symmetric Range**: Equal bins above and below current price
- **Asymmetric Range**: More bins in one direction (up or down)
- **Bin Step Impact**: Larger steps = wider coverage, fewer price points

### Practical Examples
```
Current Price: $20 SOL/USDC
Bin Step: 0.25%

Symmetric 20-bin Range:
- 10 bins below: $19.51 - $20.00
- 10 bins above: $20.00 - $20.51

Asymmetric 20-bin Range (bullish):
- 5 bins below: $19.75 - $20.00  
- 15 bins above: $20.00 - $20.76
```

## 5. UI Implementation Guidelines

### Compact Interface Design (25% Panel Constraint)

#### Strategy Selection (Visual Icons)
```
┌─────────────────────────────────────┐
│ Strategy Selection                   │
├─────────────────────────────────────┤
│ ⚖️  Spot      🔔 Curve    🎪 Bid-Ask │
│   Balanced    Focused     Volatile   │
│   Low Risk    High APY    High Risk  │
└─────────────────────────────────────┘
```

#### Progressive Disclosure Flow
1. **Position Type** → Single vs Both tokens
2. **SOL Allocation** → Total capital input
3. **Strategy Selection** → Context-aware recommendations
4. **Range Configuration** → Asymmetric for single, symmetric for both

#### Context-Aware Recommendations
```typescript
// Recommendation Logic
if (positionType === 'single') {
  recommendedStrategy = 'bid-ask'
  rangeType = 'asymmetric'
} else if (poolVolatility < 0.1) {
  recommendedStrategy = 'curve'
} else {
  recommendedStrategy = 'spot'
}
```

### Visual Distribution Indicators
- **Spot**: `████████████` (even bars)
- **Curve**: `  ████████  ` (mountain shape)  
- **Bid-Ask**: `████    ████` (split bars)

### Strategy Tooltips
- **Spot**: "Equal liquidity distribution. Safe for beginners. Works in any market."
- **Curve**: "Concentrated around current price. Higher returns, higher risk."
- **Bid-Ask**: "Catches big price moves. Best for volatile markets or DCA."

## 6. Implementation Recommendations

### Smart Defaults Based on Position Type
- **Single TokenX positions**: Default to Bid-Ask strategy with asymmetric range above current price
- **Single TokenY positions**: Default to Bid-Ask strategy with asymmetric range below current price
- **Both token positions**: Default to Spot strategy with symmetric range

### Range Configuration Guidelines
- **Single positions**: Suggest 15-25 bins in directional range
- **Both token positions**: Suggest 20-40 bins symmetric range
- **Advanced users**: Allow custom bin distribution

### Capital Efficiency Considerations
- **Curve strategy**: Highest capital efficiency but requires active management
- **Spot strategy**: Balanced approach suitable for passive LPs
- **Bid-Ask strategy**: Best for DCA and volatile market conditions

## 7. Technical Integration Notes

### Pool Data Requirements
- Current price from `pool.current_price`
- Bin step from `pool.bin_step`
- Volatility indicators for strategy recommendations

### State Management
```typescript
interface StrategyState {
  strategy: 'spot' | 'curve' | 'bidask'
  rangeType: 'symmetric' | 'asymmetric-above' | 'asymmetric-below'
  rangeMin: number
  rangeMax: number
  binCount: number
}
```

### Calculation Formulas
```typescript
// Bin price calculation
const binPrice = currentPrice * Math.pow(1 + (binStep / 10000), binIndex)

// Range calculation for asymmetric positions
const asymmetricRange = {
  above: currentPrice * (1 + (percentageAbove / 100)),
  below: currentPrice * (1 - (percentageBelow / 100))
}
```

---

*This research forms the foundation for implementing an intuitive, space-efficient position creation interface that abstracts complex DLMM concepts while preserving the system's power and flexibility.*