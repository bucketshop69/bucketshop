'use client';

import { useState } from 'react';
import { theme } from '@/lib/theme';

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

function TradingButtons({ positionSize, leverage }: { positionSize: string; leverage: number }) {
  const handleLong = () => {
    console.log('Long trade:', { positionSize, leverage });
  };

  const handleShort = () => {
    console.log('Short trade:', { positionSize, leverage });
  };

  const isDisabled = !positionSize || parseFloat(positionSize) <= 0;

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
        LONG
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
        SHORT
      </button>
    </div>
  );
}

export function DriftTradingPanel() {
  const [positionSize, setPositionSize] = useState('');
  const [leverage, setLeverage] = useState(1);

  return (
    <div className="h-full p-6" style={{ backgroundColor: theme.background.primary }}>
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
        />
      </div>
    </div>
  );
}