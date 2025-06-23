# Position Creation UX Design Documentation

*Design guidelines and patterns for SOL-based position creation in 25% panel constraint*

## Design Philosophy

### Core Constraint: 25% Action Panel
- **Limited Space**: Must fit complex position creation in ~25% of screen width
- **Context Preservation**: Users maintain view of 75% chart area
- **No Context Switching**: Complete position creation without losing chart focus

### UX Principles
1. **Progressive Disclosure**: Reveal information step-by-step
2. **Smart Defaults**: Pre-select optimal choices based on context
3. **Visual Hierarchy**: Use size, color, and spacing to guide attention
4. **Immediate Feedback**: Real-time validation and calculations

## Step-by-Step Design Pattern

### Step 1: Position Type Selection
```
┌─────────────────────────────────┐
│ Position Type                   │
├─────────────────────────────────┤
│ [Both Tokens] [Single Token]    │
│  LP with GOR + SOL              │
│                                 │
│ ┌─ When Single Selected ───────┐ │
│ │ [GOR] [SOL]                 │ │
│ │ Bullish  Using SOL directly │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Design Elements:**
- **Button toggles** instead of radio circles (more actionable)
- **2-column grid** maximizes horizontal space
- **Progressive disclosure** for token selection
- **Context hints** explain position implications

### Step 2: SOL Allocation
```
┌─────────────────────────────────┐
│ SOL to Allocate                 │
├─────────────────────────────────┤
│ Amount     Balance: 2.50 SOL    │
│ [    1.25    ]                  │
│ [25%][50%][75%][MAX]            │
│ Allocating 1.25 SOL             │
└─────────────────────────────────┘
```

**Design Elements:**
- **Inline balance display** saves vertical space
- **4-column percentage grid** for quick allocation
- **Real-time feedback** shows allocation amount
- **Compact input** with small height (`h-8`)

### Step 3: Token Preview
```
┌─────────────────────────────────┐
│ Token Preview                   │
├─────────────────────────────────┤
│ ┌─ Single GOR Position ────────┐ │
│ │ Will buy ~0.0625 GOR        │ │
│ │ 1 transaction: SOL → GOR    │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Design Elements:**
- **Colored preview cards** for visual recognition
- **Transaction count** for user expectations
- **Approximate amounts** with `~` symbol
- **Compact card design** fits in limited space

### Step 4: Strategy & Range (Future)
```
┌─────────────────────────────────┐
│ Strategy                        │
├─────────────────────────────────┤
│ ⚖️Spot  🔔Curve  🎪Bid-Ask      │
│ ████████  ████    ████    ████  │
│ Range: +15% above current       │
│ [────●──────] 15%               │
└─────────────────────────────────┘
```

## Color System

### Position Type Colors
- **Both Tokens**: Purple theme (`bg-purple-50`, `border-purple-200`)
- **Single TokenX**: Blue theme (`bg-blue-50`, `border-blue-200`)
- **Single TokenY**: Green theme (`bg-green-50`, `border-green-200`)

### Status Colors
- **Success/Ready**: Green (`text-green-600`)
- **Pending**: Muted foreground
- **Warning**: Amber (`text-amber-600`)

### Strategy Colors
- **Spot**: Neutral/Gray (balanced, safe)
- **Curve**: Blue (concentrated, focused)
- **Bid-Ask**: Orange (volatile, dynamic)

## Typography Scale

### Hierarchy for Compact Space
- **Section Headers**: `text-sm font-medium` (14px)
- **Input Labels**: `text-xs font-medium text-muted-foreground` (12px)
- **Body Text**: `text-xs` (12px)
- **Helper Text**: `text-xs text-muted-foreground` (12px, muted)

### Content Strategy
- **Concise Labels**: "SOL to Allocate" not "Total SOL Amount to Allocate"
- **Progressive Context**: Show details only when relevant
- **Abbreviations**: Use "LP" instead of "Liquidity Provider"

## Spacing and Layout

### Vertical Spacing
- **Component spacing**: `space-y-3` (12px)
- **Section spacing**: `space-y-2` (8px)
- **Card padding**: `p-3` (12px)
- **Input sections**: `space-y-1` (4px)

### Grid Layouts
- **2-column**: Position type, token selection
- **4-column**: Percentage buttons
- **Responsive**: Maintains usability at narrow widths

## Interactive Patterns

### Button States
```css
/* Default State */
variant="outline" - Inactive option

/* Selected State */
variant="default" - Active selection

/* Hover State */
hover:bg-accent - Subtle feedback
```

### Progressive Disclosure
1. **Position Type** → Always visible
2. **Token Selection** → Only if single position
3. **SOL Allocation** → Only if position type ready
4. **Token Preview** → Only if SOL amount entered
5. **Strategy/Range** → Only if calculations complete

### Validation Feedback
- **Real-time**: Update calculations as user types
- **Visual cues**: Green checkmarks, pending status
- **Error prevention**: Cap inputs at maximum values
- **Clear messaging**: "Enter amount to continue"

## Animation and Transitions

### Smooth Reveals
```css
animate-in slide-in-from-top-1 duration-200
```
- **Usage**: When new sections appear
- **Duration**: 200ms for snappy feel
- **Direction**: Top to bottom (natural reading flow)

### State Transitions
- **Button press**: Immediate visual feedback
- **Input changes**: Smooth number transitions
- **Progress updates**: Instant step indicator changes

## Accessibility Considerations

### Keyboard Navigation
- **Tab order**: Logical top-to-bottom flow
- **Enter key**: Activates buttons
- **Arrow keys**: Navigate between radio options

### Screen Readers
- **Labels**: All inputs have proper labels
- **Status updates**: Progress changes announced
- **Context**: Helper text provides explanation

### Color Independence
- **Icons**: Strategy selection has visual patterns
- **Status**: Text labels accompany color coding
- **Contrast**: Meets WCAG AA standards

## Mobile Responsiveness

### Touch Targets
- **Minimum size**: 44px touch targets
- **Button spacing**: Adequate gap for finger taps
- **Input sizing**: Large enough for mobile keyboards

### Layout Adaptation
- **Flexible grids**: Maintain usability at narrow widths
- **Font scaling**: Readable on small screens
- **Scrolling**: Vertical scroll within panel if needed

## Performance Considerations

### Calculation Efficiency
- **Debounced inputs**: Prevent excessive calculations
- **Memoization**: Cache expensive computations
- **Local state**: Minimize re-renders

### Bundle Size
- **Minimal dependencies**: Use existing UI components
- **Tree shaking**: Import only needed functions
- **Component splitting**: Lazy load complex features

## Future Enhancements

### Advanced Features
- **Strategy visualization**: Mini charts showing distribution
- **Historical performance**: Strategy success rates
- **Gas estimation**: Real-time fee calculations
- **Slippage settings**: Advanced trading parameters

### User Experience
- **Tooltips**: Contextual help system
- **Onboarding**: First-time user guidance
- **Presets**: Saved position configurations
- **Comparison**: Side-by-side strategy analysis

---

*This design system ensures consistent, intuitive position creation within the 25% panel constraint while maintaining the sophistication needed for advanced DeFi operations.*