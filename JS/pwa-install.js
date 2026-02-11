// PWA Install Prompt Management
class PWAInstallManager {
    constructor() {
        this.deferredPrompt = null;
        this.installButton = null;
        this.installPromptShown = false;
        this.init();
    }

    init() {
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('[PWA Install] Install prompt detected');
            e.preventDefault();
            this.deferredPrompt = e;
            
            // Show install prompt after delay
            setTimeout(() => {
                this.showInstallPrompt();
            }, 5000);
        });

        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            console.log('[PWA Install] App was installed');
            this.hideInstallPrompt();
            this.showInstallSuccess();
        });

        // Check if app is already installed
        if (this.isInstalled()) {
            console.log('[PWA Install] App is already installed');
        }

        // Create install button UI
        this.createInstallButton();
    }

    createInstallButton() {
        // Create floating install button
        const installButton = document.createElement('div');
        installButton.id = 'pwa-install-button';
        installButton.className = 'fixed bottom-6 right-6 bg-amber-500 text-white p-4 rounded-full shadow-lg cursor-pointer hover:bg-amber-600 transition-all duration-300 z-50 hidden';
        installButton.innerHTML = `
            <div class="flex items-center gap-3">
                <i class="fas fa-download text-xl"></i>
                <div class="text-left">
                    <div class="font-semibold text-sm">Install App</div>
                    <div class="text-xs opacity-90">Offline access</div>
                </div>
                <i class="fas fa-times ml-2 opacity-70 hover:opacity-100" onclick="pwaInstallManager.dismissInstallPrompt()"></i>
            </div>
        `;
        
        installButton.onclick = () => this.promptInstall();
        document.body.appendChild(installButton);
        this.installButton = installButton;
    }

    showInstallPrompt() {
        if (this.installButton && !this.installPromptShown && !this.isInstalled()) {
            this.installButton.classList.remove('hidden');
            this.installButton.classList.add('animate-bounce');
            
            // Remove bounce after 3 seconds
            setTimeout(() => {
                this.installButton.classList.remove('animate-bounce');
            }, 3000);
            
            this.installPromptShown = true;
        }
    }

    hideInstallPrompt() {
        if (this.installButton) {
            this.installButton.classList.add('hidden');
        }
    }

    dismissInstallPrompt() {
        this.hideInstallPrompt();
        localStorage.setItem('pwa-install-dismissed', 'true');
    }

    async promptInstall() {
        if (!this.deferredPrompt) {
            console.log('[PWA Install] No install prompt available');
            return;
        }

        try {
            // Show the install prompt
            this.deferredPrompt.prompt();
            
            // Wait for the user's response
            const { outcome } = await this.deferredPrompt.userChoice;
            console.log('[PWA Install] User response:', outcome);
            
            if (outcome === 'accepted') {
                console.log('[PWA Install] User accepted the install prompt');
            } else {
                console.log('[PWA Install] User dismissed the install prompt');
            }
            
            // Clear the deferred prompt
            this.deferredPrompt = null;
            this.hideInstallPrompt();
            
        } catch (error) {
            console.error('[PWA Install] Error during install prompt:', error);
        }
    }

    isInstalled() {
        // Check if app is running in standalone mode
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isWebApp = window.navigator.standalone === true;
        const isFromAndroidApp = document.referrer.includes('android-app://');
        
        return isStandalone || isWebApp || isFromAndroidApp;
    }

    showInstallSuccess() {
        // Show success notification
        const successNotification = document.createElement('div');
        successNotification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-slideInRight';
        successNotification.innerHTML = `
            <div class="flex items-center gap-3">
                <i class="fas fa-check-circle text-2xl"></i>
                <div>
                    <div class="font-semibold">App Installed Successfully!</div>
                    <div class="text-sm opacity-90">You can now use it offline</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(successNotification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            successNotification.remove();
        }, 5000);
    }

    // Check if should show install prompt
    shouldShowPrompt() {
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        const lastShown = localStorage.getItem('pwa-install-last-shown');
        const now = Date.now();
        
        // Don't show if dismissed
        if (dismissed) return false;
        
        // Don't show if shown in last 7 days
        if (lastShown && (now - parseInt(lastShown)) < 7 * 24 * 60 * 60 * 1000) {
            return false;
        }
        
        return true;
    }

    // Record when prompt was shown
    recordPromptShown() {
        localStorage.setItem('pwa-install-last-shown', Date.now().toString());
    }
}

// Initialize PWA Install Manager
const pwaInstallManager = new PWAInstallManager();

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .animate-slideInRight {
        animation: slideInRight 0.3s ease-out;
    }
    
    #pwa-install-button:hover {
        transform: scale(1.05);
    }
    
    #pwa-install-button:active {
        transform: scale(0.95);
    }
`;
document.head.appendChild(style);

// Export for global access
window.pwaInstallManager = pwaInstallManager;
