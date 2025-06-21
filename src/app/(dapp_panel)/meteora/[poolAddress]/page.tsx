import { PoolDetailView } from '@/components/meteora/PoolDetailView';

interface PoolPageProps {
  params: Promise<{
    poolAddress: string;
  }>;
}

/**
 * Pool Detail Page
 * 
 * Renders detailed pool information within the DApp panel.
 * Accessed via /meteora/[poolAddress] routes.
 * Layout is provided by the (dapp_panel) layout group.
 */
export default async function PoolPage({ params }: PoolPageProps) {
  const { poolAddress } = await params;
  return <PoolDetailView poolAddress={poolAddress} />;
}