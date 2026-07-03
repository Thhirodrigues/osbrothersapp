/**
 * HideValuesContext - Contexto global para gerenciar visibilidade de valores
 * Permite ocultar/mostrar valores em todas as páginas de forma sincronizada
 * Estado é persistido em localStorage
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

interface HideValuesContextType {
  isHidden: boolean;
  toggleHideValues: () => void;
}

const HideValuesContext = createContext<HideValuesContextType | undefined>(undefined);

const STORAGE_KEY = 'caderninho-hide-values';

export function HideValuesProvider({ children }: { children: React.ReactNode }) {
  const [isHidden, setIsHidden] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar estado do localStorage ao montar
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      setIsHidden(saved === 'true');
    }
    setIsLoaded(true);
  }, []);

  // Salvar estado no localStorage quando mudar
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, String(isHidden));
    }
  }, [isHidden, isLoaded]);

  const toggleHideValues = () => {
    setIsHidden((prev) => !prev);
  };

  return (
    <HideValuesContext.Provider value={{ isHidden, toggleHideValues }}>
      {children}
    </HideValuesContext.Provider>
  );
}

export function useHideValues() {
  const context = useContext(HideValuesContext);
  if (!context) {
    throw new Error('useHideValues deve ser usado dentro de HideValuesProvider');
  }
  return context;
}
