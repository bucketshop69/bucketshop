import { PoolReserveData, DEXType } from '@/types/token';
import { RaydiumPoolService, createRaydiumService } from './raydium.service';
import { OrcaPoolService, createOrcaService } from './orca.service';
import { MeteoraPoolService, createMeteoraService } from './meteora.service';

/**
 * Unified Pool Service
 * 
 * Orchestrates pool data fetching across multiple DEXs (Raydium, Orca, Meteora).
 * Provides a single interface for pool reserve data and price calculation regardless of DEX.
 * 
 * Key Features:
 * - Automatic DEX detection and routing
 * - Unified interface for all supported DEXs
 * - Error handling and fallback mechanisms
 * - Pool validation across protocols
 */

export interface PoolServiceConfig {
  heliusApiKey: string;
  network?: 'mainnet' | 'devnet';
  enabledDEXs?: DEXType[];
}

/**
 * Main Pool Service Class
 * Routes pool requests to appropriate DEX-specific services
 */
export class PoolService {
  private raydiumService: RaydiumPoolService;
  private orcaService: OrcaPoolService;
  private meteoraService: MeteoraPoolService;
  private enabledDEXs: Set<DEXType>;

  constructor(config: PoolServiceConfig) {
    const { heliusApiKey, network = 'mainnet', enabledDEXs = [DEXType.RAYDIUM, DEXType.ORCA, DEXType.METEORA] } = config;

    // Initialize DEX-specific services
    this.raydiumService = createRaydiumService(heliusApiKey);
    this.orcaService = createOrcaService(heliusApiKey);
    this.meteoraService = createMeteoraService(heliusApiKey);
    
    this.enabledDEXs = new Set(enabledDEXs);
  }

  /**
   * Get pool reserve data by automatically detecting the DEX type
   */
  async getPoolReserveData(poolId: string, dexHint?: DEXType): Promise<PoolReserveData> {
    // If DEX is specified, try that first
    if (dexHint && this.enabledDEXs.has(dexHint)) {
      try {
        return await this.getPoolReserveDataByDEX(poolId, dexHint);
      } catch (error) {
        console.warn(`Failed to fetch pool data with DEX hint ${dexHint}:`, error);
        // Continue with auto-detection
      }
    }

    // Auto-detect DEX by trying each service
    const errors: Array<{ dex: DEXType; error: Error }> = [];
    
    for (const dex of this.enabledDEXs) {
      try {
        return await this.getPoolReserveDataByDEX(poolId, dex);
      } catch (error) {
        errors.push({ 
          dex, 
          error: error instanceof Error ? error : new Error('Unknown error') 
        });
      }
    }

    // If all DEXs failed, throw comprehensive error
    const errorMessages = errors.map(({ dex, error }) => `${dex}: ${error.message}`).join('; ');
    throw new Error(`Failed to fetch pool data from all DEXs - ${errorMessages}`);
  }

  /**
   * Get pool reserve data from specific DEX
   */
  async getPoolReserveDataByDEX(poolId: string, dex: DEXType): Promise<PoolReserveData> {
    switch (dex) {
      case DEXType.RAYDIUM:
        if (!this.enabledDEXs.has(DEXType.RAYDIUM)) {
          throw new Error('Raydium DEX is not enabled');
        }
        return await this.raydiumService.getPoolReserveData(poolId);

      case DEXType.ORCA:
        if (!this.enabledDEXs.has(DEXType.ORCA)) {
          throw new Error('Orca DEX is not enabled');
        }
        return await this.orcaService.getPoolReserveData(poolId);

      case DEXType.METEORA:
        if (!this.enabledDEXs.has(DEXType.METEORA)) {
          throw new Error('Meteora DEX is not enabled');
        }
        return await this.meteoraService.getPoolReserveData(poolId);

      case DEXType.PUMP_FUN:
        throw new Error('Pump.fun pools not yet supported');

      default:
        throw new Error(`Unsupported DEX: ${dex}`);
    }
  }

  /**
   * Validate if a pool ID is valid for any enabled DEX
   */
  async validatePool(poolId: string): Promise<{ isValid: boolean; dex?: DEXType }> {
    for (const dex of this.enabledDEXs) {
      try {
        const isValid = await this.isValidPoolForDEX(poolId, dex);
        if (isValid) {
          return { isValid: true, dex };
        }
      } catch (error) {
        // Continue checking other DEXs
        console.debug(`Pool validation failed for ${dex}:`, error);
      }
    }

    return { isValid: false };
  }

  /**
   * Check if pool is valid for specific DEX
   */
  async isValidPoolForDEX(poolId: string, dex: DEXType): Promise<boolean> {
    switch (dex) {
      case DEXType.RAYDIUM:
        return await this.raydiumService.isValidRaydiumPool(poolId);
      case DEXType.ORCA:
        return await this.orcaService.isValidOrcaPool(poolId);
      case DEXType.METEORA:
        return await this.meteoraService.isValidMeteoraPool(poolId);
      default:
        return false;
    }
  }

  /**
   * Get pool data for multiple pools concurrently
   */
  async getMultiplePoolData(poolRequests: Array<{ poolId: string; dex?: DEXType }>): Promise<Array<{
    poolId: string;
    data?: PoolReserveData;
    error?: string;
  }>> {
    const promises = poolRequests.map(async ({ poolId, dex }) => {
      try {
        const data = await this.getPoolReserveData(poolId, dex);
        return { poolId, data };
      } catch (error) {
        return { 
          poolId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    });

    return await Promise.all(promises);
  }

  /**
   * Find pools for a specific token across all DEXs
   * Note: This would require additional implementation to search program accounts
   */
  async findPoolsForToken(tokenMint: string): Promise<PoolReserveData[]> {
    // This is a placeholder for future implementation
    // Would require using getProgramAccounts with proper filters for each DEX
    throw new Error('Pool discovery not yet implemented. Use specific pool IDs for now.');
  }

  /**
   * Get enabled DEXs
   */
  getEnabledDEXs(): DEXType[] {
    return Array.from(this.enabledDEXs);
  }

  /**
   * Enable/disable specific DEX
   */
  setDEXEnabled(dex: DEXType, enabled: boolean): void {
    if (enabled) {
      this.enabledDEXs.add(dex);
    } else {
      this.enabledDEXs.delete(dex);
    }
  }
}

/**
 * Default pool service instance factory
 */
export function createPoolService(config: PoolServiceConfig): PoolService {
  return new PoolService(config);
}

/**
 * Convenience function to create pool service with just API key
 */
export function createDefaultPoolService(heliusApiKey: string): PoolService {
  return new PoolService({
    heliusApiKey,
    network: 'mainnet',
    enabledDEXs: [DEXType.RAYDIUM, DEXType.ORCA, DEXType.METEORA]
  });
}