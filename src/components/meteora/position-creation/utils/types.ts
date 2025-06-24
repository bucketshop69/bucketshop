// Position creation types for meteora components

export type PositionType = 'single' | 'both';
export type SelectedToken = 'tokenX' | 'tokenY' | null;
export type Strategy = 'spot' | 'curve' | 'bidask';

export interface BinRangeConfig {
  min: number;
  max: number;
  binRange: [number, number];
  description: string;
}

export interface BinRangeCalculation {
  bothTokens: BinRangeConfig;
  tokenXOnly: BinRangeConfig;
  tokenYOnly: BinRangeConfig;
}

export interface PositionCreationState {
  // Step 1: Position Type
  positionType: PositionType;
  selectedToken: SelectedToken;
  
  // Step 2: SOL Allocation
  totalSolAllocation: number;
  availableSolBalance: number;
  
  // Step 3: Calculated Amounts
  calculatedTokenXAmount: number;
  calculatedTokenYAmount: number;
  requiresSwap: boolean;
  
  // Step 4: Strategy
  strategy: Strategy;
}

export interface RangeDisplayResult {
  min: number;
  max: number;
  description: string;
  percentageRange: string;
}

export interface BinData {
  bin: number;
  height: number;
  fill: string;
  price: number;
}