// Cache name will be set dynamically when the service worker is registered
let CACHE_NAME = 'wordget-v1';

// Function to set cache name with version
function setCacheName(version) {
  CACHE_NAME = `wordget-${version}`;
}

const urlsToCache = [
  '/',
  '/style.css',
  '/manifest.json',
  '/index.js',
  '/icon.svg',
];

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_CACHE_VERSION') {
    setCacheName(event.data.version);
  }
});

// Install event - cache the assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache with name:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve cached assets when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }
        
        // Clone the request because it's a stream that can only be consumed once
        const fetchRequest = event.request.clone();
        
        // Fetch from network
        return fetch(fetchRequest)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response because it's a stream that can only be consumed once
            const responseToCache = response.clone();
            
            // Cache the response
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
});
