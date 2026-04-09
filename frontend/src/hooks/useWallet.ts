'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';

const GENLAYER_NETWORK = {
  chainId: '0x' + (4221).toString(16),
  chainName: 'GenLayer Testnet Chain',
  nativeCurrency: {
    name: 'GEN',
    symbol: 'GEN',
    decimals: 18,
  },
  rpcUrls: [
    'https://rpc-bradbury.genlayer.com',
    'https://rpc.testnet-chain.genlayer.com',
    'https://genlayer-testnet.public.blastapi.io'
  ],
  blockExplorerUrls: [
    'https://explorer.testnet-chain.genlayer.com',
    'https://explorer-bradbury.genlayer.com'
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

  const isCorrectNetwork = useCallback((chainId: number | null) => {
    return chainId === 4221;
  }, []);

  // 🔹 Switch / Add Network
  const switchNetwork = useCallback(async () => {
    const provider = await detectEthereumProvider();
    if (!provider) return;

    try {
      await (provider as any).request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: GENLAYER_NETWORK.chainId }],
      });
    } catch (err: any) {
      if (err.code === 4902) {
        await (provider as any).request({
          method: 'wallet_addEthereumChain',
          params: [GENLAYER_NETWORK],
        });
      }
    }
  }, []);

  // 🔹 Check Network
  const checkNetwork = useCallback(async () => {
    try {
      const provider = await detectEthereumProvider();
      if (!provider) return;

      const ethersProvider = new ethers.BrowserProvider(provider as any);
      const network = await ethersProvider.getNetwork();
      const chainId = Number(network.chainId);

      setWallet(prev => ({
        ...prev,
        chainId,
        isCorrectNetwork: isCorrectNetwork(chainId),
        needsNetworkSwitch: !isCorrectNetwork(chainId),
      }));
    } catch (err) {
      console.error(err);
    }
  }, [isCorrectNetwork]);

  // 🔹 CONNECT (ONLY 1 ACCOUNT)
  const connectWallet = useCallback(async () => {
    setWallet(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const provider = await detectEthereumProvider();
      if (!provider) throw new Error('MetaMask not found. Please install MetaMask.');

      // ✅ Step 1: Minta akun DULU (1 popup saja)
      const accounts = await (provider as any).request({
        method: 'eth_requestAccounts',
      });

      const address = accounts[0];
      const ethersProvider = new ethers.BrowserProvider(provider as any);
      const network = await ethersProvider.getNetwork();
      const chainId = Number(network.chainId);

      // ✅ Step 2: Baru switch network SETELAH akun tersambung, dan HANYA jika perlu
      if (!isCorrectNetwork(chainId)) {
        await switchNetwork();
        // Reload akan di-trigger oleh listener chainChanged
        return;
      }

      const signer = await ethersProvider.getSigner(address);
      const balanceRaw = await ethersProvider.getBalance(address);

      setWallet({
        isConnected: true,
        address,
        provider: ethersProvider,
        signer,
        balance: ethers.formatEther(balanceRaw),
        chainId,
        isLoading: false,
        error: null,
        needsNetworkSwitch: false,
        isCorrectNetwork: true,
      });

    } catch (err: any) {
      // ✅ Handle user reject (code 4001) dengan pesan yang lebih bersih
      const message = err.code === 4001 
        ? 'Connection rejected by user.' 
        : err.message;
      setWallet(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
    }
  }, [switchNetwork, isCorrectNetwork]);

  // 🔹 DISCONNECT (LOCAL ONLY)
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

  // 🔹 AUTO RECONNECT (NO POPUP)
  useEffect(() => {
    const init = async () => {
      try {
        const provider = await detectEthereumProvider();
        if (!provider) return;

        const accounts = await (provider as any).request({
          method: 'eth_accounts',
        });

        if (accounts.length === 0) return;

        const address = accounts[0];

        const ethersProvider = new ethers.BrowserProvider(provider as any);
        const signer = await ethersProvider.getSigner(address);
        const balanceRaw = await ethersProvider.getBalance(address);
        const network = await ethersProvider.getNetwork();

        const chainId = Number(network.chainId);

        setWallet({
          isConnected: true,
          address,
          provider: ethersProvider,
          signer,
          balance: ethers.formatEther(balanceRaw),
          chainId,
          isLoading: false,
          error: null,
          needsNetworkSwitch: !isCorrectNetwork(chainId),
          isCorrectNetwork: isCorrectNetwork(chainId),
        });
      } catch (err) {
        console.error(err);
      }
    };

    init();
  }, [isCorrectNetwork]);

  // 🔹 LISTENER (FIX BUG DOUBLE REQUEST)
  useEffect(() => {
    let providerRef: any;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        const address = accounts[0];
        const ethersProvider = new ethers.BrowserProvider(providerRef as any);
        const signer = await ethersProvider.getSigner(address);
        const balanceRaw = await ethersProvider.getBalance(address);
        setWallet(prev => ({
        ...prev,
        address,
        signer,
        balance: ethers.formatEther(balanceRaw),
      }));
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const setup = async () => {
    const provider = await detectEthereumProvider();
    if (!provider) return;
    providerRef = provider;
    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);
  };

  setup();

  return () => {
    if (providerRef?.removeListener) {
      providerRef.removeListener('accountsChanged', handleAccountsChanged);
      providerRef.removeListener('chainChanged', handleChainChanged);
    }
  };
}, [disconnectWallet]);

  return {
    ...wallet,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    checkNetwork,
  };
};
