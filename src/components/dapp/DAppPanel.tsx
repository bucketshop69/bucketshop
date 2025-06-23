'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

// Define available DApps
type DAppType = 'watchlist' | 'jupiter' | 'drift' | 'meteora';

interface DApp {
  id: DAppType;
  name: string;
  icon: string;
  available: boolean;
  route: string;
}

const DAPPS: DApp[] = [
  { id: 'watchlist', name: 'Watchlist', icon: '📋', available: true, route: '/' },
  { id: 'jupiter', name: 'Jupiter', icon: '🪐', available: false, route: '/jupiter' },
  { id: 'drift', name: 'Drift', icon: '🌊', available: false, route: '/drift' },
  { id: 'meteora', name: 'Meteora', icon: '☄️', available: true, route: '/meteora' },
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
  children?: React.ReactNode;
}

export function DAppPanel({ children }: DAppPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Determine active tab based on current route
  const getActiveTab = (): DAppType => {
    if (pathname === '/') return 'watchlist';
    if (pathname.startsWith('/meteora')) return 'meteora';
    if (pathname.startsWith('/jupiter')) return 'jupiter';
    if (pathname.startsWith('/drift')) return 'drift';
    return 'watchlist';
  };
  
  const activeTab = getActiveTab();

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
              onClick={() => dapp.available && router.push(dapp.route)}
              className="flex items-center space-x-1 text-xs"
            >
              <span>{dapp.icon}</span>
              <span>{dapp.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* DApp Content Area - Route Outlet */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}