// Service Worker de Rutina Gym — permite que la app cargue sin conexión
// y funcione con los datos guardados localmente hasta que vuelva la señal.

const CACHE_NAME = 'rutina-gym-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-180.png',
  '/login-bg.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Botones de acción de la notificación del cronómetro de descanso (pausar/reanudar/detener)
self.addEventListener('notificationclick', (event) => {
  const notif = event.notification;
  const action = event.action; // '' si tocaron el cuerpo, o 'pause'/'resume'/'stop'
  event.waitUntil((async () => {
    const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (action) {
      clientsList.forEach(c => c.postMessage({ restTimerAction: action }));
      if (action !== 'stop') return; // pausar/reanudar no necesita cerrar la notificación
      notif.close();
      return;
    }
    // Tocaron el cuerpo de la notificación: enfocar o abrir la app
    notif.close();
    if (clientsList.length > 0) {
      clientsList[0].focus();
    } else {
      self.clients.openWindow('/');
    }
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // no interceptar POST (guardado de datos)

  const url = new URL(request.url);

  // Llamadas a la API: siempre intentar la red primero (datos frescos).
  // Si no hay conexión, la app ya sabe usar localStorage como respaldo.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => new Response(JSON.stringify({ offline: true }), {
        headers: { 'Content-Type': 'application/json' }
      }))
    );
    return;
  }

  // Recursos externos (fuentes, CDN de imágenes de ejercicios): dejar pasar normal.
  if (url.origin !== self.location.origin) return;

  // App shell y assets propios: cache primero, actualiza en segundo plano.
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((response) => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});
