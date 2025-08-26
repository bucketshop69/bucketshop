'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSolanaWallets } from '@privy-io/react-auth/solana';
import { theme } from '@/lib/theme';
import { CreateAccountModal } from '@/components/CreateAccountModal';
import { DriftApiService, AccountStatus } from '@/lib/drift/DriftApiService';
import { useDriftMarketsStore, selectSelectedSymbol } from '@/shared/store/drift/driftMarketsStore';
import { useChartStore, selectCurrentPrice, selectMetrics } from '@/components/TradingChart/data/chartStore';

function MarketDisplay() {
    // Get real market data from stores
    const selectedSymbol = useDriftMarketsStore(selectSelectedSymbol);
    const selectedMarket = useDriftMarketsStore(state => state.selectedMarket);
    const currentPrice = useChartStore(selectCurrentPrice);
    const metrics = useChartStore(selectMetrics);

    // Format the market name using displayName from market data
    const displayMarket = selectedMarket?.displayName || selectedSymbol || 'SOL-PERP';

    // Format price with proper currency symbol and change indicator
    const formattedPrice = currentPrice > 0 ? `$${currentPrice.toFixed(2)}` : '$--';
    const priceChangePercent = metrics.priceChangePercent;
    const isPositive = priceChangePercent >= 0;
    const priceColorClass = isPositive ? 'text-green-400' : 'text-red-400';

    return (
        <div className="border-b pb-2 flex items-center" style={{ borderColor: theme.grid.primary }}>
            <div className="flex items-center gap-2">
                <div className={`text-2xl font-bold ${priceColorClass}`}>
                    {formattedPrice}
                </div>
            </div>
            <div className="text-lg font-semibold" style={{ color: theme.text.primary }}>
                {displayMarket}
            </div>
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
                className={`py-2 px-3 font-bold text-lg rounded-lg transition-all cursor-pointer
          transform hover:scale-105 disabled:transform-none disabled:opacity-50 
          disabled:cursor-not-allowed ${isDisabled ? '' : 'bg-green-500 hover:bg-green-600'
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
                className={`py-4 px-6 font-bold text-lg rounded-lg transition-all cursor-pointer
           transform hover:scale-105 disabled:transform-none disabled:opacity-50
            disabled:cursor-not-allowed ${isDisabled ? '' : 'bg-red-500 hover:bg-red-600'
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

interface DriftTradingPanelProps {
    driftService?: DriftApiService;
}

export function DriftTradingPanel({ driftService: propDriftService }: DriftTradingPanelProps) {
    const [positionSize, setPositionSize] = useState('0.1');
    const [leverage, setLeverage] = useState(2);
    const [accountStatus, setAccountStatus] = useState<AccountStatus>({ isChecking: false, exists: true }); // Default to allow trading
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [driftService] = useState(() => propDriftService || new DriftApiService());
    const [orderFeedback, setOrderFeedback] = useState<{
        type: 'success' | 'error' | null;
        message: string;
    }>({ type: null, message: '' });

    const { authenticated } = usePrivy();
    const { wallets } = useSolanaWallets();

    // Removed automatic account checking - will check only when user tries to trade

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

    // Show trading interface when wallet is connected (no pre-auth needed)
    const renderContent = () => {

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
                        <div className={`mt-4 p-3 rounded-lg ${orderFeedback.type === 'success'
                            ? 'bg-green-500/20 border border-green-500/50'
                            : 'bg-red-500/20 border border-red-500/50'
                            }`}>
                            <p className={`text-sm ${orderFeedback.type === 'success' ? 'text-green-400' : 'text-red-400'
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
        <div className="p-2" style={{ backgroundColor: theme.background.primary }}>
            {renderContent()}

            <CreateAccountModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreateAccount={handleCreateAccount}
            />
        </div>
    );
}

// Export as default page component
export default function TradingPage() {
    return <DriftTradingPanel />;
}