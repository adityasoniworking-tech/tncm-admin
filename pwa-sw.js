const CACHE_VERSION = '1.3.2';
const CACHE_NAME = `tncm-admin-portal-v${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `tncm-admin-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `tncm-admin-dynamic-v${CACHE_VERSION}`;
const UPDATE_CACHE_NAME = 'tncm-admin-update-cache';

// Firebase Imports for FCM
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');


// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/Assests/site.webmanifest',
  '/Assests/favicon.ico',
  '/Assests/favicon-16x16.png',
  '/Assests/favicon-32x32.png',
  '/Assests/apple-touch-icon.png',
  '/Assests/android-chrome-192x192.png',
  '/Assests/android-chrome-512x512.png',
  '/CSS/admin-style.css',
  '/CSS/tailwind.css',
  '/CSS/dashboard.css',
  '/JS/firebase-config.js',
  '/JS/auth.js',
  '/JS/navigation.js',
  '/JS/dashboard.js',
  '/JS/orders.js',
  '/JS/menu.js',
  '/JS/categories.js',
  '/JS/products.js',
  '/JS/notification.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.1/firebase-storage-compat.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[PWA SW] Install event triggered - Version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[PWA SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[PWA SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[PWA SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches and notify clients
self.addEventListener('activate', (event) => {
  console.log('[PWA SW] Activate event triggered - Version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Clean up old version caches
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME && 
                cacheName !== CACHE_NAME &&
                cacheName !== UPDATE_CACHE_NAME) {
              console.log('[PWA SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[PWA SW] Cache cleanup completed');
        
        // Notify all clients about the update
        return self.clients.matchAll();
      })
      .then((clients) => {
        console.log('[PWA SW] Notifying clients about update');
        
        // Send update message to all clients
        clients.forEach((client) => {
          client.postMessage({
            type: 'UPDATE_AVAILABLE',
            version: CACHE_VERSION,
            message: 'A new version of the app is available!'
          });
        });
        
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and external API calls
  if (request.method !== 'GET' || 
      url.hostname.includes('firebaseio.com') || 
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firestore.googleapis.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          // Background update for static assets
          if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
            fetch(request).then(response => {
                if(response.ok) {
                    caches.open(STATIC_CACHE_NAME).then(cache => cache.put(request, response.clone()));
                }
            }).catch(() => {});
          }
          return cachedResponse;
        }

        // If not in cache, fetch from network
        return fetch(request).then(response => {
            // Cache if successful and valid
            if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
            }

            // Cache dynamic content
            if (request.headers.get('accept').includes('text/html') || 
                request.url.includes('firestore') || 
                request.url.includes('storage') ||
                request.url.includes('.jpg') || 
                request.url.includes('.png')) {
                const responseToCache = response.clone();
                caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                    cache.put(request, responseToCache);
                });
            }
            return response;
        }).catch(() => {
            // Network failed, try offline fallback
            if (request.headers.get('accept').includes('text/html')) {
                return caches.match('/index.html');
            }
            // For images/other assets, return nothing or placeholder
        });
        

      })
      .catch(() => {
        // Final fallback for critical resources
        if (request.url.includes('.css') || request.url.includes('.js')) {
          return new Response('/* Offline */', { 
            headers: { 'Content-Type': 'text/css' }
          });
        }
        
        // Return a basic offline response
        return new Response('<h1>Offline</h1><p>Please check your connection.</p>', { 
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/html' }
        });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[PWA SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync-orders') {
    event.waitUntil(syncOfflineOrders());
  }
});

// Sync offline orders when connection is restored
async function syncOfflineOrders() {
  try {
    const offlineOrders = await getOfflineOrders();
    for (const order of offlineOrders) {
      try {
        await syncOrderToServer(order);
        await removeOfflineOrder(order.id);
      } catch (error) {
        console.error('[PWA SW] Failed to sync order:', error);
      }
    }
  } catch (error) {
    console.error('[PWA SW] Background sync failed:', error);
  }
}

// [REMOVED] Raw push listener - Replaced by Firebase Messaging
// self.addEventListener('push', (event) => { ... });

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[PWA SW] Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/index.html?section=orders')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        for (const client of clientList) {
          // Robust check for existing window
          if (client.url && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/index.html');
        }
      })
    );
  }
});

// Periodic background sync for cache updates
self.addEventListener('periodicsync', (event) => {
  console.log('[PWA SW] Periodic sync triggered:', event.tag);
  
  if (event.tag === 'cache-update') {
    event.waitUntil(updateCache());
  }
});

// Update cache periodically
async function updateCache() {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    await cache.addAll(STATIC_ASSETS);
    console.log('[PWA SW] Cache updated successfully');
  } catch (error) {
    console.error('[PWA SW] Cache update failed:', error);
  }
}

// Helper functions for offline storage
async function getOfflineOrders() {
  // This would integrate with IndexedDB or localStorage
  return [];
}

async function removeOfflineOrder(orderId) {
  // Remove order from offline storage
  console.log('[PWA SW] Removing offline order:', orderId);
}

async function syncOrderToServer(order) {
  // Sync order to server
  console.log('[PWA SW] Syncing order to server:', order);
}

// Message handling for cache management and updates
self.addEventListener('message', (event) => {
  console.log('[PWA SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    event.waitUntil(updateCache());
  }
  
  if (event.data && event.data.type === 'CHECK_FOR_UPDATES') {
    event.waitUntil(checkForUpdates());
  }
  
  if (event.data && event.data.type === 'APPLY_UPDATE') {
    self.skipWaiting();
  }
});

// Check for updates in the background
async function checkForUpdates() {
  try {
    console.log('[PWA SW] Checking for updates...');
    
    // Try to fetch the service worker file to check for updates
    const response = await fetch('/pwa-sw.js', { cache: 'no-store' });
    const currentSW = await response.text();
    
    // Extract version from the service worker
    const versionMatch = currentSW.match(/const CACHE_VERSION = ['"]([^'"]+)['"]/);
    const newVersion = versionMatch ? versionMatch[1] : null;
    
    if (newVersion && newVersion !== CACHE_VERSION) {
      console.log('[PWA SW] New version detected:', newVersion);
      
      // Notify clients about the update
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({
          type: 'UPDATE_DETECTED',
          currentVersion: CACHE_VERSION,
          newVersion: newVersion,
          message: `Update available: ${CACHE_VERSION} → ${newVersion}`
        });
      });
      
      return true;
    }
    
    console.log('[PWA SW] No updates available');
    return false;
  } catch (error) {
    console.error('[PWA SW] Error checking for updates:', error);
    return false;
  }
}

// Background update check every 30 minutes
setInterval(() => {
  checkForUpdates();
}, 30 * 60 * 1000);

console.log('[PWA SW] Service Worker loaded successfully');

// ========================================
// FIREBASE CLOUD MESSAGING (FCM)
// ========================================
const firebaseConfig = {
    apiKey: "AIzaSyC6Cr8OI7pjTt3t70hrjiSW7kWeZj4jHWc",
    authDomain: "bakeryapp-c4812.firebaseapp.com",
    projectId: "bakeryapp-c4812",
    storageBucket: "bakeryapp-c4812.firebasestorage.app",
    messagingSenderId: "547764804378",
    appId: "1:547764804378:web:e4a425b9e13c826afaaaa3",
    measurementId: "G-26NMR2HTWE"
};

try {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    // Background Message Handler
    messaging.onBackgroundMessage((payload) => {
        console.log('📡 FCM Background Message (PWA SW):', payload);

        const data = payload.data || {};
        const notificationTitle = payload.notification?.title || data.title || '🍕 New Order!';
        const notificationBody = payload.notification?.body || data.body || 'You have a new order';
        const notificationIcon = payload.notification?.icon || data.icon || '/Assests/apple-touch-icon.png';
        
        // Show notification
        const notificationOptions = {
            body: notificationBody,
            icon: notificationIcon,
            badge: '/Assests/favicon-32x32.png',
            tag: 'fcm-new-order',
            requireInteraction: true,
            vibrate: [200, 100, 200],
            data: data,
            actions: [
                {
                    action: 'open',
                    title: 'View Order'
                }
            ]
        };

        if (self.registration && self.registration.showNotification) {
            self.registration.showNotification(notificationTitle, notificationOptions);
        }
        
        // Notify clients (open tabs) about message event
        self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
            clients.forEach(client => {
                if (client.url && 'postMessage' in client) {
                    client.postMessage({
                        type: 'FCM_PUSH_NOTIFICATION',
                        data: payload
                    });
                }
            });
        });
    });
    
    console.log('[PWA SW] Firebase Messaging initialized');
} catch (error) {
    console.log('[PWA SW] Firebase init failed:', error);
}
