/**
 * Service Worker pro Captioni PWA
 * Stale-while-revalidate strategie pro statické assety
 */

const CACHE_NAME = 'captioni-v1';
const STATIC_CACHE_NAME = 'captioni-static-v1';

// Soubory k ukládání do cache při instalaci
const STATIC_ASSETS = [
  '/',
  '/video/subtitles',
  '/manifest.json',
  // Fonty a základní CSS se načtou automaticky
];

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - stale-while-revalidate strategie
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Pouze GET požadavky
  if (request.method !== 'GET') {
    return;
  }

  // Přeskočit API calls
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Přeskočit externí domény
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.match(request)
          .then((cachedResponse) => {
            // Fetch ze sítě pro revalidaci
            const fetchPromise = fetch(request)
              .then((networkResponse) => {
                // Ulož do cache pouze úspěšné response
                if (networkResponse && networkResponse.status === 200) {
                  cache.put(request, networkResponse.clone());
                }
                return networkResponse;
              })
              .catch((error) => {
                console.log('[SW] Fetch failed:', error);
                return cachedResponse;
              });

            // Vrať cached verzi okamžitě pokud existuje
            return cachedResponse || fetchPromise;
          });
      })
  );
});

// Background sync pro offline actions (budoucí feature)
self.addEventListener('sync', (event) => {
  if (event.tag === 'upload-video') {
    console.log('[SW] Background sync: upload-video');
    // TODO: Implementovat offline upload queue
  }
});

// Push notifications pro dokončené joby (budoucí feature)
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Your video is ready!',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge.png',
      tag: 'video-ready',
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'View Video'
        },
        {
          action: 'dismiss',
          title: 'Close'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'Captioni',
        options
      )
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.action);
  
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/video/subtitles')
    );
  }
});

// Share target handler (budoucí feature pro PWA share)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.pathname === '/share-target' && event.request.method === 'POST') {
    event.respondWith(
      (async () => {
        const formData = await event.request.formData();
        const video = formData.get('video');
        
        if (video) {
          // TODO: Redirect na upload page s pre-selected video
          return Response.redirect('/video/subtitles', 303);
        }
        
        return Response.redirect('/', 303);
      })()
    );
  }
});
