// hooks/ContractProvider.tsx — BARU
'use client';
import { createContext, useContext } from 'react';
import { useContract as useContractHook } from '@/hooks/useContract';

const ContractContext = createContext<any>(null);

export const ContractProvider = ({ children }: { children: React.ReactNode }) => {
  const contract = useContractHook();
  return (
    <ContractContext.Provider value={contract}>
      {children}
    </ContractContext.Provider>
  );
};

export const useContract = () => useContext(ContractContext);
