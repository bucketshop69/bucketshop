import { NextRequest, NextResponse } from 'next/server';
import { WatchlistService } from '@/lib/services/watchlist.service';
import { AddTokenToWatchlistInput } from '@/types/watchlist';

/**
 * GET /api/watchlist?walletAddress=xyz
 * Get user's complete watchlist with market data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const watchlist = await WatchlistService.getUserWatchlist(walletAddress);
    
    return NextResponse.json(watchlist, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
    
  } catch (error) {
    console.error('Error fetching user watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/watchlist
 * Add token to user's watchlist
 */
export async function POST(request: NextRequest) {
  let body: AddTokenToWatchlistInput | null = null;
  
  try {
    body = await request.json();
    
    // Validate required fields
    if (!body.tokenAddress || !body.walletAddress) {
      return NextResponse.json(
        { error: 'Token address and wallet address are required' },
        { status: 400 }
      );
    }

    const newItem = await WatchlistService.addTokenToWatchlist(body);
    
    return NextResponse.json(newItem, { status: 201 });
    
  } catch (error) {
    console.error('Error adding token to watchlist:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      tokenAddress: body?.tokenAddress,
      walletAddress: body?.walletAddress
    });
    
    // Handle specific errors
    if (error instanceof Error) {
      // Handle duplicate entry (already in watchlist)
      if (error.message.includes('SQLITE_CONSTRAINT_UNIQUE')) {
        return NextResponse.json(
          { error: 'Token already in watchlist' },
          { status: 409 }
        );
      }
      
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'Token already in watchlist' },
          { status: 409 }
        );
      }
      
      // Return the actual error message for debugging
      return NextResponse.json(
        { 
          error: 'Failed to add token to watchlist',
          details: error.message,
          tokenAddress: body?.tokenAddress 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add token to watchlist' },
      { status: 500 }
    );
  }
}