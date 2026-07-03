/**
 * NovidadeNotification.tsx - Badge "NOVO" com animação pulsante
 * Exibe um badge visual em itens recém-criados
 */

import React from 'react';

interface NovidadeNotificationProps {
  className?: string;
}

export const NovidadeNotification: React.FC<NovidadeNotificationProps> = ({
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
      </span>
      <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded">
        NOVO
      </span>
    </div>
  );
};

export default NovidadeNotification;
