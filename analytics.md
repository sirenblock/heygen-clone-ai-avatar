# Analytics Documentation

## AI Avatar Studio - Analytics Infrastructure

This document provides comprehensive documentation for all analytics events tracked in the AI Avatar Studio platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Configuration](#configuration)
3. [Tracked Events](#tracked-events)
4. [Conversion Funnel](#conversion-funnel)
5. [User Journey Tracking](#user-journey-tracking)
6. [GDPR Compliance](#gdpr-compliance)
7. [Integration Guide](#integration-guide)
8. [Testing](#testing)

---

## Overview

The analytics infrastructure includes:

- **Google Analytics 4 (GA4)**: Primary analytics platform
- **Google Tag Manager (GTM)**: Tag and event management
- **Hotjar**: Heatmaps and user behavior recording
- **Custom Event Tracking**: Detailed user interaction tracking
- **Conversion Funnel Tracking**: Monitor user journey from view to conversion
- **GDPR Compliance**: Cookie consent with opt-in functionality

---

## Configuration

### Setup Instructions

1. **Update Configuration IDs** in `/public/analytics.js`:

```javascript
const ANALYTICS_CONFIG = {
    GA4_MEASUREMENT_ID: 'G-XXXXXXXXXX',  // Your GA4 Measurement ID
    GTM_CONTAINER_ID: 'GTM-XXXXXXX',     // Your GTM Container ID
    HOTJAR_SITE_ID: 'XXXXXXX',           // Your Hotjar Site ID
};
```

2. **Include Scripts** in your HTML:

```html
<link rel="stylesheet" href="analytics.css">
<script src="analytics.js"></script>
```

3. **Initialize** (automatically runs on page load):

```javascript
// Analytics initializes automatically
// Access via: window.analyticsManager
```

---

## Tracked Events

### 1. Page View Events

#### `page_view`
Triggered when a user views a page.

**Parameters:**
- `page_path` (string): URL path
- `page_title` (string): Page title
- `page_location` (string): Full URL
- `timestamp` (string): ISO timestamp
- `session_duration` (number): Seconds since session start

**Example:**
```javascript
// Automatic on page load
// Manual tracking:
window.analyticsManager.trackPageView('/avatars');
```

---

### 2. Button Click Events

#### `button_click`
Triggered when any button is clicked.

**Parameters:**
- `button_text` (string): Button text content
- `button_id` (string): Button ID attribute
- `button_class` (string): Button CSS classes
- `click_location` (object): `{x, y}` coordinates
- `timestamp` (string): ISO timestamp

**Example:**
```javascript
// Automatically tracked for all buttons
// No manual tracking needed
```

**Tracked Buttons:**
- CTA buttons
- Navigation buttons
- Form submit buttons
- Action buttons (generate, download, share)

---

### 3. Video Generation Events

#### `video_generation_start`
Triggered when user starts video generation.

**Parameters:**
- `avatar_type` (string): Selected avatar type
- `voice_type` (string): Selected voice type
- `script_length` (number): Character count of script
- `timestamp` (string): ISO timestamp

**Example:**
```javascript
window.Analytics.trackVideoStart('professional', 'rachel', 250);
```

#### `video_generation_complete`
Triggered when video generation completes.

**Parameters:**
- `video_id` (string): Generated video ID
- `duration` (number): Generation time in seconds
- `success` (boolean): Whether generation succeeded
- `timestamp` (string): ISO timestamp

**Example:**
```javascript
window.Analytics.trackVideoComplete('vid_123abc', 45, true);
```

#### `video_generation_error`
Triggered when video generation fails.

**Parameters:**
- `error_message` (string): Error description
- `error_code` (string): Error code
- `timestamp` (string): ISO timestamp

**Example:**
```javascript
window.Analytics.trackVideoError('API timeout', 'ERR_TIMEOUT');
```

---

### 4. Download Events

#### `video_download`
Triggered when user downloads a video.

**Parameters:**
- `video_id` (string): Video identifier
- `format` (string): Download format (mp4, webm, etc.)
- `timestamp` (string): ISO timestamp

**Example:**
```javascript
window.Analytics.trackDownload('vid_123abc', 'mp4');
```

---

### 5. Share Events

#### `video_share`
Triggered when user shares a video.

**Parameters:**
- `platform` (string): Social platform (twitter, facebook, linkedin, etc.)
- `video_id` (string): Video identifier
- `timestamp` (string): ISO timestamp

**Example:**
```javascript
window.Analytics.trackShare('twitter', 'vid_123abc');
```

---

### 6. Scroll Depth Events

#### `scroll_depth`
Triggered at 25%, 50%, 75%, and 100% scroll depth.

**Parameters:**
- `depth_percentage` (number): 25, 50, 75, or 100
- `page_path` (string): Current page path
- `timestamp` (string): ISO timestamp

**Example:**
```javascript
// Automatically tracked
// No manual tracking needed
```

---

### 7. Time on Page Events

#### `time_on_page`
Triggered at 30s, 60s, 120s, and 300s intervals.

**Parameters:**
- `duration_seconds` (number): 30, 60, 120, or 300
- `page_path` (string): Current page path
- `timestamp` (string): ISO timestamp

**Example:**
```javascript
// Automatically tracked
// No manual tracking needed
```

---

### 8. Feature Usage Events

#### `feature_usage`
Triggered when user interacts with specific features.

**Parameters:**
- `feature_name` (string): Feature identifier
- `[custom_params]` (various): Feature-specific parameters
- `timestamp` (string): ISO timestamp

**Example:**
```javascript
window.Analytics.trackFeature('avatar_customization', {
    customization_type: 'background',
    value: 'gradient_blue'
});
```

**Tracked Features:**
- Avatar selection
- Voice selection
- Script editing
- Template usage
- Export settings
- Custom avatar upload

---

### 9. Form Events

#### `form_submit`
Triggered when any form is submitted.

**Parameters:**
- `form_id` (string): Form identifier
- `form_action` (string): Form action URL
- `timestamp` (string): ISO timestamp

**Example:**
```javascript
// Automatically tracked
// No manual tracking needed
```

---

### 10. Link Click Events

#### `link_click`
Triggered when user clicks any link.

**Parameters:**
- `link_url` (string): Link destination
- `link_text` (string): Link text content
- `is_external` (boolean): Whether link goes to external site
- `timestamp` (string): ISO timestamp

**Example:**
```javascript
// Automatically tracked
// No manual tracking needed
```

---

### 11. Page Visibility Events

#### `page_hidden`
Triggered when user switches tabs or minimizes window.

**Parameters:**
- `time_visible` (number): Seconds page was visible
- `timestamp` (string): ISO timestamp

#### `page_visible`
Triggered when user returns to the page.

**Parameters:**
- `timestamp` (string): ISO timestamp

**Example:**
```javascript
// Automatically tracked
// No manual tracking needed
```

---

### 12. Page Exit Events

#### `page_exit`
Triggered when user leaves the page.

**Parameters:**
- `session_duration` (number): Total session time in seconds
- `journey_length` (number): Number of events in journey
- `timestamp` (string): ISO timestamp

**Example:**
```javascript
// Automatically tracked
// No manual tracking needed
```

---

### 13. Cookie Consent Events

#### `cookie_consent`
Triggered when user accepts or rejects cookies.

**Parameters:**
- `action` (string): 'accept', 'reject', or 'customize'
- `timestamp` (string): ISO timestamp

**Example:**
```javascript
// Automatically tracked
// No manual tracking needed
```

---

## Conversion Funnel

The analytics system tracks a 4-step conversion funnel:

### Funnel Steps

1. **View** (`view`)
   - User lands on the platform
   - Automatic tracking on page load

2. **Start** (`start`)
   - User initiates video generation
   - Tracked via `video_generation_start`

3. **Complete** (`complete`)
   - Video generation completes successfully
   - Tracked via `video_generation_complete`

4. **Download** (`download`)
   - User downloads the generated video
   - Tracked via `video_download`

### Funnel Event

#### `funnel_step`
Triggered at each funnel progression.

**Parameters:**
- `step` (string): Current step name
- `step_index` (number): 0-3
- `previous_step` (string): Previous step name
- `timestamp` (string): ISO timestamp

#### `conversion`
Triggered when user completes the full funnel.

**Parameters:**
- `funnel_type` (string): 'video_creation'
- `conversion_value` (number): 1
- `timestamp` (string): ISO timestamp

### Funnel Analysis

Monitor these metrics in GA4:
- Funnel completion rate
- Drop-off points
- Time between steps
- User segments by conversion

---

## User Journey Tracking

The analytics system maintains a complete user journey log.

### Journey Data Structure

```javascript
{
    event: 'event_name',
    params: { /* event parameters */ },
    timestamp: 1234567890
}
```

### Accessing Journey Data

```javascript
const journey = window.analyticsManager.getUserJourney();
console.log(journey);
```

### Journey Milestones

#### `journey_milestone`
Track significant journey points.

**Parameters:**
- `milestone` (string): Milestone identifier
- `journey_length` (number): Number of events so far
- `timestamp` (string): ISO timestamp

**Example:**
```javascript
window.analyticsManager.trackJourneyMilestone('first_video_generated');
```

---

## GDPR Compliance

### Cookie Consent

The analytics system is fully GDPR-compliant with:

1. **Opt-in Consent**: No tracking before user consent
2. **Cookie Banner**: Clear explanation of cookie usage
3. **Privacy Controls**: Accept, reject, or customize options
4. **Consent Storage**: Persisted in localStorage
5. **Google Consent Mode**: Integrated with GA4/GTM

### Consent States

- **Granted**: Full analytics tracking enabled
- **Denied**: No analytics tracking

### Consent Management

```javascript
// Check consent status
const hasConsent = window.analyticsManager.getConsent();

// Grant consent programmatically
window.analyticsManager.setConsent(true);

// Revoke consent
window.analyticsManager.setConsent(false);
```

### Data Privacy

- No personally identifiable information (PII) collected
- IP anonymization enabled
- Cookie expiration: 365 days
- User can revoke consent anytime

---

## Integration Guide

### Basic Integration

Add to your HTML `<head>`:

```html
<!-- Analytics Styles -->
<link rel="stylesheet" href="analytics.css">

<!-- Analytics Script -->
<script src="analytics.js"></script>
```

### Manual Event Tracking

```javascript
// Track custom events
window.Analytics.trackCustomEvent('custom_event', {
    param1: 'value1',
    param2: 'value2'
});

// Track video events
window.Analytics.trackVideoStart('avatar_type', 'voice_type', 250);
window.Analytics.trackVideoComplete('video_id', 45, true);
window.Analytics.trackVideoError('error_message', 'error_code');

// Track downloads
window.Analytics.trackDownload('video_id', 'mp4');

// Track shares
window.Analytics.trackShare('twitter', 'video_id');

// Track features
window.Analytics.trackFeature('feature_name', { key: 'value' });
```

### Integration Examples

#### Example 1: Generate Button

```javascript
generateButton.addEventListener('click', async () => {
    const avatarType = getSelectedAvatar();
    const voiceType = getSelectedVoice();
    const script = getScript();

    // Track start
    window.Analytics.trackVideoStart(avatarType, voiceType, script.length);

    try {
        const video = await generateVideo(avatarType, voiceType, script);

        // Track completion
        window.Analytics.trackVideoComplete(video.id, video.duration, true);
    } catch (error) {
        // Track error
        window.Analytics.trackVideoError(error.message, error.code);
    }
});
```

#### Example 2: Download Button

```javascript
downloadButton.addEventListener('click', () => {
    const videoId = getCurrentVideoId();
    const format = getSelectedFormat();

    // Track download
    window.Analytics.trackDownload(videoId, format);

    // Proceed with download
    downloadVideo(videoId, format);
});
```

#### Example 3: Share Button

```javascript
shareButtons.forEach(button => {
    button.addEventListener('click', () => {
        const platform = button.dataset.platform;
        const videoId = getCurrentVideoId();

        // Track share
        window.Analytics.trackShare(platform, videoId);

        // Open share dialog
        openShareDialog(platform, videoId);
    });
});
```

---

## Testing

### Testing Checklist

- [ ] Cookie consent banner appears on first visit
- [ ] Accept button enables tracking
- [ ] Reject button prevents tracking
- [ ] Events appear in GA4 Real-Time reports
- [ ] GTM dataLayer receives events
- [ ] Hotjar tracking is active
- [ ] Scroll depth tracking works
- [ ] Time on page tracking works
- [ ] Button clicks are tracked
- [ ] Funnel progression is tracked
- [ ] Conversion events fire correctly

### Debug Mode

Enable debug mode in browser console:

```javascript
// View current journey
console.log(window.analyticsManager.getUserJourney());

// Check consent status
console.log(window.analyticsManager.getConsent());

// Manually track test event
window.Analytics.trackCustomEvent('test_event', { test: true });
```

### GA4 Debug View

1. Install Google Analytics Debugger extension
2. Enable debug mode
3. View events in GA4 DebugView
4. Verify event parameters

### GTM Preview Mode

1. Open GTM container
2. Click "Preview"
3. Enter your site URL
4. Interact with site
5. Verify tags fire correctly

---

## Event Summary Table

| Event Name | Trigger | Auto/Manual | Funnel Step |
|------------|---------|-------------|-------------|
| `page_view` | Page load | Auto | view |
| `button_click` | Button click | Auto | - |
| `video_generation_start` | Generate clicked | Manual | start |
| `video_generation_complete` | Video ready | Manual | complete |
| `video_generation_error` | Generation fails | Manual | - |
| `video_download` | Download clicked | Manual | download |
| `video_share` | Share clicked | Manual | - |
| `scroll_depth` | Scroll milestone | Auto | - |
| `time_on_page` | Time milestone | Auto | - |
| `feature_usage` | Feature used | Manual | - |
| `form_submit` | Form submitted | Auto | - |
| `link_click` | Link clicked | Auto | - |
| `page_hidden` | Tab switched | Auto | - |
| `page_visible` | Tab focused | Auto | - |
| `page_exit` | Page unload | Auto | - |
| `cookie_consent` | Consent action | Auto | - |
| `funnel_step` | Funnel progression | Auto | All |
| `conversion` | Funnel complete | Auto | - |
| `journey_milestone` | Custom milestone | Manual | - |

---

## Support

For questions or issues:
1. Check GA4 DebugView for event data
2. Verify configuration IDs are correct
3. Check browser console for errors
4. Test with GTM Preview mode
5. Review consent status

---

## Changelog

### Version 1.0.0
- Initial release
- GA4 integration
- GTM integration
- Hotjar integration
- GDPR-compliant cookie consent
- Conversion funnel tracking
- User journey tracking
- Comprehensive event tracking

---

**Last Updated**: 2025-11-19
**Author**: AI Avatar Studio Team
**Version**: 1.0.0
