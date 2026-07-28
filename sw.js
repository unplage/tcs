// sw.js - 通用 Service Worker (适配 GitHub Pages 多项目)
const BASE_PATH = self.location.pathname.replace(/[^/]+$/, '');
const CACHE_NAME = `pwa-cache${BASE_PATH.replace(/\//g, '-')}v2`;

const PRECACHE_URLS = [
  BASE_PATH,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}manifest.json`,
];

const STATIC_EXTENSIONS = ['js', 'css', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'woff', 'woff2', 'ttf', 'eot', 'ico'];

function isStaticResource(url) {
  const ext = url.pathname.split('.').pop().toLowerCase();
  return STATIC_EXTENSIONS.includes(ext);
}

function isNavigateRequest(request) {
  return request.mode === 'navigate' || (request.method === 'GET' && request.destination === 'document');
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(
        PRECACHE_URLS.map(url => cache.add(url).catch(err => console.warn(`Precache failed ${url}:`, err)))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cache => {
          if (cache.startsWith('pwa-cache-') && cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== location.origin || request.method !== 'GET') return;

  if (isNavigateRequest(request)) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(
            '<h1 style="color:#fff;background:#0a0f1e;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">离线状态 - 请检查网络后刷新</h1>',
            { status: 503, statusText: 'Offline', headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  if (isStaticResource(url)) {
    event.respondWith(
      caches.match(request).then(cached =>
        cached || fetch(request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return networkResponse;
        }).catch(() => new Response('', { status: 408 }))
      )
    );
    return;
  }
});
