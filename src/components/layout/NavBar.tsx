'use client';

import { Button } from '@/components/ui/button';
import { TokenSearch } from '@/components/search/TokenSearch';

/**
 * Navigation bar with integrated token search
 * 
 * LEARNING: Component composition in action
 * 
 * Before: We had a static Input component
 * After: We use our TokenSearch component with full functionality
 * 
 * This demonstrates:
 * 1. Component composition - NavBar uses TokenSearch
 * 2. Props passing - We can customize TokenSearch behavior
 * 3. Separation of concerns - NavBar handles layout, TokenSearch handles search logic
 * 4. Reusability - TokenSearch could be used in other places
 */
export function NavBar() {
  return (
    <nav className="border-b bg-card shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center space-x-2">
            <div className="text-2xl">🪣</div>
            <h1 className="text-xl font-bold">BucketShop</h1>
          </div>

          {/* Center: Token Search Component */}
          <div className="flex-1 max-w-md mx-8">
            <TokenSearch 
              placeholder="Enter token address or symbol..."
              className="w-full"
            />
          </div>

          {/* Right: Future menu items */}
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}