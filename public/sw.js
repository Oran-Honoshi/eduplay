// EduPlay service worker — deliberately minimal.
// It never caches pages or API responses (kids' progress, sessions and
// questions must always be live). It only keeps a small offline page so an
// installed app shows a friendly message instead of the browser's error
// screen when there's no connection.
const OFFLINE_CACHE = 'eduplay-offline-v1'
const OFFLINE_URL = '/offline.html'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then((cache) => cache.addAll([OFFLINE_URL, '/icons/icon-192.png']))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== OFFLINE_CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return
  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL))
  )
})
