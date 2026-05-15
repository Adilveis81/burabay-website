// Алсат PWA Service Worker v1
// Стратегия: сайт всегда с сети (network-first), кэш только для иконок/шрифтов

const CACHE = 'alsat-static-v1';
const STATIC = [
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/favicon.ico'
];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c) { return c.addAll(STATIC); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Иконки и статика — из кэша
  if (url.includes('/icons/') || url.includes('favicon')) {
    e.respondWith(
      caches.match(e.request).then(function(r){ return r || fetch(e.request); })
    );
    return;
  }

  // Шрифты Google — кэшируем
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.open(CACHE).then(function(c) {
        return c.match(e.request).then(function(r) {
          return r || fetch(e.request).then(function(res) {
            c.put(e.request, res.clone());
            return res;
          });
        });
      })
    );
    return;
  }

  // Всё остальное (сайт, API) — всегда с сети, без кэша
  // Изменения на сайте сразу отображаются
  e.respondWith(fetch(e.request));
});
