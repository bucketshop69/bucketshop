'use client';

import { usePathname, useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';

const DAPPS = [
  { id: 'drift', name: 'Drift', path: '/drift/markets' },
  { id: 'meteora', name: 'Meteora', path: '/meteora/pools', disabled: true },
  { id: 'jupiter', name: 'Jupiter', path: '/jupiter/swap', disabled: true },
  { id: 'kamino', name: 'Kamino', path: '/kamino/vaults', disabled: true },
];

export default function DAppNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  
  const currentDApp = DAPPS.find(dapp => pathname.startsWith(`/${dapp.id}`))?.id || 'drift';

  const handleDAppSwitch = (dapp: typeof DAPPS[0]) => {
    if (dapp.disabled) return;
    router.push(dapp.path);
  };

  return (
    <div className="border-b" style={{ borderColor: theme.grid.primary }}>
      <div className="flex">
        {DAPPS.map((dapp) => (
          <button
            key={dapp.id}
            onClick={() => handleDAppSwitch(dapp)}
            disabled={dapp.disabled}
            className={`
              px-4 py-3 font-medium text-sm transition-all
              ${currentDApp === dapp.id 
                ? 'border-b-2 border-blue-500' 
                : 'hover:opacity-70'
              }
              ${dapp.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
            `}
            style={{ 
              backgroundColor: theme.background.primary,
              color: currentDApp === dapp.id ? '#3b82f6' : '#ffffff'
            }}
          >
            {dapp.name}
          </button>
        ))}
      </div>
    </div>
  );
}