// PWA Auto Update Manager
class PWAUpdateManager {
    constructor() {
        this.currentVersion = '1.0.0';
        this.updateAvailable = false;
        this.updateDetected = false;
        this.updateNotification = null;
        this.deferredUpdate = null;
        this.init();
    }

    init() {
        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
            this.handleServiceWorkerMessage(event.data);
        });

        // Listen for service worker controller changes
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('[PWA Update] Service worker controller changed');
            if (this.deferredUpdate) {
                this.deferredUpdate();
                this.deferredUpdate = null;
            }
        });

        // Check for updates on page load
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                console.log('[PWA Update] Service worker ready');
                this.checkForUpdates();
                
                // Listen for update found
                registration.addEventListener('updatefound', () => {
                    console.log('[PWA Update] New service worker found');
                    const newWorker = registration.installing;
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('[PWA Update] New service worker installed');
                            
                            // Fetch actual version from version.json
                            fetch('version.json')
                                .then(response => response.json())
                                .then(data => {
                                    this.showUpdateAvailable(data.version);
                                })
                                .catch(() => {
                                    this.showUpdateAvailable('New');
                                });
                        }
                    });
                });
            });
        }

        // Periodic update check every 10 minutes
        setInterval(() => {
            this.checkForUpdates();
        }, 10 * 60 * 1000);
    }

    handleServiceWorkerMessage(data) {
        console.log('[PWA Update] Message from service worker:', data);
        
        switch (data.type) {
            case 'UPDATE_AVAILABLE':
                this.showUpdateAvailable(data.version, data.message);
                break;
            case 'UPDATE_DETECTED':
                this.showUpdateDetected(data.currentVersion, data.newVersion, data.message);
                break;
            default:
                break;
        }
    }

    checkForUpdates() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                // Send message to service worker to check for updates
                if (registration.active) {
                    registration.active.postMessage({
                        type: 'CHECK_FOR_UPDATES'
                    });
                }
                
                // Also trigger manual update check
                registration.update().catch((error) => {
                    console.log('[PWA Update] Update check failed:', error);
                });
            });
        }
    }

    showUpdateAvailable(newVersion = null, message = 'A new version is available!') {
        if (this.updateAvailable) return;
        
        this.updateAvailable = true;
        console.log('[PWA Update] Update available:', newVersion);
        
        this.createUpdateNotification({
            type: 'available',
            title: '🚀 Update Available',
            message: message,
            currentVersion: this.currentVersion,
            newVersion: newVersion || 'Latest',
            showButtons: true
        });
    }

    showUpdateDetected(currentVersion, newVersion, message) {
        if (this.updateDetected) return;
        
        this.updateDetected = true;
        console.log('[PWA Update] Update detected:', currentVersion, '→', newVersion);
        
        this.createUpdateNotification({
            type: 'detected',
            title: '🔄 Update Detected',
            message: message,
            currentVersion: currentVersion,
            newVersion: newVersion,
            showButtons: true,
            autoShow: true
        });
    }

    createUpdateNotification(options) {
        // Remove existing notification if any
        if (this.updateNotification) {
            this.updateNotification.remove();
        }

        const notification = document.createElement('div');
        // High z-index so it appears above login overlay and main app
        notification.className = 'pwa-update-notification fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 bg-white rounded-lg shadow-2xl border border-gray-200 p-6 transform transition-all duration-300 translate-y-20 opacity-0';
        notification.style.zIndex = '4000';
        
        notification.innerHTML = `
            <div class="flex items-start gap-4">
                <div class="flex-shrink-0">
                    <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <i class="fas fa-download text-white text-xl"></i>
                    </div>
                </div>
                <div class="flex-grow">
                    <h3 class="font-bold text-gray-900 text-lg mb-1">${options.title}</h3>
                    <p class="text-gray-600 text-sm mb-3">${options.message}</p>
                    
                    ${options.currentVersion && options.newVersion ? `
                        <div class="flex items-center gap-2 text-xs text-gray-500 mb-4">
                            <span class="bg-gray-100 px-2 py-1 rounded">v${options.currentVersion}</span>
                            <i class="fas fa-arrow-right"></i>
                            <span class="bg-green-100 text-green-700 px-2 py-1 rounded">v${options.newVersion}</span>
                        </div>
                    ` : ''}
                    
                    <div class="flex gap-2">
                        <button onclick="pwaUpdateManager.applyUpdate()" class="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:from-blue-600 hover:to-purple-700 transition-all">
                            <i class="fas fa-sync-alt mr-2"></i>Update Now
                        </button>
                        <button onclick="pwaUpdateManager.dismissUpdate()" class="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-200 transition-all">
                            <i class="fas fa-clock mr-2"></i>Later
                        </button>
                    </div>
                </div>
                <button onclick="pwaUpdateManager.dismissUpdate()" class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        this.updateNotification = notification;
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-y-20', 'opacity-0');
        }, 100);
        
        // Auto-dismiss after 30 seconds for detected updates
        if (options.autoShow) {
            setTimeout(() => {
                if (this.updateNotification === notification) {
                    this.dismissUpdate();
                }
            }, 30000);
        }
    }

    applyUpdate() {
        console.log('[PWA Update] Applying update...');
        
        // Find and disable the update button immediately
        const updateButton = this.updateNotification.querySelector('button[onclick*="applyUpdate"]');
        if (updateButton) {
            updateButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Updating...';
            updateButton.disabled = true;
        }
        
        // Immediate reload for testing
        setTimeout(() => {
            console.log('[PWA Update] Reloading page for update');
            window.location.reload(true);
        }, 1000);
        
        // Tell service worker to skip waiting (for production)
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                if (registration.waiting) {
                    registration.waiting.postMessage({ type: 'APPLY_UPDATE' });
                } else if (registration.active) {
                    registration.active.postMessage({ type: 'APPLY_UPDATE' });
                }
            });
        }
    }

    dismissUpdate() {
        console.log('[PWA Update] Update dismissed');
        
        if (this.updateNotification) {
            this.updateNotification.classList.add('translate-y-20', 'opacity-0');
            setTimeout(() => {
                if (this.updateNotification) {
                    this.updateNotification.remove();
                    this.updateNotification = null;
                }
            }, 300);
        }
        
        // Remember dismissal for 1 hour
        localStorage.setItem('pwa-update-dismissed', Date.now().toString());
        this.updateAvailable = false;
        this.updateDetected = false;
    }

    // Check if update should be shown
    shouldShowUpdate() {
        const dismissed = localStorage.getItem('pwa-update-dismissed');
        if (!dismissed) return true;
        
        const dismissedTime = parseInt(dismissed);
        const oneHour = 60 * 60 * 1000;
        return (Date.now() - dismissedTime) > oneHour;
    }

    // Force update check (manual trigger)
    forceUpdateCheck() {
        console.log('[PWA Update] Force update check');
        this.checkForUpdates();
        
        // Show checking indicator
        this.showCheckingIndicator();
    }

    showCheckingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
        indicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking for updates...';
        
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            indicator.remove();
        }, 3000);
    }
}

// Initialize PWA Update Manager
const pwaUpdateManager = new PWAUpdateManager();

// Add CSS for update notifications
const updateStyles = document.createElement('style');
updateStyles.textContent = `
    .pwa-update-notification {
        backdrop-filter: blur(10px);
        background: rgba(255, 255, 255, 0.95);
    }
    
    .pwa-update-notification button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
    
    .pwa-update-notification button:not(:disabled) {
        cursor: pointer;
    }
    
    .pwa-update-notification button[onclick*="applyUpdate"] {
        background: linear-gradient(to right, #3b82f6, #9333ea) !important;
        color: white !important;
    }
    
    .pwa-update-notification button[onclick*="dismissUpdate"] {
        background: #f3f4f6 !important;
        color: #374151 !important;
    }
    
    @media (max-width: 768px) {
        .pwa-update-notification {
            left: 1rem !important;
            right: 1rem !important;
            width: auto !important;
        }
    }
    
    .pwa-update-notification .animate-pulse {
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }
`;
document.head.appendChild(updateStyles);

// Export for global access
window.pwaUpdateManager = pwaUpdateManager;

// Add keyboard shortcut for update check (Ctrl+Shift+U)
document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'U') {
        event.preventDefault();
        pwaUpdateManager.forceUpdateCheck();
    }
});
