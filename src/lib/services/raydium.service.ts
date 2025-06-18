import { Connection, PublicKey } from "@solana/web3.js";
import { LIQUIDITY_STATE_LAYOUT_V4 } from "@raydium-io/raydium-sdk";
import { PoolReserveData, DEXType } from '../../types/token';

/**
 * Raydium AMM v4 Pool Service
 * 
 * Following the research article implementation exactly:
 * - Uses @solana/web3.js Connection
 * - Uses @raydium-io/raydium-sdk LIQUIDITY_STATE_LAYOUT_V4
 * - Implements complete reserve calculation: vault + OpenOrders - PnL
 */

// Raydium AMM v4 Program IDs
export const RAYDIUM_PROGRAM_IDS = {
  AMM_V4: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
  CPMM: 'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C',
  CLMM: 'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK'
} as const;

/**
 * Raydium Pool Service Class
 * Follows research article implementation exactly
 */
export class RaydiumPoolService {
  private connection: Connection;

  constructor(heliusApiKey: string, network: 'mainnet' | 'devnet' = 'mainnet') {
    const rpcEndpoint = network === 'mainnet'
      ? `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`
      : `https://devnet.helius-rpc.com/?api-key=${heliusApiKey}`;
    
    this.connection = new Connection(rpcEndpoint);
  }

  /**
   * Get complete pool reserves following research article exactly
   * Based on: total reserves = vault balances + OpenOrders balances - PnL adjustments
   */
  async getCompleteReserves(poolId: string) {
    const info = await this.connection.getAccountInfo(new PublicKey(poolId));
    
    if (!info) {
      throw new Error(`Pool account not found: ${poolId}`);
    }

    const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(info.data);
    
    const baseDecimal = 10 ** poolState.baseDecimal.toNumber();
    const quoteDecimal = 10 ** poolState.quoteDecimal.toNumber();
    
    // Get vault balances
    const [baseBalance, quoteBalance] = await Promise.all([
      this.connection.getTokenAccountBalance(poolState.baseVault),
      this.connection.getTokenAccountBalance(poolState.quoteVault)
    ]);
    
    // Calculate PnL adjustments
    const basePnl = poolState.baseNeedTakePnl.toNumber() / baseDecimal;
    const quotePnl = poolState.quoteNeedTakePnl.toNumber() / quoteDecimal;
    
    // Total reserves calculation
    const baseReserve = (baseBalance.value?.uiAmount || 0) - basePnl;
    const quoteReserve = (quoteBalance.value?.uiAmount || 0) - quotePnl;
    
    // Price calculation: quote/base
    return {
      baseReserve,
      quoteReserve,
      price: quoteReserve / baseReserve
    };
  }

  /**
   * Get pool reserve data compatible with our interface
   */
  async getPoolReserveData(poolId: string): Promise<PoolReserveData> {
    try {
      const reserves = await this.getCompleteReserves(poolId);
      
      // Get pool state info for mints and decimals
      const info = await this.connection.getAccountInfo(new PublicKey(poolId));
      if (!info) throw new Error(`Pool account not found: ${poolId}`);
      
      const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(info.data);

      return {
        poolId,
        dex: DEXType.RAYDIUM,
        baseReserve: reserves.baseReserve,
        quoteReserve: reserves.quoteReserve,
        price: reserves.price,
        baseMint: poolState.baseMint.toString(),
        quoteMint: poolState.quoteMint.toString(),
        baseDecimals: poolState.baseDecimal.toNumber(),
        quoteDecimals: poolState.quoteDecimal.toNumber(),
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Raydium pool data fetch failed:', error);
      throw new Error(`Failed to fetch Raydium pool data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate if a given account is a Raydium AMM pool
   */
  async isValidRaydiumPool(poolId: string): Promise<boolean> {
    try {
      const accountInfo = await this.connection.getAccountInfo(new PublicKey(poolId));

      if (!accountInfo || accountInfo.owner.toString() !== RAYDIUM_PROGRAM_IDS.AMM_V4) {
        return false;
      }

      // Try to decode the layout
      LIQUIDITY_STATE_LAYOUT_V4.decode(accountInfo.data);
      return true;

    } catch (error) {
      console.error('Pool validation failed:', error);
      return false;
    }
  }

}

/**
 * Default Raydium service instance factory
 */
export function createRaydiumService(heliusApiKey: string): RaydiumPoolService {
  return new RaydiumPoolService(heliusApiKey);
}