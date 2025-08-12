import { Connection, Transaction, TransactionInstruction } from '@solana/web3.js';
import { DriftClient, initialize, Wallet } from '@drift-labs/sdk';

interface DriftTradingConfig {
  rpcUrl: string;
  environment: 'mainnet-beta' | 'devnet';
}

const DEFAULT_CONFIG: DriftTradingConfig = {
  rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  environment: 'mainnet-beta',
};

export interface AccountStatus {
  isChecking: boolean;
  exists: boolean;
  error?: string;
}

export class DriftServerService {
  private config: DriftTradingConfig;
  private connection: Connection;
  private driftClient: DriftClient | null = null;
  private wallet: Wallet | null = null;

  constructor(config: Partial<DriftTradingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.connection = new Connection(this.config.rpcUrl);
  }

  async connect(wallet: Wallet): Promise<boolean> {
    try {
      this.wallet = wallet;

      initialize({ env: this.config.environment });

      this.driftClient = new DriftClient({
        connection: this.connection,
        wallet: this.wallet,
        env: this.config.environment,
      });

      await this.driftClient.subscribe();

      return true;
    } catch (error) {
      console.error('Failed to connect DriftServerService:', error);
      return false;
    }
  }

  async checkAccountStatus(): Promise<AccountStatus> {
    if (!this.driftClient) {
      return { isChecking: false, exists: false, error: 'Not connected' };
    }

    try {
      const userAccount = this.driftClient.getUser();
      const exists = await userAccount.exists();

      return {
        isChecking: false,
        exists,
      };
    } catch (error) {
      console.error('Error checking account:', error);
      return {
        isChecking: false,
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async createAccountTransaction(): Promise<string | null> {
    if (!this.driftClient) {
      console.error('DriftClient not connected');
      return null;
    }

    try {
      console.log('Creating unsigned Drift account transaction...');

      // Create the instructions for account initialization
      const initUserAccountIxs: any = await this.driftClient.getInitializeUserAccountIxs();

      // Create a transaction with the instructions
      const transaction = new Transaction();
      
      // Handle the result properly - check what we actually got
      console.log('initUserAccountIxs type:', typeof initUserAccountIxs);
      console.log('initUserAccountIxs:', initUserAccountIxs);
      
      if (Array.isArray(initUserAccountIxs)) {
        initUserAccountIxs.forEach((ix: any) => {
          if (ix && ix.keys && ix.programId && ix.data) { // Check if it looks like a TransactionInstruction
            transaction.add(ix);
          }
        });
      } else if (initUserAccountIxs && initUserAccountIxs.keys && initUserAccountIxs.programId) {
        transaction.add(initUserAccountIxs);
      }

      // Set recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet!.publicKey;

      // Serialize transaction (unsigned)
      const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
      const base64Transaction = serializedTransaction.toString('base64');

      console.log('Unsigned transaction created successfully');
      return base64Transaction;

    } catch (error) {
      console.error('Failed to create account transaction:', error);
      return null;
    }
  }

  // Keep the old method for backward compatibility (now just returns false)
  async createAccount(): Promise<boolean> {
    console.log('Use createAccountTransaction() instead');
    return false;
  }

  // Legacy method - keeping for backward compatibility
  async hasAccount(): Promise<boolean> {
    const status = await this.checkAccountStatus();
    return status.exists;
  }

  isConnected(): boolean {
    return this.driftClient !== null && this.wallet !== null;
  }

  disconnect(): void {
    if (this.driftClient) {
      this.driftClient.unsubscribe();
      this.driftClient = null;
    }
    this.wallet = null;
  }
}