'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';

interface PrivyWrapperProps {
  children: React.ReactNode;
}

export function PrivyWrapper({ children }: PrivyWrapperProps) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'dark',
          walletChainType: "solana-only"
        },
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors(), // enable Solana external connectors
          },
        },
      }}
    >
      {children}
    </PrivyProvider >
  );
}