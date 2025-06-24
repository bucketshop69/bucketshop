import { Strategy, PositionType } from './types';

/**
 * Get recommended strategy based on position type
 */
export function getRecommendedStrategy(positionType: PositionType): Strategy {
  if (positionType === 'single') {
    return 'bidask'; // Best for directional bets
  }
  return 'spot'; // Safe default for both tokens
}

/**
 * Get strategy display information
 */
export function getStrategyInfo(strategy: Strategy) {
  const strategyMap = {
    spot: {
      name: 'Spot (Balanced)',
      description: 'Equal liquidity distribution. Safe for beginners. Works in any market.',
      icon: '⚖️',
      riskLevel: 'Low Risk'
    },
    curve: {
      name: 'Curve (Focused)', 
      description: 'Concentrated around current price. Higher returns, higher risk.',
      icon: '🔔',
      riskLevel: 'High APY'
    },
    bidask: {
      name: 'Bid-Ask (Volatile)',
      description: 'Catches big price moves. Best for volatile markets or DCA.',
      icon: '🎪', 
      riskLevel: 'High Risk'
    }
  };

  return strategyMap[strategy];
}

/**
 * Get strategy visual pattern for display
 */
export function getStrategyPattern(strategy: Strategy): string {
  const patterns = {
    spot: '████████████', // Even bars
    curve: '  ████████  ', // Mountain shape  
    bidask: '████    ████'  // Split bars
  };

  return patterns[strategy];
}