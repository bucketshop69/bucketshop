'use client';

import { Card } from '@/components/ui/card';
import { MeteoraPoolInfo } from '@/lib/services/meteora';

interface PositionConfigFormProps {
  pool: MeteoraPoolInfo;
}

export function PositionConfigForm({ pool }: PositionConfigFormProps) {
  // Extract token symbols from pool name (e.g., "GOR-SOL" -> "GOR", "SOL")
  const [tokenXSymbol, tokenYSymbol] = pool.name.split('-');

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-3">Create Position</h3>
      
      <div className="text-center py-8 text-muted-foreground">
        <div className="text-xs mb-2">Position configuration interface</div>
        <div className="text-xs mb-3">Will be implemented in the next sprint</div>
        <div className="text-xs">
          Ready for: {tokenXSymbol}-{tokenYSymbol} liquidity pool
        </div>
      </div>
    </Card>
  );
}