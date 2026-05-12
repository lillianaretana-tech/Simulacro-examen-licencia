/* ================================================================
   SERVICE WORKER — Simulador Licencia CR
   Versión: 2026.1
   Estrategia: Cache-first para assets estáticos, network-first para HTML
================================================================ */
const CACHE_NAME = 'simulador-licencia-cr-v1';
const OFFLINE_URL = '/Simulacro-examen-licencia/';

const ASSETS_TO_CACHE = [
  '/Simulacro-examen-licencia/',
  '/Simulacro-examen-licencia/index.html',
  '/Simulacro-examen-licencia/manifest.json',
  '/Simulacro-examen-licencia/icons/icon-192.png',
  '/Simulacro-examen-licencia/icons/icon-512.png'
];

/* — Instalación: pre-cachea los assets esenciales — */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* — Activación: limpia caches viejos — */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* — Fetch: network-first para HTML, cache-first para todo lo demás — */
self.addEventListener('fetch', function(event) {
  // Solo interceptar GET
  if (event.request.method !== 'GET') return;

  // Ignorar URLs de Hotmart y externos
  var url = new URL(event.request.url);
  if (!url.origin.includes('github.io')) return;

  if (event.request.mode === 'navigate') {
    /* Páginas HTML: intentar red primero, caché como fallback */
    event.respondWith(
      fetch(event.request).then(function(response) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
        return response;
      }).catch(function() {
        return caches.match(OFFLINE_URL);
      })
    );
  } else {
    /* Assets: caché primero, red como fallback */
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        return cached || fetch(event.request).then(function(response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
          return response;
        });
      })
    );
  }
});
