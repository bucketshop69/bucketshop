'use client';

import { useState } from 'react';

interface TabNavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function TabNavigation({ 
  activeTab = 'markets', 
  onTabChange 
}: TabNavigationProps) {
  const [currentTab, setCurrentTab] = useState(activeTab);

  const handleTabClick = (tab: string) => {
    setCurrentTab(tab);
    onTabChange?.(tab);
  };

  const tabs = [
    { id: 'markets', label: 'Markets' },
    { id: 'trade', label: 'Trade' }
  ];

  return (
    <div className="w-full border-b border-gray-700">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`
              flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200
              ${currentTab === tab.id
                ? 'text-white border-b-2 border-blue-500 bg-gray-800'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}