import { NavBar } from '@/components/layout/NavBar';
import { DAppPanel } from '@/components/dapp/DAppPanel';
import { WatchlistView } from '@/components/watchlist/WatchlistView';
import { TokenDetails } from '@/components/token/TokenDetails';

/**
 * Token Details Page - Dynamic Route
 * 
 * LEARNING: This is a Next.js dynamic route page
 * 
 * File location: /app/token/[address]/page.tsx
 * Route pattern: /token/So11111111111111111111111111111111111111112
 * 
 * The [address] folder name creates a dynamic route parameter.
 * We can access it via params.address in the component.
 * 
 * Layout Strategy:
 * - Same NavBar and DApp panel as main page
 * - Left side (75%) shows TokenDetails instead of empty chart area
 * - Right side (25%) still shows watchlist
 * - User can search for other tokens from NavBar
 */

interface TokenPageProps {
  params: Promise<{
    address: string; // This comes from the [address] folder name
  }>;
}

export default async function TokenPage({ params }: TokenPageProps) {
  const { address } = await params;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar - Full Width */}
      <NavBar />

      {/* Main Content Area - 75/25 Split */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Token Details Area - 75% (Left Side) */}
        <div className="flex-1 bg-muted/5 border-r">
          <TokenDetails tokenAddress={address} />
        </div>

        {/* DApp Panel - 25% (Right Side) */}
        <div className="w-1/4 bg-background">
          <DAppPanel>
            <WatchlistView />
          </DAppPanel>
        </div>
      </div>
    </div>
  );
}

/**
 * LEARNING: Next.js Dynamic Routes
 * 
 * 1. FILE STRUCTURE:
 *    /app/token/[address]/page.tsx
 *    Creates route: /token/:address
 * 
 * 2. ACCESSING PARAMETERS:
 *    function TokenPage({ params }: { params: { address: string } })
 *    params.address contains the dynamic segment
 * 
 * 3. NAVIGATION:
 *    router.push('/token/So111...112') → This page loads
 *    params.address = 'So111...112'
 * 
 * 4. SEO BENEFITS:
 *    Each token gets its own URL
 *    Users can bookmark/share specific tokens
 *    Browser back/forward works naturally
 * 
 * 5. LAYOUT STRATEGY:
 *    Same layout as main page, but left side shows token details
 *    Right side keeps the watchlist for easy access
 *    NavBar search still works to find other tokens
 */