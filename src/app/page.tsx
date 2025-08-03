import { TradingChart } from '@/components/TradingChart';

export default function Page() {
  return (
    <div className="h-screen flex">
      {/* Left Section - 70% */}
      <div className="w-[70%] bg-gray-100 border-r">
        <TradingChart />
      </div>
      
      {/* Right Section - 30% */}
      <div className="w-[30%] bg-white">
        <div className="p-4">Right Panel (30%)</div>
      </div>
    </div>
  );
}