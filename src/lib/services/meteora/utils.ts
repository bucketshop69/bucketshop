import { Connection, Keypair, sendAndConfirmTransaction } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import DLMM from '@meteora-ag/dlmm';
import { DEFAULT_RPC_ENDPOINT } from '@/lib/constants/rpc';
import { DLMM_CONFIG } from './constants';
import { PercentageBasedRange, OptimalPercentages, BinRange } from './types';

// ===== HELPER FUNCTIONS =====

export function calculateGroupAggregates(allPairs: any[]) {
  const totalLiquidity = allPairs.reduce((sum, pool) => 
    sum + parseFloat(pool.liquidity || '0'), 0
  );
  
  const totalVolume24h = allPairs.reduce((sum, pool) => 
    sum + (pool.trade_volume_24h || 0), 0
  );
  
  const validAPRs = allPairs.map(pool => pool.apr || 0).filter(apr => apr > 0);
  const highestAPR = validAPRs.length > 0 ? Math.max(...validAPRs) : 0;
  const averageAPR = validAPRs.length > 0 ? validAPRs.reduce((sum, apr) => sum + apr, 0) / validAPRs.length : 0;
  
  return {
    totalLiquidity,
    totalVolume24h,
    highestAPR,
    totalPools: allPairs.length,
    averageAPR
  };
}

export async function executeTransaction(
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

export async function executeTransactions(
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

export function handleError(error: any): { success: false; error: string; logs?: string[] } {
  return {
    success: false,
    error: error.message || "Unknown error",
    logs: error.logs
  };
}

// ===== PRICE & RANGE CALCULATION UTILITIES =====

export function calculatePriceFromBinOffset(basePrice: number, binStep: number, binOffset: number): number {
  return basePrice * Math.pow(1 + binStep / DLMM_CONFIG.BASIS_POINTS_DIVISOR, binOffset);
}

export function getPercentagePerBin(binStep: number): number {
  return binStep / DLMM_CONFIG.PERCENTAGE_DIVISOR;
}

export function getMaxAchievablePercentage(binStep: number): number {
  const percentagePerBin = getPercentagePerBin(binStep);
  return DLMM_CONFIG.MAX_BINS_PER_SIDE * percentagePerBin;
}

export function calculateOptimalSinglePercentage(
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

export function calculateOptimalPercentages(
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

export function calculatePriceRange(
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

export function convertPricesToBinRange(
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

export function adjustBinLimits(
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

export function calculateActualPrices(
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

export function adjustStrategyBasedOnTokenAmounts(
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

export async function calculatePercentageBasedRange(
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

export function calculateBinBasedRange(
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