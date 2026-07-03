/**
 * BannerContext - Contexto global para gerenciar banners de notícias
 * Permite mostrar/ocultar banners de forma sincronizada
 * Estado de "fechado" é persistido em localStorage
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Banner {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'success' | 'warning' | 'error';
  ativo: boolean;
  dataCriacao: number;
  dataExpiracao?: number;
}

interface BannerContextType {
  banners: Banner[];
  closedBannerIds: Set<string>;
  closeBanner: (bannerId: string) => void;
  openBanner: (bannerId: string) => void;
  setBanners: (banners: Banner[]) => void;
}

const BannerContext = createContext<BannerContextType | undefined>(undefined);

const STORAGE_KEY = 'caderninho-closed-banners';

export function BannerProvider({ children }: { children: React.ReactNode }) {
  const [banners, setBannersState] = useState<Banner[]>([]);
  const [closedBannerIds, setClosedBannerIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar banners fechados do localStorage ao montar
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const ids = JSON.parse(saved) as string[];
        setClosedBannerIds(new Set(ids));
      } catch (e) {
        console.error('Erro ao carregar banners fechados:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Salvar banners fechados no localStorage quando mudar
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(closedBannerIds)));
    }
  }, [closedBannerIds, isLoaded]);

  const closeBanner = (bannerId: string) => {
    setClosedBannerIds((prev) => {
      const next = new Set(prev);
      next.add(bannerId);
      return next;
    });
  };

  const openBanner = (bannerId: string) => {
    setClosedBannerIds((prev) => {
      const next = new Set(prev);
      next.delete(bannerId);
      return next;
    });
  };

  const setBanners = (newBanners: Banner[]) => {
    setBannersState(newBanners);
  };

  return (
    <BannerContext.Provider
      value={{
        banners,
        closedBannerIds,
        closeBanner,
        openBanner,
        setBanners,
      }}
    >
      {children}
    </BannerContext.Provider>
  );
}

export function useBanners() {
  const context = useContext(BannerContext);
  if (!context) {
    throw new Error('useBanners deve ser usado dentro de BannerProvider');
  }
  return context;
}
