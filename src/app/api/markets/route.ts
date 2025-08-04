/**
 * Markets API Route - Server-side Drift Protocol market data
 * 
 * This API route provides access to Drift Protocol perpetual markets
 * using the full Drift SDK on the server side.
 * 
 * Endpoints:
 * GET /api/markets - Get all perpetual markets
 * GET /api/markets?symbol=BTC-PERP - Get specific market
 * GET /api/markets?extended=true - Get markets with UI data
 */

import { NextRequest, NextResponse } from 'next/server';
import { driftService } from '@/lib/drift/DriftService';

/**
 * GET /api/markets
 * 
 * Query parameters:
 * - symbol: Get specific market by symbol
 * - extended: Include UI metadata (true/false)
 * - cache: Force cache refresh (false to bypass cache)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const extended = searchParams.get('extended') === 'true';
    const bypassCache = searchParams.get('cache') === 'false';
    
    // Clear cache if requested
    if (bypassCache) {
      driftService.clearCache();
    }

    console.log(`Markets API called: symbol=${symbol}, extended=${extended}, bypassCache=${bypassCache}`);

    // Handle specific market request
    if (symbol) {
      const market = await driftService.getMarketBySymbol(symbol);
      
      if (!market) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Market ${symbol} not found`,
            timestamp: Date.now()
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: market,
        timestamp: Date.now(),
      });
    }

    // Handle extended markets request
    if (extended) {
      const markets = await driftService.getExtendedMarkets();
      
      return NextResponse.json({
        success: true,
        data: markets,
        count: markets.length,
        timestamp: Date.now(),
      });
    }

    // Handle standard markets request
    const response = await driftService.getPerpMarkets();
    
    if (!response.success) {
      return NextResponse.json(
        {
          success: false,
          error: response.error || 'Failed to fetch markets',
          timestamp: response.timestamp,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: response.data,
      count: response.data?.length || 0,
      source: response.source,
      timestamp: response.timestamp,
    });

  } catch (error) {
    console.error('Markets API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/markets
 * 
 * Administrative operations (cache management, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'clear-cache':
        driftService.clearCache();
        return NextResponse.json({
          success: true,
          message: 'Cache cleared successfully',
          timestamp: Date.now(),
        });

      case 'health-check':
        const health = await driftService.healthCheck();
        return NextResponse.json({
          success: true,
          data: health,
          timestamp: Date.now(),
        });

      case 'cache-info':
        const cacheInfo = driftService.getCacheInfo();
        return NextResponse.json({
          success: true,
          data: cacheInfo,
          timestamp: Date.now(),
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`,
            timestamp: Date.now(),
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Markets POST API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}