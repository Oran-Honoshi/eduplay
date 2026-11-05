// EduPlay service worker — deliberately minimal.
// It never caches pages or API responses (kids' progress, sessions and
// questions must always be live). It only keeps a small offline page so an
// installed app shows a friendly message instead of the browser's error
// screen when there's no connection.
const OFFLINE_CACHE = 'eduplay-offline-v2'
const OFFLINE_URL = '/offline.html'
// Images the offline page itself shows (served from cache only when the network fails).
const OFFLINE_ASSETS = ['/icons/icon-192.png', '/pip/plain/sleep.webp']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then((cache) => cache.addAll([OFFLINE_URL, ...OFFLINE_ASSETS]))
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
  const url = new URL(event.request.url)
  if (url.origin === self.location.origin && OFFLINE_ASSETS.includes(url.pathname)) {
    event.respondWith(fetch(event.request).catch(() => caches.match(url.pathname)))
    return
  }
  if (event.request.mode !== 'navigate') return
  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL))
  )
})
