// Configuration
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : 'https://api.yourdomain.com'; // Update with your backend URL

// State
let currentJob = null;
let selectedAvatar = 'default';
let selectedVoice = 'rachel';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    setupCollapsibles();
});

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

async function previewVoice() {
    const voiceId = selectedVoice;
    const sampleText = "Hello! This is a preview of my voice. I'm ready to bring your scripts to life.";

    showNotification('Generating voice preview...', 'info');

    try {
        // In a real implementation, you would call the voice synthesis API
        // For now, we'll simulate it
        await new Promise(resolve => setTimeout(resolve, 1000));
        showNotification('Voice preview would play here', 'info');

        // TODO: Implement actual voice preview with audio playback

    } catch (error) {
        console.error('Preview error:', error);
        showNotification('Preview failed', 'error');
    }
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
