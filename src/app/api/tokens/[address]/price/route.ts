import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/lib/services/token.service';

/**
 * GET /api/tokens/[address]/price
 * Get current token price only (lightweight endpoint)
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

    const price = await TokenService.getCurrentPrice(address);
    
    if (price === null) {
      return NextResponse.json(
        { error: 'Price not available for this token' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      tokenAddress: address,
      currentPrice: price,
      priceChange24h: 0, // TODO: Calculate 24h change
      volume24h: 0, // TODO: Get volume data
      liquidity: 0, // TODO: Get liquidity data
      lastUpdated: new Date(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20',
      },
    });
    
  } catch (error) {
    console.error(`Error fetching price for ${params.address}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch token price' },
      { status: 500 }
    );
  }
}