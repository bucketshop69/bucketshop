// Background job for updating market data from Drift API
// This endpoint is called by Vercel Cron every 60 seconds

import { NextRequest, NextResponse } from 'next/server';
import { redis, redisHelpers } from '@/lib/redis';
import { driftApiService } from '@/lib/drift/api-service';
import type { UpdateStatus } from '@/lib/redis';

// Security: Only allow Vercel Cron to call this endpoint
function validateCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  
  if (!process.env.CRON_SECRET) {
    console.error('❌ CRON_SECRET environment variable not set');
    return false;
  }
  
  return authHeader === expectedAuth;
}

// Main handler for the cron job
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  console.log('🔄 Starting market data update job...');
  
  // Security check
  if (!validateCronRequest(request)) {
    console.error('❌ Unauthorized cron request');
    return NextResponse.json(
      { error: 'Unauthorized' }, 
      { status: 401 }
    );
  }
  
  try {
    // Update status to indicate update is in progress
    const updateStatus: UpdateStatus = {
      isUpdating: true,
      lastAttempt: startTime,
      lastSuccess: 0,
      errorCount: 0
    };
    await redisHelpers.setUpdateStatus(updateStatus);
    
    // Step 1: Health check on Drift API
    console.log('🩺 Checking Drift API health...');
    const isHealthy = await driftApiService.healthCheck();
    
    if (!isHealthy) {
      throw new Error('Drift API health check failed');
    }
    
    console.log('✅ Drift API is healthy');
    
    // Step 2: Fetch fresh market data
    console.log('📊 Fetching market data from Drift...');
    const marketData = await driftApiService.getAllMarketData();
    
    if (marketData.length === 0) {
      throw new Error('No market data received from Drift API');
    }
    
    console.log(`📈 Retrieved ${marketData.length} markets`);
    
    // Step 3: Store data in Redis using pipeline for efficiency
    console.log('💾 Storing data in Redis...');
    
    const pipeline = redis.pipeline();
    const timestamp = Date.now();
    
    // Store each market's data
    for (const market of marketData) {
      const marketKey = `drift:market:${market.symbol}`;
      
      // Set with 2-minute TTL (safety buffer)
      pipeline.setex(marketKey, 120, JSON.stringify(market));
    }
    
    // Store metadata
    pipeline.set('drift:last_update', timestamp);
    pipeline.setex('drift:markets_count', 120, marketData.length);
    
    // Execute all Redis operations at once
    await pipeline.exec();
    
    // Step 4: Update status to success
    const successStatus: UpdateStatus = {
      isUpdating: false,
      lastAttempt: startTime,
      lastSuccess: timestamp,
      errorCount: 0
    };
    await redisHelpers.setUpdateStatus(successStatus);
    
    const duration = Date.now() - startTime;
    
    console.log(`🎉 Market data update completed successfully in ${duration}ms`);
    console.log(`📊 Updated ${marketData.length} markets`);
    
    // Return success response
    return NextResponse.json({
      success: true,
      timestamp,
      marketsUpdated: marketData.length,
      duration,
      message: 'Market data updated successfully'
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('❌ Market data update failed:', error);
    
    try {
      // Update status to reflect the error
      const currentStatus = await redisHelpers.getUpdateStatus();
      const errorStatus: UpdateStatus = {
        isUpdating: false,
        lastAttempt: startTime,
        lastSuccess: currentStatus?.lastSuccess || 0,
        errorCount: (currentStatus?.errorCount || 0) + 1,
        lastError: errorMessage
      };
      await redisHelpers.setUpdateStatus(errorStatus);
    } catch (statusError) {
      console.error('❌ Failed to update error status:', statusError);
    }
    
    // Return error response (don't throw - let Vercel cron continue)
    return NextResponse.json({
      success: false,
      error: errorMessage,
      duration,
      timestamp: startTime,
      message: 'Market data update failed'
    }, { 
      status: 500 
    });
  }
}

// Health check endpoint for monitoring
export async function POST(request: NextRequest) {
  try {
    // Check Redis connectivity
    const redisHealthy = await redisHelpers.healthCheck();
    
    // Check Drift API connectivity  
    const driftHealthy = await driftApiService.healthCheck();
    
    // Get last update status
    const updateStatus = await redisHelpers.getUpdateStatus();
    const lastUpdate = await redisHelpers.getLastUpdate();
    
    const healthData = {
      redis: redisHealthy,
      driftApi: driftHealthy,
      lastUpdate,
      updateStatus,
      timestamp: Date.now()
    };
    
    const overallHealth = redisHealthy && driftHealthy;
    
    return NextResponse.json({
      healthy: overallHealth,
      components: healthData
    }, {
      status: overallHealth ? 200 : 503
    });
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    return NextResponse.json({
      healthy: false,
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: Date.now()
    }, {
      status: 503
    });
  }
}