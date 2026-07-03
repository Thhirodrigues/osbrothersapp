/**
 * HideValuesToggle - Botão para ocultar/mostrar valores
 * Exibe ícone de olho ou olho fechado
 * Sincronizado globalmente via Context
 */

import { Eye, EyeOff } from 'lucide-react';
import { useHideValues } from '@/contexts/HideValuesContext';
import { Button } from '@/components/ui/button';

export function HideValuesToggle() {
  const { isHidden, toggleHideValues } = useHideValues();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleHideValues}
      title={isHidden ? 'Mostrar valores' : 'Ocultar valores'}
      className="w-10 h-10 p-0"
    >
      {isHidden ? (
        <EyeOff className="w-5 h-5 text-muted-foreground" />
      ) : (
        <Eye className="w-5 h-5 text-muted-foreground" />
      )}
    </Button>
  );
}
