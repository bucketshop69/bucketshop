import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { DriftTransactionService } from '@/lib/drift/DriftTransactionService';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();


    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Create a mock wallet for account checking
    const publicKey = new PublicKey(walletAddress);
    const serverWallet = {
      publicKey: publicKey,
      signTransaction: async () => { throw new Error('Server-side wallet - signing not supported'); },
      signAllTransactions: async () => { throw new Error('Server-side wallet - signing not supported'); },
    };

    const driftService = new DriftTransactionService();
    const connected = await driftService.connect(serverWallet as any);

    if (!connected) {
      return NextResponse.json(
        { error: 'Failed to connect to Drift' },
        { status: 500 }
      );
    }

    const accountStatus = await driftService.checkAccountStatus();

    return NextResponse.json({
      success: true,
      accountStatus,
    });

  } catch (error) {
    console.error('Check account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}