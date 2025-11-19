# Analytics Setup Guide

## Quick Start

### 1. Update Configuration IDs

Open `/public/analytics.js` and replace the placeholder IDs:

```javascript
const ANALYTICS_CONFIG = {
    GA4_MEASUREMENT_ID: 'G-XXXXXXXXXX',  // Replace with your GA4 ID
    GTM_CONTAINER_ID: 'GTM-XXXXXXX',     // Replace with your GTM ID
    HOTJAR_SITE_ID: 'XXXXXXX',           // Replace with your Hotjar ID
};
```

### 2. Get Your IDs

#### Google Analytics 4
1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new property (or use existing)
3. Click "Data Streams" → "Add Stream" → "Web"
4. Copy your **Measurement ID** (format: G-XXXXXXXXXX)

#### Google Tag Manager
1. Go to [Google Tag Manager](https://tagmanager.google.com/)
2. Create a new container (or use existing)
3. Copy your **Container ID** (format: GTM-XXXXXXX)

#### Hotjar
1. Go to [Hotjar](https://www.hotjar.com/)
2. Sign up and create a new site
3. Copy your **Site ID** (6-7 digit number)

### 3. Verify Installation

The analytics is already integrated into `/public/index.html`:

```html
<link rel="stylesheet" href="analytics.css">
...
<script src="analytics.js"></script>
```

### 4. Test Analytics

1. Open your site in a browser
2. You should see the cookie consent banner
3. Click "Accept All"
4. Open browser console and run:

```javascript
// Check if analytics is loaded
console.log('Analytics:', window.analyticsManager);

// View user journey
console.log(window.analyticsManager.getUserJourney());
```

5. Verify in Google Analytics:
   - Go to Reports → Realtime
   - You should see your session

### 5. Integrate with Your App

See `/public/analytics-integration-example.js` for complete integration examples.

#### Quick Integration (app.js)

Add these snippets to your `app.js`:

**Track Video Generation Start:**
```javascript
// In generateVideo() function, before fetch call
if (window.Analytics) {
    window.Analytics.trackVideoStart(avatar, voice, scriptLength);
}
```

**Track Video Complete:**
```javascript
// In showResult() function
if (window.Analytics) {
    window.Analytics.trackVideoComplete(videoId, duration, true);
}
```

**Track Downloads:**
```javascript
// In downloadVideo() function
if (window.Analytics) {
    window.Analytics.trackDownload(videoId, 'mp4');
}
```

**Track Shares:**
```javascript
// In shareVideo() function
if (window.Analytics) {
    window.Analytics.trackShare('link_copy', videoId);
}
```

### 6. What's Tracked Automatically

No coding needed for these events:
- Page views
- Button clicks
- Link clicks
- Form submissions
- Scroll depth (25%, 50%, 75%, 100%)
- Time on page (30s, 60s, 2m, 5m)
- Page visibility changes
- Cookie consent

### 7. GDPR Compliance

The analytics system is GDPR-compliant:
- ✅ Cookie consent banner
- ✅ Opt-in required
- ✅ No tracking before consent
- ✅ Consent stored in localStorage
- ✅ Privacy policy link
- ✅ Google Consent Mode integrated

### 8. View Analytics Data

**Google Analytics 4:**
- Realtime: `Reports → Realtime`
- Events: `Reports → Engagement → Events`
- Conversions: `Reports → Engagement → Conversions`
- Funnel: `Explore → Funnel Exploration`

**Google Tag Manager:**
- Preview Mode: `GTM → Preview`
- Debug: Test tags and triggers

**Hotjar:**
- Recordings: `Recordings → View Sessions`
- Heatmaps: `Heatmaps → View Heatmaps`

### 9. Conversion Funnel

The funnel tracks 4 steps:
1. **View** - User lands on platform
2. **Start** - User starts video generation
3. **Complete** - Video generation completes
4. **Download** - User downloads video

Set up in GA4:
1. Go to `Explore`
2. Create `Funnel Exploration`
3. Add steps:
   - Step 1: `page_view`
   - Step 2: `video_generation_start`
   - Step 3: `video_generation_complete`
   - Step 4: `video_download`

### 10. Troubleshooting

**Cookie banner not showing:**
- Clear localStorage and refresh
- Check browser console for errors

**Events not appearing in GA4:**
- Wait 24-48 hours for full processing
- Check Realtime reports for immediate data
- Verify Measurement ID is correct

**Hotjar not recording:**
- Verify Site ID is correct
- Check Hotjar dashboard is active
- Ensure site is on Hotjar whitelist

### 11. Files Created

```
/public/analytics.js                    # Main analytics system
/public/analytics.css                   # Cookie banner styles
/public/analytics-integration-example.js # Integration examples
/analytics.md                           # Full documentation
/ANALYTICS_SETUP.md                     # This file
```

### 12. Next Steps

1. ✅ Replace placeholder IDs
2. ✅ Test cookie consent
3. ✅ Verify GA4 tracking
4. ✅ Integrate tracking into app.js
5. ✅ Set up conversion funnel in GA4
6. ✅ Configure Hotjar recordings
7. ✅ Test all events in Realtime
8. ✅ Review analytics.md for all tracked events

### 13. Support

For detailed documentation, see `/analytics.md`

For integration examples, see `/public/analytics-integration-example.js`

---

**Last Updated:** 2025-11-19
