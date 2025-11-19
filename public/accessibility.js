/**
 * WCAG 2.1 AA Accessibility JavaScript
 * Handles keyboard navigation, focus management, and screen reader support
 */

(function() {
    'use strict';

    // ==================================
    // 1. KEYBOARD NAVIGATION DETECTION
    // ==================================

    let isTabbing = false;

    function handleFirstTab(e) {
        if (e.key === 'Tab') {
            document.body.classList.add('user-is-tabbing');
            isTabbing = true;
            window.removeEventListener('keydown', handleFirstTab);
            window.addEventListener('mousedown', handleMouseDownOnce);
        }
    }

    function handleMouseDownOnce() {
        document.body.classList.remove('user-is-tabbing');
        isTabbing = false;
        window.removeEventListener('mousedown', handleMouseDownOnce);
        window.addEventListener('keydown', handleFirstTab);
    }

    window.addEventListener('keydown', handleFirstTab);

    // ==================================
    // 2. SCREEN READER ANNOUNCEMENTS
    // ==================================

    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.classList.add('sr-only');
    document.body.appendChild(announcer);

    function announce(message, priority = 'polite') {
        announcer.setAttribute('aria-live', priority);
        announcer.textContent = '';
        setTimeout(() => {
            announcer.textContent = message;
        }, 100);
    }

    window.announce = announce;

    // ==================================
    // 3. AVATAR CARD KEYBOARD SUPPORT
    // ==================================

    function initializeAvatarCards() {
        const avatarCards = document.querySelectorAll('.avatar-card');

        avatarCards.forEach(card => {
            // Handle Enter and Space keys
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });

            // Update aria-pressed on click
            card.addEventListener('click', function() {
                avatarCards.forEach(c => {
                    c.setAttribute('aria-pressed', 'false');
                    c.classList.remove('active');
                });
                this.setAttribute('aria-pressed', 'true');
                this.classList.add('active');

                const avatarName = this.querySelector('span')?.textContent || 'Avatar';
                announce(`${avatarName} selected`);
            });

            // Arrow key navigation within avatar grid
            card.addEventListener('keydown', (e) => {
                const cards = Array.from(avatarCards);
                const currentIndex = cards.indexOf(card);
                let targetIndex;

                switch(e.key) {
                    case 'ArrowRight':
                        e.preventDefault();
                        targetIndex = (currentIndex + 1) % cards.length;
                        cards[targetIndex].focus();
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        targetIndex = (currentIndex - 1 + cards.length) % cards.length;
                        cards[targetIndex].focus();
                        break;
                    case 'Home':
                        e.preventDefault();
                        cards[0].focus();
                        break;
                    case 'End':
                        e.preventDefault();
                        cards[cards.length - 1].focus();
                        break;
                }
            });
        });
    }

    // ==================================
    // 4. COLLAPSIBLE SECTIONS
    // ==================================

    function initializeCollapsibles() {
        const collapsibles = document.querySelectorAll('.collapsible-header');

        collapsibles.forEach(header => {
            header.addEventListener('click', toggleCollapsible);
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCollapsible.call(header, e);
                }
            });
        });

        function toggleCollapsible(e) {
            const panel = this.parentElement;
            const content = panel.querySelector('.collapsible-content');
            const isExpanded = this.getAttribute('aria-expanded') === 'true';

            this.setAttribute('aria-expanded', !isExpanded);
            panel.classList.toggle('collapsed');

            const sectionName = this.querySelector('span')?.textContent || 'Section';
            announce(`${sectionName} ${!isExpanded ? 'expanded' : 'collapsed'}`);
        }
    }

    // ==================================
    // 5. FORM VALIDATION & ERRORS
    // ==================================

    function validateForm() {
        const scriptInput = document.getElementById('scriptInput');

        if (scriptInput) {
            scriptInput.addEventListener('blur', () => {
                const value = scriptInput.value.trim();
                const wordCount = value.split(/\s+/).filter(w => w.length > 0).length;

                // Remove any existing error message
                const existingError = scriptInput.parentElement.querySelector('[role="alert"]');
                if (existingError) {
                    existingError.remove();
                }

                if (value && wordCount < 10) {
                    scriptInput.setAttribute('aria-invalid', 'true');
                    const errorMsg = document.createElement('div');
                    errorMsg.setAttribute('role', 'alert');
                    errorMsg.className = 'error-message';
                    errorMsg.textContent = 'Script is too short. Please add at least 10 words.';
                    scriptInput.parentElement.appendChild(errorMsg);
                    announce('Error: Script is too short. Please add at least 10 words.', 'assertive');
                } else {
                    scriptInput.setAttribute('aria-invalid', 'false');
                }
            });
        }
    }

    // ==================================
    // 6. PROGRESS BAR UPDATES
    // ==================================

    function updateProgressAccessibility() {
        const progressBar = document.querySelector('[role="progressbar"]');
        const progressPercent = document.getElementById('progressPercent');

        if (progressBar && progressPercent) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' || mutation.type === 'characterData') {
                        const percent = progressPercent.textContent;
                        progressBar.setAttribute('aria-valuenow', parseInt(percent));
                        progressBar.setAttribute('aria-valuetext', `${percent} complete`);
                    }
                });
            });

            observer.observe(progressPercent, {
                childList: true,
                characterData: true,
                subtree: true
            });
        }
    }

    // ==================================
    // 7. CAROUSEL ACCESSIBILITY
    // ==================================

    function initializeCarousel() {
        const prevBtn = document.getElementById('prevTestimonial');
        const nextBtn = document.getElementById('nextTestimonial');
        const track = document.getElementById('testimonialsTrack');
        const dotsContainer = document.getElementById('carouselDots');

        if (prevBtn && nextBtn && track) {
            let currentIndex = 0;

            prevBtn.addEventListener('click', () => {
                navigate('prev');
            });

            nextBtn.addEventListener('click', () => {
                navigate('next');
            });

            // Keyboard support for carousel
            track.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    navigate('prev');
                }
                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    navigate('next');
                }
            });

            function navigate(direction) {
                const items = track.querySelectorAll('[role="listitem"]');
                const totalItems = items.length;

                if (totalItems === 0) return;

                if (direction === 'prev') {
                    currentIndex = (currentIndex - 1 + totalItems) % totalItems;
                } else {
                    currentIndex = (currentIndex + 1) % totalItems;
                }

                announce(`Showing testimonial ${currentIndex + 1} of ${totalItems}`);
                updateDots();
            }

            function updateDots() {
                if (!dotsContainer) return;

                const dots = dotsContainer.querySelectorAll('[role="tab"]');
                dots.forEach((dot, index) => {
                    const isSelected = index === currentIndex;
                    dot.setAttribute('aria-selected', isSelected);
                    dot.setAttribute('tabindex', isSelected ? '0' : '-1');
                });
            }
        }
    }

    // ==================================
    // 8. VIDEO TESTIMONIAL CARDS
    // ==================================

    function initializeVideoTestimonials() {
        const videoCards = document.querySelectorAll('.video-testimonial-card');

        videoCards.forEach(card => {
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const name = card.querySelector('h3')?.textContent || 'testimonial';
                    announce(`Playing video testimonial from ${name}`);
                    card.click();
                }
            });
        });
    }

    // ==================================
    // 9. RANGE SLIDER ACCESSIBILITY
    // ==================================

    function initializeRangeSlider() {
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');

        if (speedSlider && speedValue) {
            speedSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                speedSlider.setAttribute('aria-valuenow', value);
                speedSlider.setAttribute('aria-valuetext', `${value} times normal speed`);
                speedValue.textContent = `${value}x`;
            });

            // Announce final value on change (not during drag)
            speedSlider.addEventListener('change', (e) => {
                const value = e.target.value;
                announce(`Speaking speed set to ${value} times normal speed`);
            });
        }
    }

    // ==================================
    // 10. VOICE PREVIEW
    // ==================================

    function initializeVoicePreview() {
        const previewBtn = document.querySelector('.preview-voice-btn');
        const voiceSelect = document.getElementById('voiceSelect');

        if (previewBtn && voiceSelect) {
            previewBtn.addEventListener('click', () => {
                const selectedVoice = voiceSelect.options[voiceSelect.selectedIndex].text;
                announce(`Playing preview of ${selectedVoice}`);
            });
        }
    }

    // ==================================
    // 11. ESCAPE KEY HANDLER
    // ==================================

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Close any modals/dialogs
            const modals = document.querySelectorAll('[role="dialog"], [role="alertdialog"]');
            modals.forEach(modal => {
                if (modal.style.display !== 'none') {
                    modal.style.display = 'none';
                    announce('Dialog closed');

                    // Return focus to trigger element
                    const trigger = modal.dataset.trigger;
                    if (trigger) {
                        document.getElementById(trigger)?.focus();
                    }
                }
            });

            // Collapse expanded collapsibles
            const expandedCollapsibles = document.querySelectorAll('[aria-expanded="true"]');
            if (expandedCollapsibles.length > 0) {
                expandedCollapsibles.forEach(header => {
                    header.click();
                });
            }
        }
    });

    // ==================================
    // 12. FOCUS TRAP FOR MODALS
    // ==================================

    class FocusTrap {
        constructor(element) {
            this.element = element;
            this.focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
            this.firstFocusableElement = null;
            this.lastFocusableElement = null;
        }

        activate() {
            const focusableContent = this.element.querySelectorAll(this.focusableElements);
            this.firstFocusableElement = focusableContent[0];
            this.lastFocusableElement = focusableContent[focusableContent.length - 1];

            this.element.addEventListener('keydown', this.handleKeyDown.bind(this));
            this.firstFocusableElement?.focus();
        }

        handleKeyDown(e) {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === this.firstFocusableElement) {
                    e.preventDefault();
                    this.lastFocusableElement?.focus();
                }
            } else {
                if (document.activeElement === this.lastFocusableElement) {
                    e.preventDefault();
                    this.firstFocusableElement?.focus();
                }
            }
        }

        deactivate() {
            this.element.removeEventListener('keydown', this.handleKeyDown.bind(this));
        }
    }

    window.FocusTrap = FocusTrap;

    // ==================================
    // 13. NOTIFICATION ACCESSIBILITY
    // ==================================

    const originalShowNotification = window.showNotification;
    if (typeof originalShowNotification === 'function') {
        window.showNotification = function(message, type = 'info') {
            originalShowNotification(message, type);

            // Announce to screen readers
            const priority = type === 'error' ? 'assertive' : 'polite';
            announce(message, priority);
        };
    }

    // ==================================
    // 14. LIVE REGION FOR SCRIPT STATS
    // ==================================

    function initializeScriptStats() {
        const scriptInput = document.getElementById('scriptInput');
        const wordCount = document.getElementById('wordCount');
        const duration = document.getElementById('estimatedDuration');

        if (scriptInput && wordCount && duration) {
            let announcementTimeout;

            scriptInput.addEventListener('input', () => {
                // Debounce announcements to avoid overwhelming screen readers
                clearTimeout(announcementTimeout);
                announcementTimeout = setTimeout(() => {
                    const words = wordCount.textContent;
                    const time = duration.textContent;
                    // The aria-live region will automatically announce the changes
                }, 1000);
            });
        }
    }

    // ==================================
    // 15. INITIALIZE ALL
    // ==================================

    function initialize() {
        initializeAvatarCards();
        initializeCollapsibles();
        validateForm();
        updateProgressAccessibility();
        initializeCarousel();
        initializeVideoTestimonials();
        initializeRangeSlider();
        initializeVoicePreview();
        initializeScriptStats();

        announce('Page loaded. AI Avatar Studio');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    // ==================================
    // 16. EXPORT FOR TESTING
    // ==================================

    window.a11y = {
        announce,
        FocusTrap,
        initializeAvatarCards,
        initializeCollapsibles,
        initializeCarousel
    };

})();
