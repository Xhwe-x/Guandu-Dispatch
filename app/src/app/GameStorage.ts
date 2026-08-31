import { createContext, useContext } from 'react';

export const GameStorageContext = createContext<Storage | null>(null);

export function useGameStorage(): Storage {
  const storage = useContext(GameStorageContext);
  if (storage === null) {
    throw new Error('useGameStorage must be used within GameProvider');
  }
  return storage;
}
