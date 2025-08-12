import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { DriftServerService } from '@/lib/server/DriftServerService';

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
    const mockWallet = {
      publicKey: new PublicKey(walletAddress),
      signTransaction: async () => { throw new Error('Mock wallet'); },
      signAllTransactions: async () => { throw new Error('Mock wallet'); },
    };

    const driftService = new DriftServerService();
    const connected = await driftService.connect(mockWallet as any);

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