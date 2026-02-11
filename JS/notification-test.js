// Test Notification System
class NotificationTester {
    constructor() {
        this.init();
    }

    init() {
        // Request notification permission
        if ('Notification' in window && 'serviceWorker' in navigator) {
            this.requestPermission();
        }
    }

    async requestPermission() {
        try {
            const permission = await Notification.requestPermission();
            console.log('[Notification Test] Permission:', permission);
            
            if (permission === 'granted') {
                console.log('[Notification Test] Notifications granted!');
                this.showTestNotification();
            } else {
                console.log('[Notification Test] Notifications denied');
            }
        } catch (error) {
            console.error('[Notification Test] Permission error:', error);
        }
    }

    showTestNotification() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification('Test Notification', {
                    body: 'This is a test notification from TNCM Admin Portal',
                    icon: '/Assests/android-chrome-192x192.png',
                    badge: '/Assests/favicon-16x16.png',
                    vibrate: [100, 50, 100],
                    requireInteraction: true,
                    silent: false,
                    actions: [
                        {
                            action: 'explore',
                            title: 'View Orders',
                            icon: '/Assests/favicon-16x16.png'
                        },
                        {
                            action: 'close',
                            title: 'Close',
                            icon: '/Assests/favicon-16x16.png'
                        }
                    ]
                });
            });
        }
    }

    // Simulate new order notification
    simulateOrderNotification() {
        const orderData = {
            id: 'TEST-' + Date.now(),
            customer: 'Test Customer',
            amount: '₹299.00',
            items: 3
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification('🛒 New Order Received!', {
                    body: `Order #${orderData.id}\n${orderData.customer} • ${orderData.amount} • ${orderData.items} items`,
                    icon: '/Assests/android-chrome-192x192.png',
                    badge: '/Assests/favicon-16x16.png',
                    vibrate: [100, 50, 100],
                    requireInteraction: true,
                    silent: false,
                    tag: 'order-' + orderData.id,
                    data: orderData,
                    actions: [
                        {
                            action: 'explore',
                            title: 'View Order',
                            icon: '/Assests/favicon-16x16.png'
                        },
                        {
                            action: 'close',
                            title: 'Close',
                            icon: '/Assests/favicon-16x16.png'
                        }
                    ]
                });
            });
        }
    }
}

// Initialize notification tester
const notificationTester = new NotificationTester();

// Export for global access
window.notificationTester = notificationTester;
