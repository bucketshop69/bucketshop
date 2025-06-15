import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/lib/services/token.service';

/**
 * GET /api/tokens/[address]/market-data
 * Get detailed token information with market data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    if (!address || address.length < 32) {
      return NextResponse.json(
        { error: 'Invalid token address' },
        { status: 400 }
      );
    }

    const tokenData = await TokenService.getTokenWithMarketData(address);
    
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    // Transform to match frontend expectations
    const response = {
      tokenAddress: address,
      symbol: tokenData.symbol,
      name: tokenData.name,
      decimals: tokenData.decimals,
      iconUrl: tokenData.iconUrl,
      marketCap: tokenData.marketCap,
      totalSupply: tokenData.totalSupply,
      firstDiscovered: tokenData.firstDiscovered,
      lastUpdated: tokenData.lastUpdated,
      currentPrice: tokenData.currentPrice,
      priceChange24h: tokenData.priceChange24h,
      volume24h: tokenData.volume24h,
      liquidity: tokenData.liquidity,
      rsi: tokenData.rsi14,
      rsiSignal: tokenData.rsi14 ? (
        tokenData.rsi14 < 30 ? 'oversold' : 
        tokenData.rsi14 > 70 ? 'overbought' : 
        'neutral'
      ) : undefined,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
    
  } catch (error) {
    console.error(`Error fetching market data for ${params.address}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch token market data' },
      { status: 500 }
    );
  }
}