/**
 * Analytics Infrastructure for AI Avatar Studio
 * GDPR-Compliant Analytics with Google Analytics 4, GTM, and Hotjar
 *
 * Features:
 * - Google Analytics 4 tracking
 * - Google Tag Manager integration
 * - Custom event tracking
 * - Conversion funnel tracking
 * - User journey tracking
 * - Scroll depth tracking
 * - Time on page tracking
 * - Heatmap integration (Hotjar)
 * - GDPR-compliant cookie consent
 */

// ==================== CONFIGURATION ====================

const ANALYTICS_CONFIG = {
    // Replace with your actual IDs
    GA4_MEASUREMENT_ID: 'G-XXXXXXXXXX',  // Replace with your GA4 Measurement ID
    GTM_CONTAINER_ID: 'GTM-XXXXXXX',     // Replace with your GTM Container ID
    HOTJAR_SITE_ID: 'XXXXXXX',           // Replace with your Hotjar Site ID

    // Cookie consent settings
    COOKIE_CONSENT_NAME: 'avatar_studio_consent',
    COOKIE_CONSENT_DURATION: 365, // days

    // Tracking settings
    SCROLL_DEPTH_THRESHOLDS: [25, 50, 75, 100],
    TIME_ON_PAGE_INTERVALS: [30, 60, 120, 300], // seconds
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
};

// ==================== ANALYTICS MANAGER ====================

class AnalyticsManager {
    constructor() {
        this.consent = this.getConsent();
        this.sessionStart = Date.now();
        this.scrollDepthTracked = new Set();
        this.timeOnPageTracked = new Set();
        this.currentFunnelStep = null;
        this.userJourney = [];
        this.isInitialized = false;
    }

    // ==================== INITIALIZATION ====================

    init() {
        if (this.isInitialized) return;

        console.log('[Analytics] Initializing Analytics Manager');

        // Show cookie consent banner if not already consented
        if (!this.consent) {
            this.showConsentBanner();
        } else {
            this.loadAnalyticsScripts();
        }

        // Setup event listeners
        this.setupEventListeners();

        // Track initial page view
        if (this.consent) {
            this.trackPageView();
        }

        this.isInitialized = true;
    }

    // ==================== CONSENT MANAGEMENT ====================

    getConsent() {
        const consent = localStorage.getItem(ANALYTICS_CONFIG.COOKIE_CONSENT_NAME);
        return consent === 'granted';
    }

    setConsent(granted) {
        const value = granted ? 'granted' : 'denied';
        localStorage.setItem(ANALYTICS_CONFIG.COOKIE_CONSENT_NAME, value);
        this.consent = granted;

        // Update Google Consent Mode
        if (window.gtag) {
            window.gtag('consent', 'update', {
                'analytics_storage': value,
                'ad_storage': value,
                'ad_user_data': value,
                'ad_personalization': value,
            });
        }

        console.log(`[Analytics] Consent ${value}`);
    }

    showConsentBanner() {
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.innerHTML = `
            <div class="consent-content">
                <div class="consent-text">
                    <h3>🍪 We value your privacy</h3>
                    <p>We use cookies and similar technologies to improve your experience, analyze site usage, and assist in our marketing efforts. We respect your privacy and only collect data with your consent.</p>
                    <a href="#privacy-policy" class="privacy-link">Privacy Policy</a>
                </div>
                <div class="consent-actions">
                    <button id="consent-accept" class="consent-btn consent-accept">Accept All</button>
                    <button id="consent-reject" class="consent-btn consent-reject">Reject All</button>
                    <button id="consent-customize" class="consent-btn consent-customize">Customize</button>
                </div>
            </div>
        `;

        document.body.appendChild(banner);

        // Add event listeners
        document.getElementById('consent-accept').addEventListener('click', () => {
            this.setConsent(true);
            this.loadAnalyticsScripts();
            this.trackPageView();
            this.removeConsentBanner();
            this.trackEvent('cookie_consent', { action: 'accept' });
        });

        document.getElementById('consent-reject').addEventListener('click', () => {
            this.setConsent(false);
            this.removeConsentBanner();
        });

        document.getElementById('consent-customize').addEventListener('click', () => {
            this.showCustomizeModal();
        });
    }

    removeConsentBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.style.animation = 'slideDown 0.3s ease-out';
            setTimeout(() => banner.remove(), 300);
        }
    }

    showCustomizeModal() {
        // Simplified customization - in production, add granular controls
        const accept = confirm('Enable analytics to help us improve your experience?');
        if (accept) {
            this.setConsent(true);
            this.loadAnalyticsScripts();
            this.trackPageView();
        } else {
            this.setConsent(false);
        }
        this.removeConsentBanner();
    }

    // ==================== SCRIPT LOADING ====================

    loadAnalyticsScripts() {
        if (!this.consent) return;

        console.log('[Analytics] Loading analytics scripts');

        // Load Google Tag Manager
        this.loadGTM();

        // Load Google Analytics 4
        this.loadGA4();

        // Load Hotjar
        this.loadHotjar();
    }

    loadGA4() {
        // Google Analytics 4
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.GA4_MEASUREMENT_ID}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        window.gtag = function() { window.dataLayer.push(arguments); };

        // Initialize with consent mode
        window.gtag('consent', 'default', {
            'analytics_storage': 'granted',
            'ad_storage': 'granted',
            'ad_user_data': 'granted',
            'ad_personalization': 'granted',
        });

        window.gtag('js', new Date());
        window.gtag('config', ANALYTICS_CONFIG.GA4_MEASUREMENT_ID, {
            'send_page_view': false, // We'll send manually
            'cookie_flags': 'SameSite=None;Secure',
        });

        console.log('[Analytics] GA4 loaded');
    }

    loadGTM() {
        // Google Tag Manager
        (function(w,d,s,l,i){
            w[l]=w[l]||[];
            w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
            j.async=true;
            j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
            f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer',ANALYTICS_CONFIG.GTM_CONTAINER_ID);

        // Add GTM noscript iframe
        const noscript = document.createElement('noscript');
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.googletagmanager.com/ns.html?id=${ANALYTICS_CONFIG.GTM_CONTAINER_ID}`;
        iframe.height = '0';
        iframe.width = '0';
        iframe.style.display = 'none';
        iframe.style.visibility = 'hidden';
        noscript.appendChild(iframe);
        document.body.insertBefore(noscript, document.body.firstChild);

        console.log('[Analytics] GTM loaded');
    }

    loadHotjar() {
        // Hotjar Tracking Code
        (function(h,o,t,j,a,r){
            h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:ANALYTICS_CONFIG.HOTJAR_SITE_ID,hjsv:6};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
            a.appendChild(r);
        })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');

        console.log('[Analytics] Hotjar loaded');
    }

    // ==================== EVENT TRACKING ====================

    trackEvent(eventName, eventParams = {}) {
        if (!this.consent) return;

        // Add timestamp and session info
        const enrichedParams = {
            ...eventParams,
            timestamp: new Date().toISOString(),
            session_duration: Math.floor((Date.now() - this.sessionStart) / 1000),
        };

        // Track in GA4
        if (window.gtag) {
            window.gtag('event', eventName, enrichedParams);
        }

        // Push to GTM dataLayer
        if (window.dataLayer) {
            window.dataLayer.push({
                'event': eventName,
                ...enrichedParams
            });
        }

        // Add to user journey
        this.userJourney.push({
            event: eventName,
            params: enrichedParams,
            timestamp: Date.now()
        });

        console.log(`[Analytics] Event: ${eventName}`, enrichedParams);
    }

    trackPageView(pagePath = window.location.pathname) {
        if (!this.consent) return;

        this.trackEvent('page_view', {
            page_path: pagePath,
            page_title: document.title,
            page_location: window.location.href,
        });
    }

    // ==================== BUTTON CLICK TRACKING ====================

    trackButtonClick(buttonElement) {
        const buttonText = buttonElement.textContent.trim();
        const buttonId = buttonElement.id || 'unknown';
        const buttonClass = buttonElement.className;

        this.trackEvent('button_click', {
            button_text: buttonText,
            button_id: buttonId,
            button_class: buttonClass,
            click_location: this.getElementPosition(buttonElement)
        });
    }

    // ==================== VIDEO GENERATION TRACKING ====================

    trackVideoGenerationStart(avatarType, voiceType, scriptLength) {
        this.trackEvent('video_generation_start', {
            avatar_type: avatarType,
            voice_type: voiceType,
            script_length: scriptLength,
        });

        // Update funnel
        this.updateFunnel('generation_start');
    }

    trackVideoGenerationComplete(videoId, duration, success = true) {
        this.trackEvent('video_generation_complete', {
            video_id: videoId,
            duration: duration,
            success: success,
        });

        // Update funnel
        this.updateFunnel('generation_complete');
    }

    trackVideoGenerationError(errorMessage, errorCode) {
        this.trackEvent('video_generation_error', {
            error_message: errorMessage,
            error_code: errorCode,
        });
    }

    // ==================== DOWNLOAD & SHARE TRACKING ====================

    trackDownload(videoId, format) {
        this.trackEvent('video_download', {
            video_id: videoId,
            format: format,
        });

        // Update funnel
        this.updateFunnel('download');
    }

    trackShare(platform, videoId) {
        this.trackEvent('video_share', {
            platform: platform,
            video_id: videoId,
        });
    }

    // ==================== SCROLL DEPTH TRACKING ====================

    setupScrollTracking() {
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.checkScrollDepth();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    checkScrollDepth() {
        const scrollPercentage = Math.floor(
            (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );

        ANALYTICS_CONFIG.SCROLL_DEPTH_THRESHOLDS.forEach(threshold => {
            if (scrollPercentage >= threshold && !this.scrollDepthTracked.has(threshold)) {
                this.scrollDepthTracked.add(threshold);
                this.trackEvent('scroll_depth', {
                    depth_percentage: threshold,
                    page_path: window.location.pathname,
                });
            }
        });
    }

    // ==================== TIME ON PAGE TRACKING ====================

    setupTimeTracking() {
        ANALYTICS_CONFIG.TIME_ON_PAGE_INTERVALS.forEach(interval => {
            setTimeout(() => {
                if (!this.timeOnPageTracked.has(interval)) {
                    this.timeOnPageTracked.add(interval);
                    this.trackEvent('time_on_page', {
                        duration_seconds: interval,
                        page_path: window.location.pathname,
                    });
                }
            }, interval * 1000);
        });
    }

    // ==================== FEATURE USAGE TRACKING ====================

    trackFeatureUsage(featureName, featureDetails = {}) {
        this.trackEvent('feature_usage', {
            feature_name: featureName,
            ...featureDetails,
        });
    }

    // ==================== CONVERSION FUNNEL TRACKING ====================

    updateFunnel(step) {
        const funnelSteps = ['view', 'start', 'complete', 'download'];
        const stepIndex = funnelSteps.indexOf(step);

        if (stepIndex === -1) return;

        // Track funnel progression
        this.trackEvent('funnel_step', {
            step: step,
            step_index: stepIndex,
            previous_step: this.currentFunnelStep,
        });

        this.currentFunnelStep = step;

        // Track conversion if reached end of funnel
        if (step === 'download') {
            this.trackEvent('conversion', {
                funnel_type: 'video_creation',
                conversion_value: 1,
            });
        }
    }

    // ==================== USER JOURNEY TRACKING ====================

    getUserJourney() {
        return this.userJourney;
    }

    trackJourneyMilestone(milestone) {
        this.trackEvent('journey_milestone', {
            milestone: milestone,
            journey_length: this.userJourney.length,
        });
    }

    // ==================== EVENT LISTENERS ====================

    setupEventListeners() {
        // Track all button clicks
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button, .btn, .cta-button, a.btn');
            if (button) {
                this.trackButtonClick(button);
            }
        });

        // Track form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            this.trackEvent('form_submit', {
                form_id: form.id || 'unknown',
                form_action: form.action || 'unknown',
            });
        });

        // Track link clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href) {
                const isExternal = link.hostname !== window.location.hostname;
                this.trackEvent('link_click', {
                    link_url: link.href,
                    link_text: link.textContent.trim(),
                    is_external: isExternal,
                });
            }
        });

        // Setup scroll tracking
        this.setupScrollTracking();

        // Setup time tracking
        this.setupTimeTracking();

        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('page_hidden', {
                    time_visible: Math.floor((Date.now() - this.sessionStart) / 1000),
                });
            } else {
                this.trackEvent('page_visible');
            }
        });

        // Track when user leaves page
        window.addEventListener('beforeunload', () => {
            this.trackEvent('page_exit', {
                session_duration: Math.floor((Date.now() - this.sessionStart) / 1000),
                journey_length: this.userJourney.length,
            });
        });
    }

    // ==================== UTILITY METHODS ====================

    getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: Math.floor(rect.left + window.scrollX),
            y: Math.floor(rect.top + window.scrollY),
        };
    }

    // ==================== PUBLIC API ====================

    // Expose methods for manual tracking
    static trackCustomEvent(eventName, eventParams) {
        if (window.analyticsManager) {
            window.analyticsManager.trackEvent(eventName, eventParams);
        }
    }

    static trackVideoStart(avatarType, voiceType, scriptLength) {
        if (window.analyticsManager) {
            window.analyticsManager.trackVideoGenerationStart(avatarType, voiceType, scriptLength);
        }
    }

    static trackVideoComplete(videoId, duration, success) {
        if (window.analyticsManager) {
            window.analyticsManager.trackVideoGenerationComplete(videoId, duration, success);
        }
    }

    static trackVideoError(errorMessage, errorCode) {
        if (window.analyticsManager) {
            window.analyticsManager.trackVideoGenerationError(errorMessage, errorCode);
        }
    }

    static trackDownload(videoId, format) {
        if (window.analyticsManager) {
            window.analyticsManager.trackDownload(videoId, format);
        }
    }

    static trackShare(platform, videoId) {
        if (window.analyticsManager) {
            window.analyticsManager.trackShare(platform, videoId);
        }
    }

    static trackFeature(featureName, details) {
        if (window.analyticsManager) {
            window.analyticsManager.trackFeatureUsage(featureName, details);
        }
    }
}

// ==================== INITIALIZATION ====================

// Initialize analytics when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.analyticsManager = new AnalyticsManager();
        window.analyticsManager.init();
    });
} else {
    window.analyticsManager = new AnalyticsManager();
    window.analyticsManager.init();
}

// Expose global API
window.Analytics = AnalyticsManager;

console.log('[Analytics] Analytics infrastructure loaded');
