import { AppLayout } from '@/components/layout/AppLayout';
import { WatchlistView } from '@/components/watchlist/WatchlistView';

/**
 * Home Page - Main Trading Dashboard
 * 
 * Provides the main 75/25 layout with watchlist in the DApp panel.
 */
export default function Home() {
  return (
    <AppLayout>
      <WatchlistView />
    </AppLayout>
  );
}
