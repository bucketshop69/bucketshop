'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSolanaWallets } from '@privy-io/react-auth/solana';
import { TradingChart } from '@/components/TradingChart';
import { WalletButton } from '@/components/WalletButton';
import { useDriftMarketSelection } from '@/shared/store/drift/driftMarketsStore';
import { DriftApiService } from '@/lib/drift/DriftApiService';
import { theme } from '@/lib/theme';
import DAppNavigation from '@/shared/components/navigation/DAppNavigation';
import DriftTabNavigation from '@/shared/components/navigation/DriftTabNavigation';
import { DepositModal } from '@/shared/components/drift/DepositModal';

export default function DAppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [driftService] = useState(() => new DriftApiService());

    const { authenticated } = usePrivy();
    const { wallets } = useSolanaWallets();

    // Initialize markets and selection
    useDriftMarketSelection();

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
                    {/* DApp Navigation - Top Layer */}
                    <DAppNavigation />

                    {/* DApp-Specific Tabs - Middle Layer */}
                    <DriftTabNavigation />

                    {/* Route Content - Bottom Layer */}
                    <div className="flex-1">
                        {children}
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