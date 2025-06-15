import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/lib/services/token.service';

/**
 * GET /api/tokens/[address]/rsi?period=14
 * Get RSI data for a token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period') || '14');

    if (!address || address.length < 32) {
      return NextResponse.json(
        { error: 'Invalid token address' },
        { status: 400 }
      );
    }

    if (period < 2 || period > 100) {
      return NextResponse.json(
        { error: 'RSI period must be between 2 and 100' },
        { status: 400 }
      );
    }

    const rsi = await TokenService.getCurrentRSI(address, period);
    
    if (rsi === null) {
      return NextResponse.json(
        { error: 'RSI data not available for this token' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      tokenAddress: address,
      period,
      values: [rsi], // Current RSI value
      lastUpdated: new Date(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
    
  } catch (error) {
    console.error(`Error fetching RSI for ${params.address}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch RSI data' },
      { status: 500 }
    );
  }
}