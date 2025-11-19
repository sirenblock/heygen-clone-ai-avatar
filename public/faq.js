// FAQ Functionality
document.addEventListener('DOMContentLoaded', function() {
    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    const faqSearch = document.getElementById('faqSearch');
    const faqCount = document.getElementById('faqCount');
    const categoryBtns = document.querySelectorAll('.faq-category-btn');
    const noResults = document.getElementById('noResults');
    const helpButton = document.getElementById('helpButton');

    // Initialize FAQ count
    updateFaqCount();

    // Accordion functionality
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all FAQ items
            faqItems.forEach(i => i.classList.remove('active'));

            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
            }
        });

        // Keyboard accessibility
        question.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                question.click();
            }
        });
    });

    // Search functionality
    if (faqSearch) {
        faqSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            let visibleCount = 0;

            faqItems.forEach(item => {
                const question = item.querySelector('h3').textContent.toLowerCase();
                const answer = item.querySelector('.faq-answer p').textContent.toLowerCase();
                const category = item.dataset.category;

                const matchesSearch = question.includes(searchTerm) || answer.includes(searchTerm);
                const matchesCategory = getActiveCategory() === 'all' || category === getActiveCategory();

                if (matchesSearch && matchesCategory) {
                    item.classList.remove('hidden');
                    visibleCount++;
                } else {
                    item.classList.add('hidden');
                }
            });

            // Show/hide no results message
            if (visibleCount === 0) {
                noResults.classList.remove('hidden');
            } else {
                noResults.classList.add('hidden');
            }

            updateFaqCount();
        });
    }

    // Category filtering
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active button
            categoryBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const category = this.dataset.category;
            const searchTerm = faqSearch ? faqSearch.value.toLowerCase().trim() : '';
            let visibleCount = 0;

            faqItems.forEach(item => {
                const itemCategory = item.dataset.category;
                const question = item.querySelector('h3').textContent.toLowerCase();
                const answer = item.querySelector('.faq-answer p').textContent.toLowerCase();

                const matchesCategory = category === 'all' || itemCategory === category;
                const matchesSearch = searchTerm === '' || question.includes(searchTerm) || answer.includes(searchTerm);

                if (matchesCategory && matchesSearch) {
                    item.classList.remove('hidden');
                    visibleCount++;
                } else {
                    item.classList.add('hidden');
                }
            });

            // Show/hide no results message
            if (visibleCount === 0) {
                noResults.classList.remove('hidden');
            } else {
                noResults.classList.add('hidden');
            }

            updateFaqCount();
        });

        // Keyboard accessibility for category buttons
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        });
    });

    // Helper function to get active category
    function getActiveCategory() {
        const activeBtn = document.querySelector('.faq-category-btn.active');
        return activeBtn ? activeBtn.dataset.category : 'all';
    }

    // Update FAQ count
    function updateFaqCount() {
        const visibleItems = document.querySelectorAll('.faq-item:not(.hidden)').length;
        const totalItems = faqItems.length;

        if (faqCount) {
            if (faqSearch && faqSearch.value.trim() !== '') {
                faqCount.textContent = `${visibleItems} of ${totalItems}`;
            } else {
                faqCount.textContent = `${visibleItems} question${visibleItems !== 1 ? 's' : ''}`;
            }
        }
    }

    // Floating Help Button
    if (helpButton) {
        helpButton.addEventListener('click', function() {
            showHelpModal();
        });
    }

    // Help Modal
    function showHelpModal() {
        // Create modal if it doesn't exist
        let modal = document.getElementById('helpModal');

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'helpModal';
            modal.className = 'help-modal';
            modal.innerHTML = `
                <div class="help-modal-content">
                    <div class="help-modal-header">
                        <h2>How can we help you?</h2>
                        <button class="help-close-btn" aria-label="Close help modal">&times;</button>
                    </div>
                    <div class="help-options">
                        <a href="#faq" class="help-option">
                            <div class="help-option-icon">❓</div>
                            <div class="help-option-content">
                                <h3>Browse FAQs</h3>
                                <p>Find answers to common questions</p>
                            </div>
                        </a>
                        <a href="#docs" class="help-option">
                            <div class="help-option-icon">📚</div>
                            <div class="help-option-content">
                                <h3>API Documentation</h3>
                                <p>Learn how to integrate our API</p>
                            </div>
                        </a>
                        <a href="#create" class="help-option">
                            <div class="help-option-icon">🎬</div>
                            <div class="help-option-content">
                                <h3>Quick Start Guide</h3>
                                <p>Create your first video in minutes</p>
                            </div>
                        </a>
                        <a href="mailto:support@aiavatarstudio.com" class="help-option">
                            <div class="help-option-icon">✉️</div>
                            <div class="help-option-content">
                                <h3>Contact Support</h3>
                                <p>Get help from our team</p>
                            </div>
                        </a>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Close button functionality
            const closeBtn = modal.querySelector('.help-close-btn');
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });

            // Close on outside click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });

            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    modal.classList.remove('active');
                }
            });

            // Close modal and navigate when clicking help options
            const helpOptions = modal.querySelectorAll('.help-option');
            helpOptions.forEach(option => {
                option.addEventListener('click', () => {
                    modal.classList.remove('active');
                });
            });
        }

        // Show modal
        modal.classList.add('active');
    }

    // Smooth scroll to FAQ section when clicking help option
    document.querySelectorAll('a[href="#faq"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const faqSection = document.getElementById('faq');
            if (faqSection) {
                e.preventDefault();
                faqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

                // Focus on search input
                if (faqSearch) {
                    setTimeout(() => {
                        faqSearch.focus();
                    }, 500);
                }
            }
        });
    });

    // Add tooltips to existing elements
    addTooltipsToInterface();

    // Highlight search terms in FAQ answers
    function highlightSearchTerm(text, term) {
        if (!term) return text;
        const regex = new RegExp(`(${term})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    // Add keyboard navigation for FAQ items
    document.addEventListener('keydown', (e) => {
        const activeElement = document.activeElement;
        const isFaqQuestion = activeElement.classList.contains('faq-question');

        if (!isFaqQuestion) return;

        const currentItem = activeElement.closest('.faq-item');
        const visibleItems = Array.from(document.querySelectorAll('.faq-item:not(.hidden)'));
        const currentIndex = visibleItems.indexOf(currentItem);

        let nextItem;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            nextItem = visibleItems[currentIndex + 1] || visibleItems[0];
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            nextItem = visibleItems[currentIndex - 1] || visibleItems[visibleItems.length - 1];
        }

        if (nextItem) {
            nextItem.querySelector('.faq-question').focus();
        }
    });
});

// Add tooltips to interface elements
function addTooltipsToInterface() {
    // Add tooltips to avatar cards
    const avatarCards = document.querySelectorAll('.avatar-card');
    const tooltips = {
        'default': 'Professional business appearance - ideal for corporate videos',
        'casual': 'Relaxed, approachable style - great for informal content',
        'friendly': 'Warm and engaging - perfect for educational content',
        'upload-avatar': 'Upload your own photo to create a custom avatar'
    };

    avatarCards.forEach(card => {
        const avatar = card.dataset.avatar;
        if (tooltips[avatar]) {
            card.setAttribute('data-tooltip', tooltips[avatar]);
        }
    });

    // Add tooltips to quality options
    const qualitySelect = document.getElementById('qualitySelect');
    if (qualitySelect) {
        qualitySelect.setAttribute('data-tooltip', 'Higher quality = better video, longer processing time');
    }

    // Add tooltips to voice preview button
    const voicePreviewBtn = document.querySelector('.preview-voice-btn');
    if (voicePreviewBtn) {
        voicePreviewBtn.setAttribute('data-tooltip', 'Listen to a sample of this voice');
    }

    // Add tooltip to generate button
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.setAttribute('data-tooltip', 'Click to create your AI avatar video');
    }

    // Add tooltips to advanced options
    const backgroundSelect = document.getElementById('backgroundSelect');
    if (backgroundSelect) {
        backgroundSelect.setAttribute('data-tooltip', 'Choose a background for your avatar');
    }

    const speedSlider = document.getElementById('speedSlider');
    if (speedSlider) {
        speedSlider.setAttribute('data-tooltip', 'Adjust how fast your avatar speaks');
    }
}

// Utility function to scroll to FAQ from anywhere
window.scrollToFAQ = function() {
    const faqSection = document.getElementById('faq');
    if (faqSection) {
        faqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};
