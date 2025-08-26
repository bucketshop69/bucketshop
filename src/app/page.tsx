import Link from 'next/link';
import { theme } from '@/lib/theme';

export default function Page() {
  return (
    <div className="h-screen flex flex-col items-center justify-center" style={{ backgroundColor: theme.background.primary }}>
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">BucketShop</h1>
        <p className="text-lg mb-8 opacity-80">Unified Crypto Trading Dashboard</p>
        
        <Link href="/drift/markets">
          <button 
            className="px-8 py-4 rounded-lg font-medium text-lg transition-all hover:opacity-80"
            style={{
              backgroundColor: '#10b981',
              color: 'white'
            }}
          >
            Go to DApp
          </button>
        </Link>
      </div>
    </div>
  );
}