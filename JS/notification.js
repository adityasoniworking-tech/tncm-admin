// ========================================
// SIMPLE ORDER NOTIFICATION SYSTEM
// ========================================
// Built into orders.js - no separate file needed

// Global notification state
let isFirstSnapshot = true;
let lastNotificationTime = 0;
let soundLoopTimer = null; // Store timer ID for stopping loop

// Default Settings (Can be overridden by user)
let notificationSettings = {
    loopSound: false,
    loopInterval: 5000, // 5 seconds
    cooldown: 0 // 0 seconds (Instant for all)
};

// Load settings from local storage on startup
function loadNotificationSettings() {
    const saved = localStorage.getItem('adminNotificationSettings');
    if (saved) {
        try {
            notificationSettings = JSON.parse(saved);
            console.log('🔔 Notification settings loaded:', notificationSettings);
        } catch (e) {
            console.error('Error parsing notification settings', e);
        }
    }
    
    // Update UI if elements exist
    const loopCheck = document.getElementById('settingLoopSound');
    const loopIntInput = document.getElementById('settingLoopInterval');
    const cooldownInput = document.getElementById('settingCooldown');
    
    if (loopCheck) loopCheck.checked = notificationSettings.loopSound;
    if (loopIntInput) loopIntInput.value = notificationSettings.loopInterval / 1000;
    if (cooldownInput) cooldownInput.value = notificationSettings.cooldown / 1000;
}

// Save settings from UI
window.saveNotificationSettings = function() {
    const loopCheck = document.getElementById('settingLoopSound');
    const loopIntInput = document.getElementById('settingLoopInterval');
    const cooldownInput = document.getElementById('settingCooldown');
    
    if (loopCheck && loopIntInput && cooldownInput) {
        notificationSettings = {
            loopSound: loopCheck.checked,
            loopInterval: parseInt(loopIntInput.value) * 1000,
            cooldown: parseInt(cooldownInput.value) * 1000
        };
        
        localStorage.setItem('adminNotificationSettings', JSON.stringify(notificationSettings));
        alert('Notification settings saved!');
        console.log('🔔 Settings saved:', notificationSettings);
    }
};

// Play notification sound - BACKGROUND SUPPORT
function playOrderSound(isLoop = false) {
    if (!isLoop) {
        // If this is a fresh call (not a loop), stop any existing loop first
        stopOrderSound();
    }

    try {
        // Method 1: Try direct play (works when page is active)
        const audio = new Audio('alert.mp3');
        audio.volume = 1.0;
        
        audio.play().then(() => {
            console.log('✅ Order sound played (active tab)');
            handleLooping();
        }).catch(error => {
            console.log('❌ Active tab sound failed, trying background method...');
            
            // Method 2: Background audio setup
            playBackgroundSound();
        });
        
    } catch (error) {
        console.log('❌ Error playing sound:', error);
        playBackgroundSound();
    }
}

// Handle looping logic
function handleLooping() {
    if (notificationSettings.loopSound) {
        console.log(`🔁 Looping sound in ${notificationSettings.loopInterval}ms`);
        soundLoopTimer = setTimeout(() => {
            playOrderSound(true); // recursive call with isLoop=true
        }, notificationSettings.loopInterval);
    }
}

// Stop the looping sound
function stopOrderSound() {
    if (soundLoopTimer) {
        clearTimeout(soundLoopTimer);
        soundLoopTimer = null;
        console.log('cF Sound loop stopped');
    }
}

// Background sound method - works when tab is inactive
function playBackgroundSound() {
    try {
        // Create hidden audio element for background playback
        const bgAudio = document.createElement('audio');
        bgAudio.src = 'alert.mp3';
        bgAudio.volume = 1.0;
        bgAudio.loop = false;
        bgAudio.style.display = 'none';
        
        // Add to page
        document.body.appendChild(bgAudio);
        
        // Try to play
        bgAudio.play().then(() => {
            console.log('✅ Background order sound played');
            handleLooping();
            
            // Remove after playing
            setTimeout(() => {
                if (bgAudio.parentElement) {
                    document.body.removeChild(bgAudio);
                }
            }, 2000);
            
        }).catch(error => {
            console.log('❌ Background sound also failed:', error);
            
            // Method 3: Web Audio API fallback
            tryWebAudioAPI();
        });
        
    } catch (error) {
        console.log('❌ Background audio setup failed:', error);
        tryWebAudioAPI();
    }
}

// Web Audio API method - ultimate fallback
function tryWebAudioAPI() {
    try {
        // Create audio context
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Load and play sound
        fetch('alert.mp3')
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                source.start(0);
                console.log('✅ Web Audio API sound played');
                handleLooping();
            })
            .catch(error => {
                console.log('❌ Web Audio API failed:', error);
            });
                
    } catch (error) {
        console.log('❌ Web Audio API not available:', error);
    }
}

// Page visibility API - detect when tab becomes active
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        console.log('📱 Tab became active - notifications ready');
        // Resume audio context if needed
        if (window.audioContext && window.audioContext.state === 'suspended') {
            window.audioContext.resume();
        }
        
        // Stop sound loop when user returns to tab (Optional UX choice)
        // stopOrderSound(); 
    }
});

// Store audio context globally
window.audioContext = null;

// Show visual notification - SIMPLE METHOD
function showOrderNotification(orderData) {
    const customerName = orderData.userName || 'Customer';
    const orderTotal = orderData.totalAmount || '0';
    const orderId = orderData.id || 'Unknown';
    
    // Create notification element
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
        transition: all 0.4s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        cursor: pointer; 
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 40px; height: 40px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 20px;">🔔</span>
            </div>
            <div>
                <h4 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700;">🍕 New Order!</h4>
                <p style="margin: 0; font-size: 14px;">${customerName} • ₹${orderTotal}</p>
                <p style="margin: 0; font-size: 12px; opacity: 0.9;">Order #${orderId}</p>
            </div>
            <button class="close-btn" style="background: rgba(255,255,255,0.2); border: none; color: white; cursor: pointer; font-size: 16px; padding: 4px 8px; border-radius: 4px;">×</button>
        </div>
    `;
    
    // Stop sound when clicked
    notification.onclick = function() {
        stopOrderSound();
        notification.remove();
        // Focus window
        window.focus();
        if(window.showSection) window.showSection('orders');
    };

    // Close button specific handler
    const closeBtn = notification.querySelector('.close-btn');
    if(closeBtn) {
        closeBtn.onclick = function(e) {
            e.stopPropagation(); // prevent parent click
            stopOrderSound();
            notification.remove();
        }
    }
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.transform = 'translateX(500px)';
            setTimeout(() => notification.remove(), 400);
        }
    }, 5000);
}

// Show browser notification if permission granted
function showBrowserNotification(orderData) {
    if ("Notification" in window && Notification.permission === "granted") {
        const customerName = orderData.userName || 'Customer';
        const orderTotal = orderData.totalAmount || '0';
        
        const notif = new Notification("🍕 New Order Received!", {
            body: `${customerName} placed an order of ₹${orderTotal}`,
            icon: "Assests/apple-touch-icon.png",
            tag: "new-order"
        });
        
        notif.onclick = function() {
            window.focus();
            stopOrderSound();
            notif.close();
            if(window.showSection) window.showSection('orders');
        };
    }
}

// Check if we should notify (prevent spam)
function shouldNotifyOrder(orderData) {
    const now = Date.now();
    const timeSinceLastNotification = now - lastNotificationTime;
    
    // Use configured cooldown (Default 0 = Always notify)
    if (timeSinceLastNotification < notificationSettings.cooldown) {
        console.log('Notification skipped - cooldown active');
        return false;
    }
    
    lastNotificationTime = now;
    return true;
}

// Enable sound on first user interaction
document.addEventListener('click', function() {
    console.log('🖱️ User interaction detected - sound enabled');
}, { once: true });

document.addEventListener('keydown', function() {
    console.log('⌨️ User interaction detected - sound enabled');
}, { once: true });

// Initial Load
loadNotificationSettings();

// Export for use in orders.js
window.orderNotificationSystem = {
    playOrderSound,
    stopOrderSound, // New export
    showOrderNotification,
    showBrowserNotification,
    shouldNotifyOrder
};
