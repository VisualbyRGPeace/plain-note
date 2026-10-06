// Minimal offline support: network first, fall back to cache.
const CACHE = 'plain-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) =>
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
);
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    fetch(r)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(r, copy));
        return res;
      })
      .catch(() => caches.match(r).then((m) => m || caches.match('./')))
  );
});
