// ========================================
// ORDER NOTIFICATION SYSTEM
// ========================================
// Simple order notification system

const NOTIFICATION_SOUND_URL = 'alert.mp3';

// Setup order listener
function setupOrderListener() {
    console.log('Setting up order listener...');
    
    try {
        db.collection('orders').onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const orderData = change.doc.data();
                    console.log('New order received:', orderData);
                    
                    // ALWAYS show visual notification (no permission needed)
                    showVisualNotification(orderData);
                    
                    // ALWAYS try to play sound (independent of notification permission)
                    if (shouldNotify(orderData)) {
                        playWhatsAppSound();
                        
                        // Only try system notifications if permission granted
                        if (Notification.permission === "granted") {
                            showBrowserNotification(orderData);
                        } else {
                            console.log('Visual notification shown + sound attempted (no system notification permission)');
                        }
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error listening for orders:', error);
    }
}

// Check if we should notify
function shouldNotify(orderData) {
    const orderTime = orderData.timestamp ? orderData.timestamp.toDate() : new Date();
    const timeDiff = Date.now() - orderTime.getTime();
    
    // Only notify for orders created in last 10 seconds
    if (timeDiff > 10000) return false;
    
    // Check if notifications are disabled
    const notificationsDisabled = localStorage.getItem('disableOrderNotifications') === 'true';
    if (notificationsDisabled) return false;
    
    // Check last notification time to prevent spam
    const lastNotification = localStorage.getItem('lastOrderNotification');
    const timeSinceLastNotification = lastNotification ? Date.now() - parseInt(lastNotification) : Infinity;
    
    return timeSinceLastNotification > 30000; // 30 seconds between notifications
}

// Play notification sound
function playNotificationSound() {
    try {
        const audio = new Audio(NOTIFICATION_SOUND_URL);
        audio.volume = 0.8;
        audio.play().then(() => {
            console.log('Notification sound played');
            localStorage.setItem('lastOrderNotification', Date.now().toString());
        }).catch(error => {
            console.error('Error playing sound:', error);
        });
    } catch (error) {
        console.error('Error creating audio:', error);
    }
}

// Show visual notification
function showVisualNotification(orderData) {
    console.log('Showing visual notification for:', orderData);
    
    const customerName = orderData.userName || 'Customer';
    const orderTotal = orderData.totalPrice || '0';
    const orderId = orderData.orderId || orderData.id || 'Unknown';
    
    // Create fallback visual notification for desktop/laptop - ALWAYS SHOWS
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 16px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 99999;
        max-width: 350px;
        transform: translateX(500px);
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        border-left: 4px solid #059669;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 16px;">
            <div style="flex-shrink: 0;">
                <div style="width: 48px; height: 48px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                    <i class="fas fa-bell" style="color: #10b981; font-size: 20px;"></i>
                </div>
            </div>
            <div style="flex-grow: 1;">
                <h4 style="margin: 0 0 8px 0; font-weight: 700; color: white; font-size: 16px;">🍕 New Order!</h4>
                <p style="margin: 4px 0; font-size: 14px; color: #d1fae5; font-weight: 500;">${customerName} • ₹${orderTotal}</p>
                <p style="margin: 0; font-size: 12px; color: #a7f3d0; opacity: 0.9;">Order #${orderId}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; cursor: pointer; font-size: 18px; padding: 8px; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: background 0.2s;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    console.log('Visual notification added to DOM');
    
    // Animate in with bounce effect
    setTimeout(() => {
        notification.style.transform = 'translateX(0) scale(1)';
        console.log('Notification animated in');
    }, 100);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.transform = 'translateX(500px) scale(0.8)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                    console.log('Visual notification removed');
                }
            }, 400);
        }
    }, 8000);
}

// Show browser notification
function showBrowserNotification(orderData) {
    if ("Notification" in window) {
        const customerName = orderData.userName || 'Customer';
        const orderTotal = orderData.totalPrice || '0';
        const orderId = orderData.orderId || orderData.id || 'Unknown';
        
        if (Notification.permission === "granted") {
            // Play WhatsApp-style notification sound
            playWhatsAppSound();
            
            const notification = new Notification("🍕 New Order Received!", {
                body: `${customerName} placed an order of ₹${orderTotal}\nOrder #${orderId}`,
                icon: "Assests/apple-touch-icon.png",
                badge: "Assests/apple-touch-icon.png",
                tag: "new-order",
                requireInteraction: true,
                silent: false,
                vibrate: [200, 100, 200] // Vibration pattern like WhatsApp
            });
            
            // Auto-close notification after 10 seconds
            setTimeout(() => {
                notification.close();
            }, 10000);
            
            // Click handler to open orders section
            notification.onclick = function() {
                window.focus();
                notification.close();
                // If logged in, show orders section
                if (typeof showSection === 'function') {
                    showSection('orders');
                }
            };
            
        } else if (Notification.permission === "default") {
            // Request permission and show notification
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    showBrowserNotification(orderData);
                } else {
                    console.log('Notification permission denied');
                }
            });
        } else {
            console.log('Notification permission denied - cannot show system notification');
        }
    } else {
        console.log('This browser does not support system notifications');
    }
}

// Play WhatsApp-style notification sound
function playWhatsAppSound() {
    console.log('Attempting to play notification sound...');
    
    try {
        // Method 1: Standard Audio object
        const audio = new Audio('alert.mp3');
        audio.volume = 0.8;
        audio.preload = 'auto';
        
        // For mobile, we need to handle audio differently
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            console.log('Mobile device - attempting sound playback');
            
            // Try multiple methods for mobile
            audio.play().then(() => {
                console.log('✅ Mobile notification sound played successfully (Method 1)');
            }).catch(error => {
                console.error('❌ Method 1 failed:', error);
                
                // Method 2: Create audio element and append to DOM
                try {
                    const audioElement = document.createElement('audio');
                    audioElement.src = 'alert.mp3';
                    audioElement.volume = 0.8;
                    audioElement.autoplay = false;
                    audioElement.preload = 'auto';
                    document.body.appendChild(audioElement);
                    
                    audioElement.play().then(() => {
                        console.log('✅ Mobile audio played successfully (Method 2)');
                        setTimeout(() => {
                            document.body.removeChild(audioElement);
                        }, 1000);
                    }).catch(method2Error => {
                        console.error('❌ Method 2 failed:', method2Error);
                        
                        // Method 3: Try with user interaction simulation
                        try {
                            const tempAudio = new Audio('alert.mp3');
                            tempAudio.volume = 0.8;
                            tempAudio.muted = false;
                            
                            // Unmute and play
                            tempAudio.play().then(() => {
                                console.log('✅ Mobile audio played successfully (Method 3)');
                            }).catch(method3Error => {
                                console.error('❌ All methods failed, sound may not work on this device');
                                console.log('💡 Tip: Enable sound in browser settings or try desktop');
                            });
                        } catch (method3Error) {
                            console.error('❌ Method 3 creation failed:', method3Error);
                        }
                    });
                } catch (method2Error) {
                    console.error('❌ Method 2 creation failed:', method2Error);
                }
            });
        } else {
            // Desktop audio playback
            audio.play().then(() => {
                console.log('✅ Desktop notification sound played');
            }).catch(error => {
                console.error('❌ Desktop audio play failed:', error);
            });
        }
    } catch (error) {
        console.error('❌ Error creating audio:', error);
    }
}

// Initialize notification system
function initializeNotifications() {
    console.log('Initializing order notification system...');
    console.log('User Agent:', navigator.userAgent);
    console.log('Is mobile:', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    
    const isAdminPage = window.location.pathname.includes('admin.html') || 
                       window.location.pathname.includes('admin/');
    
    if (isAdminPage) {
        // For mobile, we need user interaction to request permission
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            console.log('Mobile device detected - showing permission request button');
            showMobilePermissionButton();
        } else {
            console.log('Desktop detected - requesting permission after 2 seconds');
            setTimeout(() => {
                requestNotificationPermission();
            }, 2000);
        }
        
        setTimeout(setupOrderListener, 1000);
    }
}

// Show mobile permission request button
function showMobilePermissionButton() {
    const button = document.createElement('div');
    button.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        z-index: 99999;
        max-width: 300px;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    button.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 12px;">🔔</div>
        <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700;">Enable Order Notifications</h3>
        <p style="margin: 0 0 16px 0; font-size: 14px; opacity: 0.9;">Get instant alerts for new orders with sound</p>
        <button onclick="enableMobileNotifications()" style="background: white; color: #3b82f6; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; width: 100%;">Enable Notifications</button>
        <button onclick="this.parentElement.parentElement.remove()" style="background: transparent; color: white; border: 1px solid rgba(255,255,255,0.3); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; margin-top: 8px; width: 100%;">Maybe Later</button>
    `;
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 99998;
    `;
    
    overlay.appendChild(button);
    document.body.appendChild(overlay);
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
        if (overlay.parentElement) {
            overlay.remove();
        }
    }, 30000);
}

// Enable mobile notifications (called from button click)
function enableMobileNotifications() {
    console.log('Mobile notification button clicked');
    // Remove the overlay
    const overlay = document.querySelector('div[style*="rgba(0,0,0,0.5)"]');
    if (overlay) overlay.remove();
    
    // Request permission first
    requestNotificationPermission();
    
    // Test sound with user interaction
    testMobileSound();
}

// Test mobile sound with user interaction
function testMobileSound() {
    console.log('Testing mobile sound with user interaction...');
    
    // Create audio element
    const audio = new Audio('alert.mp3');
    audio.volume = 0.8;
    audio.preload = 'auto';
    
    // Play sound (this should work after user interaction)
    audio.play().then(() => {
        console.log('✅ Mobile sound test successful!');
        showSoundTestSuccess();
    }).catch(error => {
        console.error('❌ Mobile sound test failed:', error);
        // Try alternative method
        tryAlternativeSound();
    });
}

// Alternative sound method for mobile
function tryAlternativeSound() {
    console.log('Trying alternative mobile sound method...');
    
    // Create audio element with different approach
    const audioElement = document.createElement('audio');
    audioElement.src = 'alert.mp3';
    audioElement.volume = 0.8;
    audioElement.autoplay = false;
    audioElement.preload = 'auto';
    
    // Add to DOM
    document.body.appendChild(audioElement);
    
    // Try to play
    audioElement.play().then(() => {
        console.log('✅ Alternative mobile sound worked!');
        showSoundTestSuccess();
        // Remove from DOM
        setTimeout(() => {
            document.body.removeChild(audioElement);
        }, 1000);
    }).catch(error => {
        console.error('❌ Alternative mobile sound also failed:', error);
        showSoundTestFailed();
    });
}

// Show sound test success message
function showSoundTestSuccess() {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        text-align: center;
    `;
    message.innerHTML = '🎵 Notification sound enabled! You will hear alerts for new orders.';
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.transition = 'opacity 0.3s ease';
        message.style.opacity = '0';
        setTimeout(() => message.remove(), 300);
    }, 3000);
}

// Show sound test failed message
function showSoundTestFailed() {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #f59e0b;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        text-align: center;
        max-width: 90%;
    `;
    message.innerHTML = '⚠️ Sound test failed. You will still get visual notifications, but sound may not work on this device.';
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.transition = 'opacity 0.3s ease';
        message.style.opacity = '0';
        setTimeout(() => message.remove(), 300);
    }, 5000);
}

// Request notification permission
function requestNotificationPermission() {
    console.log('Requesting notification permission...');
    console.log('Current permission status:', Notification.permission);
    
    if ("Notification" in window) {
        if (Notification.permission === "default") {
            console.log('Permission is default, requesting...');
            Notification.requestPermission().then(permission => {
                console.log('Permission response:', permission);
                if (permission === "granted") {
                    console.log('Notification permission granted');
                    showPermissionSuccess();
                } else if (permission === "denied") {
                    console.log('Notification permission denied');
                    showPermissionDenied();
                }
            });
        } else if (Notification.permission === "granted") {
            console.log('Notification permission already granted');
            showPermissionSuccess();
        } else {
            console.log('Notification permission previously denied');
            showPermissionDenied();
        }
    } else {
        console.log('This browser does not support system notifications');
    }
}

// Show permission success message
function showPermissionSuccess() {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
    `;
    message.textContent = '✅ Notifications enabled! You will receive alerts for new orders.';
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.transition = 'opacity 0.3s ease';
        message.style.opacity = '0';
        setTimeout(() => message.remove(), 300);
    }, 3000);
}

// Show permission denied message
function showPermissionDenied() {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #ef4444;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        max-width: 90%;
        text-align: center;
    `;
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    message.innerHTML = `
        ⚠️ Notifications blocked. Please enable notifications in your browser settings to receive order alerts.
        ${isMobile ? '<br><br><small>On mobile: Settings → Browser → Notifications → Enable</small>' : '<button onclick="this.parentElement.remove(); requestNotificationPermission();" style="margin-left: 10px; background: white; color: #ef4444; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">Try Again</button>'}
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        if (message.parentElement) {
            message.style.transition = 'opacity 0.3s ease';
            message.style.opacity = '0';
            setTimeout(() => {
                if (message.parentElement) message.remove();
            }, 300);
        }
    }, isMobile ? 12000 : 8000);
}

// Toggle notifications
function toggleOrderNotifications() {
    const currentlyDisabled = localStorage.getItem('disableOrderNotifications') === 'true';
    
    if (currentlyDisabled) {
        localStorage.removeItem('disableOrderNotifications');
        console.log('Order notifications enabled');
    } else {
        localStorage.setItem('disableOrderNotifications', 'true');
        console.log('Order notifications disabled');
    }
}

// Export functions
window.orderNotifications = {
    initializeNotifications,
    toggleOrderNotifications,
    playNotificationSound,
    showVisualNotification
};

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNotifications);
} else {
    initializeNotifications();
}
