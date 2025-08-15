import { NextRequest, NextResponse } from 'next/server';
import { DriftServerService } from '@/lib/server/DriftServerService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { direction, amount, marketIndex = 0 } = body;

    // Validate required parameters
    if (!direction || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters: direction and amount' },
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
    const driftService = new DriftServerService();
    const serializedTransaction = await driftService.createOrderTransaction(
      direction,
      amount,
      marketIndex
    );

    if (!serializedTransaction) {
      return NextResponse.json(
        { error: 'Failed to create order transaction' },
        { status: 500 }
      );
    }

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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}