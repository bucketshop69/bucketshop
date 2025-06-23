# BucketShop App Documentation

This folder contains comprehensive documentation for the BucketShop App project, focusing on research, design patterns, and implementation guidelines.

## 📋 Table of Contents

### Research Documentation
- **[meteora-dlmm-research.md](./meteora-dlmm-research.md)** - Deep dive into Meteora's DLMM system, bin strategies, and liquidity distribution patterns

### Design Documentation  
- **[position-creation-ux-design.md](./position-creation-ux-design.md)** - UX design guidelines for position creation in 25% panel constraint

## 🎯 Project Context

**Vision**: Unified crypto trading dashboard consolidating multiple Solana DApps
**Current Sprint**: Position Creation Flow - Transform token-centric to SOL allocation-based UX
**Constraint**: 25% action panel design for context-preserving trading

## 🔬 Research Insights

### Meteora DLMM Key Findings
- **69 bin maximum** per position
- **3 distribution strategies**: Spot (uniform), Curve (center), Bid-Ask (edges)
- **Context-aware recommendations** based on position type
- **Asymmetric ranges** for directional single-token positions

### UX Design Principles
- **Progressive disclosure** - reveal complexity step-by-step
- **Button-based UI** - more actionable than radio circles in constrained space
- **Real-time calculations** - immediate feedback builds user confidence
- **Smart defaults** - reduce cognitive load through context-aware suggestions

## 🏗️ Implementation Status

### Completed (Tasks 1-3)
- ✅ Position type selection foundation
- ✅ SOL allocation interface with percentage buttons
- ✅ Smart token calculations and previews

### Next (Task 4)
- 🔄 Strategy & range selection with visual distribution indicators
- 🔄 Context-aware recommendations
- 🔄 Final transaction preview

## 📚 Related Documentation

### Project Files
- **[CLAUDE.md](../CLAUDE.md)** - Development commands and project structure
- **[.claude/current-sprint.md](../.claude/current-sprint.md)** - Active sprint details
- **[.claude/business-requirements.md](../.claude/business-requirements.md)** - Complete business logic

### Code Documentation
- **[src/lib/services/meteora/](../src/lib/services/meteora/)** - Meteora service implementation
- **[src/components/meteora/](../src/components/meteora/)** - Meteora UI components

## 🤝 Contributing

When adding new documentation:
1. **Follow established patterns** - Use similar structure and formatting
2. **Include practical examples** - Code snippets and visual diagrams
3. **Link related content** - Cross-reference relevant files
4. **Update this README** - Add new documents to the table of contents

## 📖 Documentation Standards

### File Naming
- Use kebab-case: `meteora-dlmm-research.md`
- Include topic and type: `[topic]-[type].md`
- Keep names descriptive but concise

### Content Structure
1. **Overview** - Brief summary and context
2. **Detailed sections** - In-depth coverage with examples
3. **Implementation notes** - Practical guidance for developers
4. **Future considerations** - Potential enhancements and next steps

### Code Examples
```typescript
// Always include TypeScript types
interface ExampleInterface {
  property: string;
}

// Provide context and explanation
const example = calculateTokenAmount(solAmount, currentPrice);
```

---

*This documentation evolves with the project, capturing valuable research and design decisions to prevent knowledge loss and support future development.*