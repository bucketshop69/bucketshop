'use client';

import { NavBar } from '@/components/layout/NavBar';
import { DAppPanel } from '@/components/dapp/DAppPanel';

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Main Application Layout
 * 
 * Provides the consistent 75/25 split layout:
 * - NavBar at top
 * - 75% chart area (left)
 * - 25% DApp panel (right) with route outlet
 */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar - Full Width */}
      <NavBar />

      {/* Main Content Area - 75/25 Split */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Chart Area - 75% (Left Side) - Always Visible */}
        <div className="flex-1 bg-muted/10 border-r">
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-6xl">📈</div>
              <h2 className="text-3xl font-bold text-muted-foreground">
                Trading Charts
              </h2>
              <p className="text-muted-foreground max-w-md text-lg">
                Advanced charting and technical analysis will be available here. 
                For now, focus on building your watchlist!
              </p>
            </div>
          </div>
        </div>

        {/* DApp Panel - 25% (Right Side) - Route Outlet */}
        <div className="w-1/4 bg-background">
          <DAppPanel>
            {children}
          </DAppPanel>
        </div>
      </div>
    </div>
  );
}