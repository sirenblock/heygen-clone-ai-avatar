// Configuration
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : 'https://api.yourdomain.com'; // Update with your backend URL

// State
let currentJob = null;
let selectedAvatar = 'default';
let selectedVoice = 'rachel';
let voicesData = null;
let audioContext = null;
let currentAudioSource = null;
let isPlaying = false;
let animationFrameId = null;
let avatarsData = null;
let currentFilter = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAvatars();
    initializeEventListeners();
    setupCollapsibles();
    loadVoicesData();
    initializeAudioContext();
});

// Avatar Loading System
async function loadAvatars() {
    try {
        const response = await fetch('assets/avatars/avatars.json');
        avatarsData = await response.json();
        renderAvatars(avatarsData.avatars);
        setupAvatarFilters();
        setupLazyLoading();
    } catch (error) {
        console.error('Failed to load avatars:', error);
        showAvatarLoadError();
    }
}

function renderAvatars(avatars) {
    const avatarGrid = document.getElementById('avatarGrid');
    if (!avatarGrid) return;

    // Clear loading state
    avatarGrid.innerHTML = '';

    // Filter avatars based on current filter
    const filteredAvatars = filterAvatars(avatars, currentFilter);

    // Render each avatar
    filteredAvatars.forEach((avatar, index) => {
        const avatarCard = document.createElement('div');
        avatarCard.className = `avatar-card ${index === 0 ? 'active' : ''}`;
        avatarCard.dataset.avatar = avatar.id;
        avatarCard.dataset.style = avatar.style;
        avatarCard.setAttribute('role', 'button');
        avatarCard.setAttribute('tabindex', '0');
        avatarCard.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
        avatarCard.setAttribute('aria-label', `Select ${avatar.name} avatar`);

        avatarCard.innerHTML = `
            <div class="avatar-preview">
                <img
                    data-src="${avatar.image}"
                    alt="${avatar.name}"
                    class="avatar-img lazy"
                    loading="lazy"
                />
                <div class="avatar-overlay">
                    <span class="avatar-industry">${avatar.industry}</span>
                </div>
            </div>
            <div class="avatar-details">
                <span class="avatar-name">${avatar.name}</span>
                <span class="avatar-style">${avatar.style}</span>
            </div>
        `;

        avatarCard.addEventListener('click', () => selectAvatar(avatarCard, avatar));
        avatarCard.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectAvatar(avatarCard, avatar);
            }
        });

        avatarGrid.appendChild(avatarCard);
    });

    // Add upload avatar card
    const uploadCard = document.createElement('div');
    uploadCard.className = 'avatar-card upload-avatar';
    uploadCard.setAttribute('role', 'button');
    uploadCard.setAttribute('tabindex', '0');
    uploadCard.setAttribute('aria-label', 'Upload custom avatar');
    uploadCard.innerHTML = `
        <div class="avatar-preview">
            <div class="upload-icon">➕</div>
        </div>
        <div class="avatar-details">
            <span class="avatar-name">Upload Custom</span>
        </div>
    `;
    uploadCard.addEventListener('click', handleAvatarUpload);
    avatarGrid.appendChild(uploadCard);

    // Set first avatar as selected by default
    if (filteredAvatars.length > 0) {
        selectedAvatar = filteredAvatars[0].id;
    }
}

function filterAvatars(avatars, filter) {
    if (filter === 'all') return avatars;
    return avatars.filter(avatar => avatar.style === filter || avatar.tags.includes(filter));
}

function selectAvatar(cardElement, avatar) {
    // Update active state
    document.querySelectorAll('.avatar-card').forEach(card => {
        card.classList.remove('active');
        card.setAttribute('aria-pressed', 'false');
    });
    cardElement.classList.add('active');
    cardElement.setAttribute('aria-pressed', 'true');

    // Update selected avatar
    selectedAvatar = avatar.id;

    // Update info panel
    updateAvatarInfo(avatar);
}

function updateAvatarInfo(avatar) {
    const avatarInfo = document.getElementById('avatarInfo');
    if (!avatarInfo) return;

    avatarInfo.innerHTML = `
        <div class="avatar-info-content">
            <h4>${avatar.name}</h4>
            <p>${avatar.description}</p>
            <div class="avatar-meta">
                <span><strong>Industry:</strong> ${avatar.industry}</span>
                <span><strong>Best for:</strong> ${avatar.use_case}</span>
            </div>
            <div class="avatar-tags">
                ${avatar.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
    `;
}

function setupAvatarFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active filter button
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update current filter
            currentFilter = btn.dataset.filter;

            // Re-render avatars
            if (avatarsData) {
                renderAvatars(avatarsData.avatars);
                setupLazyLoading();
            }
        });
    });
}

function setupLazyLoading() {
    const images = document.querySelectorAll('.avatar-img.lazy');

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.dataset.src;

                if (src) {
                    img.src = src;
                    img.classList.remove('lazy');
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            }
        });
    }, {
        rootMargin: '50px'
    });

    images.forEach(img => imageObserver.observe(img));
}

function showAvatarLoadError() {
    const avatarGrid = document.getElementById('avatarGrid');
    if (!avatarGrid) return;

    avatarGrid.innerHTML = `
        <div class="error-state">
            <p>Failed to load avatars. Please refresh the page.</p>
            <button onclick="loadAvatars()" class="retry-btn">Retry</button>
        </div>
    `;
}

function initializeEventListeners() {
    // Avatar selection
    document.querySelectorAll('.avatar-card').forEach(card => {
        card.addEventListener('click', function() {
            if (!this.classList.contains('upload-avatar')) {
                document.querySelectorAll('.avatar-card').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                selectedAvatar = this.dataset.avatar;
            } else {
                handleAvatarUpload();
            }
        });
    });

    // Voice selection
    const voiceSelect = document.getElementById('voiceSelect');
    voiceSelect.addEventListener('change', (e) => {
        selectedVoice = e.target.value;
    });

    // Preview voice
    document.querySelector('.preview-voice-btn').addEventListener('click', previewVoice);

    // Script input
    const scriptInput = document.getElementById('scriptInput');
    scriptInput.addEventListener('input', updateScriptStats);

    // Speed slider
    const speedSlider = document.getElementById('speedSlider');
    speedSlider.addEventListener('input', (e) => {
        document.getElementById('speedValue').textContent = `${e.target.value}x`;
    });

    // Generate button
    document.getElementById('generateBtn').addEventListener('click', generateVideo);

    // Result actions
    document.querySelector('.download-btn')?.addEventListener('click', downloadVideo);
    document.querySelector('.share-btn')?.addEventListener('click', shareVideo);
    document.querySelector('.new-video-btn')?.addEventListener('click', createNewVideo);
}

function setupCollapsibles() {
    document.querySelectorAll('.collapsible-header').forEach(header => {
        header.addEventListener('click', function() {
            this.parentElement.classList.toggle('collapsed');
        });
    });
}

function updateScriptStats() {
    const text = document.getElementById('scriptInput').value;
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    // Estimate ~150 words per minute for speech
    const estimatedSeconds = Math.round((wordCount / 150) * 60);

    document.getElementById('wordCount').textContent = `${wordCount} words`;
    document.getElementById('estimatedDuration').textContent = `~${estimatedSeconds} seconds`;
}

async function generateVideo() {
    const script = document.getElementById('scriptInput').value.trim();

    if (!script) {
        showNotification('Please enter a script', 'error');
        return;
    }

    if (script.split(/\s+/).length < 10) {
        showNotification('Script is too short. Please add more content.', 'error');
        return;
    }

    const generateBtn = document.getElementById('generateBtn');
    generateBtn.disabled = true;
    generateBtn.querySelector('.btn-text').textContent = 'Processing...';

    // Show progress section
    const progressSection = document.getElementById('progressSection');
    progressSection.classList.remove('hidden');

    // Hide result section if visible
    document.getElementById('resultSection').classList.add('hidden');

    try {
        // Prepare request data
        const requestData = {
            script: script,
            avatar_id: selectedAvatar,
            voice_id: selectedVoice,
            quality: document.getElementById('qualitySelect').value,
            background: document.getElementById('backgroundSelect').value,
            speed: parseFloat(document.getElementById('speedSlider').value)
        };

        // Start generation
        const response = await fetch(`${API_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error('Generation failed');
        }

        const result = await response.json();
        currentJob = result.job_id;

        // Start polling for status
        pollJobStatus(currentJob);

    } catch (error) {
        console.error('Generation error:', error);
        showNotification('Failed to generate video. Please try again.', 'error');
        resetGenerateButton();
        progressSection.classList.add('hidden');
    }
}

async function pollJobStatus(jobId) {
    const pollInterval = setInterval(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/status/${jobId}`);

            if (!response.ok) {
                throw new Error('Status check failed');
            }

            const status = await response.json();
            updateProgress(status);

            if (status.status === 'completed') {
                clearInterval(pollInterval);
                showResult(status);
            } else if (status.status === 'failed') {
                clearInterval(pollInterval);
                showNotification('Video generation failed. Please try again.', 'error');
                resetGenerateButton();
                document.getElementById('progressSection').classList.add('hidden');
            }

        } catch (error) {
            console.error('Status polling error:', error);
            clearInterval(pollInterval);
            showNotification('Lost connection to server', 'error');
            resetGenerateButton();
        }
    }, 2000); // Poll every 2 seconds
}

function updateProgress(status) {
    const progress = status.progress || 0;
    document.getElementById('progressPercent').textContent = `${Math.round(progress)}%`;
    document.getElementById('progressFill').style.width = `${progress}%`;

    // Update step states
    const steps = document.querySelectorAll('.step');
    const currentStep = Math.floor(progress / 25);

    steps.forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index < currentStep) {
            step.classList.add('completed');
        } else if (index === currentStep) {
            step.classList.add('active');
        }
    });
}

function showResult(status) {
    // Hide progress
    document.getElementById('progressSection').classList.add('hidden');

    // Show result
    const resultSection = document.getElementById('resultSection');
    resultSection.classList.remove('hidden');

    // Set video source
    const video = document.getElementById('resultVideo');
    video.src = `${API_BASE_URL}/api/download/${currentJob}`;

    // Reset generate button
    resetGenerateButton();

    // Show success notification
    showNotification('Video generated successfully!', 'success');
}

function resetGenerateButton() {
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.disabled = false;
    generateBtn.querySelector('.btn-text').textContent = 'Generate Video';
}

function createNewVideo() {
    document.getElementById('resultSection').classList.add('hidden');
    document.getElementById('scriptInput').value = '';
    updateScriptStats();
    currentJob = null;
}

async function downloadVideo() {
    if (!currentJob) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/download/${currentJob}`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `avatar-video-${currentJob}.mp4`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showNotification('Download started', 'success');
    } catch (error) {
        console.error('Download error:', error);
        showNotification('Download failed', 'error');
    }
}

function shareVideo() {
    if (!currentJob) return;

    const shareUrl = `${window.location.origin}/share/${currentJob}`;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl);
        showNotification('Share link copied to clipboard!', 'success');
    } else {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showNotification('Share link copied!', 'success');
    }
}

function handleAvatarUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*,image/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            showNotification('Uploading avatar...', 'info');

            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', `Custom Avatar ${Date.now()}`);

            try {
                const response = await fetch(`${API_BASE_URL}/api/avatars/train`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error('Upload failed');

                const result = await response.json();
                showNotification('Avatar uploaded successfully!', 'success');
                selectedAvatar = result.avatar_id;

            } catch (error) {
                console.error('Upload error:', error);
                showNotification('Avatar upload failed', 'error');
            }
        }
    };
    input.click();
}

// Voice Preview System

async function loadVoicesData() {
    try {
        const response = await fetch('assets/voices/voices.json');
        voicesData = await response.json();
        populateVoiceSelector();
    } catch (error) {
        console.error('Failed to load voices data:', error);
        showNotification('Failed to load voice data', 'error');
    }
}

function populateVoiceSelector() {
    const voiceSelect = document.getElementById('voiceSelect');
    if (!voicesData || !voiceSelect) return;

    // Clear existing options except custom
    voiceSelect.innerHTML = '';

    // Add all voices from JSON
    voicesData.voices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.id;
        option.textContent = `${voice.name} - ${voice.description}`;
        if (voice.popular) {
            option.textContent += ' ⭐';
        }
        voiceSelect.appendChild(option);
    });

    // Add custom voice option
    const customOption = document.createElement('option');
    customOption.value = 'custom';
    customOption.textContent = 'Custom Voice (Clone)';
    voiceSelect.appendChild(customOption);
}

function initializeAudioContext() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
        console.error('Web Audio API not supported:', error);
    }
}

async function previewVoice() {
    const voiceId = selectedVoice;

    if (voiceId === 'custom') {
        showNotification('Custom voice cloning available in Pro plan', 'info');
        return;
    }

    const voice = voicesData?.voices.find(v => v.id === voiceId);
    if (!voice) {
        showNotification('Voice not found', 'error');
        return;
    }

    // Stop any currently playing audio
    stopAudioPlayback();

    // Show voice preview player
    showVoicePreviewPlayer(voice);
}

function showVoicePreviewPlayer(voice) {
    // Remove existing player if any
    const existingPlayer = document.querySelector('.voice-preview-player');
    if (existingPlayer) {
        existingPlayer.remove();
    }

    // Create player container
    const player = document.createElement('div');
    player.className = 'voice-preview-player';
    player.innerHTML = `
        <div class="voice-preview-header">
            <div class="voice-info">
                <h4>${voice.name}</h4>
                <p>${voice.description}</p>
            </div>
            <button class="close-preview-btn">✕</button>
        </div>
        <div class="voice-characteristics">
            <span class="char-tag">Pitch: ${voice.characteristics.pitch}</span>
            <span class="char-tag">Speed: ${voice.characteristics.speed}</span>
            <span class="char-tag">Accent: ${voice.characteristics.accent}</span>
            <span class="char-tag">Tone: ${voice.characteristics.tone}</span>
        </div>
        <div class="voice-preview-text">"${voice.preview_text}"</div>
        <div class="waveform-container">
            <canvas id="waveformCanvas" width="800" height="100"></canvas>
        </div>
        <div class="audio-controls">
            <button class="play-pause-btn" id="playPauseBtn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M8 5v14l11-7z" fill="currentColor"/>
                </svg>
            </button>
            <div class="time-display">
                <span id="currentTime">0:00</span> / <span id="totalTime">0:00</span>
            </div>
            <div class="progress-container">
                <div class="progress-track">
                    <div class="progress-played" id="progressPlayed"></div>
                </div>
            </div>
        </div>
        <div class="voice-use-case">
            <strong>Best for:</strong> ${voice.useCase}
        </div>
    `;

    // Insert player after voice selector
    const voicePanel = document.querySelector('.voice-selector').parentElement;
    voicePanel.appendChild(player);

    // Setup event listeners
    setupPlayerControls(voice);

    // Animate in
    setTimeout(() => player.classList.add('active'), 10);
}

function setupPlayerControls(voice) {
    const playPauseBtn = document.getElementById('playPauseBtn');
    const closeBtn = document.querySelector('.close-preview-btn');

    playPauseBtn.addEventListener('click', () => togglePlayback(voice));
    closeBtn.addEventListener('click', () => {
        stopAudioPlayback();
        const player = document.querySelector('.voice-preview-player');
        if (player) {
            player.classList.remove('active');
            setTimeout(() => player.remove(), 300);
        }
    });
}

function togglePlayback(voice) {
    if (isPlaying) {
        stopAudioPlayback();
    } else {
        startAudioPlayback(voice);
    }
}

function startAudioPlayback(voice) {
    if (!audioContext) {
        initializeAudioContext();
    }

    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    isPlaying = true;
    updatePlayPauseButton(true);

    // Simulate audio playback with waveform visualization
    simulateAudioPlayback(voice);
}

function stopAudioPlayback() {
    isPlaying = false;
    updatePlayPauseButton(false);

    if (currentAudioSource) {
        try {
            currentAudioSource.stop();
        } catch (e) {
            // Source may already be stopped
        }
        currentAudioSource = null;
    }

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // Reset progress
    const progressPlayed = document.getElementById('progressPlayed');
    const currentTime = document.getElementById('currentTime');
    if (progressPlayed) progressPlayed.style.width = '0%';
    if (currentTime) currentTime.textContent = '0:00';
}

function updatePlayPauseButton(playing) {
    const playPauseBtn = document.getElementById('playPauseBtn');
    if (!playPauseBtn) return;

    if (playing) {
        playPauseBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
                <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
            </svg>
        `;
    } else {
        playPauseBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M8 5v14l11-7z" fill="currentColor"/>
            </svg>
        `;
    }
}

function simulateAudioPlayback(voice) {
    const canvas = document.getElementById('waveformCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const duration = 5000; // 5 seconds simulation
    const startTime = Date.now();

    // Set total time
    const totalTime = document.getElementById('totalTime');
    if (totalTime) totalTime.textContent = '0:05';

    // Generate waveform data based on voice characteristics
    const waveformData = generateWaveformData(voice, 200);

    function animate() {
        if (!isPlaying) return;

        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Update progress bar
        const progressPlayed = document.getElementById('progressPlayed');
        if (progressPlayed) {
            progressPlayed.style.width = `${progress * 100}%`;
        }

        // Update time display
        const currentTime = document.getElementById('currentTime');
        if (currentTime) {
            const seconds = Math.floor(progress * 5);
            currentTime.textContent = `0:0${seconds}`;
        }

        // Draw waveform
        drawWaveform(ctx, canvas, waveformData, progress);

        if (progress < 1) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            stopAudioPlayback();
            showNotification('Voice preview completed', 'success');
        }
    }

    animate();
}

function generateWaveformData(voice, points) {
    const data = [];
    const seed = voice.waveform_seed || 42;

    // Simple seeded random number generator
    let random = seed;
    const seededRandom = () => {
        random = (random * 9301 + 49297) % 233280;
        return random / 233280;
    };

    // Adjust amplitude based on voice characteristics
    let baseAmplitude = 0.5;
    if (voice.characteristics.tone === 'powerful' || voice.characteristics.pitch === 'very-low') {
        baseAmplitude = 0.8;
    } else if (voice.characteristics.tone === 'youthful' || voice.characteristics.pitch === 'high') {
        baseAmplitude = 0.4;
    }

    // Adjust frequency based on speaking speed
    let frequency = 0.3;
    if (voice.characteristics.speed === 'fast') {
        frequency = 0.5;
    } else if (voice.characteristics.speed === 'slow') {
        frequency = 0.15;
    }

    for (let i = 0; i < points; i++) {
        const t = i / points;
        // Create natural speech-like waveform with variation
        const wave = Math.sin(t * Math.PI * 20 * frequency) * baseAmplitude;
        const noise = (seededRandom() - 0.5) * 0.2;
        const envelope = Math.sin(t * Math.PI); // Fade in and out
        data.push((wave + noise) * envelope);
    }

    return data;
}

function drawWaveform(ctx, canvas, data, progress) {
    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // Draw center line
    ctx.strokeStyle = '#2a2a4e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Draw waveform
    const progressPoint = Math.floor(data.length * progress);
    const barWidth = width / data.length;

    for (let i = 0; i < data.length; i++) {
        const x = i * barWidth;
        const barHeight = Math.abs(data[i]) * (height / 2);

        // Color based on progress
        if (i < progressPoint) {
            // Create gradient for played portion
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#8B5CF6');
            gradient.addColorStop(1, '#EC4899');
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = '#4a4a6e';
        }

        // Draw bar
        ctx.fillRect(x, centerY - barHeight, barWidth * 0.8, barHeight * 2);
    }

    // Draw playhead
    const playheadX = width * progress;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 24px;
        background: ${type === 'error' ? '#EF4444' : type === 'success' ? '#10B981' : '#8B5CF6'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    `;

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Demo mode for testing without backend
if (window.location.search.includes('demo=true')) {
    console.log('Running in demo mode');

    // Override generateVideo for demo
    const originalGenerate = generateVideo;
    generateVideo = async function() {
        const script = document.getElementById('scriptInput').value.trim();

        if (!script) {
            showNotification('Please enter a script', 'error');
            return;
        }

        const generateBtn = document.getElementById('generateBtn');
        generateBtn.disabled = true;
        generateBtn.querySelector('.btn-text').textContent = 'Processing...';

        const progressSection = document.getElementById('progressSection');
        progressSection.classList.remove('hidden');
        document.getElementById('resultSection').classList.add('hidden');

        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            updateProgress({ progress, status: 'processing' });

            if (progress >= 100) {
                clearInterval(interval);
                showDemoResult();
            }
        }, 300);
    };

    function showDemoResult() {
        document.getElementById('progressSection').classList.add('hidden');
        const resultSection = document.getElementById('resultSection');
        resultSection.classList.remove('hidden');

        // Use a sample video
        const video = document.getElementById('resultVideo');
        video.src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

        resetGenerateButton();
        showNotification('Demo video generated!', 'success');
    }
}

// ============================================
// Pricing Section Functionality
// ============================================

// Initialize pricing interactions
function initPricingInteractions() {
    initBillingToggle();
    initPricingCalculator();
    initFAQAccordion();
}

// Billing Toggle (Monthly/Yearly)
function initBillingToggle() {
    const billingToggle = document.getElementById('billingToggle');
    const monthlyOption = document.getElementById('monthlyOption');
    const yearlyOption = document.getElementById('yearlyOption');
    const priceAmounts = document.querySelectorAll('.pricing-card .amount');

    if (!billingToggle) return;

    // Toggle between monthly and yearly
    billingToggle.addEventListener('change', (e) => {
        const isYearly = e.target.checked;

        // Update option styles
        monthlyOption.classList.toggle('active', !isYearly);
        yearlyOption.classList.toggle('active', isYearly);

        // Update prices
        priceAmounts.forEach(amount => {
            if (amount.classList.contains('custom')) return;

            const monthly = parseFloat(amount.dataset.monthly);
            const yearly = parseFloat(amount.dataset.yearly);
            const newPrice = isYearly ? yearly : monthly;

            // Animate price change
            animateValue(amount, parseFloat(amount.textContent), newPrice, 300);
        });
    });

    // Click handlers for option labels
    monthlyOption.addEventListener('click', () => {
        billingToggle.checked = false;
        billingToggle.dispatchEvent(new Event('change'));
    });

    yearlyOption.addEventListener('click', () => {
        billingToggle.checked = true;
        billingToggle.dispatchEvent(new Event('change'));
    });
}

// Pricing Calculator
function initPricingCalculator() {
    const videoCountInput = document.getElementById('videoCount');
    const videoLengthInput = document.getElementById('videoLength');
    const qualitySelect = document.getElementById('qualityLevel');

    const videoCountValue = document.getElementById('videoCountValue');
    const videoLengthValue = document.getElementById('videoLengthValue');
    const creditsNeeded = document.getElementById('creditsNeeded');
    const estimatedCost = document.getElementById('estimatedCost');
    const recommendedPlan = document.getElementById('recommendedPlan');

    if (!videoCountInput || !videoLengthInput || !qualitySelect) return;

    function updateCalculator() {
        const videoCount = parseInt(videoCountInput.value);
        const videoLength = parseFloat(videoLengthInput.value);
        const quality = qualitySelect.value;

        // Update display values
        videoCountValue.textContent = videoCount;
        videoLengthValue.textContent = videoLength;

        // Calculate credits (credits per minute based on quality)
        const creditsPerMin = {
            '720': 1,
            '1080': 2,
            '4k': 4
        };

        const totalMinutes = videoCount * videoLength;
        const totalCredits = Math.ceil(totalMinutes * creditsPerMin[quality]);

        // Animate credit change
        const currentCredits = parseInt(creditsNeeded.textContent);
        animateValue(creditsNeeded, currentCredits, totalCredits, 300, 0);

        // Calculate cost and recommend plan
        let cost = 0;
        let plan = 'Free';

        if (videoCount <= 3 && quality === '720') {
            cost = 0;
            plan = 'Free';
        } else if (videoCount <= 50 && (quality === '1080' || quality === '720')) {
            cost = 29;
            plan = 'Pro';
        } else {
            cost = 'Custom';
            plan = 'Enterprise';
        }

        // Update display
        if (typeof cost === 'number') {
            estimatedCost.textContent = `$${cost}/mo`;
        } else {
            estimatedCost.textContent = cost;
        }
        recommendedPlan.textContent = plan;

        // Highlight recommended plan with animation
        highlightRecommendedPlan(plan);
    }

    // Event listeners
    videoCountInput.addEventListener('input', updateCalculator);
    videoLengthInput.addEventListener('input', updateCalculator);
    qualitySelect.addEventListener('change', updateCalculator);

    // Initial calculation
    updateCalculator();
}

// Highlight recommended plan
function highlightRecommendedPlan(planName) {
    const pricingCards = document.querySelectorAll('.pricing-card');

    pricingCards.forEach(card => {
        const cardTitle = card.querySelector('h3').textContent;

        if (cardTitle === planName) {
            card.style.animation = 'pulse 1s ease-in-out';
            setTimeout(() => {
                card.style.animation = '';
            }, 1000);
        }
    });
}

// FAQ Accordion
function initFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });

            // Toggle current item
            item.classList.toggle('active', !isActive);
        });
    });
}

// Animate number value change
function animateValue(element, start, end, duration, decimals = 0) {
    const range = end - start;
    const increment = range / (duration / 16); // 60fps
    let current = start;

    const timer = setInterval(() => {
        current += increment;

        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }

        element.textContent = decimals > 0 ? current.toFixed(decimals) : Math.round(current);
    }, 16);
}

// Initialize pricing on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPricingInteractions);
} else {
    initPricingInteractions();
}
