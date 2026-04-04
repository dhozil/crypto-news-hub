'use client';

// Wallet connect button component
import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import SidebarMenu from './SidebarMenu';
import { Wallet, AlertCircle, Network, CheckCircle } from 'lucide-react';

const WalletConnect = () => {
  const { 
    isConnected, 
    address, 
    balance, 
    chainId,
    isLoading, 
    error, 
    needsNetworkSwitch,
    isCorrectNetwork,
    connectWallet, 
    addGenLayerNetwork 
  } = useWallet();

  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (bal: string) => {
    return parseFloat(bal).toFixed(4);
  };

  const handleNetworkSwitch = async () => {
    setIsSwitchingNetwork(true);
    try {
      await addGenLayerNetwork();
    } catch (error) {
      console.error('Failed to switch network:', error);
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  if (isLoading || isSwitchingNetwork) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">
          {isSwitchingNetwork ? 'Switching Network...' : 'Connecting...'}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-red-100 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
        
        {needsNetworkSwitch && (
          <button
            onClick={handleNetworkSwitch}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Network className="w-4 h-4" />
            Switch to GenLayer Testnet
          </button>
        )}
      </div>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={connectWallet}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>
    );
  }

  return (
    <>
      {/* Single Wallet Button - Click to Open Sidebar */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
          isCorrectNetwork 
            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
        }`}
      >
        <div className="flex items-center gap-2">
          {isCorrectNetwork ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {formatAddress(address || '')}
          </span>
        </div>
        <span className="text-xs">
          {formatBalance(balance)} GEN
        </span>
      </button>

      {/* Sidebar Menu */}
      <SidebarMenu 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </>
  );
};

export default WalletConnect;
