/**
 * AI Avatar Studio - Interactive Tutorial System
 * Custom implementation inspired by Shepherd.js
 */

class AvatarTutorial {
    constructor() {
        this.currentStep = 0;
        this.steps = [];
        this.isActive = false;
        this.elements = {};
        this.sampleScripts = null;

        this.init();
    }

    init() {
        // Load sample scripts
        this.loadSampleScripts();

        // Define tutorial steps
        this.defineSteps();

        // Create DOM elements
        this.createElements();

        // Add event listeners
        this.attachEventListeners();

        // Check if user wants to skip tutorial
        this.checkTutorialStatus();
    }

    async loadSampleScripts() {
        try {
            const response = await fetch('sample-scripts.json');
            this.sampleScripts = await response.json();
        } catch (error) {
            console.error('Failed to load sample scripts:', error);
            this.sampleScripts = { scripts: [], demo: null };
        }
    }

    defineSteps() {
        this.steps = [
            {
                id: 'welcome',
                title: 'Welcome to AI Avatar Studio!',
                description: 'Let\'s take a quick tour to help you create your first AI video. This will only take 2 minutes.',
                icon: '👋',
                target: null,
                position: 'center',
                onEnter: () => {
                    this.scrollToElement('#create');
                }
            },
            {
                id: 'select-avatar',
                title: 'Select Your Avatar',
                description: 'Choose from our professional avatars or upload your own. Each avatar has unique characteristics and styles.',
                icon: '🎭',
                target: '.avatar-grid',
                position: 'bottom',
                highlight: true,
                onEnter: () => {
                    this.scrollToElement('.avatar-grid');
                }
            },
            {
                id: 'choose-voice',
                title: 'Choose a Voice',
                description: 'Select the perfect voice for your video. Preview each voice to find the one that matches your style.',
                icon: '🎤',
                target: '.voice-selector',
                position: 'bottom',
                highlight: true,
                onEnter: () => {
                    this.scrollToElement('.voice-selector');
                }
            },
            {
                id: 'enter-script',
                title: 'Enter Your Script',
                description: 'Type or paste your script here. You can also browse example scripts for inspiration. Aim for 150-300 words for best results.',
                icon: '📝',
                target: '#scriptInput',
                position: 'bottom',
                highlight: true,
                onEnter: () => {
                    this.scrollToElement('#scriptInput');
                    this.showScriptExamples();
                },
                onExit: () => {
                    this.hideScriptExamples();
                }
            },
            {
                id: 'advanced-options',
                title: 'Advanced Options',
                description: 'Customize video quality, background, and speaking speed. These settings are optional - defaults work great!',
                icon: '⚙️',
                target: '.studio-panel.collapsible',
                position: 'top',
                highlight: true,
                onEnter: () => {
                    this.scrollToElement('.studio-panel.collapsible');
                    // Expand advanced options
                    const advancedPanel = document.querySelector('.studio-panel.collapsible');
                    if (advancedPanel && !advancedPanel.classList.contains('expanded')) {
                        advancedPanel.querySelector('.collapsible-header')?.click();
                    }
                }
            },
            {
                id: 'generate',
                title: 'Generate Your Video',
                description: 'When you\'re ready, click this button to generate your AI video. It typically takes 2-3 minutes to process.',
                icon: '🎬',
                target: '#generateBtn',
                position: 'top',
                highlight: true,
                onEnter: () => {
                    this.scrollToElement('#generateBtn');
                }
            },
            {
                id: 'complete',
                title: 'You\'re All Set!',
                description: 'You\'ve completed the tour! Ready to create your first video? Click "Try Demo" to see it in action, or start creating your own.',
                icon: '🎉',
                target: null,
                position: 'center',
                onEnter: () => {
                    this.showCelebration();
                }
            }
        ];
    }

    createElements() {
        // Create overlay
        this.elements.overlay = document.createElement('div');
        this.elements.overlay.className = 'tutorial-overlay';
        document.body.appendChild(this.elements.overlay);

        // Create spotlight
        this.elements.spotlight = document.createElement('div');
        this.elements.spotlight.className = 'tutorial-spotlight';
        document.body.appendChild(this.elements.spotlight);

        // Create tooltip
        this.elements.tooltip = document.createElement('div');
        this.elements.tooltip.className = 'tutorial-tooltip';
        this.elements.tooltip.innerHTML = this.getTooltipHTML();
        document.body.appendChild(this.elements.tooltip);

        // Create Try Demo button
        this.elements.demoBtn = document.createElement('button');
        this.elements.demoBtn.className = 'try-demo-btn';
        this.elements.demoBtn.innerHTML = '<span>✨</span><span>Try Demo</span>';
        document.body.appendChild(this.elements.demoBtn);

        // Create Start Tutorial button
        this.elements.startBtn = document.createElement('button');
        this.elements.startBtn.className = 'start-tutorial-btn';
        this.elements.startBtn.innerHTML = '<span>🎓</span><span>Take Tutorial</span>';

        // Add to navigation
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            navLinks.appendChild(this.elements.startBtn);
        }

        // Create celebration overlay
        this.elements.celebration = document.createElement('div');
        this.elements.celebration.className = 'celebration-overlay';
        this.elements.celebration.innerHTML = `
            <div class="celebration-content">
                <div class="celebration-icon">🎉</div>
                <h2 class="celebration-title">Congratulations!</h2>
                <p class="celebration-message">You've completed the tutorial and are ready to create amazing AI videos!</p>
                <button class="celebration-btn" id="celebrationContinue">Start Creating</button>
            </div>
        `;
        document.body.appendChild(this.elements.celebration);

        // Create script examples panel
        this.createScriptExamplesPanel();
    }

    createScriptExamplesPanel() {
        this.elements.scriptPanel = document.createElement('div');
        this.elements.scriptPanel.className = 'script-examples';
        this.elements.scriptPanel.innerHTML = `
            <div class="script-examples-header">
                <h3>Example Scripts</h3>
                <button class="script-examples-close">×</button>
            </div>
            <div class="script-examples-list" id="scriptExamplesList"></div>
        `;
        document.body.appendChild(this.elements.scriptPanel);

        // Create toggle button
        this.elements.scriptToggle = document.createElement('button');
        this.elements.scriptToggle.className = 'script-examples-toggle';
        this.elements.scriptToggle.textContent = '📝 Examples';
        document.body.appendChild(this.elements.scriptToggle);
    }

    getTooltipHTML() {
        return `
            <div class="tutorial-content">
                <div class="tutorial-progress">
                    <div class="tutorial-progress-bar">
                        <div class="tutorial-progress-fill"></div>
                    </div>
                    <span class="tutorial-progress-text"></span>
                </div>
                <div class="tutorial-header">
                    <span class="tutorial-icon"></span>
                    <span class="tutorial-step-number"></span>
                </div>
                <h3 class="tutorial-title"></h3>
                <p class="tutorial-description"></p>
                <div class="tutorial-actions">
                    <button class="tutorial-btn tutorial-btn-skip">Skip Tour</button>
                    <button class="tutorial-btn tutorial-btn-secondary" id="tutorialBack">Back</button>
                    <button class="tutorial-btn tutorial-btn-primary" id="tutorialNext">Next</button>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Start tutorial button
        this.elements.startBtn.addEventListener('click', () => this.start());

        // Try demo button
        this.elements.demoBtn.addEventListener('click', () => this.loadDemo());

        // Tooltip navigation
        this.elements.tooltip.querySelector('#tutorialNext').addEventListener('click', () => this.next());
        this.elements.tooltip.querySelector('#tutorialBack').addEventListener('click', () => this.previous());
        this.elements.tooltip.querySelector('.tutorial-btn-skip').addEventListener('click', () => this.skip());

        // Celebration continue
        document.getElementById('celebrationContinue').addEventListener('click', () => {
            this.hideCelebration();
            this.end();
        });

        // Script examples panel
        this.elements.scriptToggle.addEventListener('click', () => this.toggleScriptExamples());
        this.elements.scriptPanel.querySelector('.script-examples-close').addEventListener('click', () => this.hideScriptExamples());

        // Overlay click to skip
        this.elements.overlay.addEventListener('click', () => {
            if (this.currentStep === 0 || this.currentStep === this.steps.length - 1) {
                this.skip();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;

            if (e.key === 'Escape') {
                this.skip();
            } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
                this.next();
            } else if (e.key === 'ArrowLeft') {
                this.previous();
            }
        });
    }

    checkTutorialStatus() {
        const hasSeenTutorial = localStorage.getItem('avatarTutorialCompleted');

        if (!hasSeenTutorial) {
            // Auto-start tutorial for first-time users after a short delay
            setTimeout(() => {
                if (confirm('Welcome to AI Avatar Studio! Would you like a quick tour?')) {
                    this.start();
                }
            }, 2000);
        }
    }

    start() {
        this.isActive = true;
        this.currentStep = 0;
        this.showStep(this.currentStep);
        this.elements.overlay.classList.add('active');
        this.elements.demoBtn.classList.add('hidden');
    }

    end() {
        this.isActive = false;
        this.elements.overlay.classList.remove('active');
        this.elements.tooltip.classList.remove('active');
        this.elements.spotlight.style.display = 'none';
        this.elements.demoBtn.classList.remove('hidden');
        this.hideScriptExamples();

        // Remove highlight from elements
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight', 'tutorial-pulse');
        });

        localStorage.setItem('avatarTutorialCompleted', 'true');
    }

    skip() {
        if (confirm('Are you sure you want to skip the tutorial?')) {
            this.end();
        }
    }

    next() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.showStep(this.currentStep);
        } else {
            this.end();
        }
    }

    previous() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStep(this.currentStep);
        }
    }

    showStep(index) {
        const step = this.steps[index];
        if (!step) return;

        // Call onExit for previous step
        if (index > 0 && this.steps[index - 1].onExit) {
            this.steps[index - 1].onExit();
        }

        // Update tooltip content
        this.updateTooltipContent(step, index);

        // Handle positioning
        if (step.position === 'center') {
            this.showCenterTooltip();
            this.elements.spotlight.style.display = 'none';
        } else {
            this.showTargetedTooltip(step);
        }

        // Call onEnter callback
        if (step.onEnter) {
            step.onEnter();
        }

        // Update navigation buttons
        this.updateNavigationButtons(index);
    }

    updateTooltipContent(step, index) {
        const tooltip = this.elements.tooltip;

        // Update progress
        const progress = ((index + 1) / this.steps.length) * 100;
        tooltip.querySelector('.tutorial-progress-fill').style.width = `${progress}%`;
        tooltip.querySelector('.tutorial-progress-text').textContent = `${index + 1}/${this.steps.length}`;

        // Update content
        tooltip.querySelector('.tutorial-icon').textContent = step.icon;
        tooltip.querySelector('.tutorial-step-number').textContent = `Step ${index + 1}`;
        tooltip.querySelector('.tutorial-title').textContent = step.title;
        tooltip.querySelector('.tutorial-description').textContent = step.description;
    }

    showCenterTooltip() {
        const tooltip = this.elements.tooltip;
        tooltip.className = 'tutorial-tooltip active';

        // Center the tooltip
        tooltip.style.top = '50%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translate(-50%, -50%)';
    }

    showTargetedTooltip(step) {
        const target = document.querySelector(step.target);
        if (!target) {
            console.warn(`Target not found: ${step.target}`);
            return;
        }

        const tooltip = this.elements.tooltip;
        const rect = target.getBoundingClientRect();

        // Highlight target
        if (step.highlight) {
            document.querySelectorAll('.tutorial-highlight').forEach(el => {
                el.classList.remove('tutorial-highlight', 'tutorial-pulse');
            });
            target.classList.add('tutorial-highlight', 'tutorial-pulse');
        }

        // Position spotlight
        this.positionSpotlight(rect);

        // Position tooltip
        this.positionTooltip(tooltip, rect, step.position);
    }

    positionSpotlight(rect) {
        const spotlight = this.elements.spotlight;
        const padding = 8;

        spotlight.style.display = 'block';
        spotlight.style.top = `${rect.top - padding}px`;
        spotlight.style.left = `${rect.left - padding}px`;
        spotlight.style.width = `${rect.width + padding * 2}px`;
        spotlight.style.height = `${rect.height + padding * 2}px`;
    }

    positionTooltip(tooltip, targetRect, position) {
        const tooltipRect = tooltip.getBoundingClientRect();
        const spacing = 20;
        let top, left;

        tooltip.className = 'tutorial-tooltip active position-' + position;

        switch (position) {
            case 'bottom':
                top = targetRect.bottom + spacing;
                left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'top':
                top = targetRect.top - tooltipRect.height - spacing;
                left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'left':
                top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                left = targetRect.left - tooltipRect.width - spacing;
                break;
            case 'right':
                top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                left = targetRect.right + spacing;
                break;
        }

        // Keep tooltip within viewport
        const maxLeft = window.innerWidth - tooltipRect.width - 20;
        const maxTop = window.innerHeight - tooltipRect.height - 20;

        left = Math.max(20, Math.min(left, maxLeft));
        top = Math.max(20, Math.min(top, maxTop));

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
        tooltip.style.transform = 'none';
    }

    updateNavigationButtons(index) {
        const backBtn = this.elements.tooltip.querySelector('#tutorialBack');
        const nextBtn = this.elements.tooltip.querySelector('#tutorialNext');

        // Disable back button on first step
        backBtn.disabled = index === 0;

        // Change next button text on last step
        if (index === this.steps.length - 1) {
            nextBtn.textContent = 'Finish';
        } else {
            nextBtn.textContent = 'Next';
        }
    }

    scrollToElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Script Examples
    showScriptExamples() {
        if (!this.sampleScripts || !this.sampleScripts.scripts) return;

        const list = document.getElementById('scriptExamplesList');
        list.innerHTML = '';

        this.sampleScripts.scripts.forEach(script => {
            const item = document.createElement('div');
            item.className = 'script-example-item';
            item.innerHTML = `
                <div class="script-example-header">
                    <h4 class="script-example-title">${script.title}</h4>
                    <span class="script-example-category">${script.category}</span>
                </div>
                <p class="script-example-preview">${script.script}</p>
            `;

            item.addEventListener('click', () => {
                this.loadScript(script);
                this.hideScriptExamples();
            });

            list.appendChild(item);
        });

        this.elements.scriptPanel.classList.add('open');
        this.elements.scriptToggle.classList.add('hidden');
    }

    hideScriptExamples() {
        this.elements.scriptPanel.classList.remove('open');
        this.elements.scriptToggle.classList.remove('hidden');
    }

    toggleScriptExamples() {
        if (this.elements.scriptPanel.classList.contains('open')) {
            this.hideScriptExamples();
        } else {
            this.showScriptExamples();
        }
    }

    loadScript(script) {
        // Fill in the form with script data
        const scriptInput = document.getElementById('scriptInput');
        if (scriptInput) {
            scriptInput.value = script.script;
            // Trigger input event to update word count
            scriptInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Select avatar
        const avatarCard = document.querySelector(`.avatar-card[data-avatar="${script.avatar}"]`);
        if (avatarCard) {
            document.querySelectorAll('.avatar-card').forEach(card => card.classList.remove('active'));
            avatarCard.classList.add('active');
        }

        // Select voice
        const voiceSelect = document.getElementById('voiceSelect');
        if (voiceSelect) {
            voiceSelect.value = script.voice;
        }

        // Scroll to script input
        this.scrollToElement('#scriptInput');
    }

    // Try Demo functionality
    async loadDemo() {
        if (!this.sampleScripts || !this.sampleScripts.demo) {
            alert('Demo data not available');
            return;
        }

        const demo = this.sampleScripts.demo;

        // Load demo script
        this.loadScript(demo);

        // Set advanced options if available
        if (demo.quality) {
            const qualitySelect = document.getElementById('qualitySelect');
            if (qualitySelect) qualitySelect.value = demo.quality;
        }

        if (demo.background) {
            const backgroundSelect = document.getElementById('backgroundSelect');
            if (backgroundSelect) backgroundSelect.value = demo.background;
        }

        if (demo.speed) {
            const speedSlider = document.getElementById('speedSlider');
            const speedValue = document.getElementById('speedValue');
            if (speedSlider) {
                speedSlider.value = demo.speed;
                if (speedValue) speedValue.textContent = demo.speed + 'x';
            }
        }

        // Scroll to generate button
        this.scrollToElement('#generateBtn');

        // Highlight generate button
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            generateBtn.classList.add('tutorial-pulse');
            setTimeout(() => {
                generateBtn.classList.remove('tutorial-pulse');
            }, 3000);
        }

        // Show notification
        this.showNotification('Demo loaded! Click "Generate Video" to see it in action.');
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #8B5CF6, #EC4899);
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
            z-index: 10002;
            font-weight: 600;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Celebration
    showCelebration() {
        this.elements.celebration.classList.add('active');
        this.createConfetti();
    }

    hideCelebration() {
        this.elements.celebration.classList.remove('active');
    }

    createConfetti() {
        const colors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];
        const confettiCount = 50;

        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = Math.random() * 0.5 + 's';
                confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';

                this.elements.celebration.appendChild(confetti);

                setTimeout(() => confetti.remove(), 4000);
            }, i * 30);
        }
    }
}

// Initialize tutorial when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.avatarTutorial = new AvatarTutorial();
    });
} else {
    window.avatarTutorial = new AvatarTutorial();
}

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

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
