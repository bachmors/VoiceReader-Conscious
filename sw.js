// 🎤 VoiceReader Conscious - Service Worker
const CACHE_NAME = 'voicereader-v1';
const urlsToCache = [
  '/VoiceReader-Conscious/',
  '/VoiceReader-Conscious/index.html',
  '/VoiceReader-Conscious/assets/',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
