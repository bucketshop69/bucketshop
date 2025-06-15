'use client';

import { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

/**
 * Main application layout with 75/25 split
 * 
 * Layout Structure:
 * - NavBar (full width at top)
 * - ChartArea (75% left - empty for now) 
 * - DAppPanel (25% right - contains watchlist and future DApps)
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar - Full Width */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">BucketShop</h1>
              {/* Search will be rendered here by NavBar component */}
              {children}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area - 75/25 Split */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Chart Area - 75% (Left Side) */}
        <div className="flex-1 bg-muted/20 border-r">
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-4xl">📈</div>
              <h2 className="text-2xl font-semibold text-muted-foreground">
                Trading Charts
              </h2>
              <p className="text-muted-foreground max-w-md">
                Advanced charting and technical analysis will be available here. 
                For now, focus on building your watchlist!
              </p>
            </div>
          </div>
        </div>

        {/* DApp Panel - 25% (Right Side) */}
        <div className="w-1/4 bg-background flex flex-col">
          {/* This is where DAppPanel component will be rendered */}
          <div className="flex-1 p-4">
            <div className="text-center text-muted-foreground">
              DApp Panel will render here
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}