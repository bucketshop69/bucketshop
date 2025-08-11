'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  useTimeframeSelection, 
  Timeframe, 
  TIMEFRAME_CONFIG 
} from '../data/chartStore';
import { BUCKETSHOP_ELITE_THEME } from '../core/theme';

interface TimeframeSelectorProps {
  className?: string;
}

export function TimeframeSelector({ className }: TimeframeSelectorProps) {
  const { 
    currentTimeframe, 
    switchTimeframe, 
    isTimeframeSwitching,
    availableTimeframes 
  } = useTimeframeSelection();

  const handleTimeframeClick = (timeframe: Timeframe) => {
    if (timeframe === currentTimeframe || isTimeframeSwitching) return;
    switchTimeframe(timeframe);
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-1 rounded-md p-1",
        "border border-slate-700/50",
        "bg-gradient-to-r from-slate-900/80 to-slate-800/80",
        "backdrop-blur-sm",
        className
      )}
      style={{
        background: `linear-gradient(to right, ${BUCKETSHOP_ELITE_THEME.background.secondary}CC, ${BUCKETSHOP_ELITE_THEME.background.tertiary}CC)`,
        borderColor: `${BUCKETSHOP_ELITE_THEME.grid.primary}80`,
      }}
    >
      {availableTimeframes.map((timeframe) => {
        const config = TIMEFRAME_CONFIG[timeframe];
        const isActive = timeframe === currentTimeframe;
        const isDisabled = isTimeframeSwitching;

        return (
          <button
            key={timeframe}
            onClick={() => handleTimeframeClick(timeframe)}
            disabled={isDisabled}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded transition-all duration-200",
              "hover:scale-105 active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
              isActive ? [
                "shadow-md",
                "text-white font-semibold",
                "bg-gradient-to-r from-purple-600 to-purple-500",
                "border border-purple-400/30",
              ] : [
                "text-slate-300 hover:text-white",
                "hover:bg-slate-700/30",
                "border border-transparent",
              ]
            )}
            style={{
              ...(isActive && {
                background: `linear-gradient(to right, ${BUCKETSHOP_ELITE_THEME.accent.primary}, ${BUCKETSHOP_ELITE_THEME.accent.secondary})`,
                borderColor: `${BUCKETSHOP_ELITE_THEME.accent.primary}50`,
                color: BUCKETSHOP_ELITE_THEME.text.primary,
                boxShadow: `0 0 12px ${BUCKETSHOP_ELITE_THEME.accent.primary}30`,
              }),
            }}
            title={config.displayName}
          >
            {config.label}
          </button>
        );
      })}
      
      {/* Loading indicator */}
      {isTimeframeSwitching && (
        <div 
          className="ml-2 flex items-center text-xs text-slate-400"
        >
          <div 
            className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin mr-1"
            style={{
              borderColor: BUCKETSHOP_ELITE_THEME.accent.primary,
              borderTopColor: 'transparent',
            }}
          />
          Loading...
        </div>
      )}
    </div>
  );
}

TimeframeSelector.displayName = 'TimeframeSelector';