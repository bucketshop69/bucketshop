// Client-side API service that talks to our Next.js API routes
export interface AccountStatus {
  isChecking: boolean;
  exists: boolean;
  error?: string;
}

// Import the enhanced type from server service
import type { EnhancedPerpPosition } from '@/lib/drift/DriftTransactionService';
export type { EnhancedPerpPosition };

// Utility function to get RPC connection
async function getSolanaConnection() {
  const { Connection } = await import('@solana/web3.js');
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  
  if (!rpcUrl) {
    throw new Error('NEXT_PUBLIC_SOLANA_RPC_URL environment variable is not set');
  }
  
  return new Connection(rpcUrl);
}

export class DriftApiService {
  private walletAddress: string | null = null;

  constructor() {}

  setWallet(walletAddress: string) {
    this.walletAddress = walletAddress;
  }

  async checkAccountStatus(): Promise<AccountStatus> {
    if (!this.walletAddress) {
      return { isChecking: false, exists: false, error: 'No wallet connected' };
    }

    try {
      
      const response = await fetch('/api/drift/check-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: this.walletAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          isChecking: false,
          exists: false,
          error: data.error || 'Failed to check account',
        };
      }

      return data.accountStatus;
    } catch (error) {
      console.error('Account check failed:', error);
      return {
        isChecking: false,
        exists: false,
        error: 'Network error',
      };
    }
  }

  async createAccount(wallet: any): Promise<boolean> {
    if (!this.walletAddress || !wallet) {
      console.error('No wallet connected');
      return false;
    }

    try {
      // Step 1: Get unsigned transaction from server
      const response = await fetch('/api/drift/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: this.walletAddress,
          signature: 'mock-for-now',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to create transaction:', data.error);
        return false;
      }

      // Step 2: Deserialize and prepare transaction
      const { Transaction } = await import('@solana/web3.js');
      const transaction = Transaction.from(Buffer.from(data.transaction, 'base64'));
      
      // Step 3: Update blockhash before signing (to avoid expiration)
      const connection = await getSolanaConnection();
      const { blockhash } = await connection.getLatestBlockhash();
      
      // Update transaction with fresh blockhash
      transaction.recentBlockhash = blockhash;
      
      // Sign transaction with Privy wallet
      const signedTransaction = await wallet.signTransaction(transaction);
      
      // Submit signed transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(signature, 'confirmed');
      
      console.log('Account created successfully! Signature:', signature);
      return true;

    } catch (error) {
      console.error('Account creation error:', error);
      return false;
    }
  }

  async placeOrder(
    direction: 'LONG' | 'SHORT',
    amount: number,
    wallet: any,
    marketIndex: number = 0
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    if (!this.walletAddress || !wallet) {
      return { success: false, error: 'No wallet connected' };
    }

    try {
      // Step 1: Get unsigned transaction from server
      const response = await fetch('/api/drift/place-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          direction,
          amount,
          marketIndex,
          walletAddress: this.walletAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to create order transaction' };
      }

      // Step 2: Sign and submit transaction with real wallet
      const { Transaction } = await import('@solana/web3.js');
      const transaction = Transaction.from(Buffer.from(data.transaction, 'base64'));
      
      // Sign transaction with Privy wallet
      const signedTransaction = await wallet.signTransaction(transaction);
      
      // Step 3: Submit signed transaction to Solana
      const connection = await getSolanaConnection();
      
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(signature, 'confirmed');
      
      console.log(`Order placed successfully! ${direction} ${amount} - Signature:`, signature);
      return { success: true, signature };

    } catch (error) {
      console.error('Order placement error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to place order' 
      };
    }
  }

  async deposit(
    amount: number,
    wallet: any,
    marketIndex: number = 0
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    if (!this.walletAddress || !wallet) {
      return { success: false, error: 'No wallet connected' };
    }

    try {
      // Step 1: Get unsigned transaction from server
      const response = await fetch('/api/drift/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          marketIndex,
          walletAddress: this.walletAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to create deposit transaction' };
      }

      // Step 2: Sign and submit transaction with real wallet
      const { Transaction } = await import('@solana/web3.js');
      const transaction = Transaction.from(Buffer.from(data.transaction, 'base64'));
      
      // Sign transaction with Privy wallet
      const signedTransaction = await wallet.signTransaction(transaction);
      
      // Step 3: Submit signed transaction to Solana
      const connection = await getSolanaConnection();
      
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(signature, 'confirmed');
      
      console.log(`Deposit successful! ${amount} to market ${marketIndex} - Signature:`, signature);
      return { success: true, signature };

    } catch (error) {
      console.error('Deposit error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to deposit' 
      };
    }
  }

  isConnected(): boolean {
    return this.walletAddress !== null;
  }

  async getOpenPositions(): Promise<{ success: boolean; positions?: EnhancedPerpPosition[]; error?: string }> {
    if (!this.walletAddress) {
      return { success: false, error: 'No wallet connected' };
    }

    try {
      const response = await fetch('/api/drift/open-positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: this.walletAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to get open positions' };
      }

      return { success: true, positions: data.positions };

    } catch (error) {
      console.error('Get open positions error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get open positions' 
      };
    }
  }

  disconnect(): void {
    this.walletAddress = null;
  }
}