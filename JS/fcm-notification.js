// ========================================
// FCM-ONLY NOTIFICATION SYSTEM
// ========================================
// Primary notification system for all devices (laptop + mobile)

// FCM Service Worker Registration
let fcmToken = null;
let fcmMessaging = null; // Renamed to avoid conflict

// 1) Use alert.mp3 from root - ENHANCED AUDIO SETUP
const orderSound = new Audio('alert.mp3');
let soundEnabled = false;
let audioContext = null;

// 2) Enable sound after user interaction (required by browsers)
function enableSound() {
    soundEnabled = true;
    console.log('[FCM] Sound enabled after user click');
    
    // Initialize AudioContext for better compatibility
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('[FCM] AudioContext initialized');
        } catch (error) {
            console.log('[FCM] AudioContext failed:', error);
        }
    }
    
    // Preload the audio
    orderSound.load();
    orderSound.volume = 1.0;
}

// Multiple event listeners for better detection
window.addEventListener('click', enableSound);
window.addEventListener('keydown', enableSound);
window.addEventListener('touchstart', enableSound);
window.addEventListener('scroll', enableSound);

// 3) Helper: decide if a payload is an "order" notification
function isOrderNotification(payload) {
    const title = 
        (payload.notification && payload.notification.title) ||
        (payload.data && payload.data.title) ||
        '';
    const body = 
        (payload.notification && payload.notification.body) ||
        (payload.data && payload.data.body) ||
        '';

    if (payload.data && payload.data.type === 'order') return true;
    if (/order/i.test(title)) return true;
    if (/order/i.test(body)) return true;
    return false;
}

// 4) Play sound safely - ENHANCED
function tryPlayOrderSound() {
    console.log('[FCM] Attempting to play order sound...');
    
    try {
        // Method 1: Regular Audio element
        orderSound.currentTime = 0;
        orderSound.play().then(() => {
            console.log('[FCM] ✅ Sound played successfully (Audio element)');
        }).catch((error) => {
            console.log('[FCM] ❌ Audio element failed, trying fallback:', error);
            tryPlayFallbackSound();
        });
        
    } catch (e) {
        console.log('[FCM] ❌ Audio error, trying fallback:', e);
        tryPlayFallbackSound();
    }
}

// Fallback sound method
function tryPlayFallbackSound() {
    try {
        // Method 2: Web Audio API beep
        if (audioContext) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.3;
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
            
            console.log('[FCM] ✅ Fallback beep played (Web Audio API)');
        }
    } catch (error) {
        console.log('[FCM] ❌ All sound methods failed:', error);
    }
}

// Register FCM Service Worker - RETURN PROMISE
function registerFCMServiceWorker() {
    return new Promise((resolve, reject) => {
        if ('serviceWorker' in navigator) {
            // Wait for the main PWA service worker to be ready
            navigator.serviceWorker.ready.then((registration) => {
                console.log('✅ FCM reusing existing Service Worker:', registration);
                
                // If Firebase is available, ensure it uses this registration
                if (typeof firebase !== 'undefined' && firebase.messaging) {
                    try {
                        const messaging = firebase.messaging();
                        messaging.useServiceWorker(registration);
                        console.log('✅ Firebase Messaging configured with SW');
                        resolve(registration);
                    } catch (e) {
                        console.log('ℹ️ Firebase Messaging binding scheduled');
                        resolve(registration); // Resolve anyway
                    }
                } else {
                    resolve(registration);
                }
            }).catch(reject);
        } else {
            console.log('❌ Service Worker not supported in this browser');
            reject(new Error('Service Worker not supported'));
        }
    });
}

// Initialize FCM - PRIMARY SYSTEM
function initializeFCM() {
    console.log('🚀 Initializing FCM-ONLY notification system...');
    
    // Wait for Firebase to be available
    const checkFirebase = () => {
        if (typeof firebase !== 'undefined' && firebase.messaging) {
            try {
                fcmMessaging = firebase.messaging(); // Use renamed variable
                
                // Chain the initialization: Register SW -> Request Permission
                registerFCMServiceWorker()
                    .then((registration) => {
                         // Request permission and get token using specific registration
                         requestFCMPermission(registration);
                    })
                    .catch(err => console.error('FCM SW Registration failed', err));

                // Handle incoming messages - PRIMARY HANDLER
                setupFCMMessageHandler();
                
                console.log('✅ FCM-ONLY system initialized successfully');
                
            } catch (error) {
                console.error('❌ FCM initialization failed:', error);
            }
        } else {
            console.log('⏳ Firebase not ready, retrying in 1 second...');
            setTimeout(checkFirebase, 1000);
        }
    };
    
    checkFirebase();
}

// Request FCM permission - ALL DEVICES
async function requestFCMPermission(registration) {
    try {
        console.log('📱 Requesting FCM permission for all devices...');
        
        // Request notification permission first
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            console.log('✅ Notification permission granted');
            
            // Get FCM token with explicit Service Worker registration
            const token = await fcmMessaging.getToken({
                vapidKey: 'BDLEZ5_h4bzFnWnfQklrRmQjbGp6Mh9QuJGLJiLuNH6OLCJbepAu6xO9lT0rKzJIUKGMJ89Atejwv9T4cvm68Zo',
                serviceWorkerRegistration: registration // CRITICAL FIX
            });
            
            fcmToken = token;
            console.log('🔑 FCM Token for all devices:', token);
            
            // Save token to localStorage
            localStorage.setItem('fcmToken', token);
            
            // Send token to your server
            sendTokenToServer(token);
            
            // Show success message
            showFCMStatus('✅ FCM Push Notifications Enabled on All Devices!', 'success');
            
        } else if (permission === 'denied') {
            console.warn('❌ Notification permission denied by user. Please reset permissions in browser settings.');
            showFCMStatus('❌ Notifications Blocked. Enable in Browser Settings.', 'error');
        } else {
            console.log('⚠️ Notification permission ignored/default. User needs to trigger interaction.');
            showFCMStatus('⚠️ Please Allow Notifications', 'warning');
        }
        
    } catch (error) {
        console.error('❌ FCM permission error:', error);
        
        // Handle specific error: "Subscription failed - no active Service Worker"
        if (error.message && error.message.includes('no active Service Worker')) {
             console.log('🔄 Retrying FCM token generation in 3 seconds...');
             setTimeout(() => requestFCMPermission(registration), 3000);
        } else {
            showFCMStatus('❌ Failed to enable FCM notifications', 'error');
        }
    }
}

// Handle incoming FCM messages - PRACTICAL SOLUTION
function setupFCMMessageHandler() {
    // 3) Foreground FCM (tab visible or at least loaded)
    if (typeof fcmMessaging !== 'undefined' && fcmMessaging.onMessage) {
        fcmMessaging.onMessage((payload) => {
            console.log('[FCM] Foreground message:', payload);

            if (isOrderNotification(payload)) {
                tryPlayOrderSound();
            }

            // Update your orders UI here if you like
        });
    }
    
    // 4) Sound when SW push arrives but tab is open
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
            const msg = event.data || {};
            if (msg.type === 'FCM_PUSH_NOTIFICATION') {
                const payload = msg.data || {};
                console.log('[FCM] Message from SW:', payload);

                if (isOrderNotification(payload)) {
                    tryPlayOrderSound();
                }
            }
        });
    }
}

// Modern FCM message handler
function handleModernFCMMessage(payload) {
    const orderData = payload.data || payload.notification || payload;
    
    // Enhanced data extraction
    const customerName = orderData.userName || orderData.customerName || 'Customer';
    const orderTotal = orderData.totalAmount || orderData.totalPrice || '0';
    const orderId = orderData.orderId || orderData.id || 'Unknown';
    const timestamp = orderData.timestamp || Date.now();
    
    // Modern sound with Web Audio API
    playModernFCMSound();
    
    // Modern visual notification with animations
    showModernFCMNotification({
        customerName,
        orderTotal,
        orderId,
        timestamp
    });
    
    // Modern browser notification
    showModernFCMBrowserNotification({
        customerName,
        orderTotal,
        orderId
    });
    
    // Optional: Haptic feedback for mobile
    triggerHapticFeedback();
}

// Modern FCM sound - Web Audio API
function playModernFCMSound() {
    try {
        // Use Web Audio API for better compatibility
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create multiple sound layers for rich notification
        const primaryOscillator = audioContext.createOscillator();
        const secondaryOscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Connect nodes
        primaryOscillator.connect(gainNode);
        secondaryOscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Configure primary tone (attention sound)
        primaryOscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        primaryOscillator.type = 'sine';
        
        // Configure secondary tone (harmonic)
        secondaryOscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
        secondaryOscillator.type = 'triangle';
        
        // Configure gain envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        // Start oscillators
        primaryOscillator.start(audioContext.currentTime);
        secondaryOscillator.start(audioContext.currentTime);
        
        // Stop after 300ms
        primaryOscillator.stop(audioContext.currentTime + 0.3);
        secondaryOscillator.stop(audioContext.currentTime + 0.3);
        
        console.log('🔊 Modern FCM sound played with Web Audio API');
        
    } catch (error) {
        console.log('❌ Web Audio API failed, using fallback:', error);
        
        // Fallback to regular Audio
        const audio = new Audio('alert.mp3');
        audio.volume = 1.0;
        audio.play().catch(() => {
            console.log('❌ Fallback audio also failed');
        });
    }
}

// Modern visual notification with animations
function showModernFCMNotification(orderData) {
    const { customerName, orderTotal, orderId, timestamp } = orderData;
    
    // Create modern notification element
    const notification = document.createElement('div');
    notification.className = 'fcm-modern-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        z-index: 99999;
        max-width: 380px;
        transform: translateX(500px) scale(0.8);
        transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        border-left: 4px solid #764ba2;
        backdrop-filter: blur(10px);
        animation: fcmSlideIn 0.6s ease-out;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 16px;">
            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #fff 0%, #f3f4f6 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 16px rgba(0,0,0,0.1);">
                <span style="font-size: 24px; animation: fcmPulse 2s infinite;">📡</span>
            </div>
            <div style="flex-grow: 1;">
                <h4 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; animation: fcmGlow 2s ease-in-out infinite alternate;">🍕 Modern Order Alert!</h4>
                <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: 500;">${customerName} • ₹${orderTotal}</p>
                <p style="margin: 0 0 4px 0; font-size: 12px; opacity: 0.8; color: #e0e7ff;">Order #${orderId} • ${new Date(timestamp).toLocaleTimeString()}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="background: rgba(255,255,255,0.15); border: none; color: white; cursor: pointer; font-size: 18px; padding: 8px 12px; border-radius: 8px; transition: all 0.2s; backdrop-filter: blur(10px);">×</button>
        </div>
    `;
    
    // Add modern animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fcmSlideIn {
            0% { transform: translateX(500px) scale(0.8) rotateY(90deg); opacity: 0; }
            50% { transform: translateX(250px) scale(1.05) rotateY(45deg); opacity: 0.8; }
            100% { transform: translateX(0) scale(1) rotateY(0deg); opacity: 1; }
        }
        @keyframes fcmPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        @keyframes fcmGlow {
            0%, 100% { text-shadow: 0 0 5px rgba(255,255,255,0.3); }
            50% { text-shadow: 0 0 20px rgba(255,255,255,0.8); }
        }
        .fcm-modern-notification:hover {
            transform: scale(1.02);
            box-shadow: 0 25px 50px rgba(0,0,0,0.2);
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Animate in with modern timing
    setTimeout(() => {
        notification.style.transform = 'translateX(0) scale(1) rotateY(0deg)';
        notification.style.opacity = '1';
    }, 100);
    
    // Auto remove with modern animation
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.transform = 'translateX(500px) scale(0.8) rotateY(-90deg)';
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
                style.remove(); // Clean up animations
            }, 500);
        }
    }, 8000);
}

// Modern browser notification
function showModernFCMBrowserNotification(orderData) {
    const { customerName, orderTotal, orderId } = orderData;
    
    if ("Notification" in window && Notification.permission === "granted") {
        const notification = new Notification("📡 Modern Order Alert!", {
            body: `${customerName} placed an order of ₹${orderTotal}`,
            icon: "Assests/apple-touch-icon.png",
            badge: "Assests/apple-touch-icon.png",
            tag: "fcm-modern-order",
            requireInteraction: true,
            vibrate: [200, 100, 200, 100, 200],
            silent: false,
            data: orderData,
            actions: [
                {
                    action: 'view',
                    title: '👁️ View Order',
                    icon: 'https://img.icons8.com/color/48/000000/visible.png'
                },
                {
                    action: 'dismiss',
                    title: '❌ Dismiss',
                    icon: 'https://img.icons8.com/color/48/000000/delete-sign.png'
                }
            ]
        });
        
        // Handle notification actions
        notification.onclick = (event) => {
            if (event.action === 'view') {
                // Focus app and navigate to orders
                window.focus();
                if (typeof showSection === 'function') {
                    showSection('orders');
                }
            }
            notification.close();
        };
        
        console.log('📱 Modern browser notification shown');
    }
}

// Haptic feedback for mobile devices
function triggerHapticFeedback() {
    try {
        // Check if haptic feedback is available
        if ('vibrate' in navigator) {
            // Modern vibration pattern for notifications
            navigator.vibrate([100, 50, 100, 50, 150]);
            console.log('📳 Haptic feedback triggered');
        }
        
        // Check for newer haptic API (if available)
        if ('haptics' in navigator && navigator.haptics) {
            navigator.haptics.triggerImpact('medium');
            console.log('📳 Modern haptic feedback triggered');
        }
    } catch (error) {
        console.log('❌ Haptic feedback not available:', error);
    }
}

// FCM Sound - OPTIMIZED FOR ALL DEVICES
function playFCMSound() {
    try {
        // Create audio with maximum compatibility
        const audio = new Audio('alert.mp3');
        audio.volume = 1.0;
        audio.preload = 'auto';
        
        // Try multiple methods for all devices
        audio.play().then(() => {
            console.log('✅ FCM sound played successfully');
        }).catch(error => {
            console.log('❌ FCM sound failed, trying fallback...');
            
            // Fallback method
            try {
                const audioElement = document.createElement('audio');
                audioElement.src = 'alert.mp3';
                audioElement.volume = 1.0;
                audioElement.autoplay = true;
                audioElement.style.display = 'none';
                document.body.appendChild(audioElement);
                
                setTimeout(() => {
                    if (audioElement.parentElement) {
                        document.body.removeChild(audioElement);
                    }
                }, 2000);
                
                console.log('🔄 FCM fallback sound method attempted');
            } catch (fallbackError) {
                console.log('❌ FCM sound fallback failed:', fallbackError);
            }
        });
        
    } catch (error) {
        console.log('❌ FCM sound error:', error);
    }
}

// FCM Visual Notification - ALL DEVICES
function showFCMNotification(orderData) {
    const customerName = orderData.userName || orderData.customerName || 'Customer';
    const orderTotal = orderData.totalAmount || orderData.totalPrice || '0';
    const orderId = orderData.orderId || orderData.id || 'Unknown';
    
    // Create FCM-styled notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        padding: 16px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 99999;
        max-width: 350px;
        transform: translateX(500px);
        transition: all 0.4s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        border-left: 4px solid #1d4ed8;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 40px; height: 40px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 20px;">📡</span>
            </div>
            <div>
                <h4 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700;">🍕 FCM Order Alert!</h4>
                <p style="margin: 0; font-size: 14px;">${customerName} • ₹${orderTotal}</p>
                <p style="margin: 0; font-size: 12px; opacity: 0.9;">Order #${orderId}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; cursor: pointer; font-size: 16px; padding: 4px 8px; border-radius: 4px;">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 6 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.transform = 'translateX(500px)';
            setTimeout(() => notification.remove(), 400);
        }
    }, 6000);
}

// FCM Browser Notification - ALL DEVICES
function showFCMBrowserNotification(orderData) {
    if ("Notification" in window && Notification.permission === "granted") {
        const customerName = orderData.userName || orderData.customerName || 'Customer';
        const orderTotal = orderData.totalAmount || orderData.totalPrice || '0';
        
        new Notification("📡 FCM Order Alert!", {
            body: `${customerName} placed an order of ₹${orderTotal}`,
            icon: "Assests/apple-touch-icon.png",
            badge: "Assests/apple-touch-icon.png",
            tag: "fcm-new-order",
            requireInteraction: true,
            vibrate: [200, 100, 200]
        });
    }
}

// Send token to server (optional)
function sendTokenToServer(token) {
    // You can send this token to your server to target specific devices
    console.log('📡 Sending FCM token to server...');
    
    // Example: Save to Firestore (without FieldValue to avoid compat issues)
    if (typeof db !== 'undefined') {
        db.collection('fcmTokens').doc(token).set({
            token: token,
            userAgent: navigator.userAgent,
            // Use plain ISO timestamps for compatibility
            timestamp: new Date().toISOString(),
            lastActive: new Date().toISOString()
        }).then(() => {
            console.log('✅ FCM token saved to database');
        }).catch(error => {
            console.log('❌ Failed to save FCM token:', error);
        });
    }
}

// Show FCM status message
function showFCMStatus(message, type) {
    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        text-align: center;
    `;
    statusDiv.textContent = message;
    
    document.body.appendChild(statusDiv);
    
    setTimeout(() => {
        statusDiv.style.transition = 'opacity 0.3s ease';
        statusDiv.style.opacity = '0';
        setTimeout(() => statusDiv.remove(), 300);
    }, 3000);
}

// Get current FCM token
function getFCMToken() {
    return fcmToken || localStorage.getItem('fcmToken');
}

// Delete FCM token (cleanup)
async function deleteFCMToken() {
    try {
        if (messaging && fcmToken) {
            await messaging.deleteToken(fcmToken);
            localStorage.removeItem('fcmToken');
            fcmToken = null;
            console.log('✅ FCM token deleted');
        }
    } catch (error) {
        console.error('❌ Failed to delete FCM token:', error);
    }
}

// Export FCM functions
window.fcmSystem = {
    initializeFCM,
    requestFCMPermission,
    getFCMToken,
    deleteFCMToken
};

// Auto-initialize FCM when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFCM);
} else {
    initializeFCM();
}
