import { TradingChart } from '@/components/TradingChart';
import { WalletButton } from '@/components/WalletButton';
import { DriftTradingPanel } from '@/components/TradingPanel/drift';
import { theme } from '@/lib/theme';

export default function Page() {
  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: theme.background.primary }}>
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b"
        style={{ backgroundColor: theme.background.primary, borderColor: theme.grid.primary }}>
        <h3 className="text-l font-bold">BucketShop</h3>
        <WalletButton />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Section - 70% */}
        <div className="w-[70%] border-r"
          style={{ backgroundColor: theme.background.primary, borderColor: theme.grid.primary }}>
          <TradingChart />
        </div>

        {/* Right Section - 30% */}
        <div className="w-[30%]" style={{ backgroundColor: theme.background.primary }}>
          <DriftTradingPanel />
        </div>
      </div>
    </div>
  );
}