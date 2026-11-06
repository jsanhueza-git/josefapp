self.addEventListener('install', event => {
    event.waitUntil(
        caches.open('v2').then(cache => {
            return cache.addAll([
                'index.html',
                'manifest.json',
                'icon.png'
            ]);
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== 'v2').map(k => caches.delete(k)))
        )
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
