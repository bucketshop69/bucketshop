'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { theme } from '@/lib/theme';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAccount: () => Promise<boolean>;
}

export function CreateAccountModal({ isOpen, onClose, onCreateAccount }: CreateAccountModalProps) {
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreateAccount = async () => {
    setIsCreating(true);
    try {
      const success = await onCreateAccount();
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Account creation failed:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
        style={{ backgroundColor: theme.background.secondary, borderColor: theme.grid.primary }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold" style={{ color: theme.text.primary }}>
            Create Drift Account
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isCreating}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-300 mb-4" style={{ color: theme.text.secondary }}>
            You need a Drift account to start trading perpetuals. This is a one-time setup.
          </p>
          
          <div className="bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg p-3 mb-4">
            <p className="text-blue-300 text-sm">
              <strong>What happens next:</strong><br />
              • Create your Drift trading account<br />
              • Sign the transaction with your wallet<br />
              • Start trading perpetuals immediately
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border transition-colors"
            style={{ 
              borderColor: theme.grid.primary,
              color: theme.text.secondary 
            }}
            disabled={isCreating}
          >
            Cancel
          </button>
          
          <button
            onClick={handleCreateAccount}
            disabled={isCreating}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
}