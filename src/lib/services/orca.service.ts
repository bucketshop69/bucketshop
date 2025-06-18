import { OrcaWhirlpoolState, PoolReserveData, DEXType } from '@/types/token';

/**
 * Orca Whirlpools Service
 * 
 * Handles fetching and parsing Orca Whirlpool concentrated liquidity pool data.
 * Uses sqrt price mechanism with Q64.64 fixed-point numbers and tick-based pricing.
 * 
 * Key Features:
 * - Sqrt price to decimal price conversion
 * - Tick-based concentrated liquidity parsing
 * - Position NFT integration awareness
 * - Support for custom liquidity ranges
 */

// Orca Whirlpools Program ID
export const ORCA_PROGRAM_IDS = {
  WHIRLPOOLS: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc'
} as const;

// Whirlpool account layout offsets (bytes)
const WHIRLPOOL_LAYOUT = {
  LIQUIDITY: 101,           // u128 (16 bytes) - Current active liquidity
  SQRT_PRICE: 117,          // u128 (16 bytes) - Current sqrt price (Q64.64)
  TICK_CURRENT_INDEX: 133,  // i32 (4 bytes) - Current tick index
  TOKEN_MINT_A: 8,          // PublicKey (32 bytes) - Token A mint
  TOKEN_VAULT_A: 40,        // PublicKey (32 bytes) - Token A vault
  TOKEN_MINT_B: 72,         // PublicKey (32 bytes) - Token B mint
  TOKEN_VAULT_B: 104,       // PublicKey (32 bytes) - Token B vault
  FEE_RATE: 137,            // u16 (2 bytes) - Fee rate (basis points)
  TICK_SPACING: 139         // u16 (2 bytes) - Tick spacing
};

/**
 * Orca Whirlpools Service Class
 * Provides methods to fetch and parse Orca concentrated liquidity pool data
 */
export class OrcaPoolService {
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
   * Parse raw Whirlpool account data into structured format
   */
  private parseWhirlpoolAccountData(accountData: Buffer): OrcaWhirlpoolState {
    // Helper function to read u128 as string (for large numbers)
    const readU128 = (offset: number): string => {
      const low = accountData.readBigUInt64LE(offset);
      const high = accountData.readBigUInt64LE(offset + 8);
      return (high * BigInt(2 ** 64) + low).toString();
    };

    // Helper function to read i32 as number
    const readI32 = (offset: number): number => {
      return accountData.readInt32LE(offset);
    };

    // Helper function to read u16 as number
    const readU16 = (offset: number): number => {
      return accountData.readUInt16LE(offset);
    };

    // Helper function to read PublicKey as base64 string
    const readPublicKey = (offset: number): string => {
      return accountData.subarray(offset, offset + 32).toString('base64');
    };

    return {
      liquidity: readU128(WHIRLPOOL_LAYOUT.LIQUIDITY),
      sqrtPrice: readU128(WHIRLPOOL_LAYOUT.SQRT_PRICE),
      tickCurrentIndex: readI32(WHIRLPOOL_LAYOUT.TICK_CURRENT_INDEX),
      tokenMintA: readPublicKey(WHIRLPOOL_LAYOUT.TOKEN_MINT_A),
      tokenVaultA: readPublicKey(WHIRLPOOL_LAYOUT.TOKEN_VAULT_A),
      tokenMintB: readPublicKey(WHIRLPOOL_LAYOUT.TOKEN_MINT_B),
      tokenVaultB: readPublicKey(WHIRLPOOL_LAYOUT.TOKEN_VAULT_B),
      feeRate: readU16(WHIRLPOOL_LAYOUT.FEE_RATE),
      tickSpacing: readU16(WHIRLPOOL_LAYOUT.TICK_SPACING)
    };
  }

  /**
   * Convert sqrt price (Q64.64) to decimal price
   */
  private sqrtPriceToDecimalPrice(sqrtPrice: string, decimalsA: number, decimalsB: number): number {
    const sqrtPriceNum = Number(sqrtPrice);
    
    // Convert Q64.64 to decimal: divide by 2^64
    const sqrtPriceDecimal = sqrtPriceNum / Math.pow(2, 64);
    
    // Square to get the actual price
    const price = Math.pow(sqrtPriceDecimal, 2);
    
    // Adjust for token decimals (price = tokenB per tokenA)
    return price * Math.pow(10, decimalsB - decimalsA);
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
   * Get complete pool reserve data and price information
   */
  async getPoolReserveData(poolId: string): Promise<PoolReserveData> {
    try {
      // Fetch pool account data
      const accountInfo = await this.getAccountInfo(poolId);
      
      if (!accountInfo) {
        throw new Error(`Whirlpool account not found: ${poolId}`);
      }

      // Parse account data
      const accountData = Buffer.from(accountInfo.data[0], 'base64');
      const poolState = this.parseWhirlpoolAccountData(accountData);

      // Get token mint information for decimals
      const [mintAInfo, mintBInfo] = await Promise.all([
        this.getTokenMintInfo(poolState.tokenMintA),
        this.getTokenMintInfo(poolState.tokenMintB)
      ]);

      // Get vault balances (reserves)
      const [reserveA, reserveB] = await Promise.all([
        this.getTokenAccountBalance(poolState.tokenVaultA),
        this.getTokenAccountBalance(poolState.tokenVaultB)
      ]);

      // Calculate price from sqrt price
      const price = this.sqrtPriceToDecimalPrice(
        poolState.sqrtPrice,
        mintAInfo.decimals,
        mintBInfo.decimals
      );

      return {
        poolId,
        dex: DEXType.ORCA,
        baseReserve: reserveA,
        quoteReserve: reserveB,
        price,
        baseMint: poolState.tokenMintA,
        quoteMint: poolState.tokenMintB,
        baseDecimals: mintAInfo.decimals,
        quoteDecimals: mintBInfo.decimals,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Orca pool data fetch failed:', error);
      throw new Error(`Failed to fetch Orca pool data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate if a given account is an Orca Whirlpool
   */
  async isValidOrcaPool(poolId: string): Promise<boolean> {
    try {
      const accountInfo = await this.getAccountInfo(poolId);
      
      if (!accountInfo || accountInfo.owner !== ORCA_PROGRAM_IDS.WHIRLPOOLS) {
        return false;
      }

      // Check if account data has correct layout size for Whirlpool
      const accountData = Buffer.from(accountInfo.data[0], 'base64');
      return accountData.length >= 150; // Minimum size for Whirlpool account

    } catch (error) {
      console.error('Orca pool validation failed:', error);
      return false;
    }
  }
}

/**
 * Default Orca service instance factory
 */
export function createOrcaService(heliusApiKey: string): OrcaPoolService {
  return new OrcaPoolService(heliusApiKey);
}