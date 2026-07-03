/**
 * AnnouncementBannerContainer - Container que exibe banners ativos
 * Filtra banners fechados e expirados
 * Carrega banners do servidor
 */

import { useEffect } from 'react';
import { useBanners, Banner } from '@/contexts/BannerContext';
import { AnnouncementBanner } from './AnnouncementBanner';

export function AnnouncementBannerContainer() {
  const { banners, closedBannerIds, setBanners } = useBanners();

  // Carregar banners do servidor ao montar
  useEffect(() => {
    const loadBanners = async () => {
      try {
        const response = await fetch('/api/banners');
        if (response.ok) {
          const data = await response.json();
          setBanners(data);
        }
      } catch (error) {
        console.error('Erro ao carregar banners:', error);
      }
    };

    loadBanners();
    // Recarregar a cada 5 minutos
    const interval = setInterval(loadBanners, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [setBanners]);

  // Filtrar banners ativos, não fechados e não expirados
  const activeBanners = banners.filter((banner: Banner) => {
    // Verificar se está ativo
    if (!banner.ativo) return false;

    // Verificar se foi fechado pelo usuário
    if (closedBannerIds.has(banner.id)) return false;

    // Verificar se expirou
    if (banner.dataExpiracao && banner.dataExpiracao < Date.now()) return false;

    return true;
  });

  if (activeBanners.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {activeBanners.map((banner: Banner) => (
        <AnnouncementBanner key={banner.id} banner={banner} />
      ))}
    </div>
  );
}
