import { Connection } from '@solana/web3.js';
import { DriftClient, initialize, Wallet } from '@drift-labs/sdk';

interface DriftTradingConfig {
  rpcUrl: string;
  environment: 'mainnet-beta' | 'devnet';
}

const DEFAULT_CONFIG: DriftTradingConfig = {
  rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  environment: 'mainnet-beta',
};

export class DriftTradingService {
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
      console.error('Failed to connect DriftTradingService:', error);
      return false;
    }
  }

  async hasAccount(): Promise<boolean> {
    if (!this.driftClient) return false;

    try {
      const userAccount = this.driftClient.getUser();
      return await userAccount.exists();
    } catch (error) {
      console.error('Error checking account:', error);
      return false;
    }
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