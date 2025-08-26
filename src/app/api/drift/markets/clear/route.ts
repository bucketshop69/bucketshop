// Development endpoint to clear market data for testing auto-refresh
// Only available in development

import { NextResponse } from 'next/server';
import { redisHelpers } from '@/lib/redis';

async function clearMarketData() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Clear endpoint not available in production' },
      { status: 404 }
    );
  }
  
  try {
    console.log('🗑️ Clearing market data for testing...');
    
    const clearedCount = await redisHelpers.clearAllMarketData();
    
    console.log(`✅ Cleared ${clearedCount} market records`);
    
    return NextResponse.json({
      success: true,
      message: `Cleared ${clearedCount} market records`,
      clearedCount
    });
    
  } catch (error) {
    console.error('❌ Failed to clear market data:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Clear failed',
      message: 'Failed to clear market data'
    }, { 
      status: 500 
    });
  }
}

export async function POST() {
  return clearMarketData();
}

export async function GET() {
  return clearMarketData();
}