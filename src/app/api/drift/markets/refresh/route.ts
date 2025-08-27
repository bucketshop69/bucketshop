// Server-side market refresh endpoint
// This triggers a manual backend update when markets are empty

import { NextResponse } from 'next/server';
import { redisHelpers } from '@/lib/redis';

export async function POST() {
  try {
    // Check current market count
    const currentMarkets = await redisHelpers.getAllMarketData();
    
    // If we already have markets, no need to refresh
    if (currentMarkets.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Markets already available',
        count: currentMarkets.length,
        refreshed: false
      });
    }
    
    // Trigger the cron job internally
    const cronResponse = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/drift/cron/update-markets`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!cronResponse.ok) {
      throw new Error(`Cron job failed: ${cronResponse.status} ${cronResponse.statusText}`);
    }
    
    const cronResult = await cronResponse.json();
    
    // Verify markets were updated
    const updatedMarkets = await redisHelpers.getAllMarketData();
    
    return NextResponse.json({
      success: true,
      message: 'Markets refreshed successfully',
      count: updatedMarkets.length,
      refreshed: true,
      cronResult
    });
    
  } catch (error) {
    console.error('❌ Manual refresh failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Refresh failed',
      message: 'Failed to refresh market data'
    }, { 
      status: 500 
    });
  }
}