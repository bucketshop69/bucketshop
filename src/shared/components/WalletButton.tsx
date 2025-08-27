'use client';

import { useLogin, useLogout, usePrivy } from '@privy-io/react-auth';
import { Wallet, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function WalletButton() {
  const { login } = useLogin();
  const { logout } = useLogout();
  const { ready, authenticated, user } = usePrivy();
  const [isOpen, setIsOpen] = useState(false);

  if (!ready) {
    return (
      <div className="px-3 py-2 bg-gray-600 text-white rounded-lg flex items-center gap-2">
        <Wallet size={16} />
        <span>Loading...</span>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <button
        onClick={login}
        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
      >
        <Wallet size={16} />
        <span>Connect Wallet</span>
      </button>
    );
  }

  const displayAddress = user?.wallet?.address 
    ? `${user.wallet.address.slice(0, 4)}...${user.wallet.address.slice(-4)}`
    : 'Connected';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
      >
        <Wallet size={16} />
        <span>{displayAddress}</span>
        <ChevronDown size={14} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border py-1 min-w-[120px] z-10">
          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}