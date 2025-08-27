import { Connection, Transaction } from '@solana/web3.js';
import { DriftClient, initialize, Wallet, OrderType, PositionDirection, OptionalOrderParams, BN, UserAccount } from '@drift-labs/sdk';

interface DriftTradingConfig {
  rpcUrl: string;
  environment: 'mainnet-beta' | 'devnet';
}

const DEFAULT_CONFIG: DriftTradingConfig = {
  rpcUrl: process.env.SOLANA_RPC_URL || (() => {
    console.warn('SOLANA_RPC_URL not set, using default devnet RPC');
    return 'https://api.devnet.solana.com';
  })(),
  environment: (process.env.DRIFT_ENV as 'mainnet-beta' | 'devnet') || (() => {
    console.warn('DRIFT_ENV not set, defaulting to devnet');
    return 'devnet';
  })(),
};


export interface AccountStatus {
  isChecking: boolean;
  exists: boolean;
  error?: string;
  user: UserAccount | null
}

export interface EnhancedPerpPosition {
  // Convert all BN fields to numbers for easier client handling
  baseAssetAmount: number;
  lastCumulativeFundingRate: number;
  marketIndex: number;
  quoteAssetAmount: number;
  quoteEntryAmount: number;
  quoteBreakEvenAmount: number;
  openOrders: number;
  openBids: number;
  openAsks: number;
  settledPnl: number;
  lpShares: number;
  remainderBaseAssetAmount: number;
  lastBaseAssetAmountPerLp: number;
  lastQuoteAssetAmountPerLp: number;
  perLpBase: number;
  // Our additional fields
  isLong: boolean;
  isShort: boolean;
  marketSymbol: string;
}

export class DriftTransactionService {
  private config: DriftTradingConfig;
  private connection: Connection;
  private driftClient: DriftClient | null = null;
  private wallet: Wallet | null = null;

  constructor(config: Partial<DriftTradingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    // Use connection with rate limiting
    this.connection = new Connection(this.config.rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
    });
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
      console.error('Failed to connect DriftTransactionService:', error);
      return false;
    }
  }

  async checkAccountStatus(): Promise<AccountStatus> {
    if (!this.driftClient) {
      return { isChecking: false, exists: false, error: 'Not connected', user: null };
    }

    try {
      console.log('🔍 DRIFT-SERVICE DEBUG:');
      console.log('🔗 DriftClient connected with wallet:', this.wallet?.publicKey?.toString());
      console.log('🌐 Environment:', this.config.environment);
      console.log('🔗 RPC URL:', this.config.rpcUrl);

      // Try to get user account - this might throw if no user exists
      try {
        const userAccount = this.driftClient.getUser();
        console.log('👤 Got user account object');

        const exists = await userAccount.exists();
        console.log('✅ Account exists check result:', exists);

        return {
          isChecking: false,
          exists,
          user: userAccount.getUserAccount()
        };
      } catch (getUserError) {
        console.log('👤 getUser() failed, checking if this means no account exists');
        console.log('📝 getUserError message:', getUserError instanceof Error ? getUserError.message : 'Unknown');

        // If the error is "DriftClient has no user", it means account doesn't exist yet
        const errorMessage = getUserError instanceof Error ? getUserError.message : '';
        if (errorMessage.includes('DriftClient has no user')) {
          console.log('✅ Confirmed: Account does not exist (getUser failed as expected)');
          return {
            isChecking: false,
            exists: false,
            user: null
          };
        }

        // If it's a different error, throw it
        throw getUserError;
      }
    } catch (error) {
      console.error('❌ Unexpected error checking account:', error);
      console.log('🔍 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        wallet: this.wallet?.publicKey?.toString(),
        environment: this.config.environment,
      });
      return {
        isChecking: false,
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        user: null
      };
    }
  }

  async createAccountTransaction(): Promise<string | null> {
    if (!this.driftClient) {
      console.error('DriftClient not connected');
      return null;
    }

    try {

      // Step 1: Get the initialization instructions (same as SDK does internally)
      let initializeIxs: any[];
      let userAccountPublicKey: any;

      try {
        const result = await this.driftClient.getInitializeUserAccountIxs(
          0, // subAccountId
          undefined, // name (optional) 
          undefined  // referrerInfo (optional)
        );

        initializeIxs = result[0];
        userAccountPublicKey = result[1];


      } catch (instructionError) {
        console.error('Failed to get initialization instructions:', instructionError);
        throw instructionError;
      }

      // Step 2: Build transaction manually from instructions (simpler approach)
      const transaction = new Transaction();

      // Add all initialization instructions
      if (Array.isArray(initializeIxs)) {
        initializeIxs.forEach((ix: any) => {
          transaction.add(ix);
        });
      } else {
        transaction.add(initializeIxs);
      }

      // Set fee payer and temporary blockhash (client will update with fresh one)
      transaction.feePayer = this.wallet!.publicKey;

      // Set a temporary blockhash for serialization (client will replace with fresh one)
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      // Step 3: Serialize as unsigned transaction
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      });

      const base64Transaction = serializedTransaction.toString('base64');

      return base64Transaction;

    } catch (error) {
      console.error('Failed to create account transaction:', error);
      return null;
    }
  }

  async createOrderTransaction(
    direction: 'LONG' | 'SHORT',
    amount: number,
    marketIndex: number = 0
  ): Promise<string | null> {
    if (!this.driftClient) {
      console.error('DriftClient not connected');
      return null;
    }

    try {
      console.log(`Creating unsigned order transaction: ${direction} ${amount} at market ${marketIndex}`);

      // Convert direction to PositionDirection enum
      const positionDirection = direction === 'LONG' ? PositionDirection.LONG : PositionDirection.SHORT;

      // Convert amount to perp precision (Drift uses different precision for amounts)
      const baseAssetAmount = this.driftClient.convertToPerpPrecision(amount);

      // Create order parameters
      const orderParams: OptionalOrderParams = {
        orderType: OrderType.MARKET,
        marketIndex,
        direction: positionDirection,
        baseAssetAmount,
      };

      console.log('Order params:', orderParams);

      // Get the order instruction
      const placeOrderIx = await this.driftClient.getPlacePerpOrderIx(orderParams);

      // Create transaction with the instruction
      const transaction = new Transaction();
      transaction.add(placeOrderIx);

      // Set recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet!.publicKey;

      // Serialize transaction (unsigned)
      const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
      const base64Transaction = serializedTransaction.toString('base64');

      console.log('Unsigned order transaction created successfully');
      return base64Transaction;

    } catch (error) {
      console.error('Failed to create order transaction:', error);
      return null;
    }
  }

  async createDepositTransaction(
    amount: number,
    marketIndex: number = 0
  ): Promise<string | null> {
    if (!this.driftClient) {
      console.error('DriftClient not connected');
      return null;
    }

    try {
      console.log(`Creating unsigned deposit transaction: ${amount} to market ${marketIndex}`);

      // Convert amount to spot precision for the specific market
      const convertedAmount = this.driftClient.convertToSpotPrecision(marketIndex, amount);

      // Get the associated token account for this market
      const associatedTokenAccount = await this.driftClient.getAssociatedTokenAccount(marketIndex);

      console.log('Deposit params:', {
        amount: convertedAmount.toString(),
        marketIndex,
        associatedTokenAccount: associatedTokenAccount.toString()
      });

      // Get the deposit instructions
      const depositInstructions = await this.driftClient.getDepositTxnIx(
        convertedAmount,
        marketIndex,
        associatedTokenAccount
      );

      // Create transaction with the instructions
      const transaction = new Transaction();
      depositInstructions.forEach((ix: any) => {
        transaction.add(ix);
      });

      // Set recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet!.publicKey;

      // Serialize transaction (unsigned)
      const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
      const base64Transaction = serializedTransaction.toString('base64');

      console.log('Unsigned deposit transaction created successfully');
      return base64Transaction;

    } catch (error) {
      console.error('Failed to create deposit transaction:', error);
      return null;
    }
  }

  // Keep the old method for backward compatibility (now just returns false)
  async createAccount(): Promise<boolean> {
    console.log('Use createAccountTransaction() instead');
    return false;
  }

  async getOpenPositions(): Promise<EnhancedPerpPosition[]> {
    if (!this.driftClient) {
      console.error('DriftClient not connected');
      return [];
    }

    try {
      const user = this.driftClient.getUser();
      const positions: EnhancedPerpPosition[] = [];

      // Get all perp markets (typically 0-50+ markets)
      const perpMarkets = this.driftClient.getPerpMarketAccounts();

      for (let marketIndex = 0; marketIndex < perpMarkets.length; marketIndex++) {
        try {
          const perpPosition = user.getPerpPosition(marketIndex);

          if (perpPosition && perpPosition.baseAssetAmount && !perpPosition.baseAssetAmount.eq(new BN(0))) {
            const baseAssetAmount = perpPosition.baseAssetAmount;
            const isLong = baseAssetAmount.gte(new BN(0));
            const isShort = baseAssetAmount.lt(new BN(0));

            // Get market info
            const market = perpMarkets[marketIndex];
            const marketSymbol = market ? `Market-${marketIndex}` : `Unknown-${marketIndex}`;

            // Get precision factors for proper conversion
            const baseAssetPrecision = 1e9; // SOL uses 10^9 precision
            const quoteAssetPrecision = 1e6; // USDC uses 10^6 precision
            const fundingPrecision = 1e9; // Funding rates use 10^9 precision

            // Convert all BN values to properly scaled numbers
            const enhancedPosition: EnhancedPerpPosition = {
              baseAssetAmount: parseFloat(perpPosition.baseAssetAmount.toString()) / baseAssetPrecision,
              lastCumulativeFundingRate: parseFloat(perpPosition.lastCumulativeFundingRate.toString()) / fundingPrecision,
              marketIndex: perpPosition.marketIndex,
              quoteAssetAmount: parseFloat(perpPosition.quoteAssetAmount.toString()) / quoteAssetPrecision,
              quoteEntryAmount: parseFloat(perpPosition.quoteEntryAmount.toString()) / quoteAssetPrecision,
              quoteBreakEvenAmount: parseFloat(perpPosition.quoteBreakEvenAmount.toString()) / quoteAssetPrecision,
              openOrders: perpPosition.openOrders,
              openBids: parseFloat(perpPosition.openBids.toString()) / baseAssetPrecision,
              openAsks: parseFloat(perpPosition.openAsks.toString()) / baseAssetPrecision,
              settledPnl: parseFloat(perpPosition.settledPnl.toString()) / quoteAssetPrecision,
              lpShares: parseFloat(perpPosition.lpShares.toString()),
              remainderBaseAssetAmount: perpPosition.remainderBaseAssetAmount,
              lastBaseAssetAmountPerLp: parseFloat(perpPosition.lastBaseAssetAmountPerLp.toString()) / baseAssetPrecision,
              lastQuoteAssetAmountPerLp: parseFloat(perpPosition.lastQuoteAssetAmountPerLp.toString()) / quoteAssetPrecision,
              perLpBase: perpPosition.perLpBase,
              // Our additional fields
              isLong,
              isShort,
              marketSymbol
            };

            console.log(`🔍 Position ${marketIndex} converted:`, {
              baseAssetAmount: enhancedPosition.baseAssetAmount,
              quoteAssetAmount: enhancedPosition.quoteAssetAmount,
              settledPnl: enhancedPosition.settledPnl,
              isLong: enhancedPosition.isLong,
              isShort: enhancedPosition.isShort
            });

            positions.push(enhancedPosition);
          }
        } catch (positionError) {
          // Skip positions that can't be read (market might not exist)
          console.log(`Skipping market ${marketIndex}:`, positionError instanceof Error ? positionError.message : 'Unknown error');
        }
      }

      console.log(`Found ${positions.length} open positions`);
      return positions;

    } catch (error) {
      console.error('Failed to get open positions:', error);
      return [];
    }
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