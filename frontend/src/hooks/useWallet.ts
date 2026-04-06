'use client';

// Wallet connection hook for MetaMask integration
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';

// Network configuration for GenLayer Testnet Chain
const GENLAYER_NETWORK = {
  chainId: '0x' + (4221).toString(16), // 0x107D in hex
  chainName: 'GenLayer Testnet Chain',
  nativeCurrency: {
    name: 'GEN',
    symbol: 'GEN',
    decimals: 18,
  },
  rpcUrls: [
    'https://rpc.testnet-chain.genlayer.com',
    'https://testnet-chain.genlayer.com',
    'https://genlayer-testnet.public.blastapi.io'
  ],
  blockExplorerUrls: [
    'https://explorer.testnet-chain.genlayer.com',
    'https://testnet-explorer.genlayer.com'
  ],
};

interface WalletState {
  isConnected: boolean;
  address: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  balance: string;
  chainId: number | null;
  isLoading: boolean;
  error: string | null;
  needsNetworkSwitch: boolean;
  isCorrectNetwork: boolean;
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    provider: null,
    signer: null,
    balance: '0',
    chainId: null,
    isLoading: false,
    error: null,
    needsNetworkSwitch: false,
    isCorrectNetwork: false,
  });

  // Check if current network is GenLayer Testnet Chain
  const isCorrectNetwork = useCallback((chainId: number | null): boolean => {
    return chainId === 4221; // GenLayer Testnet Chain ID
  }, []);

  // Add GenLayer network to wallet
  const addGenLayerNetwork = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;

    try {
      const provider = await detectEthereumProvider();
      
      if (!provider) {
        throw new Error('MetaMask is not installed');
      }

      // Try to switch to the network first
      try {
        await (provider as any).request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: GENLAYER_NETWORK.chainId }],
        });
        return true;
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          await (provider as any).request({
            method: 'wallet_addEthereumChain',
            params: [GENLAYER_NETWORK],
          });
          return true;
        } else {
          throw switchError;
        }
      }
    } catch (error: any) {
      console.error('Failed to add GenLayer network:', error);
      throw error;
    }
  }, []);

  // Auto-detect and prompt for network switch
  const checkAndSwitchNetwork = useCallback(async (): Promise<void> => {
    if (typeof window === 'undefined') return;

    try {
      const provider = await detectEthereumProvider();
      
      if (!provider) {
        throw new Error('MetaMask is not installed');
      }

      const ethersProvider = new ethers.BrowserProvider(provider as any);
      const network = await ethersProvider.getNetwork();
      const currentChainId = Number(network.chainId);

      if (!isCorrectNetwork(currentChainId)) {
        setWallet(prev => ({
          ...prev,
          needsNetworkSwitch: true,
          isCorrectNetwork: false,
          error: `Wrong network detected. Please switch to GenLayer Testnet Chain (Chain ID: 4221). Current: Chain ID ${currentChainId}`,
        }));
      } else {
        setWallet(prev => ({
          ...prev,
          needsNetworkSwitch: false,
          isCorrectNetwork: true,
          error: null,
        }));
      }
    } catch (error: any) {
      console.error('Network check failed:', error);
      setWallet(prev => ({
        ...prev,
        error: 'Failed to check network',
      }));
    }
  }, [isCorrectNetwork]);

  const connectWallet = useCallback(async () => {
    if (typeof window === 'undefined') return;

    setWallet(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const provider = await detectEthereumProvider();
      
      if (!provider) {
        throw new Error('MetaMask is not installed');
      }

      // Check and switch network before connecting
      await checkAndSwitchNetwork();

      const accounts = await (provider as any).request({
        method: 'eth_requestAccounts',
      });

      const selectedAccount = accounts[0];

      const ethersProvider = new ethers.BrowserProvider(provider as any);
      const signer = await ethersProvider.getSigner(selectedAccount);
      const address = selectedAccount;
      const balance = await ethersProvider.getBalance(address);
      const network = await ethersProvider.getNetwork();

      const currentChainId = Number(network.chainId);
      const correctNetwork = isCorrectNetwork(currentChainId);

      setWallet({
        isConnected: true,
        address,
        provider: ethersProvider,
        signer,
        balance: ethers.formatEther(balance),
        chainId: currentChainId,
        isLoading: false,
        error: null,
        needsNetworkSwitch: !correctNetwork,
        isCorrectNetwork: correctNetwork,
      });

      // Listen for network changes
      (provider as any).on('chainChanged', (chainId: string) => {
        const newChainId = parseInt(chainId, 16);
        setWallet(prev => ({
          ...prev,
          chainId: newChainId,
          isCorrectNetwork: isCorrectNetwork(newChainId),
          needsNetworkSwitch: !isCorrectNetwork(newChainId),
        }));
      });

      // Listen for account changes
      (provider as any).on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          setWallet(prev => ({
            ...prev,
            isConnected: false,
            address: null,
            signer: null,
            balance: '0',
          }));
        } else {
          // Account changed, reconnect
          connectWallet();
        }
      });

    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      setWallet(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to connect wallet',
      }));
    }
  }, [checkAndSwitchNetwork, isCorrectNetwork]);

  const disconnectWallet = useCallback(() => {
    setWallet({
      isConnected: false,
      address: null,
      provider: null,
      signer: null,
      balance: '0',
      chainId: null,
      isLoading: false,
      error: null,
      needsNetworkSwitch: false,
      isCorrectNetwork: false,
    });
  }, []);

  // Auto-check network on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      checkAndSwitchNetwork();
    }
  }, [checkAndSwitchNetwork]);

  // Auto reconnect wallet if already connected
useEffect(() => {
  const init = async () => {
    if (typeof window === 'undefined') return;

    try {
      const provider = await detectEthereumProvider();
      if (!provider) return;

     const accounts = await (provider as any).request({
       method: 'eth_accounts',
     });

     if (accounts.length > 0) {
        const selectedAccount = accounts[0];

        const ethersProvider = new ethers.BrowserProvider(provider as any);
        const signer = await ethersProvider.getSigner(selectedAccount);
        const address = selectedAccount;
        const balance = await ethersProvider.getBalance(address);
        const network = await ethersProvider.getNetwork();

        const currentChainId = Number(network.chainId);
        const correctNetwork = currentChainId === 4221;

        setWallet({
          isConnected: true,
          address,
          provider: ethersProvider,
          signer,
          balance: ethers.formatEther(balance),
          chainId: currentChainId,
          isLoading: false,
          error: null,
          needsNetworkSwitch: !correctNetwork,
          isCorrectNetwork: correctNetwork,
        });
      }
    } catch (err) {
      console.error('Auto reconnect failed:', err);
    }
  };

  init();
}, []);

  return {
    ...wallet,
    connectWallet,
    disconnectWallet,
    addGenLayerNetwork,
    checkAndSwitchNetwork,
  };
};
