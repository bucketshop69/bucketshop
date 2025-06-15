import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/lib/services/token.service';

/**
 * GET /api/tokens/search?q=address (for token address lookup)
 * GET /api/tokens/search?q=query&type=local (for local database search)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'address';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.trim().length < 1) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    if (type === 'address') {
      // Search by token address (exact lookup)
      const result = await TokenService.searchTokenByAddress(query.trim());
      
      if (!result) {
        return NextResponse.json({
          results: [],
          totalCount: 0,
          message: 'Token not found'
        });
      }
      
      return NextResponse.json({
        results: [result],
        totalCount: 1,
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
      
    } else if (type === 'local') {
      // Search local database for suggestions
      const results = await TokenService.searchLocalTokens(query.trim(), limit);
      
      return NextResponse.json({
        results,
        totalCount: results.length,
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid search type. Use "address" or "local"' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Error searching tokens:', error);
    return NextResponse.json(
      { error: 'Failed to search tokens' },
      { status: 500 }
    );
  }
}