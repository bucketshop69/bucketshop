'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Define available DApps
type DAppType = 'watchlist' | 'jupiter' | 'drift' | 'meteora';

interface DApp {
  id: DAppType;
  name: string;
  icon: string;
  available: boolean;
}

const DAPPS: DApp[] = [
  { id: 'watchlist', name: 'Watchlist', icon: '📋', available: true },
  { id: 'jupiter', name: 'Jupiter', icon: '🪐', available: false },
  { id: 'drift', name: 'Drift', icon: '🌊', available: false },
  { id: 'meteora', name: 'Meteora', icon: '☄️', available: false },
];

/**
 * DApp Panel - 25% right side panel with tabs for different DApps
 * 
 * This component demonstrates:
 * 1. Tab-based navigation between DApps
 * 2. Only Watchlist is available initially
 * 3. Future DApps will be added as separate components
 * 4. Outlet pattern for rendering active DApp content
 */
interface DAppPanelProps {
  // We'll pass the WatchlistView component as children
  children?: React.ReactNode;
}

export function DAppPanel({ children }: DAppPanelProps) {
  const [activeTab, setActiveTab] = useState<DAppType>('watchlist');

  return (
    <div className="h-full flex flex-col">
      {/* DApp Tabs */}
      <div className="border-b bg-muted/20 p-2">
        <div className="flex space-x-1">
          {DAPPS.map((dapp) => (
            <Button
              key={dapp.id}
              variant={activeTab === dapp.id ? 'default' : 'ghost'}
              size="sm"
              disabled={!dapp.available}
              onClick={() => dapp.available && setActiveTab(dapp.id)}
              className="flex items-center space-x-1 text-xs"
            >
              <span>{dapp.icon}</span>
              <span>{dapp.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* DApp Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Watchlist Tab Content */}
        {activeTab === 'watchlist' && (
          <div className="h-full">
            {children || (
              <div className="p-4 text-center text-muted-foreground">
                WatchlistView component will render here
              </div>
            )}
          </div>
        )}

        {/* Future DApp Tabs */}
        {activeTab === 'jupiter' && (
          <div className="h-full p-4 flex items-center justify-center">
            <Card className="p-6 text-center">
              <div className="text-4xl mb-2">🪐</div>
              <h3 className="font-semibold mb-2">Jupiter Integration</h3>
              <p className="text-sm text-muted-foreground">
                Token swaps and DeFi features coming soon
              </p>
            </Card>
          </div>
        )}

        {activeTab === 'drift' && (
          <div className="h-full p-4 flex items-center justify-center">
            <Card className="p-6 text-center">
              <div className="text-4xl mb-2">🌊</div>
              <h3 className="font-semibold mb-2">Drift Integration</h3>
              <p className="text-sm text-muted-foreground">
                Perpetuals trading coming soon
              </p>
            </Card>
          </div>
        )}

        {activeTab === 'meteora' && (
          <div className="h-full p-4 flex items-center justify-center">
            <Card className="p-6 text-center">
              <div className="text-4xl mb-2">☄️</div>
              <h3 className="font-semibold mb-2">Meteora Integration</h3>
              <p className="text-sm text-muted-foreground">
                Liquidity pools coming soon
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}