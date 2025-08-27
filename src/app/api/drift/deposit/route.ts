import { NextRequest, NextResponse } from 'next/server';
import { DriftTransactionService } from '@/lib/drift/DriftTransactionService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, marketIndex = 0, walletAddress } = body;

    // Validate required parameters
    if (!amount || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters: amount and walletAddress' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a positive number' },
        { status: 400 }
      );
    }

    if (typeof marketIndex !== 'number' || marketIndex < 0) {
      return NextResponse.json(
        { error: 'Invalid marketIndex. Must be a non-negative number' },
        { status: 400 }
      );
    }

    // Create wallet object for transaction creation
    const { PublicKey } = await import('@solana/web3.js');
    const publicKey = new PublicKey(walletAddress);
    const serverWallet = {
      publicKey: publicKey,
      signTransaction: async () => { throw new Error('Server-side wallet - signing not supported'); },
      signAllTransactions: async () => { throw new Error('Server-side wallet - signing not supported'); },
    };

    // Create deposit transaction
    const driftService = new DriftTransactionService();
    const connected = await driftService.connect(serverWallet as any);
    
    if (!connected) {
      return NextResponse.json(
        { error: 'Failed to connect to Drift' },
        { status: 500 }
      );
    }

    const serializedTransaction = await driftService.createDepositTransaction(
      amount,
      marketIndex
    );

    if (!serializedTransaction) {
      return NextResponse.json(
        { error: 'Failed to create deposit transaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction: serializedTransaction,
      depositDetails: {
        amount,
        marketIndex,
        marketType: marketIndex === 0 ? 'USDC' : 'SOL'
      }
    });

  } catch (error) {
    console.error('Error in deposit API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}