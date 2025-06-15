import { TokenService } from '@/lib/services/token.service';

/**
 * Seed Script - Add Popular Solana Tokens for Testing
 * 
 * LEARNING: This script demonstrates how to populate your database
 * with real token data from Jupiter API.
 * 
 * Popular Solana tokens and their addresses:
 */

const POPULAR_TOKENS = [
  {
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Solana'
  },
  {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    name: 'USD Coin'
  },
  {
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    symbol: 'BONK',
    name: 'Bonk'
  },
  {
    address: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    symbol: 'MSOL',
    name: 'Marinade staked SOL'
  },
  {
    address: '5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm',
    symbol: 'SAMO',
    name: 'Samoyed Coin'
  }
];

/**
 * Seed the database with popular tokens
 */
export async function seedTokens() {
  console.log('🌱 Seeding database with popular tokens...');
  
  for (const token of POPULAR_TOKENS) {
    try {
      console.log(`Fetching data for ${token.symbol}...`);
      
      // This will:
      // 1. Call Jupiter API to get token metadata
      // 2. Store token in database
      // 3. Return the stored token
      const storedToken = await TokenService.getOrFetchToken(token.address);
      
      console.log(`✅ Added ${storedToken.symbol} (${storedToken.name})`);
    } catch (error) {
      console.error(`❌ Failed to add ${token.symbol}:`, error);
    }
  }
  
  console.log('🎉 Database seeding complete!');
}

// Run if called directly
if (require.main === module) {
  seedTokens()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}