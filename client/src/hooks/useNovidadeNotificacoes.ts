/**
 * useNovidadeNotificacoes.ts - Hook para gerenciar notificações de novidade
 * Busca itens novos de um cardápio e fornece funções para marcar como visto
 */

import { useState, useEffect } from 'react';

export interface NovoItem {
  id: string;
  name: string;
  price: number;
  category_name: string;
}

interface UseNovidadeNotificacoesReturn {
  novoItems: NovoItem[];
  count: number;
  isLoading: boolean;
  error: string | null;
  marcarComoVisto: (itemId: string) => Promise<void>;
  limparTodas: () => Promise<void>;
}

export const useNovidadeNotificacoes = (menuId: string): UseNovidadeNotificacoesReturn => {
  const [novoItems, setNovoItems] = useState<NovoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar itens novos
  useEffect(() => {
    if (!menuId) {
      console.log('[NovidadeNotificacoes] menuId vazio, pulando fetch');
      return;
    }

    const fetchNovidadeItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log(`[NovidadeNotificacoes] Buscando itens novos para menuId: ${menuId}`);
        const response = await fetch(`/api/menus/${menuId}/new-items`);
        if (!response.ok) {
          throw new Error(`Erro ao buscar notificações: ${response.statusText}`);
        }
        const data = await response.json();
        console.log(`[NovidadeNotificacoes] Itens recebidos:`, data, `Total: ${data?.length || 0}`);
        setNovoItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('[NovidadeNotificacoes] Erro ao buscar notificações de novidade:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setNovoItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNovidadeItems();

    // Recarregar a cada 10 segundos
    const interval = setInterval(fetchNovidadeItems, 10000);
    return () => clearInterval(interval);
  }, [menuId]);

  // Marcar item como visto
  const marcarComoVisto = async (itemId: string) => {
    try {
      const response = await fetch(`/api/menu-items/${itemId}/mark-as-seen`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Erro ao marcar como visto');
      }
      // Remover do array local
      setNovoItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      console.error('Erro ao marcar como visto:', err);
    }
  };

  // Limpar todas as notificações
  const limparTodas = async () => {
    try {
      const response = await fetch(`/api/menus/${menuId}/clear-new-items`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Erro ao limpar notificações');
      }
      setNovoItems([]);
    } catch (err) {
      console.error('Erro ao limpar notificações:', err);
    }
  };

  return {
    novoItems,
    count: novoItems.length,
    isLoading,
    error,
    marcarComoVisto,
    limparTodas,
  };
};
