import { Connection, Keypair, sendAndConfirmTransaction, PublicKey } from "@solana/web3.js";
import DLMM, { StrategyType } from '@meteora-ag/dlmm';
import { BN } from "@coral-xyz/anchor";
import { DEFAULT_RPC_ENDPOINT } from '@/lib/constants/rpc';

// ===== CONFIGURATION =====
const DLMM_CONFIG = {
  MAX_BINS: 69,
  MAX_BINS_PER_SIDE: 34,
  DEFAULT_RANGE_INTERVAL: 6,
  BASIS_POINTS_DIVISOR: 10000,
  PERCENTAGE_DIVISOR: 100
} as const;

// ===== INTERFACES =====

// Pool Discovery Interfaces
interface MeteoraPoolInfo {
  address: string;
  name: string;
  mint_x: string;
  mint_y: string;
  reserve_x: string;
  reserve_y: string;
  reserve_x_amount: number;
  reserve_y_amount: number;
  bin_step: number;
  base_fee_percentage: string;
  max_fee_percentage: string;
  protocol_fee_percentage: string;
  liquidity: string;
  reward_infos: any[];
  farm_infos: any[];
  last_updated_at: string;
  current_price: number;
}

interface PoolSearchFilters {
  tokenAddress?: string;
  minLiquidity?: number;
  maxBinStep?: number;
  hasRewards?: boolean;
  sortBy?: 'liquidity' | 'volume' | 'fees';
  limit?: number;
}

interface PercentageBasedRange {
  percentageAbove?: number;
  percentageBelow?: number;
  side?: 'both' | 'above-only' | 'below-only';
}

interface CreatePositionParams {
  lbPairAddress: PublicKey;
  userKeypair: Keypair;
  totalXAmount: BN;
  totalYAmount: BN;
  rangeInterval?: number;
  percentageRange?: PercentageBasedRange;
  strategyType?: StrategyType;
  skipPreflight?: boolean;
}

interface CreatePositionResult {
  success: boolean;
  transactionHash?: string;
  positionAddress?: string;
  error?: string;
  logs?: string[];
}

interface ClosePositionParams {
  positionAddress: PublicKey;
  userKeypair: Keypair;
  lbPairAddress: PublicKey;
  skipPreflight?: boolean;
}

interface ClosePositionResult {
  success: boolean;
  transactionHashes?: string[];
  error?: string;
  logs?: string[];
}

interface RemoveLiquidityParams {
  positionAddress: PublicKey;
  userKeypair: Keypair;
  lbPairAddress: PublicKey;
  percentageToRemove?: number;
  shouldClaimAndClose?: boolean;
  skipPreflight?: boolean;
}

interface RemoveLiquidityResult {
  success: boolean;
  transactionHashes?: string[];
  error?: string;
  logs?: string[];
}

interface BinRange {
  minBinId: number;
  maxBinId: number;
  minPrice: number;
  maxPrice: number;
}

interface OptimalPercentages {
  percentageAbove: number;
  percentageBelow: number;
}

// ===== HELPER FUNCTIONS =====
async function createDLMMPool(lbPairAddress: PublicKey): Promise<DLMM> {


  const connection = new Connection(DEFAULT_RPC_ENDPOINT)
  console.log('Creating DLMM pool...');
  const dlmmPool = await DLMM.create(connection, lbPairAddress);
  await dlmmPool.refetchStates();
  return dlmmPool;
}

async function findUserPosition(dlmmPool: DLMM, userKeypair: Keypair, positionAddress: PublicKey) {
  const { userPositions } = await dlmmPool.getPositionsByUserAndLbPair(userKeypair.publicKey);
  return userPositions.find(({ publicKey }) => publicKey.equals(positionAddress));
}

async function executeTransaction(
  tx: any,
  signers: Keypair[],
  skipPreflight: boolean = false,
): Promise<string> {
  const connection = new Connection(DEFAULT_RPC_ENDPOINT)
  return await sendAndConfirmTransaction(
    connection,
    tx,
    signers,
    { skipPreflight, preflightCommitment: "confirmed" }
  );
}

async function executeTransactions(
  txs: any[],
  signers: Keypair[],
  skipPreflight: boolean = false
): Promise<string[]> {
  const txHashes: string[] = [];
  for (const tx of txs) {
    const txHash = await executeTransaction(tx, signers, skipPreflight);
    txHashes.push(txHash);
  }
  return txHashes;
}

function handleError(error: any): { success: false; error: string; logs?: string[] } {
  return {
    success: false,
    error: error.message || "Unknown error",
    logs: error.logs
  };
}

// ===== UTILITY FUNCTIONS (from original) =====
function calculatePriceFromBinOffset(basePrice: number, binStep: number, binOffset: number): number {
  return basePrice * Math.pow(1 + binStep / DLMM_CONFIG.BASIS_POINTS_DIVISOR, binOffset);
}

function getPercentagePerBin(binStep: number): number {
  return binStep / DLMM_CONFIG.PERCENTAGE_DIVISOR;
}

function getMaxAchievablePercentage(binStep: number): number {
  const percentagePerBin = getPercentagePerBin(binStep);
  return DLMM_CONFIG.MAX_BINS_PER_SIDE * percentagePerBin;
}

function calculateOptimalSinglePercentage(
  binStep: number,
  requestedPercentage: number | null
): { optimalPercentage: number; binsRequired: number } {
  const percentagePerBin = getPercentagePerBin(binStep);
  const maxAchievablePercentage = getMaxAchievablePercentage(binStep);
  const targetPercentage = requestedPercentage ?? maxAchievablePercentage;

  if (targetPercentage <= maxAchievablePercentage) {
    return {
      optimalPercentage: targetPercentage,
      binsRequired: Math.ceil(targetPercentage / percentagePerBin)
    };
  } else {
    return {
      optimalPercentage: maxAchievablePercentage,
      binsRequired: DLMM_CONFIG.MAX_BINS_PER_SIDE
    };
  }
}

function calculateOptimalPercentages(
  binStep: number,
  percentageConfig: PercentageBasedRange
): OptimalPercentages {
  const { percentageAbove, percentageBelow, side = 'both' } = percentageConfig;

  if (side === 'both') {
    const aboveOptimal = calculateOptimalSinglePercentage(binStep, percentageAbove ?? null);
    const belowOptimal = calculateOptimalSinglePercentage(binStep, percentageBelow ?? null);

    return {
      percentageAbove: aboveOptimal.optimalPercentage,
      percentageBelow: belowOptimal.optimalPercentage
    };
  } else {
    const percentagePerBin = getPercentagePerBin(binStep);
    const maxSingleSidePercentage = DLMM_CONFIG.MAX_BINS * percentagePerBin;

    if (side === 'above-only') {
      const requestedAbove = percentageAbove ?? maxSingleSidePercentage;
      return {
        percentageAbove: Math.min(requestedAbove, maxSingleSidePercentage),
        percentageBelow: 0
      };
    } else {
      const requestedBelow = percentageBelow ?? maxSingleSidePercentage;
      return {
        percentageAbove: 0,
        percentageBelow: Math.min(requestedBelow, maxSingleSidePercentage)
      };
    }
  }
}

function calculatePriceRange(
  activeBinPrice: number,
  percentages: OptimalPercentages,
  side: string
): { minPrice: number; maxPrice: number } {
  const { percentageAbove, percentageBelow } = percentages;

  switch (side) {
    case 'above-only':
      return {
        minPrice: activeBinPrice,
        maxPrice: activeBinPrice * (1 + percentageAbove / DLMM_CONFIG.PERCENTAGE_DIVISOR)
      };
    case 'below-only':
      return {
        minPrice: activeBinPrice * (1 - percentageBelow / DLMM_CONFIG.PERCENTAGE_DIVISOR),
        maxPrice: activeBinPrice
      };
    case 'both':
    default:
      return {
        minPrice: activeBinPrice * (1 - percentageBelow / DLMM_CONFIG.PERCENTAGE_DIVISOR),
        maxPrice: activeBinPrice * (1 + percentageAbove / DLMM_CONFIG.PERCENTAGE_DIVISOR)
      };
  }
}

function convertPricesToBinRange(
  dlmmPool: DLMM,
  minPrice: number,
  maxPrice: number,
  activeBinPrice: number
): { minBinId: number; maxBinId: number; activeBinId: number } {
  return {
    minBinId: dlmmPool.getBinIdFromPrice(minPrice, false),
    maxBinId: dlmmPool.getBinIdFromPrice(maxPrice, true),
    activeBinId: dlmmPool.getBinIdFromPrice(activeBinPrice, false)
  };
}

function adjustBinLimits(
  binRange: { minBinId: number; maxBinId: number; activeBinId: number },
  side: string
): { adjustedMinBinId: number; adjustedMaxBinId: number } {
  const { minBinId, maxBinId, activeBinId } = binRange;
  let adjustedMinBinId = minBinId;
  let adjustedMaxBinId = maxBinId;

  if (side === 'above-only') {
    adjustedMaxBinId = Math.min(maxBinId, activeBinId + (DLMM_CONFIG.MAX_BINS - 1));
    adjustedMinBinId = activeBinId;
  } else if (side === 'below-only') {
    adjustedMinBinId = Math.max(minBinId, activeBinId - (DLMM_CONFIG.MAX_BINS - 1));
    adjustedMaxBinId = activeBinId;
  }

  const totalBins = adjustedMaxBinId - adjustedMinBinId + 1;
  if (totalBins > DLMM_CONFIG.MAX_BINS) {
    if (side === 'both') {
      const excess = totalBins - DLMM_CONFIG.MAX_BINS;
      const trimPerSide = Math.floor(excess / 2);
      adjustedMinBinId += trimPerSide;
      adjustedMaxBinId -= Math.ceil(excess / 2);
    } else if (side === 'above-only') {
      adjustedMaxBinId = activeBinId + (DLMM_CONFIG.MAX_BINS - 1);
    } else {
      adjustedMinBinId = activeBinId - (DLMM_CONFIG.MAX_BINS - 1);
    }
  }

  return { adjustedMinBinId, adjustedMaxBinId };
}

function calculateActualPrices(
  activeBinPrice: number,
  binStep: number,
  adjustedMinBinId: number,
  adjustedMaxBinId: number,
  activeBinId: number
): { actualMinPrice: number; actualMaxPrice: number } {
  return {
    actualMinPrice: calculatePriceFromBinOffset(activeBinPrice, binStep, adjustedMinBinId - activeBinId),
    actualMaxPrice: calculatePriceFromBinOffset(activeBinPrice, binStep, adjustedMaxBinId - activeBinId)
  };
}

function adjustStrategyBasedOnTokenAmounts(
  percentageRange: PercentageBasedRange,
  totalXAmount: BN,
  totalYAmount: BN
): PercentageBasedRange {
  let adjustedStrategy = percentageRange.side;

  if (totalYAmount.isZero() && !totalXAmount.isZero()) {
    if (percentageRange.side === 'below-only') {
      adjustedStrategy = 'above-only';
    }
  } else if (totalXAmount.isZero() && !totalYAmount.isZero()) {
    if (percentageRange.side === 'above-only') {
      adjustedStrategy = 'below-only';
    }
  }

  return {
    ...percentageRange,
    side: adjustedStrategy
  };
}

async function calculatePercentageBasedRange(
  dlmmPool: DLMM,
  activeBinPrice: number,
  percentageConfig: PercentageBasedRange
): Promise<{ minBinId: number; maxBinId: number; minPrice: number; maxPrice: number; actualConfig: PercentageBasedRange }> {
  const binStep = dlmmPool.lbPair.binStep;
  const side = percentageConfig.side || 'both';

  const optimalPercentages = calculateOptimalPercentages(binStep, percentageConfig);
  const priceRange = calculatePriceRange(activeBinPrice, optimalPercentages, side);
  const binRange = convertPricesToBinRange(dlmmPool, priceRange.minPrice, priceRange.maxPrice, activeBinPrice);
  const { adjustedMinBinId, adjustedMaxBinId } = adjustBinLimits(binRange, side);
  const { actualMinPrice, actualMaxPrice } = calculateActualPrices(
    activeBinPrice,
    binStep,
    adjustedMinBinId,
    adjustedMaxBinId,
    binRange.activeBinId
  );

  return {
    minBinId: adjustedMinBinId,
    maxBinId: adjustedMaxBinId,
    minPrice: actualMinPrice,
    maxPrice: actualMaxPrice,
    actualConfig: {
      percentageAbove: optimalPercentages.percentageAbove,
      percentageBelow: optimalPercentages.percentageBelow,
      side: percentageConfig.side
    }
  };
}

function calculateBinBasedRange(
  activeBin: any,
  activeBinPrice: number,
  binStep: number,
  rangeInterval: number,
  dlmmPool: DLMM
): BinRange {
  const minBinId = activeBin.binId - rangeInterval;
  const maxBinId = activeBin.binId + rangeInterval;
  const activeBinId = dlmmPool.getBinIdFromPrice(activeBinPrice, false);

  const actualMinPrice = calculatePriceFromBinOffset(activeBinPrice, binStep, minBinId - activeBinId);
  const actualMaxPrice = calculatePriceFromBinOffset(activeBinPrice, binStep, maxBinId - activeBinId);

  return {
    minBinId,
    maxBinId,
    minPrice: actualMinPrice,
    maxPrice: actualMaxPrice
  };
}

// ===== MAIN FUNCTIONS =====
export async function createPositionAndAddLiquidity(params: CreatePositionParams): Promise<CreatePositionResult> {
  const {
    lbPairAddress,
    userKeypair,
    totalXAmount,
    totalYAmount,
    rangeInterval = DLMM_CONFIG.DEFAULT_RANGE_INTERVAL,
    percentageRange,
    strategyType = StrategyType.Spot,
    skipPreflight = false
  } = params;

  try {
    const dlmmPool = await createDLMMPool(lbPairAddress);
    const activeBin = await dlmmPool.getActiveBin();
    const activeBinPrice = Number(activeBin.price);

    let binRange: BinRange;

    if (percentageRange) {
      const adjustedConfig = adjustStrategyBasedOnTokenAmounts(percentageRange, totalXAmount, totalYAmount);
      const rangeResult = await calculatePercentageBasedRange(dlmmPool, activeBinPrice, adjustedConfig);
      binRange = {
        minBinId: rangeResult.minBinId,
        maxBinId: rangeResult.maxBinId,
        minPrice: rangeResult.minPrice,
        maxPrice: rangeResult.maxPrice
      };
    } else {
      binRange = calculateBinBasedRange(activeBin, activeBinPrice, dlmmPool.lbPair.binStep, rangeInterval, dlmmPool);
    }

    const newPosition = Keypair.generate();
    const createPositionTx = await dlmmPool.initializePositionAndAddLiquidityByStrategy({
      positionPubKey: newPosition.publicKey,
      user: userKeypair.publicKey,
      totalXAmount,
      totalYAmount,
      strategy: {
        maxBinId: binRange.maxBinId,
        minBinId: binRange.minBinId,
        strategyType,
      },
    });

    const txHash = await executeTransaction(createPositionTx, [userKeypair, newPosition], skipPreflight);

    return {
      success: true,
      transactionHash: txHash,
      positionAddress: newPosition.publicKey.toBase58()
    };

  } catch (error: any) {
    return handleError(error);
  }
}

export async function removeLiquidityFromPosition(params: RemoveLiquidityParams): Promise<RemoveLiquidityResult> {
  const {
    positionAddress,
    userKeypair,
    lbPairAddress,
    percentageToRemove = 100,
    shouldClaimAndClose = false,
    skipPreflight = false
  } = params;

  try {
    const dlmmPool = await createDLMMPool(lbPairAddress);
    const userPosition = await findUserPosition(dlmmPool, userKeypair, positionAddress);

    if (!userPosition) {
      return { success: false, error: "Position not found" };
    }

    const binIdsToRemove = userPosition.positionData.positionBinData.map(bin => bin.binId);

    if (binIdsToRemove.length === 0) {
      return { success: false, error: "No liquidity found in position" };
    }

    const basisPoints = Math.min(Math.max(percentageToRemove, 0), 100) * 100;

    const removeLiquidityTx = await dlmmPool.removeLiquidity({
      position: userPosition.publicKey,
      user: userKeypair.publicKey,
      fromBinId: binIdsToRemove[0],
      toBinId: binIdsToRemove[binIdsToRemove.length - 1],
      bps: new BN(basisPoints),
      shouldClaimAndClose,
    });

    const txs = Array.isArray(removeLiquidityTx) ? removeLiquidityTx : [removeLiquidityTx];
    const txHashes = await executeTransactions(txs, [userKeypair], skipPreflight);

    return {
      success: true,
      transactionHashes: txHashes
    };

  } catch (error: any) {
    return handleError(error);
  }
}

async function closePositionCompletely(params: ClosePositionParams): Promise<ClosePositionResult> {
  const { positionAddress, userKeypair, lbPairAddress, skipPreflight = false } = params;

  try {
    const dlmmPool = await createDLMMPool(lbPairAddress);
    const userPosition = await findUserPosition(dlmmPool, userKeypair, positionAddress);

    if (!userPosition) {
      return { success: false, error: "Position not found" };
    }

    const binIdsToRemove = userPosition.positionData.positionBinData.map(bin => bin.binId);

    if (binIdsToRemove.length > 0) {
      // Remove all liquidity and close position
      const removeLiquidityTx = await dlmmPool.removeLiquidity({
        position: userPosition.publicKey,
        user: userKeypair.publicKey,
        fromBinId: binIdsToRemove[0],
        toBinId: binIdsToRemove[binIdsToRemove.length - 1],
        bps: new BN(100 * 100), // 100%
        shouldClaimAndClose: true,
      });

      const txs = Array.isArray(removeLiquidityTx) ? removeLiquidityTx : [removeLiquidityTx];
      const txHashes = await executeTransactions(txs, [userKeypair], skipPreflight);

      return {
        success: true,
        transactionHashes: txHashes
      };
    } else {
      // Just close the position
      const closePositionTx = await dlmmPool.closePosition({
        owner: userKeypair.publicKey,
        position: userPosition,
      });

      const txHash = await executeTransaction(closePositionTx, [userKeypair], skipPreflight);

      return {
        success: true,
        transactionHashes: [txHash]
      };
    }

  } catch (error: any) {
    return handleError(error);
  }
}

async function closePositionOnly(params: ClosePositionParams): Promise<ClosePositionResult> {
  const { positionAddress, userKeypair, lbPairAddress, skipPreflight = false } = params;

  try {
    const dlmmPool = await createDLMMPool(lbPairAddress);
    const userPosition = await findUserPosition(dlmmPool, userKeypair, positionAddress);

    if (!userPosition) {
      return { success: false, error: "Position not found" };
    }

    const closePositionTx = await dlmmPool.closePosition({
      owner: userKeypair.publicKey,
      position: userPosition,
    });

    const txHash = await executeTransaction(closePositionTx, [userKeypair], skipPreflight);

    return {
      success: true,
      transactionHashes: [txHash]
    };

  } catch (error: any) {
    return handleError(error);
  }
}

async function claimFeesFromPosition(params: ClosePositionParams): Promise<ClosePositionResult> {
  const { positionAddress, userKeypair, lbPairAddress, skipPreflight = false } = params;

  try {
    const dlmmPool = await createDLMMPool(lbPairAddress);
    const userPosition = await findUserPosition(dlmmPool, userKeypair, positionAddress);

    if (!userPosition) {
      return { success: false, error: "Position not found" };
    }

    const claimFeeTx = await dlmmPool.claimSwapFee({
      owner: userKeypair.publicKey,
      position: userPosition,
    });

    if (!claimFeeTx) {
      return { success: false, error: "No claim fee transaction" };
    }

    const txHash = await executeTransaction(claimFeeTx, [userKeypair], skipPreflight);

    return {
      success: true,
      transactionHashes: [txHash]
    };

  } catch (error: any) {
    return handleError(error);
  }
}

async function claimAllFeesFromPositions(
  userKeypair: Keypair,
  lbPairAddress: PublicKey,
  skipPreflight: boolean = false
): Promise<ClosePositionResult> {
  try {
    const dlmmPool = await createDLMMPool(lbPairAddress);
    const { userPositions } = await dlmmPool.getPositionsByUserAndLbPair(userKeypair.publicKey);

    if (userPositions.length === 0) {
      return { success: false, error: "No positions found" };
    }

    const claimFeeTxs = await dlmmPool.claimAllSwapFee({
      owner: userKeypair.publicKey,
      positions: userPositions,
    });

    const txHashes = await executeTransactions(claimFeeTxs, [userKeypair], skipPreflight);

    return {
      success: true,
      transactionHashes: txHashes
    };

  } catch (error: any) {
    return handleError(error);
  }
}

// ===== POOL DISCOVERY METHODS =====

/**
 * Get all available Meteora DLMM pools from the API
 */
export async function getAvailablePools(): Promise<MeteoraPoolInfo[]> {
  try {
    const response = await fetch('https://dlmm-api.meteora.ag/pair/all');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch pools: ${response.status} ${response.statusText}`);
    }
    
    const pools: MeteoraPoolInfo[] = await response.json();
    return pools;
    
  } catch (error: any) {
    console.error('Failed to fetch Meteora pools:', error);
    throw new Error(`Pool discovery failed: ${error.message}`);
  }
}

/**
 * Search pools by token address (either mint_x or mint_y)
 */
export async function getPoolsByToken(tokenAddress: string): Promise<MeteoraPoolInfo[]> {
  try {
    const allPools = await getAvailablePools();
    
    return allPools.filter(pool => 
      pool.mint_x === tokenAddress || pool.mint_y === tokenAddress
    );
    
  } catch (error: any) {
    console.error('Failed to search pools by token:', error);
    throw new Error(`Token pool search failed: ${error.message}`);
  }
}

/**
 * Get popular pools sorted by liquidity
 */
export async function getPopularPools(limit: number = 10): Promise<MeteoraPoolInfo[]> {
  try {
    const allPools = await getAvailablePools();
    
    // Sort by liquidity (highest first) and take top N
    return allPools
      .sort((a, b) => parseFloat(b.liquidity) - parseFloat(a.liquidity))
      .slice(0, limit);
      
  } catch (error: any) {
    console.error('Failed to fetch popular pools:', error);
    throw new Error(`Popular pools fetch failed: ${error.message}`);
  }
}

/**
 * Search pools with advanced filters
 */
export async function searchPools(filters: PoolSearchFilters): Promise<MeteoraPoolInfo[]> {
  try {
    const allPools = await getAvailablePools();
    let filteredPools = allPools;
    
    // Filter by token address
    if (filters.tokenAddress) {
      filteredPools = filteredPools.filter(pool => 
        pool.mint_x === filters.tokenAddress || pool.mint_y === filters.tokenAddress
      );
    }
    
    // Filter by minimum liquidity
    if (filters.minLiquidity) {
      filteredPools = filteredPools.filter(pool => 
        parseFloat(pool.liquidity) >= filters.minLiquidity!
      );
    }
    
    // Filter by maximum bin step
    if (filters.maxBinStep) {
      filteredPools = filteredPools.filter(pool => 
        pool.bin_step <= filters.maxBinStep!
      );
    }
    
    // Filter by rewards
    if (filters.hasRewards) {
      filteredPools = filteredPools.filter(pool => 
        pool.reward_infos && pool.reward_infos.length > 0
      );
    }
    
    // Sort results
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'liquidity':
          filteredPools.sort((a, b) => parseFloat(b.liquidity) - parseFloat(a.liquidity));
          break;
        case 'fees':
          filteredPools.sort((a, b) => parseFloat(b.base_fee_percentage) - parseFloat(a.base_fee_percentage));
          break;
        case 'volume':
          // Note: Volume not available in current API response, fallback to liquidity
          filteredPools.sort((a, b) => parseFloat(b.liquidity) - parseFloat(a.liquidity));
          break;
      }
    }
    
    // Apply limit
    if (filters.limit) {
      filteredPools = filteredPools.slice(0, filters.limit);
    }
    
    return filteredPools;
    
  } catch (error: any) {
    console.error('Failed to search pools with filters:', error);
    throw new Error(`Pool search failed: ${error.message}`);
  }
}

/**
 * Get specific pool information by address
 */
export async function getPoolInfo(poolAddress: string): Promise<MeteoraPoolInfo | null> {
  try {
    const allPools = await getAvailablePools();
    
    return allPools.find(pool => pool.address === poolAddress) || null;
    
  } catch (error: any) {
    console.error('Failed to get pool info:', error);
    throw new Error(`Pool info fetch failed: ${error.message}`);
  }
}

/**
 * Get pools for a specific token pair
 */
export async function getPoolsForTokenPair(tokenA: string, tokenB: string): Promise<MeteoraPoolInfo[]> {
  try {
    const allPools = await getAvailablePools();
    
    return allPools.filter(pool => 
      (pool.mint_x === tokenA && pool.mint_y === tokenB) ||
      (pool.mint_x === tokenB && pool.mint_y === tokenA)
    );
    
  } catch (error: any) {
    console.error('Failed to get pools for token pair:', error);
    throw new Error(`Token pair pool search failed: ${error.message}`);
  }
}
