import { PublicKey, Keypair } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { StrategyType } from '@meteora-ag/dlmm';

// ===== POOL DISCOVERY TYPES =====

export interface MeteoraPoolInfo {
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
  current_price: number;
  apr: number;
  apy: number;
  farm_apr: number;
  farm_apy: number;
  cumulative_fee_volume: string;
  cumulative_trade_volume: string;
  trade_volume_24h: number;
  fees_24h: number;
  today_fees: number;
  hide: boolean;
  is_blacklisted: boolean;
  tags: string[];
  launchpad: any;
  reward_mint_x: string;
  reward_mint_y: string;
  fee_tvl_ratio: {
    min_30: number;
    hour_1: number;
    hour_2: number;
    [key: string]: number;
  };
  fees: {
    min_30: number;
    hour_1: number;
    hour_2: number;
    [key: string]: number;
  };
}

export interface MeteoraTokenGroup {
  name: string;
  pairs: MeteoraPoolInfo[];
  aggregates: {
    totalLiquidity: number;
    totalVolume24h: number;
    highestAPR: number;
    totalPools: number;
    averageAPR: number;
  };
}

export interface MeteoraGroupResponse {
  groups: MeteoraTokenGroup[];
}

export interface PoolSearchFilters {
  tokenAddress?: string;
  minLiquidity?: number;
  maxBinStep?: number;
  hasRewards?: boolean;
  sortBy?: 'liquidity' | 'volume' | 'fees';
  limit?: number;
}

// ===== POSITION MANAGEMENT TYPES =====

export interface PercentageBasedRange {
  percentageAbove?: number;
  percentageBelow?: number;
  side?: 'both' | 'above-only' | 'below-only';
}

export interface CreatePositionParams {
  lbPairAddress: PublicKey;
  userKeypair: Keypair;
  totalXAmount: BN;
  totalYAmount: BN;
  rangeInterval?: number;
  percentageRange?: PercentageBasedRange;
  strategyType?: StrategyType;
  skipPreflight?: boolean;
}

export interface CreatePositionResult {
  success: boolean;
  transactionHash?: string;
  positionAddress?: string;
  error?: string;
  logs?: string[];
}

export interface ClosePositionParams {
  positionAddress: PublicKey;
  userKeypair: Keypair;
  lbPairAddress: PublicKey;
  skipPreflight?: boolean;
}

export interface ClosePositionResult {
  success: boolean;
  transactionHashes?: string[];
  error?: string;
  logs?: string[];
}

export interface RemoveLiquidityParams {
  positionAddress: PublicKey;
  userKeypair: Keypair;
  lbPairAddress: PublicKey;
  percentageToRemove?: number;
  shouldClaimAndClose?: boolean;
  skipPreflight?: boolean;
}

export interface RemoveLiquidityResult {
  success: boolean;
  transactionHashes?: string[];
  error?: string;
  logs?: string[];
}

// ===== UTILITY TYPES =====

export interface BinRange {
  minBinId: number;
  maxBinId: number;
  minPrice: number;
  maxPrice: number;
}

export interface OptimalPercentages {
  percentageAbove: number;
  percentageBelow: number;
}