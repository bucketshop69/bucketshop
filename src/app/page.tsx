'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSolanaWallets } from '@privy-io/react-auth/solana';
import { TradingChart } from '@/components/TradingChart';
import { WalletButton } from '@/components/WalletButton';
import { DriftTradingPanel } from '@/components/TradingPanel/drift';
import { OpenPositions } from '@/components/OpenPositions';
import { DepositModal } from '@/components/DepositModal';
import TabNavigation from '@/components/core/TabNavigation';
import MarketList from '@/components/core/MarketList';
import { useMarketStore, selectSelectedSymbol, selectAvailableMarkets, useMarketInitialization } from '@/components/TradingChart/data/marketStore';
import { DriftApiService } from '@/lib/drift/DriftApiService';
import { theme } from '@/lib/theme';

export default function Page() {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [activeTab, setActiveTab] = useState('markets');
  const [driftService] = useState(() => new DriftApiService());
  
  const { authenticated } = usePrivy();
  const { wallets } = useSolanaWallets();

  // Market store state and actions
  const selectedSymbol = useMarketStore(selectSelectedSymbol);
  const availableMarkets = useMarketStore(selectAvailableMarkets);
  const { selectMarket } = useMarketStore();

  // Initialize markets on mount
  useMarketInitialization();

  // Handle market selection
  const handleMarketSelect = (symbol: string) => {
    selectMarket(symbol);
  };

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleDeposit = async (amount: number): Promise<boolean> => {
    if (!authenticated || wallets.length === 0) {
      console.error('No wallet connected for deposit');
      return false;
    }

    try {
      const wallet = wallets[0];
      driftService.setWallet(wallet.address);
      
      // Use marketIndex 1 for SOL deposits (0 is USDC)
      const result = await driftService.deposit(amount, wallet, 1);
      
      if (result.success) {
        console.log('Deposit successful! Signature:', result.signature);
        return true;
      } else {
        console.error('Deposit failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Deposit error:', error);
      return false;
    }
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: theme.background.primary }}>
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b"
        style={{ backgroundColor: theme.background.primary, borderColor: theme.grid.primary }}>
        <h3 className="text-l font-bold">BucketShop</h3>
        
        {/* Navigation Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDepositModal(true)}
            className="px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80"
            style={{
              backgroundColor: '#10b981',
              color: 'white'
            }}
          >
            Deposit
          </button>
          <WalletButton />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Section - 70% */}
        <div className="w-[70%] border-r"
          style={{ backgroundColor: theme.background.primary, borderColor: theme.grid.primary }}>
          <TradingChart />
        </div>

        {/* Right Section - 30% */}
        <div className="w-[30%] flex flex-col" style={{ backgroundColor: theme.background.primary }}>
          <TabNavigation 
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
          
          {/* Tab Content */}
          <div className="flex-1 flex flex-col">
            {activeTab === 'markets' ? (
              <MarketList
                selectedSymbol={selectedSymbol}
                availableMarkets={availableMarkets.map(market => ({
                  symbol: market.config.symbol,
                  displayName: market.displayName
                }))}
                onMarketSelect={handleMarketSelect}
              />
            ) : (
              <>
                <DriftTradingPanel driftService={driftService} />
                <OpenPositions driftService={driftService} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onDeposit={handleDeposit}
      />
    </div>
  );
}