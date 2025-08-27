'use client';

import { usePathname, useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';
import { useDriftMarketsStore, selectSelectedSymbol } from '@/shared/store/drift/driftMarketsStore';


export default function DriftTabNavigation() {
    const pathname = usePathname();
    const router = useRouter();
    const selectedSymbol = useDriftMarketsStore(selectSelectedSymbol);

    // Don't show if not on Drift routes
    if (!pathname.startsWith('/drift')) return null;

    // Create dynamic tabs based on selected market
    const dynamicTabs = [
        { id: 'markets', name: 'Markets', path: '/drift/markets' },
        ...(selectedSymbol ? [{
            id: 'trade',
            name: 'Trade',
            path: `/drift/${selectedSymbol.toLowerCase().replace('-', '-')}/trade`
        }] : []),
    ];

    const activeTab = dynamicTabs.find(tab =>
        pathname === tab.path || pathname.startsWith(tab.path.replace('/trade', ''))
    )?.id || 'markets';

    const handleTabChange = (tab: typeof dynamicTabs[0]) => {
        router.push(tab.path);
    };

    return (
        <div className="border-b" style={{ borderColor: theme.grid.primary }}>
            <div className="flex">
                {dynamicTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab)}
                        className={`
              px-4 py-2 text-sm font-medium transition-all
              ${activeTab === tab.id
                                ? 'border-b-2 border-green-500'
                                : 'hover:opacity-70'
                            }
            `}
                        style={{
                            backgroundColor: theme.background.primary,
                            color: activeTab === tab.id ? '#10b981' : '#ffffff'
                        }}
                    >
                        {tab.name}
                    </button>
                ))}
            </div>
        </div>
    );
}