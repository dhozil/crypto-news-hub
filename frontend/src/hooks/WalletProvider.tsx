'use client';

import { createContext, useContext } from 'react';
import { useWallet as useWalletHook } from '@/hooks/useWallet';

const WalletContext = createContext<any>(null);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const wallet = useWalletHook();

  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  return useContext(WalletContext);
};
