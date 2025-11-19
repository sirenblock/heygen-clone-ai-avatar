// PWA Installation and Service Worker Management
// AI Avatar Studio PWA Features

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('✓ Service Worker registered:', registration.scope);

                // Check for updates periodically
                setInterval(() => {
                    registration.update();
                }, 60000); // Check every minute
            })
            .catch((error) => {
                console.error('✗ Service Worker registration failed:', error);
            });
    });
}

// PWA Install Prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;

    // Check if user has dismissed before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const installBanner = document.getElementById('installBanner');

    if (!dismissed && installBanner) {
        installBanner.classList.remove('hidden');
    }
});

// Install button click handler
document.addEventListener('DOMContentLoaded', () => {
    const installBtn = document.getElementById('installBtn');
    const dismissInstall = document.getElementById('dismissInstall');
    const installBanner = document.getElementById('installBanner');

    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;

            // Show the install prompt
            deferredPrompt.prompt();

            // Wait for the user to respond
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to install prompt: ${outcome}`);

            // Clear the prompt
            deferredPrompt = null;

            if (installBanner) {
                installBanner.classList.add('hidden');
            }
        });
    }

    if (dismissInstall) {
        dismissInstall.addEventListener('click', () => {
            if (installBanner) {
                installBanner.classList.add('hidden');
            }
            localStorage.setItem('pwa-install-dismissed', 'true');
        });
    }

    // Mobile Menu Toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navLinks = document.getElementById('navLinks');

    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navLinks.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                navLinks.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            }
        });

        // Close menu when clicking a link
        const navLinksItems = navLinks.querySelectorAll('a');
        navLinksItems.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            });
        });
    }

    // Mobile Generate Button (mirrors desktop button)
    const mobileGenerateBtn = document.getElementById('mobileGenerateBtn');
    const desktopGenerateBtn = document.getElementById('generateBtn');

    if (mobileGenerateBtn && desktopGenerateBtn) {
        mobileGenerateBtn.addEventListener('click', () => {
            desktopGenerateBtn.click();

            // Scroll to progress section after a brief delay
            const progressSection = document.getElementById('progressSection');
            if (progressSection) {
                setTimeout(() => {
                    progressSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        });
    }

    // Hide mobile action bar when keyboard is visible (on input focus)
    const inputs = document.querySelectorAll('input, textarea, select');
    const mobileActionBar = document.querySelector('.mobile-action-bar');

    if (mobileActionBar) {
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                mobileActionBar.style.transform = 'translateY(100%)';
            });

            input.addEventListener('blur', () => {
                // Small delay to prevent flickering
                setTimeout(() => {
                    mobileActionBar.style.transform = 'translateY(0)';
                }, 100);
            });
        });
    }
});

// Handle app installed event
window.addEventListener('appinstalled', () => {
    console.log('✓ PWA was installed successfully');

    // Hide install banner if visible
    const installBanner = document.getElementById('installBanner');
    if (installBanner) {
        installBanner.classList.add('hidden');
    }

    // Clear dismissed flag
    localStorage.removeItem('pwa-install-dismissed');
});

// Detect if running as installed PWA
function isInstalledPWA() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
}

if (isInstalledPWA()) {
    console.log('✓ Running as installed PWA');
    document.body.classList.add('pwa-installed');
}

// Online/Offline status monitoring
window.addEventListener('online', () => {
    console.log('✓ Back online');
    document.body.classList.remove('offline');

    // Show notification
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'NETWORK_STATUS',
            online: true
        });
    }
});

window.addEventListener('offline', () => {
    console.log('✗ Gone offline');
    document.body.classList.add('offline');

    // Show notification
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'NETWORK_STATUS',
            online: false
        });
    }
});

// Check initial online status
if (!navigator.onLine) {
    document.body.classList.add('offline');
}
