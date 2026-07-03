/**
 * AnnouncementBanner - Componente para exibir banners de notícias
 * Mostra título, mensagem e botão de fechar
 * Não reabre após fechar (persistido em localStorage)
 */

import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Banner, useBanners } from '@/contexts/BannerContext';
import { Button } from '@/components/ui/button';

interface AnnouncementBannerProps {
  banner: Banner;
}

export function AnnouncementBanner({ banner }: AnnouncementBannerProps) {
  const { closeBanner } = useBanners();

  const getBgColor = () => {
    switch (banner.tipo) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'info':
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const getTextColor = () => {
    switch (banner.tipo) {
      case 'success':
        return 'text-green-800 dark:text-green-200';
      case 'warning':
        return 'text-yellow-800 dark:text-yellow-200';
      case 'error':
        return 'text-red-800 dark:text-red-200';
      case 'info':
      default:
        return 'text-blue-800 dark:text-blue-200';
    }
  };

  const getIcon = () => {
    switch (banner.tipo) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'info':
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 flex items-start gap-3 ${getBgColor()}`}
      role="alert"
    >
      <div className={`flex-shrink-0 mt-0.5 ${getTextColor()}`}>
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold ${getTextColor()}`}>{banner.titulo}</h3>
        <p className={`text-sm mt-1 ${getTextColor()} opacity-90`}>
          {banner.mensagem}
        </p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => closeBanner(banner.id)}
        className="flex-shrink-0 -mr-2"
        aria-label="Fechar notificação"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
