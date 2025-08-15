'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSolanaWallets } from '@privy-io/react-auth/solana';
import { theme } from '@/lib/theme';
import { CreateAccountModal } from '@/components/CreateAccountModal';
import { DriftApiService, AccountStatus } from '@/lib/drift/DriftApiService';

function MarketDisplay() {
  // TODO: Get selected market from chart context
  const selectedMarket = 'SOL-PERP';
  const currentPrice = '$64.25';

  return (
    <div className="border-b pb-4 mb-6" style={{ borderColor: theme.grid.primary }}>
      <div className="text-lg font-semibold" style={{ color: theme.text.primary }}>{selectedMarket}</div>
      <div className="text-2xl font-bold text-green-400">{currentPrice}</div>
    </div>
  );
}

function PositionSizeInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-3" style={{ color: theme.text.secondary }}>
        Position Size (USDC)
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        style={{
          backgroundColor: theme.background.tertiary,
          borderColor: theme.grid.primary,
          color: theme.text.primary
        }}
      />
    </div>
  );
}

function LeverageSlider({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-3" style={{ color: theme.text.secondary }}>
        Leverage: <span style={{ color: theme.text.primary }}>{value}x</span>
      </label>
      <input
        type="range"
        min="1"
        max="20"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-3 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - 1) / 19) * 100}%, ${theme.grid.primary} ${((value - 1) / 19) * 100}%, ${theme.grid.primary} 100%)`
        }}
      />
      <div className="flex justify-between text-xs mt-2" style={{ color: theme.text.secondary }}>
        <span>1x</span>
        <span>20x</span>
      </div>
    </div>
  );
}

function TradingButtons({ 
  positionSize, 
  leverage, 
  driftService, 
  wallet,
  onOrderComplete 
}: { 
  positionSize: string; 
  leverage: number;
  driftService: DriftApiService;
  wallet: any;
  onOrderComplete: (success: boolean, signature?: string, error?: string) => void;
}) {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [lastOrderDirection, setLastOrderDirection] = useState<'LONG' | 'SHORT' | null>(null);

  const placeOrder = async (direction: 'LONG' | 'SHORT') => {
    if (isPlacingOrder) return;
    
    setIsPlacingOrder(true);
    setLastOrderDirection(direction);

    try {
      // Calculate actual position size with leverage
      const amount = parseFloat(positionSize) * leverage;
      
      const result = await driftService.placeOrder(direction, amount, wallet);
      
      if (result.success) {
        onOrderComplete(true, result.signature);
      } else {
        onOrderComplete(false, undefined, result.error);
      }
    } catch (error) {
      onOrderComplete(false, undefined, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsPlacingOrder(false);
      setLastOrderDirection(null);
    }
  };

  const handleLong = () => placeOrder('LONG');
  const handleShort = () => placeOrder('SHORT');

  const isDisabled = !positionSize || parseFloat(positionSize) <= 0 || isPlacingOrder;

  const getButtonText = (direction: 'LONG' | 'SHORT') => {
    if (isPlacingOrder && lastOrderDirection === direction) {
      return 'PLACING...';
    }
    return direction;
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        onClick={handleLong}
        disabled={isDisabled}
        className={`py-4 px-6 font-bold text-lg rounded-lg transition-all transform hover:scale-105 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed ${
          isDisabled ? '' : 'bg-green-500 hover:bg-green-600'
        }`}
        style={{
          backgroundColor: isDisabled ? theme.grid.primary : undefined,
          color: theme.text.primary
        }}
      >
        {getButtonText('LONG')}
      </button>
      <button
        onClick={handleShort}
        disabled={isDisabled}
        className={`py-4 px-6 font-bold text-lg rounded-lg transition-all transform hover:scale-105 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed ${
          isDisabled ? '' : 'bg-red-500 hover:bg-red-600'
        }`}
        style={{
          backgroundColor: isDisabled ? theme.grid.primary : undefined,
          color: theme.text.primary
        }}
      >
        {getButtonText('SHORT')}
      </button>
    </div>
  );
}

export function DriftTradingPanel() {
  const [positionSize, setPositionSize] = useState('');
  const [leverage, setLeverage] = useState(1);
  const [accountStatus, setAccountStatus] = useState<AccountStatus>({ isChecking: true, exists: false });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [driftService] = useState(() => new DriftApiService());
  const [orderFeedback, setOrderFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const { authenticated } = usePrivy();
  const { wallets } = useSolanaWallets();

  // Check account status when wallet connects
  useEffect(() => {
    
    const checkAccount = async () => {
      
      if (!authenticated || wallets.length === 0) {
        setAccountStatus({ isChecking: false, exists: false, error: 'Wallet not connected' });
        return;
      }

      try {
        const wallet = wallets[0]; // Use first wallet
        
        driftService.setWallet(wallet.address);
        
        const status = await driftService.checkAccountStatus();
        setAccountStatus(status);
        
        
        // Show modal if no account exists (either no error, or the "no user" error)
        const isNoAccountError = status.error?.includes('DriftClient has no user');
        if (!status.exists && (!status.error || isNoAccountError)) {
            setShowCreateModal(true);
        }
      } catch (error) {
        setAccountStatus({ 
          isChecking: false, 
          exists: false, 
          error: error instanceof Error ? error.message : 'Connection error' 
        });
      }
    };

    checkAccount();
  }, [authenticated, wallets, driftService]);

  const handleCreateAccount = async (): Promise<boolean> => {
    if (wallets.length === 0) {
      console.error('No wallet available for signing');
      return false;
    }

    try {
      const wallet = wallets[0]; // Use first wallet for signing
      const success = await driftService.createAccount(wallet);
      if (success) {
        // Recheck account status
        const newStatus = await driftService.checkAccountStatus();
        setAccountStatus(newStatus);
      }
      return success;
    } catch (error) {
      console.error('Account creation failed:', error);
      return false;
    }
  };

  const handleOrderComplete = (success: boolean, signature?: string, error?: string) => {
    if (success && signature) {
      setOrderFeedback({
        type: 'success',
        message: `Order placed successfully! Signature: ${signature.slice(0, 8)}...`
      });
      // Clear form
      setPositionSize('');
      setLeverage(1);
    } else {
      setOrderFeedback({
        type: 'error',
        message: error || 'Failed to place order'
      });
    }

    // Clear feedback after 5 seconds
    setTimeout(() => {
      setOrderFeedback({ type: null, message: '' });
    }, 5000);
  };

  // Show different UI based on account status
  const renderContent = () => {
    if (!authenticated) {
      return (
        <div className="flex items-center justify-center h-full">
          <p style={{ color: theme.text.secondary }}>Connect wallet to start trading</p>
        </div>
      );
    }

    if (accountStatus.isChecking) {
      return (
        <div className="flex items-center justify-center h-full">
          <p style={{ color: theme.text.secondary }}>Checking account...</p>
        </div>
      );
    }

    if (accountStatus.error && !accountStatus.exists) {
      return (
        <div className="flex items-center justify-center h-full">
          <p style={{ color: theme.text.secondary }}>Error: {accountStatus.error}</p>
        </div>
      );
    }

    // Show normal trading interface if account exists
    return (
      <>
        <MarketDisplay />
        
        <div>
          <PositionSizeInput
            value={positionSize}
            onChange={setPositionSize}
          />

          <LeverageSlider
            value={leverage}
            onChange={setLeverage}
          />

          <TradingButtons
            positionSize={positionSize}
            leverage={leverage}
            driftService={driftService}
            wallet={wallets[0]}
            onOrderComplete={handleOrderComplete}
          />

          {/* Order Feedback */}
          {orderFeedback.type && (
            <div className={`mt-4 p-3 rounded-lg ${
              orderFeedback.type === 'success' 
                ? 'bg-green-500/20 border border-green-500/50' 
                : 'bg-red-500/20 border border-red-500/50'
            }`}>
              <p className={`text-sm ${
                orderFeedback.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`}>
                {orderFeedback.message}
              </p>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="h-full p-6" style={{ backgroundColor: theme.background.primary }}>
      {renderContent()}
      
      <CreateAccountModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateAccount={handleCreateAccount}
      />
    </div>
  );
}