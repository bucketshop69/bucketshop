import { AppLayout } from '@/components/layout/AppLayout';
import { ReactNode } from 'react';

interface DAppPanelLayoutProps {
  children: ReactNode;
}

/**
 * DApp Panel Layout Group
 * 
 * Provides consistent 75/25 layout for all DApp-related routes:
 * - Charts area (75%)
 * - DApp panel area (25%) containing route-specific content
 * 
 * Routes under this layout:
 * - / (watchlist)
 * - /meteora (pool selection)
 * - /meteora/[poolAddress] (pool details)
 * - /jupiter (future)
 * - /drift (future)
 */
export default function DAppPanelLayout({ children }: DAppPanelLayoutProps) {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
}