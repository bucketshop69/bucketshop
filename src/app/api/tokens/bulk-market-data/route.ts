import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/lib/services/token.service';

/**
 * POST /api/tokens/bulk-market-data
 * Get bulk market data for multiple tokens (for watchlist)
 */
export async function POST(request: NextRequest) {
  try {
    const { tokenAddresses }: { tokenAddresses: string[] } = await request.json();

    if (!Array.isArray(tokenAddresses)) {
      return NextResponse.json(
        { error: 'tokenAddresses must be an array' },
        { status: 400 }
      );
    }

    if (tokenAddresses.length === 0) {
      return NextResponse.json({
        tokens: [],
        lastUpdated: new Date().toISOString(),
      });
    }

    if (tokenAddresses.length > 50) {
      return NextResponse.json(
        { error: 'Cannot request more than 50 tokens at once' },
        { status: 400 }
      );
    }

    // Validate token addresses format
    const invalidAddresses = tokenAddresses.filter(addr => 
      !addr || typeof addr !== 'string' || addr.length < 32
    );
    
    if (invalidAddresses.length > 0) {
      return NextResponse.json(
        { error: 'Invalid token addresses provided' },
        { status: 400 }
      );
    }

    const bulkData = await TokenService.getBulkMarketData(tokenAddresses, true);
    
    // Transform the data to match our API response format
    const tokens = Object.entries(bulkData).map(([address, data]) => ({
      tokenAddress: address,
      symbol: data.symbol || 'UNKNOWN',
      name: data.name || 'Unknown Token',
      decimals: data.decimals || 6,
      iconUrl: data.iconUrl,
      marketCap: data.marketCap,
      totalSupply: data.totalSupply,
      firstDiscovered: data.firstDiscovered || new Date(),
      lastUpdated: data.lastUpdated || new Date(),
      currentPrice: data.currentPrice,
      priceChange24h: data.priceChange24h,
      volume24h: data.volume24h,
      liquidity: data.liquidity,
      rsi: data.rsi14,
      rsiSignal: data.rsi14 ? (
        data.rsi14 < 30 ? 'oversold' : 
        data.rsi14 > 70 ? 'overbought' : 
        'neutral'
      ) : undefined,
    }));

    return NextResponse.json({
      tokens,
      lastUpdated: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
      },
    });
    
  } catch (error) {
    console.error('Error fetching bulk market data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}