'use client';

import { useState } from 'react';
import { theme } from '@/lib/theme';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (amount: number) => Promise<boolean>;
}

export function DepositModal({ isOpen, onClose, onDeposit }: DepositModalProps) {
  const [amount, setAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount);
    
    if (!depositAmount || depositAmount <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid amount' });
      return;
    }

    setIsDepositing(true);
    setFeedback({ type: null, message: '' });
    
    try {
      const success = await onDeposit(depositAmount);
      if (success) {
        setFeedback({ type: 'success', message: 'Deposit successful!' });
        setAmount('');
        setTimeout(() => {
          onClose();
          setFeedback({ type: null, message: '' });
        }, 2000);
      } else {
        setFeedback({ type: 'error', message: 'Deposit failed. Please try again.' });
      }
    } catch (error) {
      setFeedback({ type: 'error', message: 'Deposit failed. Please try again.' });
    } finally {
      setIsDepositing(false);
    }
  };

  const handleClose = () => {
    if (!isDepositing) {
      setAmount('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="rounded-lg p-6 w-96 max-w-[90vw]"
        style={{ backgroundColor: theme.background.secondary }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold" style={{ color: theme.text.primary }}>
            Deposit SOL
          </h2>
          <button
            onClick={handleClose}
            disabled={isDepositing}
            className="text-gray-400 hover:text-white disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.text.secondary }}>
              Amount (SOL)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              min="0"
              step="0.01"
              disabled={isDepositing}
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              style={{
                backgroundColor: theme.background.tertiary,
                borderColor: theme.grid.primary,
                color: theme.text.primary
              }}
            />
          </div>

          <div className="text-xs" style={{ color: theme.text.secondary }}>
            This will deposit SOL into your Drift account for trading collateral.
          </div>

          {/* Feedback Message */}
          {feedback.type && (
            <div className={`p-3 rounded-lg ${
              feedback.type === 'success' 
                ? 'bg-green-500/20 border border-green-500/50' 
                : 'bg-red-500/20 border border-red-500/50'
            }`}>
              <p className={`text-sm ${
                feedback.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`}>
                {feedback.message}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            disabled={isDepositing}
            className="flex-1 py-3 px-4 rounded-lg border transition-all disabled:opacity-50"
            style={{
              borderColor: theme.grid.primary,
              color: theme.text.secondary,
              backgroundColor: 'transparent'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDeposit}
            disabled={!amount || parseFloat(amount) <= 0 || isDepositing}
            className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: parseFloat(amount) > 0 && !isDepositing ? '#3b82f6' : theme.grid.primary,
              color: theme.text.primary
            }}
          >
            {isDepositing ? 'Depositing...' : 'Deposit SOL'}
          </button>
        </div>
      </div>
    </div>
  );
}