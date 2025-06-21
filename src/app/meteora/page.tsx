import { AppLayout } from '@/components/layout/AppLayout';
import { MeteoraMainLayout } from '@/components/meteora/MeteoraMainLayout';

/**
 * Meteora Pool Discovery Page
 * 
 * This page renders in the 25% DApp panel when /meteora route is active.
 * Users can browse and search pools, then navigate to specific pool pages.
 */
export default function MeteoraPage() {
  return (
    <AppLayout>
      <MeteoraMainLayout />
    </AppLayout>
  );
}