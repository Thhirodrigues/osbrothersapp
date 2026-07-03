/**
 * NovidadeBanner.tsx - Banner de notificação de novidades na tela inicial
 * Exibe notificação push com itens novos para gerar curiosidade
 * 
 * MELHORIAS:
 * - Cor profissional (azul/verde em vez de laranja)
 * - Estado de fechamento persistente em localStorage
 * - Não reabre automaticamente após usuário fechar
 */

import React, { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useNovidadeNotificacoes, NovoItem } from '../hooks/useNovidadeNotificacoes';

interface NovidadeBannerProps {
  menuId: string;
  onClose?: () => void;
  autoHideSeconds?: number;
}

export const NovidadeBanner: React.FC<NovidadeBannerProps> = ({
  menuId,
  onClose,
  autoHideSeconds = 8,
}) => {
  const { novoItems, count } = useNovidadeNotificacoes(menuId);
  const [isVisible, setIsVisible] = useState(false);
  const [displayItems, setDisplayItems] = useState<NovoItem[]>([]);
  const [userClosed, setUserClosed] = useState(false);

  // Chave para localStorage para rastrear se o usuário fechou o banner
  const closedKey = `novidadeBannerClosed_${menuId}`;

  // Carregar estado de fechamento ao montar
  useEffect(() => {
    const wasClosed = localStorage.getItem(closedKey) === 'true';
    setUserClosed(wasClosed);
  }, [closedKey]);

  useEffect(() => {
    // Se o usuário fechou, não mostrar novamente
    if (userClosed) {
      setIsVisible(false);
      return;
    }

    if (count > 0) {
      setIsVisible(true);
      setDisplayItems(novoItems.slice(0, 3)); // Mostrar apenas os 3 primeiros

      // Auto-hide após alguns segundos
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, autoHideSeconds * 1000);

      return () => clearTimeout(timer);
    }
  }, [count, novoItems, autoHideSeconds, userClosed]);

  if (!isVisible || count === 0) {
    return null;
  }

  const handleClose = () => {
    setIsVisible(false);
    setUserClosed(true);
    // Persistir no localStorage que o usuário fechou
    localStorage.setItem(closedKey, 'true');
    onClose?.();
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Cor profissional: Azul com gradiente sutil */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg shadow-xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 animate-bounce" />
            <h3 className="font-bold text-blue-900">Novidades no Cardápio!</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition"
            aria-label="Fechar notificação"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="space-y-2 mb-3">
          {displayItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded p-2 border border-blue-200 hover:border-blue-400 transition"
            >
              <p className="font-semibold text-sm text-gray-800">{item.name}</p>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-600">{item.category_name}</span>
                <span className="text-sm font-bold text-blue-600">R$ {item.price.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-xs text-gray-600 text-center">
          {count > 3 ? (
            <p>+{count - 3} itens novos! Confira no cardápio</p>
          ) : (
            <p>Confira esses novos itens!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NovidadeBanner;
