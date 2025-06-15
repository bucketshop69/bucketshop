import { NextRequest, NextResponse } from 'next/server';
import { WatchlistService } from '@/lib/services/watchlist.service';
import { UpdateWatchlistItemInput } from '@/types/watchlist';

/**
 * PATCH /api/watchlist/[id]
 * Update watchlist item (notes, active status)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid watchlist item ID' },
        { status: 400 }
      );
    }

    const body: Omit<UpdateWatchlistItemInput, 'id'> = await request.json();
    const input: UpdateWatchlistItemInput = { id, ...body };

    const updatedItem = await WatchlistService.updateWatchlistItem(input);
    
    if (!updatedItem) {
      return NextResponse.json(
        { error: 'Watchlist item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedItem);
    
  } catch (error) {
    console.error('Error updating watchlist item:', error);
    return NextResponse.json(
      { error: 'Failed to update watchlist item' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/watchlist/[id]
 * Remove token from watchlist
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid watchlist item ID' },
        { status: 400 }
      );
    }

    // Get wallet address from request body or use demo wallet
    // In production, this would come from authentication
    const body = await request.json().catch(() => ({}));
    const walletAddress = body.walletAddress || '7EHgQpahjYzu8qCShiSW3jFpLnmoZNosMi9hVQp1mEsj';
    
    const success = await WatchlistService.removeFromWatchlist(id, walletAddress);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Watchlist item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove from watchlist' },
      { status: 500 }
    );
  }
}