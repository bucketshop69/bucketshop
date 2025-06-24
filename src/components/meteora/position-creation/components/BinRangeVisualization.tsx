'use client';

import { BarChart, Bar, ResponsiveContainer } from 'recharts';
import { BinData, RangeDisplayResult } from '../utils/types';

interface BinRangeVisualizationProps {
  binVisualizationData: BinData[];
  rangeDisplay: RangeDisplayResult;
  binCountInfo: {
    count: number;
    description: string;
    rangeDescription: string;
  };
  binStep: number;
}

export function BinRangeVisualization({
  binVisualizationData,
  rangeDisplay,
  binCountInfo,
  binStep
}: BinRangeVisualizationProps) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground">
        Range ({binStep}bp step)
      </div>

      {/* BarChart Bin Visualization */}
      <div className="space-y-1">
        <div className="h-16 w-full bg-muted/20 rounded p-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={binVisualizationData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <Bar
                dataKey="height"
                fill="#3b82f6"
                stroke="none"
                radius={[1, 1, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Range description */}
        <div className="text-xs text-muted-foreground text-center">
          {binCountInfo.rangeDescription}
        </div>

        {/* Bin count display - fixed for DLMM */}
        <div className="flex items-center justify-center">
          <div className="text-center text-xs font-medium">
            {binCountInfo.description}
          </div>
        </div>

        {/* Price range display with percentages */}
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <div>${rangeDisplay.min.toFixed(2)} - ${rangeDisplay.max.toFixed(2)}</div>
          <div className="text-xs opacity-75">{rangeDisplay.percentageRange}</div>
        </div>
      </div>
    </div>
  );
}