import { NextRequest, NextResponse } from 'next/server';
import { DriftServerService } from '@/lib/server/DriftServerService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, marketIndex = 0 } = body;

    // Validate required parameters
    if (!amount) {
      return NextResponse.json(
        { error: 'Missing required parameter: amount' },
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

    // Create deposit transaction
    const driftService = new DriftServerService();
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