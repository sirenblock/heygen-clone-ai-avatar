/**
 * Analytics Integration Examples for app.js
 *
 * This file shows how to integrate analytics tracking into your existing app.js
 * Copy these code snippets into the appropriate places in app.js
 */

// ==================== EXAMPLE 1: Track Video Generation Start ====================
// In generateVideo() function, after line 119 (after requestData is created)
// Add this before the fetch call:

// Track video generation start
if (window.Analytics) {
    window.Analytics.trackVideoStart(
        requestData.avatar_id,
        requestData.voice_id,
        script.length
    );
}

// ==================== EXAMPLE 2: Track Video Generation Complete ====================
// In showResult() function, after line 213 (after showing success notification)
// Add this:

// Track video generation complete
if (window.Analytics && currentJob) {
    const scriptLength = document.getElementById('scriptInput').value.length;
    const estimatedDuration = parseInt(
        document.getElementById('estimatedDuration').textContent.match(/\d+/)?.[0] || '0'
    );

    window.Analytics.trackVideoComplete(
        currentJob,
        estimatedDuration,
        true // success
    );
}

// ==================== EXAMPLE 3: Track Video Generation Error ====================
// In the catch block of generateVideo() function, after line 142
// Replace the existing catch block with:

catch (error) {
    console.error('Generation error:', error);

    // Track error
    if (window.Analytics) {
        window.Analytics.trackVideoError(
            error.message || 'Unknown error',
            error.code || 'ERR_GENERATION'
        );
    }

    showNotification('Failed to generate video. Please try again.', 'error');
    resetGenerateButton();
    progressSection.classList.add('hidden');
}

// Also in pollJobStatus() when status === 'failed', after line 165:

else if (status.status === 'failed') {
    clearInterval(pollInterval);

    // Track error
    if (window.Analytics) {
        window.Analytics.trackVideoError(
            status.error || 'Generation failed',
            'ERR_PROCESSING'
        );
    }

    showNotification('Video generation failed. Please try again.', 'error');
    resetGenerateButton();
    document.getElementById('progressSection').classList.add('hidden');
}

// ==================== EXAMPLE 4: Track Downloads ====================
// In downloadVideo() function, after line 243 (after click)
// Add this before showNotification:

// Track download
if (window.Analytics && currentJob) {
    window.Analytics.trackDownload(currentJob, 'mp4');
}

// ==================== EXAMPLE 5: Track Shares ====================
// In shareVideo() function, after line 268 (after copy to clipboard)
// Add this:

// Track share
if (window.Analytics && currentJob) {
    window.Analytics.trackShare('link_copy', currentJob);
}

// If you add social sharing buttons later, track each platform:
function shareToSocial(platform) {
    if (window.Analytics && currentJob) {
        window.Analytics.trackShare(platform, currentJob);
    }
    // ... rest of share logic
}

// ==================== EXAMPLE 6: Track Feature Usage ====================
// Track when users interact with specific features:

// Avatar selection (add to avatar card click handler, after line 31)
if (window.Analytics) {
    window.Analytics.trackFeature('avatar_selection', {
        avatar_type: selectedAvatar
    });
}

// Voice selection (add to voice select change handler, after line 41)
if (window.Analytics) {
    window.Analytics.trackFeature('voice_selection', {
        voice_type: selectedVoice
    });
}

// Quality selection (add a change event listener)
document.getElementById('qualitySelect').addEventListener('change', (e) => {
    if (window.Analytics) {
        window.Analytics.trackFeature('quality_selection', {
            quality: e.target.value
        });
    }
});

// Background selection (add a change event listener)
document.getElementById('backgroundSelect').addEventListener('change', (e) => {
    if (window.Analytics) {
        window.Analytics.trackFeature('background_selection', {
            background: e.target.value
        });
    }
});

// Speed adjustment (add to speed slider input handler, after line 54)
if (window.Analytics) {
    window.Analytics.trackFeature('speed_adjustment', {
        speed: parseFloat(e.target.value)
    });
}

// Avatar upload (add to handleAvatarUpload success, after line 293)
if (window.Analytics) {
    window.Analytics.trackFeature('avatar_upload', {
        avatar_id: result.avatar_id
    });
}

// ==================== EXAMPLE 7: Track Funnel Progression ====================
// The funnel steps are already tracked automatically by the analytics system:
// - 'view' is tracked on page load
// - 'start' is tracked when trackVideoStart() is called
// - 'complete' is tracked when trackVideoComplete() is called
// - 'download' is tracked when trackDownload() is called

// You can also manually track funnel steps if needed:
if (window.analyticsManager) {
    window.analyticsManager.updateFunnel('view'); // User viewed the platform
}

// ==================== EXAMPLE 8: Track Journey Milestones ====================
// Track significant user journey points:

// First script entered
let hasEnteredScript = false;
document.getElementById('scriptInput').addEventListener('input', function() {
    if (!hasEnteredScript && this.value.length > 10) {
        hasEnteredScript = true;
        if (window.analyticsManager) {
            window.analyticsManager.trackJourneyMilestone('first_script_entered');
        }
    }
});

// First video generated
let hasGeneratedVideo = false;
// Add to showResult() function:
if (!hasGeneratedVideo) {
    hasGeneratedVideo = true;
    if (window.analyticsManager) {
        window.analyticsManager.trackJourneyMilestone('first_video_generated');
    }
}

// ==================== COMPLETE EXAMPLE: Updated generateVideo() ====================
// Here's what the complete generateVideo() function looks like with analytics:

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

        // ✨ ANALYTICS: Track video generation start
        if (window.Analytics) {
            window.Analytics.trackVideoStart(
                requestData.avatar_id,
                requestData.voice_id,
                script.length
            );
        }

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

        // ✨ ANALYTICS: Track error
        if (window.Analytics) {
            window.Analytics.trackVideoError(
                error.message || 'Unknown error',
                error.code || 'ERR_GENERATION'
            );
        }

        showNotification('Failed to generate video. Please try again.', 'error');
        resetGenerateButton();
        progressSection.classList.add('hidden');
    }
}

// ==================== COMPLETE EXAMPLE: Updated showResult() ====================

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

    // ✨ ANALYTICS: Track video generation complete
    if (window.Analytics && currentJob) {
        const scriptLength = document.getElementById('scriptInput').value.length;
        const estimatedDuration = parseInt(
            document.getElementById('estimatedDuration').textContent.match(/\d+/)?.[0] || '0'
        );

        window.Analytics.trackVideoComplete(
            currentJob,
            estimatedDuration,
            true // success
        );
    }
}

// ==================== COMPLETE EXAMPLE: Updated downloadVideo() ====================

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

        // ✨ ANALYTICS: Track download
        if (window.Analytics && currentJob) {
            window.Analytics.trackDownload(currentJob, 'mp4');
        }

        showNotification('Download started', 'success');
    } catch (error) {
        console.error('Download error:', error);
        showNotification('Download failed', 'error');
    }
}

// ==================== COMPLETE EXAMPLE: Updated shareVideo() ====================

function shareVideo() {
    if (!currentJob) return;

    const shareUrl = `${window.location.origin}/share/${currentJob}`;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl);

        // ✨ ANALYTICS: Track share
        if (window.Analytics && currentJob) {
            window.Analytics.trackShare('link_copy', currentJob);
        }

        showNotification('Share link copied to clipboard!', 'success');
    } else {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);

        // ✨ ANALYTICS: Track share
        if (window.Analytics && currentJob) {
            window.Analytics.trackShare('link_copy', currentJob);
        }

        showNotification('Share link copied!', 'success');
    }
}

// ==================== TESTING ANALYTICS ====================
// To test analytics integration, open browser console and run:

// Check if analytics is loaded
console.log('Analytics loaded:', !!window.analyticsManager);
console.log('Analytics API available:', !!window.Analytics);

// Check consent status
console.log('Consent status:', window.analyticsManager?.getConsent());

// View user journey
console.log('User journey:', window.analyticsManager?.getUserJourney());

// Test custom event
window.Analytics?.trackCustomEvent('test_event', { test: true });

// ==================== NOTES ====================
/*
1. All analytics calls are wrapped in if (window.Analytics) checks to prevent errors
   if analytics fails to load or user rejects consent.

2. Analytics tracking is non-blocking and won't affect app functionality.

3. Events are automatically enriched with:
   - Timestamp
   - Session duration
   - User journey data

4. Button clicks, form submissions, link clicks, scroll depth, and time on page
   are all tracked automatically - no manual integration needed.

5. The conversion funnel (view → start → complete → download) is tracked
   automatically when you call the appropriate Analytics methods.

6. To view analytics in real-time:
   - Google Analytics 4: Go to Reports → Realtime
   - GTM: Use Preview mode
   - Hotjar: View recordings and heatmaps

7. Remember to replace placeholder IDs in analytics.js:
   - GA4_MEASUREMENT_ID
   - GTM_CONTAINER_ID
   - HOTJAR_SITE_ID
*/
