// Service Worker for Background Order Notifications
// Works even when website is closed

const CACHE_NAME = 'order-notifications-v1';
const NOTIFICATION_SOUND_URL = 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3';

// Install Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Service Worker installed');
            return cache.addAll([
                NOTIFICATION_SOUND_URL
            ]);
        })
    );
});

// Activate Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Listen for push messages (if using Firebase Cloud Messaging)
self.addEventListener('push', event => {
    console.log('Push message received:', event);
    
    const data = event.data.json();
    
    if (data.type === 'new_order') {
        showOrderNotification(data.orderData);
    }
});

// Listen for messages from main thread
self.addEventListener('message', event => {
    console.log('Message received in service worker:', event.data);
    
    if (event.data.type === 'new_order') {
        showOrderNotification(event.data.orderData);
    }
});

// Show order notification
function showOrderNotification(orderData) {
    const customerName = orderData.userName || 'Customer';
    const orderTotal = orderData.totalPrice || '0';
    const orderId = orderData.orderId || orderData.id || 'Unknown';
    
    // Play notification sound
    playNotificationSound();
    
    // Show browser notification
    self.registration.showNotification("🍕 New Order Received!", {
        body: `${customerName} placed an order of ₹${orderTotal} (Order #${orderId})`,
        icon: "https://img.icons8.com/color/96/000000/bakery--v1.png",
        badge: "https://img.icons8.com/color/48/000000/bakery--v1.png",
        vibrate: [200, 100, 200],
        requireInteraction: true,
        tag: "new-order",
        data: {
            orderId: orderId,
            customerName: customerName,
            total: orderTotal,
            url: self.registration.scope + 'admin.html'
        }
    });
}

// Play notification sound
function playNotificationSound() {
    try {
        // Try to play from cache first
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(NOTIFICATION_SOUND_URL);
        }).then(response => {
            if (response) {
                return response.blob();
            } else {
                // Fallback to fetch
                return fetch(NOTIFICATION_SOUND_URL).then(fetchResponse => {
                    return fetchResponse.blob();
                });
            }
        }).then(blob => {
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            
            audio.volume = 0.8;
            audio.loop = false;
            
            return audio.play();
        }).then(() => {
            console.log('Notification sound played in service worker');
        }).catch(error => {
            console.error('Error playing sound in service worker:', error);
        });
        
    } catch (error) {
        console.error('Error in service worker sound playback:', error);
    }
}

// Handle notification click
self.addEventListener('notificationclick', event => {
    console.log('Notification clicked:', event);
    
    event.notification.close();
    
    // Open or focus the admin page
    if (clients.openWindow) {
        clients.openWindow(event.notification.data.url || '/admin.html').then(windowClient => {
            if (windowClient) {
                windowClient.focus();
            }
        });
    } else if (clients.matchAll) {
        clients.matchAll().then(clientList => {
            for (const client of clientList) {
                if (client.url.includes('admin.html')) {
                    client.focus();
                    return;
                }
            }
            // If no admin page is open, open one
            if (clientList.length > 0) {
                clients.openWindow('/admin.html');
            }
        });
    }
});

// Handle notification close
self.addEventListener('notificationclose', event => {
    console.log('Notification closed:', event);
});

// Fetch handler for offline support
self.addEventListener('fetch', event => {
    if (event.request.url === NOTIFICATION_SOUND_URL) {
        event.respondWith(
            caches.match(NOTIFICATION_SOUND_URL).then(response => {
                return response || fetch(NOTIFICATION_SOUND_URL);
            })
        );
    }
});
