// ===== TYPE EXPORTS =====
export type {
  MeteoraPoolInfo,
  MeteoraTokenGroup,
  MeteoraGroupResponse,
  PoolSearchFilters,
  PercentageBasedRange,
  CreatePositionParams,
  CreatePositionResult,
  ClosePositionParams,
  ClosePositionResult,
  RemoveLiquidityParams,
  RemoveLiquidityResult,
  BinRange,
  OptimalPercentages
} from './types';

// ===== CONSTANT EXPORTS =====
export { DLMM_CONFIG, METEORA_API } from './constants';

// ===== POOL SERVICE EXPORTS =====
export {
  getAvailableGroups,
  getAvailablePools,
  getPoolsByToken,
  getPopularPools,
  searchPools,
  getPoolInfo,
  getPoolsForTokenPair
} from './meteora.pools.service';

// ===== POSITION SERVICE EXPORTS =====
export {
  createPositionAndAddLiquidity,
  removeLiquidityFromPosition,
  closePositionCompletely,
  closePositionOnly,
  claimFeesFromPosition,
  claimAllFeesFromPositions
} from './meteora.position.service';

// ===== UTILITY EXPORTS =====
export {
  calculateGroupAggregates,
  executeTransaction,
  executeTransactions,
  handleError,
  calculatePriceFromBinOffset,
  getPercentagePerBin,
  getMaxAchievablePercentage,
  calculateOptimalSinglePercentage,
  calculateOptimalPercentages,
  calculatePriceRange,
  convertPricesToBinRange,
  adjustBinLimits,
  calculateActualPrices,
  adjustStrategyBasedOnTokenAmounts,
  calculatePercentageBasedRange,
  calculateBinBasedRange
} from './utils';