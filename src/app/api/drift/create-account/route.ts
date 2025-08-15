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

    // Create a proper wallet object with the real public key
    const publicKey = new PublicKey(walletAddress);
    // Create wallet object for transaction creation (no signing methods needed)
    const walletForTxCreation = {
      publicKey: publicKey,
      signTransaction: async () => { throw new Error('Server-side wallet - signing not supported'); },
      signAllTransactions: async () => { throw new Error('Server-side wallet - signing not supported'); },
    };


    const driftService = new DriftServerService();
    const connected = await driftService.connect(walletForTxCreation as any);
    

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