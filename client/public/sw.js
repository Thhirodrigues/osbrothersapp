/**
 * Service Worker para Caderninho Digital
 * Suporta funcionamento offline com cache de assets
 * Implementa atualização automática do PWA
 */

// Usar timestamp para forçar atualização do cache a cada deploy
// Isso garante que PWAs instalados no celular recebam a nova versão
const CACHE_VERSION = '{{BUILD_TIMESTAMP}}';
const CACHE_NAME = `caderninho-cache-${CACHE_VERSION}`;

const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Versão do app (deve ser atualizada a cada release)
const APP_VERSION = '1.0.0';

// Instalar o Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE).catch((err) => {
        console.log('Erro ao cachear URLs:', err);
      });
    })
  );
  self.skipWaiting();
});

// Ativar o Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia de cache: Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Ignorar requisições não-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar requisições para APIs externas (como Google Fonts)
  if (event.request.url.includes('fonts.googleapis.com') || 
      event.request.url.includes('fonts.gstatic.com')) {
    return;
  }

  // ⚠️ CRÍTICO: NÃO cachear requisições de API!
  // API responses devem ser sempre frescos para evitar dados desincronizados
  if (event.request.url.includes('/api/')) {
    // Network only para APIs - sem cache
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cachear apenas assets estáticos (CSS, JS, imagens)
        if (response.ok && event.request.destination !== 'document') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Se falhar, tentar do cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // Se não estiver em cache, retornar página offline
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Sincronização em background (quando voltar online)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-dados') {
    event.waitUntil(
      // Aqui você pode sincronizar dados quando voltar online
      Promise.resolve()
    );
  }
});
