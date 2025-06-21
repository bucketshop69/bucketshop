import { METEORA_API } from './constants';
import { calculateGroupAggregates } from './utils';
import {
  MeteoraPoolInfo,
  MeteoraTokenGroup,
  MeteoraGroupResponse,
  PoolSearchFilters
} from './types';

// ===== POOL DISCOVERY METHODS =====

/**
 * Get all available Meteora DLMM pools grouped by token pairs
 */
export async function getAvailableGroups(): Promise<MeteoraTokenGroup[]> {
  try {
    const response = await fetch(METEORA_API.GROUPS_ENDPOINT);

    if (!response.ok) {
      throw new Error(`Failed to fetch pool groups: ${response.status} ${response.statusText}`);
    }

    const data: MeteoraGroupResponse = await response.json();

    // Process groups: calculate aggregates from ALL pools, then limit display to top 5
    const processedGroups = data.groups.map(group => {
      // Filter out blacklisted/hidden pools
      const validPairs = group.pairs.filter(pool => !pool.is_blacklisted && !pool.hide);

      // Calculate aggregates from ALL valid pools
      const aggregates = calculateGroupAggregates(validPairs);

      // Return group with aggregates and top 5 pairs for display
      return {
        ...group,
        pairs: validPairs.slice(0, 5), // Only top 5 for display
        aggregates
      };
    }).filter(group => group.pairs.length > 0);

    console.log(`Loaded ${processedGroups.length} token groups (showing top 5 pairs each, aggregates from all pools)`);
    return processedGroups;

  } catch (error: any) {
    console.error('Failed to fetch Meteora pool groups:', error);
    throw new Error(`Pool group discovery failed: ${error.message}`);
  }
}

/**
 * Get all available pools (flattened from groups for backward compatibility)
 */
export async function getAvailablePools(): Promise<MeteoraPoolInfo[]> {
  try {
    const groups = await getAvailableGroups();

    // Flatten groups into pools for backward compatibility
    const pools: MeteoraPoolInfo[] = [];
    groups.forEach(group => {
      pools.push(...group.pairs);
    });

    return pools;
  } catch (error: any) {
    console.error('Failed to get available pools:', error);
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

    // Filter by rewards (using farm_apr as indicator of rewards)
    if (filters.hasRewards) {
      filteredPools = filteredPools.filter(pool =>
        pool.farm_apr > 0
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
          filteredPools.sort((a, b) => b.trade_volume_24h - a.trade_volume_24h);
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