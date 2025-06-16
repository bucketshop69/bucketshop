import { MeteoraPoolState, PoolReserveData, DEXType } from '@/types/token';

/**
 * Meteora Dynamic AMM Service
 * 
 * Handles fetching and parsing Meteora Dynamic AMM pool data.
 * Features dynamic fee adjustment based on volatility and vault integration for yield.
 * 
 * Key Features:
 * - Dynamic fee calculation based on volatility
 * - Vault integration for additional yield
 * - Virtual price calculation including yield accumulation
 * - Support for both Dynamic AMM and DLMM pools
 */

// Meteora Program IDs
export const METEORA_PROGRAM_IDS = {
  DYNAMIC_AMM_V2: 'cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG',
  DLMM: 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo'
} as const;

// Dynamic AMM pool account layout offsets (bytes)
const DYNAMIC_AMM_LAYOUT = {
  TOKEN_A_MINT: 8,              // PublicKey (32 bytes) - Token A mint
  TOKEN_B_MINT: 40,             // PublicKey (32 bytes) - Token B mint  
  TOKEN_A_VAULT: 72,            // PublicKey (32 bytes) - Token A vault
  TOKEN_B_VAULT: 104,           // PublicKey (32 bytes) - Token B vault
  VOLATILITY_ACCUMULATOR: 136,  // u64 (8 bytes) - Tracks price volatility
  VARIABLE_FEE_CONTROL: 144,    // u64 (8 bytes) - Dynamic fee control
  ACTIVATION_POINT: 152         // Option<u64> (9 bytes) - Launch protection
};

/**
 * Meteora Dynamic AMM Service Class
 * Provides methods to fetch and parse Meteora pool data with dynamic fee calculations
 */
export class MeteoraPoolService {
  private rpcEndpoint: string;

  constructor(heliusApiKey: string, network: 'mainnet' | 'devnet' = 'mainnet') {
    this.rpcEndpoint = network === 'mainnet' 
      ? `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`
      : `https://devnet.helius-rpc.com/?api-key=${heliusApiKey}`;
  }

  /**
   * Fetch pool account data from Solana blockchain
   */
  private async getAccountInfo(accountAddress: string): Promise<any> {
    const response = await fetch(this.rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getAccountInfo',
        params: [
          accountAddress,
          { encoding: 'base64' }
        ]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`RPC Error: ${data.error.message}`);
    }

    return data.result?.value;
  }

  /**
   * Parse raw Meteora pool account data into structured format
   */
  private parseMeteoraAccountData(accountData: Buffer): MeteoraPoolState {
    // Helper function to read u64 as number
    const readU64 = (offset: number): number => {
      return Number(accountData.readBigUInt64LE(offset));
    };

    // Helper function to read PublicKey as base64 string
    const readPublicKey = (offset: number): string => {
      return accountData.subarray(offset, offset + 32).toString('base64');
    };

    // Helper function to read optional u64
    const readOptionalU64 = (offset: number): number | undefined => {
      const hasValue = accountData.readUInt8(offset) === 1;
      return hasValue ? Number(accountData.readBigUInt64LE(offset + 1)) : undefined;
    };

    return {
      tokenAMint: readPublicKey(DYNAMIC_AMM_LAYOUT.TOKEN_A_MINT),
      tokenBMint: readPublicKey(DYNAMIC_AMM_LAYOUT.TOKEN_B_MINT),
      tokenAVault: readPublicKey(DYNAMIC_AMM_LAYOUT.TOKEN_A_VAULT),
      tokenBVault: readPublicKey(DYNAMIC_AMM_LAYOUT.TOKEN_B_VAULT),
      volatilityAccumulator: readU64(DYNAMIC_AMM_LAYOUT.VOLATILITY_ACCUMULATOR),
      variableFeeControl: readU64(DYNAMIC_AMM_LAYOUT.VARIABLE_FEE_CONTROL),
      activationPoint: readOptionalU64(DYNAMIC_AMM_LAYOUT.ACTIVATION_POINT)
    };
  }

  /**
   * Calculate dynamic fee based on volatility
   * Formula: ((volatilityAccumulator * binStep)^2 * variableFeeControl + 99_999_999_999) / 100_000_000_000
   */
  private calculateDynamicFee(volatilityAccumulator: number, variableFeeControl: number, binStep: number = 1): number {
    const numerator = Math.pow(volatilityAccumulator * binStep, 2) * variableFeeControl + 99_999_999_999;
    const dynamicFeeNumerator = numerator / 100_000_000_000;
    return (dynamicFeeNumerator / 1_000_000_000) * 100; // Convert to percentage
  }

  /**
   * Get token account balance
   */
  private async getTokenAccountBalance(vaultAddress: string): Promise<number> {
    const response = await fetch(this.rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccountBalance',
        params: [vaultAddress]
      })
    });

    const data = await response.json();
    return data.result?.value?.uiAmount || 0;
  }

  /**
   * Get token mint information including decimals
   */
  private async getTokenMintInfo(mintAddress: string): Promise<{ decimals: number }> {
    const response = await fetch(this.rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getParsedAccountInfo',
        params: [
          mintAddress,
          { encoding: 'jsonParsed' }
        ]
      })
    });

    const data = await response.json();
    return {
      decimals: data.result?.value?.data?.parsed?.info?.decimals || 6
    };
  }

  /**
   * Calculate virtual price including vault yield
   * Note: This is a simplified calculation. Production implementation would 
   * need integration with actual vault protocols (Solend, Mango, etc.)
   */
  private calculateVirtualPrice(basePrice: number, yieldAccumulator: number = 0): number {
    // Simplified virtual price calculation
    // In production, this would query actual vault protocols for yield rates
    const yieldMultiplier = 1 + (yieldAccumulator / 1_000_000); // Assuming 6 decimal places
    return basePrice * yieldMultiplier;
  }

  /**
   * Get complete pool reserve data and price information
   */
  async getPoolReserveData(poolId: string): Promise<PoolReserveData> {
    try {
      // Fetch pool account data
      const accountInfo = await this.getAccountInfo(poolId);
      
      if (!accountInfo) {
        throw new Error(`Meteora pool account not found: ${poolId}`);
      }

      // Parse account data
      const accountData = Buffer.from(accountInfo.data[0], 'base64');
      const poolState = this.parseMeteoraAccountData(accountData);

      // Get token mint information for decimals
      const [mintAInfo, mintBInfo] = await Promise.all([
        this.getTokenMintInfo(poolState.tokenAMint),
        this.getTokenMintInfo(poolState.tokenBMint)
      ]);

      // Get vault balances (reserves)
      const [reserveA, reserveB] = await Promise.all([
        this.getTokenAccountBalance(poolState.tokenAVault),
        this.getTokenAccountBalance(poolState.tokenBVault)
      ]);

      // Calculate basic constant product price
      const basePrice = reserveA > 0 ? reserveB / reserveA : 0;

      // Calculate virtual price (including potential vault yield)
      const virtualPrice = this.calculateVirtualPrice(basePrice);

      // Calculate dynamic fee for reference
      const dynamicFee = this.calculateDynamicFee(
        poolState.volatilityAccumulator,
        poolState.variableFeeControl
      );

      return {
        poolId,
        dex: DEXType.METEORA,
        baseReserve: reserveA,
        quoteReserve: reserveB,
        price: virtualPrice, // Use virtual price that includes yield
        baseMint: poolState.tokenAMint,
        quoteMint: poolState.tokenBMint,
        baseDecimals: mintAInfo.decimals,
        quoteDecimals: mintBInfo.decimals,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Meteora pool data fetch failed:', error);
      throw new Error(`Failed to fetch Meteora pool data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate if a given account is a Meteora Dynamic AMM pool
   */
  async isValidMeteoraPool(poolId: string): Promise<boolean> {
    try {
      const accountInfo = await this.getAccountInfo(poolId);
      
      if (!accountInfo || 
          (accountInfo.owner !== METEORA_PROGRAM_IDS.DYNAMIC_AMM_V2 && 
           accountInfo.owner !== METEORA_PROGRAM_IDS.DLMM)) {
        return false;
      }

      // Check if account data has reasonable size for Dynamic AMM
      const accountData = Buffer.from(accountInfo.data[0], 'base64');
      return accountData.length >= 200; // Minimum size for Dynamic AMM account

    } catch (error) {
      console.error('Meteora pool validation failed:', error);
      return false;
    }
  }

  /**
   * Get additional pool metrics specific to Meteora
   */
  async getPoolMetrics(poolId: string): Promise<{
    dynamicFee: number;
    volatilityAccumulator: number;
    variableFeeControl: number;
    isLaunchProtected: boolean;
  }> {
    const accountInfo = await this.getAccountInfo(poolId);
    const accountData = Buffer.from(accountInfo.data[0], 'base64');
    const poolState = this.parseMeteoraAccountData(accountData);

    const dynamicFee = this.calculateDynamicFee(
      poolState.volatilityAccumulator,
      poolState.variableFeeControl
    );

    return {
      dynamicFee,
      volatilityAccumulator: poolState.volatilityAccumulator,
      variableFeeControl: poolState.variableFeeControl,
      isLaunchProtected: poolState.activationPoint !== undefined
    };
  }
}

/**
 * Default Meteora service instance factory
 */
export function createMeteoraService(heliusApiKey: string): MeteoraPoolService {
  return new MeteoraPoolService(heliusApiKey);
}