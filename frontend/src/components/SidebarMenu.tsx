'use client';

// Simplified sidebar menu component
import { useState } from 'react';
import { useWallet } from '@/hooks/WalletProvider';
import { X, LogOut } from 'lucide-react';

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SidebarMenu = ({ isOpen, onClose }: SidebarMenuProps) => {
  const { address, balance, disconnectWallet, isCorrectNetwork, chainId } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (bal: string) => {
    return parseFloat(bal).toFixed(4);
  };

  const getNetworkName = (chainId: number | null) => {
    if (!chainId) return 'Unknown Network';
    switch (chainId) {
      case 4221:
        return 'GenLayer Testnet Chain';
      case 1:
        return 'Ethereum Mainnet';
      case 137:
        return 'Polygon';
      case 56:
        return 'BSC';
      case 42161:
        return 'Arbitrum';
      case 10:
        return 'Optimism';
      default:
        return `Chain ID: ${chainId}`;
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={handleOverlayClick}
      />
      
      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <div className="font-semibold text-gray-900">{formatAddress(address || '')}</div>
            <div className="text-sm text-gray-600">{formatBalance(balance || '0')} GEN</div>
            <div className="text-xs text-gray-500 mt-1">
              {getNetworkName(chainId)}
              {isCorrectNetwork ? ' ✅' : ' ⚠️'}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="p-4">
          {/* Disconnect */}
          <button
            onClick={handleDisconnect}
            className="w-full flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Disconnect Wallet</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default SidebarMenu;
