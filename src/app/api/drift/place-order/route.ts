import { NextRequest, NextResponse } from 'next/server';
import { DriftServerService } from '@/lib/server/DriftServerService';

export async function POST(request: NextRequest) {
  let driftService: DriftServerService | null = null;
  
  try {
    const body = await request.json();
    const { direction, amount, marketIndex = 0, walletAddress } = body;

    // Validate required parameters
    if (!direction || !amount || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters: direction, amount, and walletAddress' },
        { status: 400 }
      );
    }

    if (!['LONG', 'SHORT'].includes(direction)) {
      return NextResponse.json(
        { error: 'Invalid direction. Must be LONG or SHORT' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a positive number' },
        { status: 400 }
      );
    }

    // Create order transaction
    driftService = new DriftServerService();
    
    // Create a server-side wallet for transaction creation (same pattern as check-account)
    const { PublicKey } = await import('@solana/web3.js');
    const publicKey = new PublicKey(walletAddress);
    const serverWallet = {
      publicKey: publicKey,
      signTransaction: async () => { throw new Error('Server-side wallet - signing not supported'); },
      signAllTransactions: async () => { throw new Error('Server-side wallet - signing not supported'); },
    };
    
    const connected = await driftService.connect(serverWallet as any);
    if (!connected) {
      return NextResponse.json(
        { error: 'Failed to connect to Drift' },
        { status: 500 }
      );
    }
    
    const serializedTransaction = await driftService.createOrderTransaction(
      direction,
      amount,
      marketIndex
    );

    if (!serializedTransaction) {
      driftService.disconnect();
      return NextResponse.json(
        { error: 'Failed to create order transaction' },
        { status: 500 }
      );
    }

    // Clean up connection to prevent leaks
    driftService.disconnect();

    return NextResponse.json({
      success: true,
      transaction: serializedTransaction,
      orderDetails: {
        direction,
        amount,
        marketIndex,
        orderType: 'MARKET'
      }
    });

  } catch (error) {
    console.error('Error in place-order API:', error);
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