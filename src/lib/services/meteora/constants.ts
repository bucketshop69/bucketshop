// ===== DLMM CONFIGURATION =====
export const DLMM_CONFIG = {
  MAX_BINS: 69,
  MAX_BINS_PER_SIDE: 34,
  DEFAULT_RANGE_INTERVAL: 6,
  BASIS_POINTS_DIVISOR: 10000,
  PERCENTAGE_DIVISOR: 100
} as const;

// ===== API ENDPOINTS =====
export const METEORA_API = {
  GROUPS_ENDPOINT: 'https://v2.meteora.ag/dlmm-api/pair/all_by_groups?limit=30&page=0&sort_key=volume&order_by=desc',
  POOLS_ENDPOINT: 'https://dlmm-api.meteora.ag/pair/all'
} as const;