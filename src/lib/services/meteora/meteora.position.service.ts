import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import DLMM, { StrategyType } from '@meteora-ag/dlmm';
import { BN } from "@coral-xyz/anchor";
import { DEFAULT_RPC_ENDPOINT } from '@/lib/constants/rpc';
import { DLMM_CONFIG } from './constants';
import { 
  executeTransaction, 
  executeTransactions, 
  handleError,
  calculatePercentageBasedRange,
  calculateBinBasedRange,
  adjustStrategyBasedOnTokenAmounts
} from './utils';
import {
  CreatePositionParams,
  CreatePositionResult,
  ClosePositionParams,
  ClosePositionResult,
  RemoveLiquidityParams,
  RemoveLiquidityResult,
  BinRange
} from './types';

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

// ===== MAIN POSITION FUNCTIONS =====

/**
 * Create a new position and add liquidity
 */
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

/**
 * Remove liquidity from a position
 */
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

/**
 * Close position completely (remove all liquidity and close)
 */
export async function closePositionCompletely(params: ClosePositionParams): Promise<ClosePositionResult> {
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

/**
 * Close position only (without removing liquidity first)
 */
export async function closePositionOnly(params: ClosePositionParams): Promise<ClosePositionResult> {
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

/**
 * Claim fees from a specific position
 */
export async function claimFeesFromPosition(params: ClosePositionParams): Promise<ClosePositionResult> {
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

/**
 * Claim all fees from all positions for a user
 */
export async function claimAllFeesFromPositions(
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