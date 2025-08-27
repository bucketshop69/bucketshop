import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { DriftTransactionService } from '@/lib/drift/DriftTransactionService';

export async function POST(request: NextRequest) {
  let driftService: DriftTransactionService | null = null;
  
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Create a server-side wallet for position reading (same pattern as other endpoints)
    const publicKey = new PublicKey(walletAddress);
    const serverWallet = {
      publicKey: publicKey,
      signTransaction: async () => { throw new Error('Server-side wallet - signing not supported'); },
      signAllTransactions: async () => { throw new Error('Server-side wallet - signing not supported'); },
    };

    driftService = new DriftTransactionService();
    const connected = await driftService.connect(serverWallet as any);

    if (!connected) {
      return NextResponse.json(
        { error: 'Failed to connect to Drift' },
        { status: 500 }
      );
    }

    const openPositions = await driftService.getOpenPositions();

    // Clean up connection to prevent leaks
    driftService.disconnect();

    return NextResponse.json({
      success: true,
      positions: openPositions,
    });

  } catch (error) {
    console.error('Get open positions error:', error);
    // Clean up connection in error case too
    try {
      driftService?.disconnect();
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}