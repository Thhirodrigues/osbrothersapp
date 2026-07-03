/**
 * useUserActiveMenu.ts - Hook para obter o cardápio ativo do usuário
 * Retorna o cardápio fixo do usuário (Adega ou After)
 */

import { useState, useEffect } from 'react';

interface UseUserActiveMenuReturn {
  activeMenuId: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useUserActiveMenu = (userId: string | number | null | undefined): UseUserActiveMenuReturn => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      console.log('[useUserActiveMenu] userId vazio, usando padrão After');
      setActiveMenuId('after-menu-1');
      return;
    }

    const fetchActiveMenu = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log(`[useUserActiveMenu] Buscando cardápio ativo para userId: ${userId}`);
        const response = await fetch(`/api/users/${userId}/active-menu`);
        if (!response.ok) {
          throw new Error(`Erro ao buscar cardápio ativo: ${response.statusText}`);
        }
        const data = await response.json();
        console.log(`[useUserActiveMenu] Cardápio ativo recebido:`, data.menuId);
        setActiveMenuId(data.menuId || 'after-menu-1');
      } catch (err) {
        console.error('[useUserActiveMenu] Erro ao buscar cardápio ativo:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        // Usar padrão em caso de erro
        setActiveMenuId('after-menu-1');
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveMenu();
  }, [userId]);

  return {
    activeMenuId,
    isLoading,
    error,
  };
};
