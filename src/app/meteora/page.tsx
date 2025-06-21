import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';

/**
 * Meteora Pool Discovery Page
 * 
 * This page renders in the 25% DApp panel when /meteora route is active.
 * Users can browse and search pools, then navigate to specific pool pages.
 */
export default function MeteoraPage() {
  return (
    <AppLayout>
      <div className="h-full p-4 flex items-center justify-center">
        <Card className="p-6 text-center">
          <div className="text-4xl mb-2">☄️</div>
          <h3 className="font-semibold mb-2">Meteora Pool Discovery</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Browse and select DLMM pools for position creation
          </p>
          <p className="text-xs text-muted-foreground">
            Pool search and strip components coming next...
          </p>
        </Card>
      </div>
    </AppLayout>
  );
}