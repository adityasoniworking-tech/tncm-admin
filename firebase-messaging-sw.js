// ========================================
// FCM SERVICE WORKER - firebase-messaging-sw.js
// ========================================
// Standard FCM service worker file (root directory)
// Handles push notifications for all devices

// ========================================
// FCM SERVICE WORKER - firebase-messaging-sw.js
// ========================================
// Firebase Modular SDK v9+ for Service Worker

// Import Firebase modules (compat for service worker)
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC6Cr8OI7pjTt3t70hrjiSW7kWeZj4jHWc",
    authDomain: "bakeryapp-c4812.firebaseapp.com",
    projectId: "bakeryapp-c4812",
    storageBucket: "bakeryapp-c4812.firebasestorage.app",
    messagingSenderId: "547764804378",
    appId: "1:547764804378:web:e4a425b9e13c826afaaaa3",
    measurementId: "G-26NMR2HTWE"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages (FCM Push)
messaging.onBackgroundMessage((payload) => {
    console.log('📡 FCM Background Message:', payload);
    
    // Extract notification data
    const notificationTitle = payload.notification?.title || '🍕 New Order!';
    const notificationBody = payload.notification?.body || payload.data?.body || 'You have a new order';
    const notificationIcon = payload.notification?.icon || payload.data?.icon || 'Assests/apple-touch-icon.png';
    const notificationBadge = payload.notification?.badge || payload.data?.badge || 'Assests/apple-touch-icon.png';
    
    // Create notification options
    const notificationOptions = {
        body: notificationBody,
        icon: notificationIcon,
        badge: notificationBadge,
        tag: 'fcm-new-order',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: payload.data || {},
        actions: [
            {
                action: 'open',
                title: 'View Order',
                icon: 'https://img.icons8.com/color/48/000000/view-details.png'
            }
        ]
    };
    
    // Show the notification
    self.registration.showNotification(notificationTitle, notificationOptions);
    
    // Send message to all clients (open tabs) - NO SOUND IN SW
    self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
        clients.forEach(client => {
            if (client.url && client.focus) {
                client.postMessage({
                    type: 'FCM_PUSH_NOTIFICATION',
                    data: payload,
                    timestamp: Date.now()
                });
            }
        });
    });
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('🖱️ FCM Notification clicked:', event);
    
    // Close the notification
    event.notification.close();
    
    // Get notification data
    const notificationData = event.notification.data || {};
    
    // Handle action clicks
    if (event.action === 'open') {
        // Focus or open the app
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(clientList => {
                // If app is already open, focus it
                for (const client of clientList) {
                    if (client.url && client.focus) {
                        return client.focus();
                    }
                }
                
                // Otherwise open new window
                if (clients.openWindow) {
                    return clients.openWindow('/?order=' + (notificationData.orderId || 'new'));
                }
            })
        );
    } else {
        // Default click behavior
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(clientList => {
                for (const client of clientList) {
                    if (client.url && client.focus) {
                        return client.focus();
                    }
                }
                
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
        );
    }
});

// Handle push events (fallback for older browsers)
self.addEventListener('push', (event) => {
    console.log('📡 Push event received:', event);
    
    if (!event.data) {
        console.log('No data in push event');
        return;
    }
    
    try {
        const data = event.data.json();
        console.log('Push data:', data);
        
        // Show notification
        const title = data.title || '🍕 New Order!';
        const options = {
            body: data.body || 'You have a new order',
            icon: data.icon || 'Assests/apple-touch-icon.png',
            badge: data.badge || 'Assests/apple-touch-icon.png',
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
        
        event.waitUntil(
            self.registration.showNotification(title, options)
        );
        
    } catch (error) {
        console.error('Error handling push event:', error);
    }
});

// Service worker installation
self.addEventListener('install', (event) => {
    console.log('🔧 FCM Service Worker installing...');
    self.skipWaiting();
});

// Service worker activation
self.addEventListener('activate', (event) => {
    console.log('✅ FCM Service Worker activated');
    event.waitUntil(self.clients.claim());
});

// Handle message events from main app
self.addEventListener('message', (event) => {
    console.log('📨 Message received in FCM SW:', event.data);
    
    // Handle different message types
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'GET_FCM_TOKEN':
                // Return FCM token if available
                if (messaging && messaging.getToken) {
                    messaging.getToken().then(token => {
                        event.ports[0].postMessage({ 
                            type: 'FCM_TOKEN', 
                            token: token 
                        });
                    });
                }
                break;
                
            case 'SKIP_WAITING':
                // Force activate new service worker
                self.skipWaiting();
                break;
        }
    }
});

// Background sync for offline support
self.addEventListener('sync', (event) => {
    console.log('🔄 Background sync:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Handle background sync tasks
            console.log('🔄 Processing background sync...')
        );
    }
});

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
    self.registration.periodicSync.register('check-orders', {
        minInterval: 60 * 1000 // Every minute
    }).then(() => {
        console.log('🔄 Periodic sync registered');
    }).catch(error => {
        console.log('❌ Periodic sync not supported:', error);
    });
}

console.log('🚀 FCM Service Worker (firebase-messaging-sw.js) loaded successfully');
