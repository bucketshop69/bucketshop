import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { DriftServerService } from '@/lib/server/DriftServerService';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, signature } = await request.json();

    if (!walletAddress || !signature) {
      return NextResponse.json(
        { error: 'Wallet address and signature are required' },
        { status: 400 }
      );
    }

    // For now, we'll use a mock wallet
    // In production, you'd verify the signature and create a proper wallet
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

    const unsignedTransaction = await driftService.createAccountTransaction();

    if (!unsignedTransaction) {
      return NextResponse.json(
        { error: 'Failed to create account transaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction: unsignedTransaction,
      message: 'Account transaction created - ready to sign',
    });

  } catch (error) {
    console.error('Create account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}